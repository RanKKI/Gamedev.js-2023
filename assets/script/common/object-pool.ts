import { CardComponent } from "../components/card";
import { loadPrefab } from "../manager/resources";

type Factory<T> = () => T | Promise<T>;

class ObjectPool<T> {
    private _pool: T[] = [];
    private _factory: Factory<T>;

    constructor(factory: Factory<T>) {
        this._factory = factory;
    }

    public async get() {
        let result: T;
        if (this._pool.length > 0) {
            result = this._pool.pop();
        } else {
            const obj = this._factory();
            if (obj instanceof Promise) {
                result = await obj;
            } else {
                result = obj
            }
        }
        if (result instanceof cc.Node) {
            if (result.getComponent(CardComponent)) {
                result.getComponent(CardComponent).recycle()
            }
        }
        return result;
    }

    public put(obj: T) {
        if (obj instanceof cc.Node) {
            obj.removeFromParent();
            cc.Tween.stopAllByTarget(obj);
            obj.cleanup();
        }
        this._pool.push(obj);
    }

}

export const objectPool = {
    cardPool: new ObjectPool<cc.Node>(async () => {
        // load prefab
        const prefab = await loadPrefab("prefab/components/Card")
        const node = cc.instantiate(prefab);
        return node;
    }),
}