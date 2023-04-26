import { objectPool } from "../common/object-pool"

const { ccclass, property, menu } = cc._decorator

@ccclass
@menu('components/ActionLabel')
export default class ActionLabel extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null

    public setText(text: string) {
        this.label.string = text
    }

    public do(text: string, parent: cc.Node) {
        this.setText(text)
        this.node.parent = parent
        this.node.opacity = 0
        this.node.setPosition(cc.Vec2.ZERO)
        cc.tween(this.node)
            .parallel(
                cc.tween().to(1, { y: 100 }, { easing: cc.easing.sineIn }),
                cc.tween()
                    .to(0.5, { opacity: 255 })
                    .to(0.5, { opacity: 0 })
            )
            .call(() => {
                this.reset()
            })
            .start()
    }

    public reset() {
        this.node.parent = null
        this.node.angle = 0
        objectPool.actionLabelsPool.put(this.node)
    }

}