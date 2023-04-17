import "cc";

const { ccclass, property, menu } = cc._decorator;

@ccclass("Card")
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

    private isVisible: boolean = false;
    private bSelected: boolean = false;

    protected start(): void {
        this.setIsVisible(this.isVisible)
        this.setSelect(this.bSelected)
    }

    public setIsVisible(isVisible: boolean) {
        this.cardNode.active = isVisible;
        this.cardBg.active = !isVisible;
        this.isVisible = isVisible;
    }

    public hitTest(evt: cc.Event.EventTouch): boolean {
        let touchPos = evt.getLocation()
        cc.Camera.main.getScreenToWorldPoint(touchPos, touchPos);//世界坐标
        this.node.convertToNodeSpaceAR(touchPos, touchPos);//本地坐标
        return cc.Intersection.pointInPolygon(touchPos, this.collider.points)
    }

    private currentAngle: number = 0;
    private currentPos: cc.Vec3 = null;
    private currentZIndex: number = 0;

    public beforeMoving() {
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

    private getScaledHeight(): number {
        return this.node.height * this.node.scaleY;
    }

    public updateMoving(evt: cc.Event.EventTouch) {
        let touchPos = evt.getLocation()
        cc.Camera.main.getScreenToWorldPoint(touchPos, touchPos);//世界坐标
        this.node.parent.convertToNodeSpaceAR(touchPos, touchPos);//本地坐标
        this.node.setPosition(touchPos.add(cc.v2(0, -this.getScaledHeight() / 2)))
    }

    public afterMoving(restore: boolean) {
        if (restore) {
            this.node.angle = this.currentAngle;
            this.node.position = this.currentPos;
            this.node.setSiblingIndex(this.currentZIndex);
        }
    }
}