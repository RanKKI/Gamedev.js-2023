import { TypedEvent } from "./typed-event"

export const BEFORE_NODE_REMOVE = "BEFORE_NODE_REMOVE"
export const ON_NODE_REMOVE = "ON_NODE_REMOVE"

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
}

export const logEvent = new TypedEvent<Partial<{ log: string, level: typeof LogLevel }>>()
export const GameEvent = {
    UserRoundFinished: "UserRoundFinished",
}
export const gameEvent = new TypedEvent<{ name: string, data: any }>()

const events = [
    logEvent
]

logEvent.on((e) => {
    const level = e.level || LogLevel.DEBUG
    const log = e.log || ""
    console.log(log)
})

export function resetAllEvents() {
    events.forEach(evt => {
        evt.reset()
    })
}