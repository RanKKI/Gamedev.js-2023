import "cc";
import { CardComponent } from "./card";
import { objectPool } from "../common/object-pool";
import { getLocalTouchPos, random, randomChoice, randomChoiceOne, sleep } from "../common";
import { GameEvent, gameEvent } from "../common/event/events";
import { UI } from "../manager/ui-manager"
import LinkPrefab from "./ext/linked-prefab";
import { BarComponent } from "./bar";
import { cardConfigManager } from "../game-logic/card-manager";
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
    }

    get selfName() {
        return this.mode === CardDeckMode.Player ? "Player" : "Computer";
    }

    private round: number = 0
    public setRound(round: number) {
        this.round = round
    }

    private log(...msg: any[]) {
        console.log(`[${this.round}][${this.selfName}]`, ...msg)
    }

    protected start(): void {

    }

    /* 初始化牌组 */
    private async createCard() {
        for (let i = 0; i < 5; i++) {
            await this.drawCard()
        }
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

    /* 玩家状态 */

    @property(LinkPrefab)
    public hpBarPrefab: LinkPrefab = null

    get hpBar() {
        return this.hpBarPrefab.getComponent(BarComponent)
    }

    private HP = 0

    public isDead() {
        return this.HP <= 0
    }

    public addHP(value: number) {
        if(value == 0) return;
        this.HP += value
        this.hpBar.setPercentage(this.HP / 100, true)
        this.log(`HP ${value > 0 ? "+": "-"}${Math.abs(value)}, HP: ${this.HP}`)
    }

    public setHP(value: number) {
        this.HP = value
        this.hpBar.setPercentage(this.HP / 100)
    }

    private effects: NormalCommand[] = []

    /* 卡池 */
    private cardsPool: Card[] = []
    private nextCardIdx = 0
    private direction = -1

    private resetCardsPool() {
        this.cardsPool = []
        this.nextCardIdx = 0
        this.direction = 1
    }

    private getNextCardConf(): Card {
        if (this.cardsPool.length <= 0) {
            throw new Error("卡池为空")
        }
        // 循环从 cardsPool 中取出卡牌
        const card = this.cardsPool[this.nextCardIdx]
        if (this.nextCardIdx <= 0) {
            this.direction = 1
            this.nextCardIdx = 0
        } else if (this.nextCardIdx >= this.cardsPool.length - 1) {
            this.direction = -1
            this.nextCardIdx = this.cardsPool.length - 1
        }
        this.nextCardIdx += this.direction
        return card
    }

    public async prepare(cardsPool: Card[]) {
        // 为开始游戏做准备，

        // 设置卡组
        this.resetCardsPool()
        this.cardsPool = [...cardsPool]
        // 恢复 HP
        this.setHP(100)
        // 清空状态
        this.effects = []

        await this.createCard()

        this.log(this.cards.map(v => v.conf.name))
    }

    /* 玩家从卡池中抽取一张卡牌 */

    @property(LinkPrefab)
    public cardPoolNode: LinkPrefab = null;

    public async drawCard() {
        // 从对象池中抽取一张卡牌
        const cardNode = await objectPool.cardPool.get()

        // 初始化信息
        cardNode.setPosition(this.cardPoolNode.node.getPosition())
        const card = cardNode.getComponent(CardComponent)
        card.setIsVisible(this.mode === CardDeckMode.Player)

        // 加入到界面中，并播放动画，插入到卡组
        this.deck.addChild(cardNode)
        this.cards.push(card)

        // 配置 Card
        const conf = this.getNextCardConf()
        card.setCardConf(conf)

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

    public async play(): Promise<NormalCommand[]> {
        if (this.needsSkip()) {
            this.log("Skip this turn")
            return []
        }

        const card = this.cards.splice(0, 1)[0]
        // move card to center of table

        this.log("Play card", card.conf.name)

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

        return cardConfigManager.convertToCommands(card.conf, 1);
    }

    private needsSkip(): boolean {
        const skipCard = this.effects.find(effect => effect.type === "skipturn")
        if (skipCard) {
            skipCard.value--;
            if (skipCard.value <= 0) {
                this.effects.splice(this.effects.indexOf(skipCard), 1)
            }
            return true;
        }
        return false
    }

    private executeMap: { [key: string]: (command: NormalCommand) => void } = {
        "attack": (command: NormalCommand) => this.executeAttack(command),
        "skipturn": (command: NormalCommand) => this.executeSkipTurn(command),
    }

    public async execute(commands: NormalCommand[]) {
        const effects = this.findCommandsByType<EffectCommand>(commands, "effect")
        commands = this.applyEffects(effects, commands)

        for (let i = 0, len = commands.length; i < len; i++) {
            const command = commands[i]

            if (command.type == "effect") continue;

            const execute = this.executeMap[command.type]
            if (!execute) {
                this.log("not found execute for command", command.type)
                continue
            }
            execute(command)
        }
    }

    private executeAttack(command: NormalCommand) {
        this.log("attacked by", command.value, "damage")
        this.addHP(-command.value)
    }

    private executeSkipTurn(command: NormalCommand) {
        this.effects.push(command)
    }

    private findCommandsByType<T>(commands: NormalCommand[], type: string): T[] {
        return commands.filter(cmd => cmd.type === type) as T[]
    }

    private applyBuff(buff: BuffCommand, cmd: NormalCommand) {
        let addValue = buff.value
        if (buff.valueType === "percent") {
            addValue = cmd.value * buff.value
        }
        const rawValue = buff.value + (buff.valueType == "percent" ? "%" : "")
        this.log("use effect on", buff.on, "value", addValue, "raw", rawValue)
        cmd.value += addValue
    }

    private applyEffects(effects: EffectCommand[], commands: NormalCommand[]): NormalCommand[] {
        for (let i = 0, len = commands.length; i < len; i++) {
            const command = commands[i]
            const targetEffects = effects.filter(eff => eff.buff.on === command.type)
            // for targetEffects
            for (let j = 0, len = targetEffects.length; j < len; j++) {
                const effect = targetEffects[j]
                if (random(0, 1) > effect.value) continue
                const buff = effect.buff
                this.applyBuff(buff, command)
            }
        }
        return commands
    }

}