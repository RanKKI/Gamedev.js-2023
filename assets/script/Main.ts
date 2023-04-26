import { UI } from "./manager/ui-manager";
import { userData } from "./user/userdata";
import { cardConfigManager } from "./game-logic/card-manager";

const { ccclass, menu } = cc._decorator

@ccclass
@menu("components/Main")
export default class Main extends cc.Component {

    async start() {
        console.log("Main start")
        await cardConfigManager.loadConfigs()
        await this.loadUserData()
        await UI.openLayer("prefab/layers/StartLayer", null)
    }

    private async loadUserData() {
        console.log("load user data")
        userData.load()

        console.debug("load debug data")
        userData.loadDebug()

        console.log("finish load user data")
    }

}