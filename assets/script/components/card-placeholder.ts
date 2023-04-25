import "cc";
import { getLocalTouchPos } from "../common";
import { CardComponent } from "./card";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("components/CardPlaceholder")
export class CardPlaceholderComponent extends cc.Component {

    @property(cc.PolygonCollider)
    public collider: cc.PolygonCollider = null;

    @property(cc.Node)
    public lockNode: cc.Node = null;

    public isLocked: boolean = false
    public holderIdx: number = 0

    public setIsLocked(isLocked: boolean) {
        this.isLocked = isLocked
        this.lockNode.active = isLocked
    }

    public hitTest(evt: cc.Event.EventTouch | cc.Vec2): boolean {
        let pos: cc.Vec2 = cc.Vec2.ZERO
        if (evt instanceof cc.Event.EventTouch) {
            pos = getLocalTouchPos(evt, this.node)
        } else {
            pos = evt
        }
        return cc.Intersection.pointInPolygon(pos, this.collider.points)
    }

}