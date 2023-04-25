import "cc"
import BasePanel from "./components/base/base-panel"
import { CardPlaceholderComponent } from "./components/card-placeholder"
import LinkPrefab from "./components/ext/linked-prefab"
import { objectPool } from "./common/object-pool"
import { CardComponent } from "./components/card"
import { touchLocker } from "./common/locker"
import { cardConfigManager } from "./game-logic/card-manager"

const { ccclass, property, menu } = cc._decorator

@ccclass
@menu("panel/SelectCard")
export default class SelectCard extends BasePanel {

    @property([LinkPrefab])
    public cardPlaceholdersRaw: LinkPrefab[] = []

    @property(cc.Node)
    public cardPool: cc.Node = null

    @property(cc.Node)
    public holdingCard: cc.Node = null

    private cards: CardComponent[] = []

    private get cardPlaceholders(): CardPlaceholderComponent[] {
        return this.cardPlaceholdersRaw.map((v) => v.getComponent(CardPlaceholderComponent))
    }

    protected async playEnterAnima(duration: number) {
        this.initHolders(5)
        await this.createCards()
        await this.playCardsAnimation(true)
        this.addListeners()
    }

    private initHolders(lockStartIdx: number) {
        const holders = this.cardPlaceholders
        for (let i = 0, len = holders.length; i < len; i++) {
            const holder = holders[i]
            holder.holderIdx = i
            holder.setIsLocked(i >= lockStartIdx)
        }
    }

    private async createCards() {
        const cardConfigs = [
            cardConfigManager.getCard(1),
            cardConfigManager.getCard(2),
            cardConfigManager.getCard(3),
        ]
        for (let i = 0; i < 5; i++) {
            // 从对象池中抽取一张卡牌
            const cardNode = await objectPool.cardPool.get()

            // 初始化信息
            // cardNode.setPosition(this.cardPool.getPosition())
            const card = cardNode.getComponent(CardComponent)
            card.setIsVisible(true)
            card.setCardConf(cardConfigs[i % cardConfigs.length])

            // 加入到界面中，并播放动画，插入到卡组
            this.cardPool.addChild(cardNode)
            this.cards.push(card)
            cardNode.opacity = 0
        }
    }

    private getCardX(idx: number) {
        return 50 + idx * 50
    }

    private async playCardsAnimation(init = false) {
        const tasks: Promise<void>[] = []
        for (let i = 0, len = this.cards.length; i < len; i++) {
            const card = this.cards[i]
            const targetX = this.getCardX(i)
            if (init) {
                card.node.x = targetX + 150
            }
            card.node.setSiblingIndex(len - i - 1)
            tasks.push(new Promise<void>((resolve) => {
                cc.tween(card.node)
                    .delay(i * 5 / 24)
                    .to(0.7, { x: targetX, opacity: 255 }, { easing: cc.easing.sineIn })
                    .call(() => {
                        resolve()
                    })
                    .start()
            }))
        }
        await Promise.all(tasks)
    }

    private addListeners() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchBegin, this)
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
    }

    protected onHide(): void {
        this.removeListeners()
    }

    private removeListeners() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchBegin, this)
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
    }

    private selectedCard: CardComponent = null
    private selectHolder: CardPlaceholderComponent = null
    private holderCardMap: Map<CardPlaceholderComponent, CardComponent> = new Map()
    private cardHolderMap: Map<CardComponent, CardPlaceholderComponent> = new Map()

    private onTouchBegin(evt: cc.Event.EventTouch) {
        const cards = this.cards

        this.selectedCard = null
        for (let i = 0, len = cards.length; i < len; i++) {
            const card = cards[i]
            if (card.hitTest(evt)) {
                this.selectedCard = card
                break
            }
        }

        if (!this.selectedCard) {
            return
        }

        const card = this.selectedCard
        card.beforeMoving()
        card.setSelect(true)
    }

    private onTouchMove(evt: cc.Event.EventTouch) {
        if (!this.selectedCard) {
            return
        }
        const card = this.selectedCard
        card.setMoving(evt)
        this.selectHolder = this.getTouchedHolder(evt)
    }

    private getTouchedHolder(evt: cc.Event.EventTouch): CardPlaceholderComponent {
        // loop selectHolder
        const holders = this.cardPlaceholders
        let holder: CardPlaceholderComponent = null
        for (let i = 0, len = holders.length; i < len; i++) {
            if (!holders[i].isLocked && holders[i].hitTest(evt)) {
                holder = holders[i]
                break
            }
        }
        return holder
    }

    @touchLocker
    private async onTouchEnd(evt: cc.Event.EventTouch) {
        if (!this.selectedCard) {
            return
        }
        const holder = this.selectHolder
        const card = this.selectedCard
        card.setSelect(false)

        if (holder) {
            const oldCard = this.holderCardMap.get(holder)
            const oldHolder = this.cardHolderMap.get(card)
            this.holderCardMap.delete(oldHolder)
            this.cardHolderMap.delete(oldCard)

            if (oldCard && oldHolder) {
                this.putCardToHolder(oldCard, oldHolder)
                this.putCardToHolder(card, holder)
            } else if (oldCard) {
                console.log('put card back to pool')
                this.putCardBackToPool(oldCard, card)
                this.putCardToHolder(card, holder)
            } else {
                this.putCardToHolder(card, holder)
            }

        } else {
            card.afterMoving(true)
        }
    }

    private putCardBackToPool(card: CardComponent, newCard: CardComponent) {
        card.node.parent = this.cardPool
        const {pos, zIndex} = newCard.getDataBeforeMoving()
        card.node.setPosition(pos)
        card.node.zIndex = zIndex
    }

    private putCardToHolder(card: CardComponent, holder: CardPlaceholderComponent) {
        const pos = holder.node.getPosition()
        holder.node.convertToWorldSpaceAR(pos, pos)
        this.holdingCard.convertToNodeSpaceAR(pos, pos)
        card.node.parent = this.holdingCard
        card.node.setPosition(pos)
        this.holderCardMap.set(holder, card)
        this.cardHolderMap.set(card, holder)
    }

    submit() {
        const holders = this.cardPlaceholders
        const m = this.holderCardMap
        const cards: Card[] = []
        for (let i = 0, len = holders.length; i < len; i++) {
            const holder = holders[i]
            if (holder.isLocked) {
                break
            }
            const card = m.get(holder)
            if (!card) {
                continue
            }
            cards.push(card.conf)
        }
        this.setReturnValue(cards)
        this.hide()
    }

}