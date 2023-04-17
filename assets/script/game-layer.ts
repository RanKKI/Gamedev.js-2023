import "cc"
import { UI } from "./manager/ui-manager"
import BaseLayer from "./components/base/base-layer"
import LinkPrefab from "./components/ext/linked-prefab"
import { CardDeckMode, CardDeckComponent } from "./components/card-deck"
import { gameEvent, GameEvent } from "./common/event/events"

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

    private onGameEvent(event: string, data: any) {
        if (event == GameEvent.UserRoundFinished) {
            this.oppositeDeck.play()
        }
    }

}