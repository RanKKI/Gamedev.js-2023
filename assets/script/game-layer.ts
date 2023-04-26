import { UI } from "./manager/ui-manager"
import BaseLayer from "./components/base/base-layer"
import LinkPrefab from "./components/ext/linked-prefab"
import { CardDeckMode, CardDeckComponent } from "./components/card-deck"
import { gameEvent, GameEvent } from "./common/event/events"
import { touchLocker } from "./common/locker"
import { cardConfigManager } from "./game-logic/card-manager"

const { ccclass, menu, property } = cc._decorator

@ccclass
@menu("components/layers/GameLayer")
export default class GameLayer extends BaseLayer {

    @property(LinkPrefab)
    public playerDeckPrefab: LinkPrefab = null

    @property(LinkPrefab)
    public oppositeDeckPrefab: LinkPrefab = null

    get playerDeck(): CardDeckComponent {
        return this.playerDeckPrefab.getComponent(CardDeckComponent)
    }

    get oppositeDeck(): CardDeckComponent {
        return this.oppositeDeckPrefab.getComponent(CardDeckComponent)
    }

    async testPanel() {
        await UI.openPanel("prefab/common/confirm-panel", null)
    }

    protected start(): void {
        this.playerDeck.setMode(CardDeckMode.Player)
        this.oppositeDeck.setMode(CardDeckMode.Computer)
        gameEvent.on((arg) => this.onGameEvent(arg.name, arg.data))
        this.startGame()
    }

    /* 处理回合 */
    private onGameEvent(event: string, data: any) {

    }

    private async selectCards(): Promise<Card[]> {
        const ret = await UI.openPanel("prefab/select-card-panel", null)
        return ret.values as Card[]
    }

    @touchLocker
    public async startGame() {
        const p1 = this.playerDeck
        const p2 = this.oppositeDeck
        /* 设置卡组 */
        const cards = await this.selectCards()

        await Promise.all([
            p1.prepare(cards),
            p2.prepare(cards.reverse())
        ])

        let isPlayerWin = false
        let round = 0
        while (!p1.isDead() && !p2.isDead()) {
            p1.setRound(round)
            p2.setRound(round)

            const cmd = await p1.play(p2.getAttributes())
            await p2.execute(cmd, p2.getAttributes())
            if (p2.isDead()) {
                isPlayerWin = true
                break
            }
            const cmd1 = await p2.play(p1.getAttributes())
            await p1.execute(cmd1, p1.getAttributes())
            if (p1.isDead()) break

            round++
            console.log(`-----------${round}------------`)
        }

        const labelStr = isPlayerWin ? "You Win" : "You Lose"
        if (isPlayerWin) {
            console.log("player win")
        } else {
            console.log("player lose")
        }

        await UI.openLayer("prefab/layers/FinishLayer", { label: labelStr })
        this.close()
    }

}