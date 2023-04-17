import "cc";
import { CardComponent } from "./card";
import { objectPool } from "../common/object-pool";
import { randomChoice, randomChoiceOne } from "../common";
import { GameEvent, gameEvent } from "../common/event/events";
import { UI } from "../manager/ui-manager"
const { ccclass, property, menu } = cc._decorator;

export enum CardDeckMode {
    Player,
    Computer,
}

@ccclass("CardDeck")
@menu("components/CardDeck")
export class CardDeckComponent extends cc.Component {

    @property(cc.Node)
    public deck: cc.Node = null;

    private cards: CardComponent[] = [];

    private mode: CardDeckMode | null = null;

    public setMode(mode: CardDeckMode) {
        if (this.mode === mode) {
            return;
        }
        this.mode = mode;
        this.removeTouchListener()
        if (mode === CardDeckMode.Player) {
            this.addTouchListener()
        } else {

        }
        this.createCard()
    }

    protected start(): void {
        console.log("CardDeckComponent start")
    }

    private async createCard() {
        for (let i = 0; i < 7; i++) {
            const cardNode = await objectPool.cardPool.get()
            this.deck.addChild(cardNode)
            const card = cardNode.getComponent(CardComponent)
            card.setIsVisible(this.mode === CardDeckMode.Player)
            this.cards.push(card)
        }
        this.reorderCard(false)
    }

    private async reorderCard(withAnima = true) {
        const tasks: Promise<void>[] = []
        const middleIndex = Math.floor(this.cards.length / 2)
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i]
            const isLeft = i < middleIndex
            const isRight = i > middleIndex
            const degree = isLeft ? 15 * (middleIndex - i) : isRight ? -15 * (i - middleIndex) : 0
            if (!withAnima) {
                card.node.angle = degree
            } else {
                tasks.push(new Promise<void>((resolve) => {
                    cc.tween(card.node)
                        .to(0.2, { angle: degree })
                        .call(() => {
                            resolve()
                        })
                        .start()
                }))
            }
        }
        await Promise.all(tasks)
    }

    private addTouchListener() {
        if (this.node.hasEventListener(cc.Node.EventType.TOUCH_START)) {
            return
        }
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchBegin, this)
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    }

    private removeTouchListener() {
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_START)) {
            return
        }
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchBegin, this)
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this)
    }

    private selectedCard: CardComponent = null

    private onTouchBegin(event: cc.Event.EventTouch) {
        // find the card that is touched
        let touchPos = event.getLocation()
        cc.Camera.main.getScreenToWorldPoint(touchPos, touchPos);//世界坐标
        this.node.convertToNodeSpaceAR(touchPos, touchPos);//本地坐标

        let card: CardComponent;
        for (let i = this.cards.length - 1; i >= 0; i--) {
            card = this.cards[i];
            if (card.hitTest(event)) {
                break;
            }
        }

        if (card) {
            console.log("card touched", card.node)
            this.selectedCard = card
            card.setSelect(true)
            card.beforeMoving()
            card.setMoving(event)
        } else {
            console.log("no card touched")
        }
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if (this.selectedCard) {
            this.selectedCard.updateMoving(event)
        }
    }

    private isOnTable(card: CardComponent): boolean {
        const cardPos = card.node.getPosition()
        card.node.convertToWorldSpaceAR(cardPos, cardPos)
        this.node.parent.convertToNodeSpaceAR(cardPos, cardPos)
        const rect = this.node.getBoundingBox()
        return rect.contains(cardPos);
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        const card = this.selectedCard;
        this.selectedCard = null;

        if (!card) {
            return;
        }

        let useCard = !this.isOnTable(card);
        card.setSelect(false)

        if (!useCard) {
            card.afterMoving(true)
        }

        if (useCard) {
            this.useCard(card)
            gameEvent.emit({ name: GameEvent.UserRoundFinished, data: { card } })
        }
    }

    private useCard(card: CardComponent) {
        this.cards.splice(this.cards.indexOf(card), 1)
        this.reorderCard()
        cc.tween(card.node)
            .to(0.2, { opacity: 0 })
            .call(() => {
                card.node.parent = null
                objectPool.cardPool.put(card.node)
            })
            .start()
    }

    public async play() {
        if (this.mode === CardDeckMode.Player) {
            return
        }
        const card = randomChoiceOne(this.cards)
        // move card to center of table

        const centerPos = cc.v2(0, 50)

        UI.getTopLayer().node.convertToWorldSpaceAR(centerPos, centerPos);//世界坐标
        card.node.parent.convertToNodeSpaceAR(centerPos, centerPos);//本地坐标

        console.log("centerPos", centerPos)
        card.beforeMoving()
        card.setMoving()
        card.setIsVisible(true)

        await new Promise<void>((resolve) => {
            cc.tween(card.node)
                .to(1, { x: centerPos.x, y: centerPos.y }, { easing: cc.easing.sineIn })
                .call(() => {
                    resolve()
                })
                .start()
        })
        this.useCard(card)
    }
}