import { TypedEvent } from "./event/typed-event"

interface TimeEventPayload {
    /**
     * 当前时间 (服务器事件) 秒
     */
    now: number,
    /**
     * 距离上次调用的时间差
     */
    dt: number,
    /**
     * 发生跨天事件
     */
    dayChange?: boolean,
}

class TimeUtils {

    public weekDay: number = -1

    private _cachedZoneOffset: number = null
    private clientStartT: number
    private serverStartT: number
    private dayChangeT: number = -1

    private initd: boolean = false

    public sync(data: { serverTime: number, weekDay?: number, dayChangeT?: number }) {
        if (null == data || null == data.serverTime) {
            console.warn("invalid server time")
            return
        }
        this.serverStartT = data.serverTime * 1000
        this.clientStartT = Date.now()
        this.weekDay = data.weekDay ?? -1
        this.dayChangeT = data.dayChangeT ?? -1
    }

    /**
     * 获取服务器 UTC 时间，单位 秒
     */
    public get serverTime(): number {
        const ret = Math.floor((this.serverStartT + Date.now() - this.clientStartT) / 1000)
        if (isNaN(ret)) {
            return Math.floor(Date.now() / 1000)
        }
    }

    public get timeZoneOffset(): number {
        if (this._cachedZoneOffset == null) {
            const now = new Date()
            const offset = Math.round(now.getTimezoneOffset() / 6)
            this._cachedZoneOffset = -(offset / 10)
        }
        return this._cachedZoneOffset
    }

    public startGlobalTimer(comp: cc.Component) {
        comp.schedule((dt: number) => {
            const now = time.serverTime
            const dayChange = now > this.dayChangeT && this.dayChangeT > 0
            if (dayChange) {
                this.dayChangeT += 26 * 60 * 60
            }
            timeEvent.emit({
                now: now,
                dt: dt,
                dayChange: dayChange
            })
        }, 1, cc.macro.REPEAT_FOREVER)
    }

}

/**
 * @param t1 时间戳（秒）
 * @param t2 时间戳（秒）
 * @returns 两个时间戳是否在一天之内
 */
export function isSameDay(t1: number, t2: number) {
    const d1 = new Date(t1 * 1000)
    const d2 = new Date(t2 * 1000)
    return d1.getFullYear() == d2.getFullYear() &&
        d1.getMonth() == d2.getMonth() &&
        d1.getDate() == d2.getDate()
}

/**
 * @param t 时间戳（秒）
 * @returns 时间戳 t 是否是今天
 */
export function isToday(t: number) {
    return isSameDay(time.serverTime, t)
}

export function addZero(num: number): string {
    if (num < 10) {
        return "0" + num
    }
    return num + ""
}

/**
 * 转换时间戳到 年/月/日
 * @param t 时间戳（秒）
 * @returns
 */
export function getFullDisplayDate(t: number) {
    const day = new Date(t * 1000)
    return day.getFullYear() + "/" + addZero(day.getMonth() + 1) + "/" + addZero(day.getDate())
}

/**
 * 转换时间戳到 时:分:秒
 * @param t 时间戳（秒）
 * @returns
 */
export function getFullDisplayTime(t: number) {
    const day = new Date(t * 1000)
    return addZero(day.getHours()) + ":" + addZero(day.getMinutes()) + ":" + addZero(day.getSeconds())
}


/**
 * 转换时间戳到 年/月/日 时:分:秒
 * @param t 时间戳（秒）
 * @returns
 */
export function getFullDisplayDateTime(t: number) {
    return getFullDisplayDate(t) + " " + getFullDisplayTime(t)
}

/**
 * timeEvent 将每秒抛出一个事件， 包括当前时间和是否夸天
 */
export const timeEvent: TypedEvent<TimeEventPayload> = new TypedEvent()
export const time = new TimeUtils()
window['time'] = time;


export function formatTimeString(num: number, needHour?: boolean): string {

    if (num <= 0) {
        if (needHour) {
            return "00:00:00";
        }
        else {
            return "00:00";
        }
    }
    let second: string | number = num % 60;
    num = (num - second) / 60;
    let min: string | number = num % 60;
    let hour: string | number = (num - min) / 60;

    let str: string = "";
    if (hour > 0 || needHour) {
        if (hour < 10) {
            hour = '0' + hour;
        }
        str += hour + ":"
    }
    if (min < 10) {
        min = '0' + min;
    }
    str += min + ":";
    if (second < 10) {
        second = '0' + second;
    }
    str += second;
    return str;
}