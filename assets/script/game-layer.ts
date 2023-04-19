import "cc"
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
        console.log("GameLayer testPanel")
        await UI.openPanel("prefab/common/confirm-panel", null)
    }

    protected start(): void {
        console.log("GameLayer start")
        this.playerDeck.setMode(CardDeckMode.Player)
        this.oppositeDeck.setMode(CardDeckMode.Computer)
        gameEvent.on((arg) => this.onGameEvent(arg.name, arg.data))
    }

    /* 处理回合 */
    private onGameEvent(event: string, data: any) {

    }

    private async selectCards(): Promise<Card[]> {
        const conf = cardConfigManager
        return [
            conf.getCard(1),
            conf.getCard(2),
            conf.getCard(3),
        ]
    }

    @touchLocker
    public async startGame() {
        const p1 = this.playerDeck
        const p2 = this.oppositeDeck
        /* 设置卡组 */
        const cards = await this.selectCards()

        p1.prepare(cards)
        p2.prepare(cards.reverse())

        let isPlayerWin = false
        while (!p1.isDead() && !p2.isDead()) {
            const cmd = await p1.play()
            await p2.execute(cmd)
            if (p2.isDead()) {
                isPlayerWin = true
                break
            }
            const cmd1 = await p2.play()
            await p1.execute(cmd1)
            if (p1.isDead()) break
        }

        if (isPlayerWin) {

        } else {

        }
    }

}