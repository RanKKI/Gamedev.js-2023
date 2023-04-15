export function getScreenWidth() {
    return cc.view.getCanvasSize().width;
}

export function getScreenHeight() {
    return cc.view.getCanvasSize().height;
}

export function curCanvas() {
    const scene = cc.director.getScene();
    return cc.find("Canvas", scene);
}

// 正则表达式
export const toThousands = (num = 0) => {
    return num.toString().replace(/\d+/, function (n) {
        return n.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
    });
};


/**
 * @func 显示隐藏节点
 * @param node
 * @param visible
 */
export function showNode(node: cc.Node, active: boolean, duration?: number, deley: number = 0) {
    if (duration) {
        node.scale = 0;
        cc.tween(node)
            .delay(deley)
            .to(duration, { scale: 1 })
            .start()
    }
    if (null != node) {
        node.active = active;
    }
}

/**
 * @func 禁止或开启全屏输入事件
 * @param disable 是否禁止触摸
 * @example
 * ```jsx
 *  disableAllTouch(true)
 * ```
 */
let globalBlockInputComp: cc.BlockInputEvents = null
export function disableAllTouch(disable: boolean) {
    if (globalBlockInputComp == null) {
        const canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
        const children = canvas.node.children
        const node = children[children.length - 1]
        globalBlockInputComp = node.getComponent(cc.BlockInputEvents)
    }
    if (globalBlockInputComp) {
        globalBlockInputComp.enabled = disable
    }
}

export function resetGlobalBlockInputComp() {
    globalBlockInputComp = null
}

/**
 * @func 禁止或开启按钮点击事件
 * @param button cc.Button实例
 * @param disable 是否可点击
 */
export function disableBtn(button: cc.Button, disable: boolean) {
    button.interactable = !disable;
}

/**
 * 临时屏蔽一个节点/按钮
 * 返回一个函数，可以立即调用 schedule 的函数，并取消 schedule
 * @param target cc.Button or cc.Node
 * @param second 屏蔽点击的秒数
 *
 */
export function tempDisableButton(target: cc.Button | cc.Node | cc.Event.EventTouch, second = 0): () => void {
    if (target == null) {
        return
    }

    if (target instanceof cc.Event.EventTouch) {
        target = target.target
    }

    let button: cc.Button = null
    if (target instanceof cc.Button) {
        button = target
    } else if (target instanceof cc.Node) {
        button = target.getComponent(cc.Button)
    }
    if (button == null) {
        return
    }

    const func = () => {
        disableBtn(button, false)
    }

    disableBtn(button, true)
    button.scheduleOnce(func, second)

    return () => {
        func()
        button.unschedule(func)
    }

}


/**
 * @func 禁止或开启节点的点击事件
 * @param node cc.Node
 * @param disable  是否可以点击
 */
export function disableTouch(node: cc.Node, disable: boolean) {
    if (disable) {
        node.pauseSystemEvents(true)
    } else {
        node.resumeSystemEvents(true)
    }
}


/**
 * @func 生成区间内的随机数
 * @param min
 * @param max
 * @returns number
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}



/**
 * 比较版本号
 * @example
 * ```js
 * // 1 表示 1.11.0 比 1.9.9 要新
 * compareVersion('1.11.0', '1.9.9') // => 1
 * // 0 表示 1.11.0 和 1.11.0 是同一个版本
 * compareVersion('1.11.0', '1.11.0') // => 0
 * // -1 表示 1.11.0 比 1.99.0 要老
 * compareVersion('1.11.0', '1.99.0') // => -1
 * ```
 */
export function compareVersion(v1: string, v2: string): 0 | -1 | 1 {
    const version1 = v1.split('.');
    const version2 = v2.split('.');
    let len = Math.max(version1.length, version2.length)
    while (version1.length < len) {
        version1.push('0');
    }
    while (version2.length < len) {
        version2.push('0');
    }
    for (let i = 0; i < len; i++) {
        let num1 = parseInt(version1[i]);
        let num2 = parseInt(version2[i]);
        if (num1 > num2) {
            return 1;
        } else if (num1 < num2) {
            return -1;
        }
    }
    return 0;
}


export function sleep(second: number, comp?: cc.Component): Promise<void> {
    return new Promise<void>(resolve => {
        if (comp) {
            comp.scheduleOnce(() => {
                resolve()
            }, second)
        } else {
            cc.director.getScene().getComponentInChildren(cc.Canvas).scheduleOnce(() => {
                resolve()
            }, second)
        }

    })
}

/**
 * 使用洗牌算法原地打算数组
 */
export function shuffleArr<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i >= 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1))
        const itemAtIndex = arr[randomIndex]
        arr[randomIndex] = arr[i]
        arr[i] = itemAtIndex
    }
    return arr
}

/**
 * 随机从 arr 中获取 n 个元素
 */

export function randomChoiceOne<T>(arr: T[]): T {
    return randomChoice(arr, 1)[0]
}

export function randomChoice<T>(arr: T[], n: number): T[] {
    return shuffleArr(Object.assign([], arr)).slice(0, n)
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target: Object, ...sources: Object[]) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

// 定义一个深拷贝函数  接收目标target参数
export function deepClone<T>(target: T): T {
    // 定义一个变量
    let result;
    // 如果当前需要深拷贝的是一个对象的话
    if (typeof target === 'object') {
        // 如果是一个数组的话
        if (Array.isArray(target)) {
            result = []; // 将result赋值为一个数组，并且执行遍历
            for (let i in target) {
                // 递归克隆数组中的每一项
                result.push(deepClone(target[i]))
            }
            // 判断如果当前的值是null的话；直接赋值为null
        } else if (target === null) {
            result = null;
            // 判断如果当前的值是一个RegExp对象的话，直接赋值
        } else if (target.constructor === RegExp) {
            result = target;
        } else {
            // 否则是普通对象，直接for in循环，递归赋值对象的所有值
            result = {};
            for (let i in target) {
                result[i] = deepClone(target[i]);
            }
        }
        // 如果不是对象的话，就是基本数据类型，那么直接赋值
    } else {
        result = target;
    }
    // 返回最终结果
    return result;
}


export function clamp(input: number, min: number, max: number): number {
    return input < min ? min : input > max ? max : input;
}

export function mapRange(current: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
    const mapped: number = ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    return clamp(mapped, out_min, out_max);
}

export const isPord = false