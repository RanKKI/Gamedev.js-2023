import { getLocalTouchPos } from "../common";
import { loadRes } from "../manager/resources";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("components/Card")
export class CardComponent extends cc.Component {

    @property(cc.Node)
    public cardNode: cc.Node = null;

    @property(cc.Node)
    public cardBg: cc.Node = null;

    @property(cc.Node)
    public selected: cc.Node = null;

    @property(cc.PolygonCollider)
    public collider: cc.PolygonCollider = null;

    @property(cc.Sprite)
    public cardSprite: cc.Sprite = null;

    private isVisible: boolean = false;
    private bSelected: boolean = false;

    protected start(): void {
        this.setIsVisible(this.isVisible)
        this.setSelect(this.bSelected)
    }

    public async setIsVisible(isVisible: boolean, withAnima?: boolean) {
        if (isVisible == this.isVisible) {
            return;
        }
        this.isVisible = isVisible;
        this.cardNode.active = isVisible;
        this.cardBg.active = !isVisible;
        if (!withAnima || withAnima == null) {
            return;
        }
        this.cardNode.opacity = isVisible ? 0 : 255;
        this.cardBg.opacity = isVisible ? 255 : 0;
        const a1 = new Promise<void>((resolve) => {
            cc.tween(this.cardNode)
                .to(0.4, { opacity: isVisible ? 255 : 0 }, { easing: cc.easing.sineIn })
                .call(() => {
                    resolve()
                    this.cardNode.active = isVisible;
                })
                .start()
        })
        const a2 = new Promise<void>((resolve) => {
            cc.tween(this.cardBg)
                .to(0.2, { opacity: isVisible ? 0 : 255 })
                .call(() => {
                    this.cardBg.active = !isVisible;
                    resolve()
                })
                .start()
        })
        await Promise.all([a1, a2])
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

    private currentAngle: number = 0;
    private currentPos: cc.Vec3 = null;
    private currentZIndex: number = 0;

    public getDataBeforeMoving() {
        return {
            "pos": this.currentPos,
            "zIndex": this.currentZIndex
        }
    }

    public beforeMoving() {
        if (this.node == null) {
            return;
        }
        this.currentAngle = this.node.angle;
        this.currentPos = this.node.position.clone();
        this.currentZIndex = this.node.getSiblingIndex();
    }

    public setSelect(isSelect: boolean) {
        this.selected.active = isSelect;
        this.bSelected = isSelect;
    }

    // 玩家移动卡牌中
    public setMoving(evt: cc.Event.EventTouch | null = null) {
        this.node.angle = 0;
        this.node.setSiblingIndex(this.node.parent.childrenCount - 1);
        if (evt) {
            this.updateMoving(evt)
        }
    }

    public updateMoving(evt: cc.Event.EventTouch) {
        let touchPos = evt.getLocation()
        cc.Camera.main.getScreenToWorldPoint(touchPos, touchPos);//世界坐标
        this.node.parent.convertToNodeSpaceAR(touchPos, touchPos);//本地坐标
        this.node.setPosition(touchPos)
    }

    public afterMoving(restore: boolean) {
        if (restore) {
            this.node.angle = this.currentAngle;
            this.node.position = this.currentPos;
            this.node.setSiblingIndex(this.currentZIndex);
        }
    }

    public conf: Card = null;

    public setCardConf(conf: Card) {
        this.conf = conf
        loadRes(`ui/card/${conf.resource}`, cc.SpriteFrame)
            .then((spriteFrame: cc.SpriteFrame) => {
                this.cardSprite.spriteFrame = spriteFrame
            })
    }

    public recycle() {
        // reset all properties
        this.setIsVisible(false);
        this.setSelect(false);
        this.node.angle = 0;
        this.node.position = cc.Vec3.ZERO;
        this.node.setSiblingIndex(0);
        this.currentAngle = 0;
        this.currentPos = null;
        this.currentZIndex = 0;
        this.node.opacity = 255;
        this.cardNode.opacity = 255
        this.cardBg.opacity = 255
        this.conf = null
    }

}