import { randomInt, sleep } from "../common"
import { env } from "../env"
import { showToast } from "../toast"
import { API } from "./router"

interface IRequest {
    parameters?: UtilityTypes.JsonObject,
    body?: UtilityTypes.JsonObject,
    /** 最多自动重试次数，默认 3 次 */
    maxAutoRetryCnt?: number,
    /** 没有任何响应，比如报错，loading 信息，默认 false */
    silence?: boolean,
    /** 支持手动重试，默认为 true */
    askToRetry?: boolean,
}

interface IResult<T = any> {
    ok: boolean,
    status: number,
    statusText: string,
    data: T,
}

interface GeneralServerResult {
    errcode: number
    errmsg: string
    data: UtilityTypes.JsonObject
}

type IMethod = "post" | "get"

const POST: IMethod = "post"
const GET: IMethod = "get"

const DEFAULT_REQUEST_OPTIONS = {
    ignoreCache: false,
    headers: {
        "Accept": 'application/json, text/javascript, text/plain',
    },
    timeout: 5000,
}

// 自增 key
let onceKey = 0
const getOnceKey = () => onceKey++

function queryParams(params?: UtilityTypes.JsonObject) {
    if (params == null) {
        return ""
    }
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] + ""))
        .join('&');
}

function withQuery(url: string, params?: UtilityTypes.JsonObject): string {
    const queryString = queryParams(params);
    if (queryString.length > 0) {
        return url + (url.indexOf('?') === -1 ? '?' : '&') + queryString
    }
    return url
}

function parseResult(xhr: XMLHttpRequest): IResult {

    const ret: IResult = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        data: xhr.responseText
    };

    if (ret.ok) { /** 只有在 200 的时候才处理返回信息 */
        try {
            const info: GeneralServerResult = JSON.parse(xhr.responseText)
            if (info.errcode != null && info.errcode > 0) {
                ret.ok = false
                ret.status = info.errcode
                ret.statusText = info.errmsg ?? ret.statusText
            }
            ret.data = info.data
        } catch (err) {
            console.error("failed to parse response text", xhr.responseText, err)
        }
    }
    return ret
}

function sendRequest(method: IMethod, baseURL: string, payload?: IRequest): Promise<IResult> {
    const ignoreCache = DEFAULT_REQUEST_OPTIONS.ignoreCache;
    const headers = DEFAULT_REQUEST_OPTIONS.headers;
    const timeout = DEFAULT_REQUEST_OPTIONS.timeout;

    return new Promise<IResult>((resolve, reject) => {

        const xhr = new XMLHttpRequest()

        let url = withQuery(baseURL, {
            // 一些自定义的字段
            platform: "default",
            ver: env.version
        })

        if (payload) {
            url = withQuery(url, payload.parameters)
        }

        xhr.open(method, url)

        if (headers) {
            Object.keys(headers)
                .forEach(key => {
                    xhr.setRequestHeader(key, headers[key])
                })
        }

        if (ignoreCache) {
            xhr.setRequestHeader('Cache-Control', 'no-cache');
        }

        xhr.timeout = timeout

        xhr.onload = () => {
            resolve(parseResult(xhr))
        }

        xhr.onerror = () => {
            resolve(parseResult(xhr))
        }

        xhr.ontimeout = () => {
            reject(new Error("Time out"))
        }

        if (method === 'post' && payload.body) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(payload.body));
        } else {
            xhr.send();
        }

    })
}

async function askRetry(): Promise<boolean> {
    // return await platform.showModal({
    //     title: "提示",
    //     content: "网络发生故障, 是否重试？",
    //     confirmText: "重试",
    //     cancelText: "取消",
    //     showClose: false,
    // })
    return false;
}

async function makeRequest(method: IMethod, baseURL: string, payload?: IRequest): Promise<IResult> {
    payload = payload ?? {}
    payload.parameters = payload.parameters ?? {}
    /** 随机的 key，后端用来校验是否为重发请求 */
    payload.parameters["consistKey"] = getOnceKey()

    let loadingViewKey: number

    const showLoading = () => {
        if (payload.silence) {
            return
        }
        /** n 毫秒后，如果网络请求还没回来， 展示 loading 界面 */
        loadingViewKey = setTimeout(() => {
            // platform.showLoading()
        }, 200)
    }

    const hideLoading = () => {
        if (loadingViewKey == null) {
            return
        }
        clearTimeout(loadingViewKey)
        // platform.hideLoading()
    }

    const canRetry = payload.askToRetry == null || payload.askToRetry == true
    const maxRetry = Math.max(1, payload.maxAutoRetryCnt ?? env.network.defaultRetryCnt)

    for (let cnt = 0; cnt < maxRetry || canRetry; cnt++) {
        try {
            showLoading()
            const ret = await sendRequest(method, baseURL, payload)
            hideLoading()
            /**
             * 合理的请求～, 直接放过
             */
            if (ret.status >= 200 && ret.status <= 399 || ret.status >= 20000) {
                return ret
            }
            throw ret
        } catch (err) {
            hideLoading()
            /** 自动重发 */
            if (payload.silence) {
                if (cnt == maxRetry - 1) {
                    throw err
                }
                await sleep(0.5)
            } else if (!canRetry || !(await askRetry())) {
                throw err
            }
        }
    }
}

interface QueueRequest {
    url: string,
    request?: IRequest,
    onSuccess: (result: IResult) => void,
    onFailed: (resolve: Error) => void,
}

class RequestQueue {

    private method: IMethod
    private queue: QueueRequest[]

    public constructor(method: IMethod) {
        this.method = method
        this.queue = []
    }

    public isEmpty(): boolean {
        return this.queue.length == 0
    }

    public push(req: QueueRequest) {
        req.request = req.request || {}
        const isEmpty = this.isEmpty()
        this.queue.push(req)
        if (isEmpty) {
            this.consume()
        }
    }

    public clear() {
        while (!this.isEmpty()) {
            const item = this.queue.pop()
            item.onFailed(new Error(`the queue of ${this.method} was cleared`))
        }
    }

    private handleError(item: QueueRequest, data: IResult | Error | any) {
        console.log("handle error", data)
        if (data instanceof Error) {
            item.onFailed(data)
        } else {
            item.onFailed(new Error(data.statusText))
        }
        if (item.request.silence) {
            return
        }
        if (data instanceof Error) {
            showToast(data.message)
        } else if (data.statusText) {
            showToast(data.statusText)
        } else {
            showToast("网络请求失败")
        }
    }

    public async consume() {
        const item = this.queue[0]
        try {
            const data = await makeRequest(this.method, env.network.server + item.url, item.request)
            if (data.ok) {
                item.onSuccess(data)
            } else {
                this.handleError(item, data)
            }
        } catch (err) {
            this.handleError(item, err)
        }
        this.queue.shift()
        if (!this.isEmpty()) {
            this.consume()
        }
    }

}

const getQueue = new RequestQueue(GET)
const postQueue = new RequestQueue(POST)

/**
 * @example
 * ```js
 * get("https://httpbin.org/get", {
 *      parameters: {
 *          uid: 1,
 *          item: testItem
 *      }
 * })
 * ```
 */
export async function get<T extends keyof API>(url: T, request?: IRequest): Promise<IResult<API[T]>> {
    return new Promise((resolve, reject) => {
        getQueue.push({
            request: request,
            url: url,
            onSuccess: (result) => {
                resolve(result)
            },
            onFailed: (err) => {
                reject(err)
            }
        })
    })
}


/**
 * @example
 * ```js
 * post("https://httpbin.org/post", {
 *      parameters: {
 *          uid: 1,
 *          item: testItem
 *      },
 *      body: {
 *          key: "this is a body value"
 *      }
 * })
 * ```
 */
export async function post<T extends keyof API>(url: T, request?: IRequest): Promise<IResult<API[T]>> {
    return new Promise((resolve, reject) => {
        postQueue.push({
            url: url,
            request: request,
            onSuccess: (result) => {
                resolve(result)
            },
            onFailed: (err) => {
                reject(err)
            }
        })
    })
}