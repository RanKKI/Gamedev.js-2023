import "cc"
import { UI } from "./manager/ui-manager"
import BaseLayer from "./components/base/base-layer"
import LinkPrefab from "./components/ext/linked-prefab"
import { CardDeckMode, CardDeckComponent } from "./components/card-deck"
import { gameEvent, GameEvent } from "./common/event/events"
import { touchLocker } from "./common/locker"

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

    @touchLocker
    public async startGame() {
        const p1 = this.playerDeck
        const p2 = this.oppositeDeck
        let i = 0;
        while (i <= 10) {
            await p1.play()
            await p2.play()
            i++;
        }
    }

}