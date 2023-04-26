import BaseLayer from "./components/base/base-layer";
import { UI } from "./manager/ui-manager";

const { ccclass, menu, property } = cc._decorator


@ccclass
@menu("components/StartLayer")
export default class StartLayer extends BaseLayer {

    async enterGame() {
        await UI.openLayer("prefab/layers/GameLayer", null)
    }

}