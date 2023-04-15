import "cc"
import { UI } from "./manager/ui-manager"
import BaseLayer from "./components/base/base-layer"

const { ccclass, menu } = cc._decorator

@ccclass
@menu("components/layers/GameLayer")
export default class GameLayer extends BaseLayer {

    async testPanel() {
        console.log("GameLayer testPanel")
        await UI.openPanel("prefab/common/confirm-panel", null)
    }

}