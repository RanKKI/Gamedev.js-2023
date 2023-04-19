import { stashLocker, unstashLocker } from "../common/locker"
import BasePanel from "../components/base/base-panel"
import { PanelPrefab } from "../components/prefab"
import { layerEvent } from "./layer-manager"

const { ccclass, property, menu, disallowMultiple } = cc._decorator

export interface PanelOption {
    inQueue?: boolean,
    priority?: number,
    clickMaskToClose?: boolean
}

interface Panel<T extends keyof PanelPrefab = any> {
    prefab: T,
    data: PanelPrefab[T],
    opt: PanelOption,
    node?: cc.Node
}

export enum PanelShowResult {
    DONE,
    FAILED,
    WAITING,
}

@ccclass
@menu("manager/panel-manager")
@disallowMultiple
export class PanelManager extends cc.Component {

    @property(cc.Node)
    container: cc.Node = null

    @property(cc.Node)
    mask: cc.Node = null

    public static get ins(): PanelManager {
        const canvas = cc.director.getScene().getChildByName('Canvas');
        const ret = canvas.getComponent(PanelManager) || canvas.getComponentInChildren(PanelManager)
        return ret
    }

    private panelQueue: Panel[]
    public panelList: Panel[]
    private currentPanel?: cc.Node

    onLoad() {
        this.panelQueue = []
        this.panelList = []
        this.mask.active = false
    }

    /**
     * 打开一个弹窗
     * @param path 预设的相对路径， 相对于 resources/
     * @param data 打开面板时传入的数据
     * @param opt 一些设置，是否进入队列， 排序的优先级 etc
     * @returns
     */
    public async open<T extends keyof PanelPrefab, K>(path: T, data: PanelPrefab[T], opt?: PanelOption): Promise<{
        panelResult: PanelShowResult,
        values?: K
    }> {
        debugger

        opt = opt ?? {}

        /** 放入队列 */
        if (opt.inQueue && this.panelQueue.length > 0) {
            // 加入队列
            this.panelQueue.push({
                prefab: path,
                data: data,
                opt: opt
            })
            return {
                panelResult: PanelShowResult.WAITING
            }
        }

        /** 加载 prefab */
        const prefab = await new Promise<cc.Prefab>((resolve, reject) => {
            cc.resources.load(path, cc.Prefab, (err, asset: cc.Prefab) => {
                err ? reject(err) : resolve(asset)
            })
        })

        if (!cc.isValid(prefab)) {
            console.warn("invalid prefab", path)
            return {
                panelResult: PanelShowResult.FAILED
            }
        }

        /** 实例化 node */
        const node = cc.instantiate(prefab)

        const comp = node.getComponent(BasePanel)

        /** 未挂在任何 BasePanel 的组件 */
        if (!comp) {
            console.warn("failed to load component of prefab", path)
            return {
                panelResult: PanelShowResult.FAILED
            }
        }

        /** set widget values */
        let widget = node.getComponent(cc.Widget)
        if (!widget) {
            widget = node.addComponent(cc.Widget)
            // widget.verticalCenter = 0
            // widget.horizontalCenter = 0
            // widget.isAlignVerticalCenter = true
            // widget.isAlignHorizontalCenter = true
        }

        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true
        widget.top = widget.bottom = widget.left = widget.right = 0
        widget.alignMode = cc.Widget.AlignMode.ON_WINDOW_RESIZE

        /** set current panel to inactive */
        // if (this.currentPanel != null) {
        //     this.currentPanel.active = false
        // }

        this.currentPanel = node
        this.panelList.push({
            prefab: path,
            data: data,
            opt: opt,
            node: node
        })
        node.setParent(this.container)
        comp.show(data)
        this.ensureMask()
        layerEvent.emit({ comp: comp })
        stashLocker()
        return new Promise(resolve => {
            comp.setFinishCallback((node, val) => {
                this.currentPanel = null
                node.parent = null
                this.panelList.pop()
                resolve({
                    panelResult: PanelShowResult.DONE,
                    values: val
                })
                unstashLocker()
                this.onNext()
                this.scheduleOnce(() => {
                    this.ensureMask()
                    layerEvent.emit({ comp: null })
                }, 0)
            })
        })
    }

    private onNext() {
        if (this.currentPanel != null || this.panelQueue.length == 0) {
            return
        }
        const panel = this.panelQueue.shift()
        this.open(panel.prefab, panel.data, panel.opt)
    }

    /**
     * 没有 Panel 啦, 清理 mask
     */
    private ensureMask() {
        const panels = this.panelList
        const count = panels.length
        const childrenCount = this.container.childrenCount
        const mask = this.mask
        /**
         * 没有任何面板开着
         */
        if (count <= 0) {
            mask.active = false
            return
        }
        const { node } = panels[count - 1]
        mask.active = true
        node.active = true
        mask.setSiblingIndex(childrenCount)
        node.setSiblingIndex(childrenCount)
    }

    public onMaskClick() {
        const panels = this.panelList
        const count = panels.length
        /**
         * 没有任何面板开着
         */
        if (count <= 0) {
            return
        }
        const { opt, node } = panels[count - 1]
        if (opt.clickMaskToClose) {
            const comp = node.getComponent(BasePanel)
            comp.hide()
        }

    }


}