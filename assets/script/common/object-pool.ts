import { loadPrefab } from "../manager/resources";

type Factory<T> = () => T | Promise<T>;

class ObjectPool<T> {
    private _pool: T[] = [];
    private _factory: Factory<T>;

    constructor(factory: Factory<T>) {
        this._factory = factory;
    }

    public async get() {
        if (this._pool.length > 0) {
            return this._pool.pop();
        }
        const obj = this._factory();
        if (obj instanceof Promise) {
            return await obj;
        }
        return obj;
    }

    public put(obj: any) {
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