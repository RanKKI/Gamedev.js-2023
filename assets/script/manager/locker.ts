import { disableAllTouch, randomInt, resetGlobalBlockInputComp } from "../common";

function wrap(target: unknown, method1: Function, method2: () => void) {
    return function (...args: unknown[]) {
        method1 && method1.call(target, ...args)
        method2 && method2()
    }
}

const lockerData = new Set<String>();
const _stashLocker: Set<String>[] = []

export const stashLocker = () => {
    _stashLocker.push(new Set(lockerData))
    lockerData.clear()
    onLockerChange()
}

export const unstashLocker = () => {
    lockerData.clear()
    if (_stashLocker.length > 0) {
        _stashLocker.pop().forEach(v => {
            lockerData.add(v)
        })
    }
    onLockerChange()
}

// @ts-ignore
lockerData["add"] = wrap(lockerData, lockerData["add"], () => {
    onLockerChange()
})

// @ts-ignore
lockerData["delete"] = wrap(lockerData, lockerData["delete"], () => {
    onLockerChange()
})

// window["lockerData"] = lockerData
// window["_stashLocker"] = _stashLocker

const onLockerChange = () => {
    const flag = isTouchLocked()
    // console.log("on locker change", flag, lockerData, _stashLocker)
    disableAllTouch(flag)
}

const uuid = (): string => {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ randomInt(0, 1000000000000) & 15 >> c / 4).toString(16)
    );
}

export const isTouchLocked = () => lockerData.size > 0

export const disableTouch = () => {
    const uid = uuid()
    lockerData.add(uid)
    return () => {
        lockerData.delete(uid)
    }
}

function unlock(uuid: string) {
    lockerData.delete(uuid)
    _stashLocker.forEach(v => {
        v.delete(uuid)
    })
}

export function touchLocker(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let method = descriptor.value;
    descriptor.value = function (...args: any[]) {
        const uid = uuid()
        lockerData.add(uid)

        const p = method.call(this, ...args);
        if (p instanceof Promise) {
            p.then(() => {
                unlock(uid)
            });
        } else {
            unlock(uid)
        }

        if (this instanceof cc.Component) {
            this['onDestroy'] = wrap(this, this['onDestroy'], () => {
                unlock(uid)
            });
        }
        return p;
    }
}

export function onSceneChanged() {
    resetGlobalBlockInputComp()
}