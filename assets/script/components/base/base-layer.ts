import { Event } from "../../common"

const { ccclass } = cc._decorator

@ccclass
export default class BaseLayer<Options = {}> extends cc.Component {

    protected options: Options

    public name: string = ""

    init(data: Options) {
        this.options = data
    }

    async preLoad() {

    }

    show() {
        this.onShow()
    }

    protected onShow() {

    }

    hide() {
        this.onHide()
    }

    protected onHide() {

    }

    close() {
        const node = this.node
        node.emit(Event.BEFORE_NODE_REMOVE, node)
        node.active = false
        node.removeFromParent()
        node.emit(Event.ON_NODE_REMOVE, node)
        node.parent = null;
    }

}