import { random, sleep } from "../common";
import { objectPool } from "../common/object-pool";
import { cardConfigManager } from "../game-logic/card-manager";
import { UI } from "../manager/ui-manager";
import ActionLabel from "./action-label";
import { BarComponent } from "./bar";
import { CardComponent } from "./card";
import LinkPrefab from "./ext/linked-prefab";
const { ccclass, property, menu } = cc._decorator;

export enum CardDeckMode {
    Player,
    Computer,
}

const TriggerType = {
    None: 0,
    UsedStrength: 1 << 1,
    HPChanged: 1 << 2,
}

interface PlayerAttribute {
    hp: number
    block: number
    strength: number
}

const MAX_HP = 40
const DEFAULT_PLAYER_ATTRIBUTE: PlayerAttribute = {
    block: 0,
    strength: 0,
    hp: MAX_HP,
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

    /*
        玩家状态
        Player Property
     */
    private playerAttributes: PlayerAttribute = { ...DEFAULT_PLAYER_ATTRIBUTE }

    public getAttributes() {
        return this.playerAttributes
    }

    private resetAttributes() {
        this.playerAttributes = { ...DEFAULT_PLAYER_ATTRIBUTE }
        this.triggers = TriggerType.None
    }

    public isDead() {
        return this.playerAttributes.hp <= 0
    }

    public addHP(value: number) {
        if (value == 0) return;
        this.playerAttributes.hp += value
        const hp = this.playerAttributes.hp
        this.hpBar.setPercentage(hp / MAX_HP, true)
        this.log(`HP ${value > 0 ? "+" : "-"}${Math.abs(value)}, HP: ${hp}`)
    }

    public setHP(value: number) {
        this.playerAttributes.hp = value
        this.hpBar.setPercentage(value / MAX_HP)
    }

    private effects: NormalCommand[] = []

    /* 卡池 */
    private cardsPool: Card[] = []
    private nextCardIdx = 0

    private resetCardsPool() {
        this.cardsPool = []
        this.nextCardIdx = 0
    }

    private getNextCardConf(): Card {
        if (this.cardsPool.length <= 0) {
            throw new Error("卡池为空")
        }
        // 循环从 cardsPool 中取出卡牌
        const card = this.cardsPool[this.nextCardIdx % this.cardsPool.length]
        this.nextCardIdx++
        return card
    }

    public async prepare(cardsPool: Card[]) {
        // 为开始游戏做准备，

        // 设置卡组
        this.resetCardsPool()
        this.cardsPool = [...cardsPool]

        // 清空状态
        this.resetAttributes()
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

    public async play(otherPlayerAttributed: PlayerAttribute): Promise<NormalCommand[]> {
        if (this.needsSkip()) {
            this.log("Skip this turn")
            return []
        }

        this.beforeUseCard()

        const card = this.cards.splice(0, 1)[0]
        // move card to center of table

        this.log("Play card", card.conf.name)

        const centerPos = cc.v2(0, 0)

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

        let commands = cardConfigManager.convertToCommands(card.conf);
        commands = this.applySelfCommands(commands, otherPlayerAttributed)
        commands = this.applyEffectBeforeUseCard(commands, otherPlayerAttributed)

        this.afterUseCard()

        return commands
    }

    private triggers = TriggerType.None

    private addTrigger(trigger: number) {
        this.triggers |= trigger
    }

    private removeTrigger(trigger: number) {
        this.triggers &= ~trigger
    }

    private isTrigger(trigger: number) {
        return (this.triggers & trigger) !== 0
    }

    private beforeUseCard() {
        // 每回合 -1
        if (this.playerAttributes.strength > 0) {
            this.playerAttributes.strength = Math.max(0, this.playerAttributes.strength - 1)
            this.log("reduce strength by 1, now = ", this.playerAttributes.strength)
        }
    }

    private afterUseCard() {
        if (this.isTrigger(TriggerType.UsedStrength)) {
            this.removeTrigger(TriggerType.UsedStrength)
            this.log("Used strength, reset strength to 0")
            this.playerAttributes.strength = 0
        }
    }

    private applyEffectBeforeUseCard(commands: NormalCommand[], otherPlayerAttributed: PlayerAttribute) {
        for (const cmd of commands) {
            const strength = this.playerAttributes.strength
            const val = cmd.value
            if (cmd.type === "attack" && strength > 0) {
                cmd.value += strength
                this.addTrigger(TriggerType.UsedStrength)
                this.log("Apply strength", strength, `, increased attack from ${val} to ${cmd.value}`)
            }
        }
        return commands
    }

    private applySelfCommands(commands: NormalCommand[], otherPlayerAttributed: PlayerAttribute) {
        const selfCmdTypes = ["block", "block_strength", "strength", "vengeance"]
        const selfCommands = this.findCommandsByType<NormalCommand>(commands, selfCmdTypes)
        const newCommands = this.callCommands(selfCommands, otherPlayerAttributed)
        return [
            ...commands.filter(v => !selfCmdTypes.includes(v.type)),
            ...newCommands
        ]
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

    public async execute(commands: NormalCommand[], otherPlayerAttributed: PlayerAttribute) {

        const attributes = { ...this.playerAttributes }

        const effects = this.findCommandsByType<EffectCommand>(commands, "effect")
        commands = this.applyEffects(effects, commands)
        // filter type not include effect
        commands = commands.filter(v => v.type !== "effect")
        this.callCommands(commands, otherPlayerAttributed)

        if (this.playerAttributes.hp != attributes.hp) {
            this.addTrigger(TriggerType.HPChanged)
        } else {
            this.removeTrigger(TriggerType.HPChanged)
        }
    }

    private callCommands(commands: NormalCommand[], otherPlayerAttributed: PlayerAttribute) {
        let newCommands: NormalCommand[] = []
        for (let i = 0, len = commands.length; i < len; i++) {
            const command = commands[i]
            let execute = this[`execute_${command.type}`]
            if (!execute) {
                this.log("not found execute for command", command.type)
                continue
            }
            const newCommand = execute.call(this, command, otherPlayerAttributed)
            if (newCommand) {
                newCommands.push(newCommand)
            }
        }
        return newCommands
    }

    private execute_attack(command: NormalCommand) {
        let damage = command.value
        let block = this.playerAttributes.block
        if (block > 0) {
            if (block >= damage) {
                block -= damage
                damage = 0
            } else {
                damage -= block
                block = 0
            }
        }
        this.playerAttributes.block = block
        if (damage != command.value) {
            this.log("attacked by", damage, "damage", `(origin damage = ${command.value})`)
        } else {
            this.log("attacked by", damage, "damage")
        }
        this.addAction(`-${damage} HP`)
        this.addHP(-damage)
    }

    private execute_skipturn(command: NormalCommand) {
        this.effects.push(command)
    }

    private execute_block(command: NormalCommand) {
        const block = Math.max(0, command.value)
        this.log("add block", block)
        this.addAction(`+${block} Block`)
        this.playerAttributes.block += block
    }

    private execute_block_strength(command: NormalCommand, playerAttributes: PlayerAttribute) {
        const block = Math.max(0, command.value + playerAttributes.strength)
        this.log("add block", block)
        this.addAction(`+${block} Block`)
        this.playerAttributes.block += block
    }

    private execute_strength(command: NormalCommand) {
        this.log("add strength", command.value)
        this.addAction(`+${command.value} Strength`)
        this.playerAttributes.strength += command.value
    }

    private execute_vengeance(command: NormalCommand): NormalCommand {
        // If health is reduced last turn, deals 6 damage, otherwise, deals 3 damage.
        const damage = this.isTrigger(TriggerType.HPChanged) ? 6 : 3
        this.log(`Vengeance triggered, deal ${damage}  damage to enemy`)
        return {
            type: "attack",
            value: damage,
        }
    }

    private findCommandsByType<T>(commands: NormalCommand[], type: string | string[]): T[] {
        const typeArr = Array.isArray(type) ? type : [type]
        return commands.filter(cmd => typeArr.findIndex((v) => v == cmd.type) >= 0) as T[]
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

    @property(cc.Node)
    public actionLabelRoot: cc.Node = null

    private async addAction(action: string) {
        const node = await objectPool.actionLabelsPool.get()
        const label = node.getComponent(ActionLabel)
        label.do(action, this.actionLabelRoot)
        if(this.mode == CardDeckMode.Computer) {
            node.angle = -180;
        }
    }

}