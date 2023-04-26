import BaseLayer from "./components/base/base-layer";
import { UI } from "./manager/ui-manager";
import { userData } from "./user/userdata";

const { ccclass, menu, property } = cc._decorator


@ccclass
@menu("components/StartLayer")
export default class StartLayer extends BaseLayer {

    protected start(): void {
        if (userData.setting.getValue("showInfo")) {
            this.openInfoPanel()
            userData.setting.setValue("showInfo", false)
        }
    }

    async enterGame() {
        await UI.openLayer("prefab/layers/GameLayer", null)
        this.close()
    }

    openInfoPanel() {
        UI.openPanel("prefab/common/info-panel", null)
    }

}