import "cc";
import { getLocalTouchPos } from "../common";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("components/Bar")
export class BarComponent extends cc.Component {

    @property(cc.Node)
    public mask: cc.Node = null;

    private _value: number = 0;

    protected start(): void {
        console.log("BarComponent start")
        this.setPercentage(1, false);
    }

    public setPercentage(value: number, withAnima?: boolean) {
        this._value = value;
        const target =  5 + (this.node.width - 10) * value;
        console.log("setPercentage", value, "width", target);
        if(!withAnima) {
            this.mask.width = target;
            return;
        }
        cc.Tween.stopAllByTarget(this.mask);
        cc.tween(this.mask)
            .to(0.2, { width: target })
            .start()
    }

}