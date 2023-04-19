import "cc";
import { CardComponent } from "./card";
import { objectPool } from "../common/object-pool";
import { getLocalTouchPos, randomChoice, randomChoiceOne, sleep } from "../common";
import { GameEvent, gameEvent } from "../common/event/events";
import { UI } from "../manager/ui-manager"
import LinkPrefab from "./ext/linked-prefab";
const { ccclass, property, menu } = cc._decorator;

export enum CardDeckMode {
    Player,
    Computer,
}

@ccclass
@menu("components/CardDeck")
export class CardDeckComponent extends cc.Component {

    @property(cc.Node)
    public deck: cc.Node = null;

    private cards: CardComponent[] = [];

    /* Deck 模式 */
    private mode: CardDeckMode | null = null;

    public setMode(mode: CardDeckMode) {
        if (this.mode === mode) {
            return;
        }
        this.mode = mode;
        this.createCard()
    }

    protected start(): void {
        console.log("CardDeckComponent start")
    }

    /* 初始化牌组 */
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
        for (let i = 0, len = this.cards.length; i < len; i++) {
            const card = this.cards[i]
            const targetX = this.getCardX(i)
            card.node.setSiblingIndex(len - i - 1)
            if (!withAnima) {
                card.node.x = targetX
            } else {
                tasks.push(new Promise<void>((resolve) => {
                    cc.tween(card.node)
                        .to(0.2, { x: targetX })
                        .call(() => {
                            resolve()
                        })
                        .start()
                }))
            }
        }
        await Promise.all(tasks)
    }

    private getCardX(idx: number) {
        return 50 + idx * 20
    }

    /* 玩家从卡池中抽取一张卡牌 */

    @property(LinkPrefab)
    public cardPool: LinkPrefab = null;

    get cardPoolNode() {
        return this.cardPool.node
    }

    public async drawCard() {
        // 从对象池中抽取一张卡牌
        const cardNode = await objectPool.cardPool.get()

        // 初始化信息
        cardNode.setPosition(this.cardPoolNode.getPosition())
        const card = cardNode.getComponent(CardComponent)
        card.setIsVisible(this.mode === CardDeckMode.Player)

        // 加入到界面中，并播放动画，插入到卡组
        this.deck.addChild(cardNode)
        this.cards.push(card)
        await this.reorderCard(true)
    }

    private async useCard(card: CardComponent) {
        const tasks = [
            this.reorderCard(),
            new Promise<void>(resolve => {
                cc.tween(card.node)
                    .to(0.2, { opacity: 0 })
                    .call(() => {
                        card.node.parent = null
                        objectPool.cardPool.put(card.node)
                        resolve()
                    })
                    .start()
            })
        ]
        await Promise.all(tasks)
    }

    public async play() {
        const card = this.cards.splice(0, 1)[0]
        // move card to center of table

        const centerPos = cc.v2(0, 50)

        UI.getTopLayer().node.convertToWorldSpaceAR(centerPos, centerPos);//世界坐标
        card.node.parent.convertToNodeSpaceAR(centerPos, centerPos);//本地坐标

        card.beforeMoving()
        card.setMoving()
        await Promise.all([
            new Promise<void>((resolve) => {
                cc.tween(card.node)
                    .to(0.8, { x: centerPos.x, y: centerPos.y }, { easing: cc.easing.sineIn })
                    .call(() => {
                        resolve()
                    })
                    .start()
            }),
            sleep(0.4)
                .then(() => card.setIsVisible(true, true))
        ])

        await Promise.all([
            this.useCard(card),
            this.drawCard()
        ])
    }
}