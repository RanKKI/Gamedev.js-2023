import "cc";
import { UI } from "./manager/ui-manager";

const { ccclass, menu } = cc._decorator

@ccclass
@menu("components/Main")
export default class Main extends cc.Component {

    async start() {
        console.log("Main start")
        await UI.openLayer("prefab/layers/GameLayer", null)
    }

}