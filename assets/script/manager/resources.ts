import { env } from "../common/env";
import { LayerPrefab, PanelPrefab } from "../components/prefab";

export async function loadPrefab(path: string): Promise<cc.Prefab> {
    return await loadRes<cc.Prefab>(path, cc.Prefab);
}

export async function preloadPrefab<T extends (keyof LayerPrefab | keyof PanelPrefab)>(path: T | T[]): Promise<void> {
    // const name = path.substring(path.lastIndexOf('/') + 1);
    await new Promise<void>(resolve => {
        cc.resources.preload(path, cc.Prefab, (err, item) => {
            resolve()
        })
    })
}

export async function loadAnimaClip(path: string): Promise<cc.AnimationClip> {
    return await loadRes<cc.AnimationClip>(path, cc.AnimationClip)
}

/**
 * @func 加载resources目录下资源
 * @param localPath
 * @param type cc.SpriteFrame | cc.AudioClip
 * @example
 * ```jsx
 * await loadLocalRes('ui/next_btn', cc.SpriteFrame);
 * ```
 */
export function loadLocalRes<T extends cc.Asset>(path: string) {
    // if (!path) {
    //     return
    // }
    // if (CC_DEBUG) {
    //     console.debug("load res", path)
    // }

    // return new Promise<T>((resolve, reject) => {
    //     cc.resources.load<T>(path, (err, asset) => {
    //         err ? reject(err) : resolve(asset as T)
    //     })
    // })

    return loadRes<T>(path, cc.Asset)
}

export async function loadRemote<T extends cc.Asset>(path: string, type?: typeof cc.Asset): Promise<T> {
    if (!path) {
        return
    }
    if (CC_DEBUG) {
        console.debug("load res", path)
    }
    return new Promise<T>((resolve, reject) => {
        cc.assetManager.loadRemote<T>(env.network.resourceURL + path, (err, asset) => {
            err ? reject(err) : resolve(asset as T)
        })
    })
}

export async function loadRes<T extends cc.Asset>(path: string, type: typeof cc.Asset): Promise<T> {
    if (!path) {
        return
    }
    // if (CC_DEBUG) {
    //     console.debug("load res", path)
    // }
    let bundle = cc.resources
    let bundleName = "resources"
    let useRemote = false
    // if (!bundle.getInfoWithPath(path)) {
    //     bundleName = "remote"
    //     useRemote = true
    //     bundle = cc.assetManager.getBundle(bundleName)
    //     if (!bundle) {
    //         bundle = await new Promise((resolve, reject) => {
    //             cc.assetManager.loadBundle(bundleName, (err, bundle) => {
    //                 err ? reject(err) : resolve(bundle)
    //             })
    //         })
    //     }
    // }
    const res = await getResFromBundle<T>(bundleName, path, type)
    if (res) {
        return res
    }
    return new Promise((resolve, reject) => {
        bundle.load(path, type, (err, asset) => {
            err ? reject(err) : resolve(asset as T)
        })
    })
}

export async function getResFromBundle<T extends cc.Asset>(bundle: string, path: string, type: typeof cc.Asset): Promise<T> {
    if (!path) {
        return null
    }
    const uuid = pathToUUID(bundle, path, type)
    if (!uuid) {
        return null
    }
    const res = cc.assetManager.assets.get(uuid)
    if (res) {
        return res as T
    }
    return null
}

function pathToUUID(bundleName: string, path: string, type: typeof cc.Asset): string {
    const bundles = cc.assetManager.bundles
    const getFromBundle = (name: string): string => {
        if (!bundles.has(name)) {
            return null
        }
        const bundle = bundles.get(name)
        const info = bundle.getInfoWithPath(path, type)
        if (!info) {
            return null
        }
        if (info.redirect) {
            return getFromBundle(info.redirect)
        }
        return info.uuid
    }
    return getFromBundle(bundleName)
}


