
const { ccclass, executeInEditMode, property, menu } = cc._decorator;

@ccclass
@executeInEditMode
@menu("ext/linked-prefab")
export default class LinkPrefab extends cc.Component {

    @property
    private _prefab: cc.Prefab = null

    @property({ type: cc.Prefab, visible: true })
    set prefab(value: cc.Prefab) {
        this._onPrefabChanged(this._prefab, value)
    }

    get prefab(): cc.Prefab {
        return this._prefab
    }

    private _prefabNode: cc.Node = null

    private _onPrefabChanged(oldValue: cc.Prefab, newValue: cc.Prefab) {
        if (oldValue == newValue) {
            return
        }
        this._prefab = newValue
        if (newValue) {
            let prefabNode = cc.instantiate(newValue);
            this._prefabNode = prefabNode
            if (prefabNode) {
                // cc.Object["Flags"].DontSave          // 当前节点不会被保存到 prefab 文件里
                // cc.Object["Flags"].LockedInEditor    // 当前节点及子节点在编辑器里不会被点击到
                // cc.Object["Flags"].HideInHierarchy   // 当前节点及子节点在编辑器里不显示
                prefabNode["_objFlags"] |= (cc.Object["Flags"].DontSave | cc.Object["Flags"].LockedInEditor | cc.Object["Flags"].HideInHierarchy);
                this.node.addChild(prefabNode, -1) // 添加到最底层
                this.node.width = prefabNode.width
                this.node.height = prefabNode.height
            }
        }
    }

    onLoad() {
        this._onPrefabChanged(null, this._prefab)
    }

    getComponent<T extends cc.Component>(type: { prototype: T; }): T;
    getComponent(className: string);
    getComponent(className: unknown): any {
        // @ts-ignore
        return this._prefabNode.getComponent(className)
    }

}