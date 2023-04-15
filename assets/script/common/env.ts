
interface Network {
    server: string,
    /**
     * 请求重发的间隔
     */
    retryT: number,
    /**
     * 默认重发次数
     */
    defaultRetryCnt: number,
    /**
     * CDN 地址
     */
    resourceURL: string,
}

const Test3: Network = {
    server: "https://xbtnc-test.hortor003.com",
    retryT: 2,
    defaultRetryCnt: 3,
    resourceURL: "",
}

export enum EnvMode {
    Debug = "Debug",
    TEST = "Test",
    PROD = "Prod"
}

export const env = {
    version: "0.1.1",
    mode: EnvMode.TEST,
    network: Test3,
}