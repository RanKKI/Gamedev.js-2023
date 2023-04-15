import { Event, sleep } from "../common";
import { TypedEvent } from "../common/event/typed-event";
import { touchLocker } from "../common/locker";
import BaseLayer from "../components/base/base-layer";
import BasePanel from "../components/base/base-panel";
import { LayerPrefab } from "../components/prefab";

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

@ccclass
@menu("manager/layer-manager")
@disallowMultiple
export class LayerManager extends cc.Component {

    @property(cc.Node)
    container: cc.Node = null

    // @property(cc.Node)
    // loadingAnima: cc.Node = null

    private currentLayer: cc.Node = null
    public layers: cc.Node[]
    private swiftAnimaCount = 0
    private isSwitching = false

    public static get ins(): LayerManager {
        const canvas = cc.director.getScene().getChildByName('Canvas');
        const ret = canvas.getComponent(LayerManager) || canvas.getComponentInChildren(LayerManager)
        return ret
    }

    onLoad() {
        this.layers = []
    }

    @touchLocker
    private async beforeSwitch() {
        if (this.isSwitching) {
            return
        }
        this.isSwitching = true
        // this.loadingAnima.active = true
        // const animation = this.loadingAnima.getComponentInChildren(cc.Animation)
        // animation.play("loading_in")
        // await sleep(1)
    }

    @touchLocker
    private async afterSwitch() {
        // const animation = this.loadingAnima.getComponentInChildren(cc.Animation)
        // animation.play("loading_out")
        // await sleep(1)
        this.isSwitching = false
        // this.loadingAnima.active = false
    }

    public async open<T extends keyof LayerPrefab>(path: T, data: LayerPrefab[T]): Promise<boolean> {
        let hasEnterAnima = false
        if (this.swiftAnimaCount > 0) {
            hasEnterAnima = true
            await this.beforeSwitch()
        }
        this.swiftAnimaCount++
        /** 加载 prefab */
        const prefab = await new Promise<cc.Prefab>((resolve, reject) => {
            cc.resources.load(path, cc.Prefab, (err, asset: cc.Prefab) => {
                err ? reject(err) : resolve(asset)
            })
        })

        if (!cc.isValid(prefab)) {
            console.warn("invalid prefab", path)
            return false
        }

        /** 实例化 */
        const node = cc.instantiate(prefab)
        const comp = node.getComponent(BaseLayer)

        /** 未挂在任何 BaseLayer 的组件 */
        if (!comp) {
            console.error("not found BaseLayer", path)
            return false
        }

        comp.init(data)

        const cur = this.currentLayer
        if (cur != null) {
            const layer = cur.getComponent(BaseLayer)
            layer.hide()
            cur.active = false
        }

        /** set widget values */
        let widget = node.getComponent(cc.Widget)
        if (!widget) {
            widget = node.addComponent(cc.Widget)
        }
        widget.isAlignHorizontalCenter = widget.isAlignVerticalCenter = false
        widget.isAlignRight = widget.isAlignLeft = widget.isAlignTop = widget.isAlignBottom = true
        widget.left = widget.right = widget.top = widget.bottom = 0

        node.setParent(this.container)
        node.setSiblingIndex(this.container.childrenCount)

        // preload asset
        // const pa = node.getComponent(PreloadAsset)
        // if (pa) {
        //     await Promise.all(pa.paths.map(v => new Promise<void>(resolve => {
        //         cc.resources.loadDir(v, (err) => {
        //             resolve()
        //         })
        //     })))
        // }

        await comp.preLoad()

        if (hasEnterAnima) {
            await this.afterSwitch()
        }
        comp.show()

        this.currentLayer = node
        this.layers.push(node)

        layerEvent.emit({ comp: comp })

        node.once(Event.BEFORE_NODE_REMOVE, async (node: cc.Node) => {
            await this.beforeSwitch()
            const arr = this.layers
            const idx = arr.findIndex((target) => target == node)
            if (idx == -1) {
                return
            }
            arr.splice(idx, 1)
            const count = arr.length
            if (count == 0) {
                this.onNoLayerExists()
                return
            }
            const lastLayer = arr[count - 1]
            const comp = lastLayer.getComponent(BaseLayer)
            if (!lastLayer.active) {
                lastLayer.active = true
                comp.show()
            }
            layerEvent.emit({ comp: comp })
            this.currentLayer = lastLayer
            await this.afterSwitch()
        })
    }

    private onNoLayerExists() {

    }

}

export const layerEvent = new TypedEvent<{ comp: BaseLayer | BasePanel }>()