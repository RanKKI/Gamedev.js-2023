import BaseLayer from "./components/base/base-layer";
import { UI } from "./manager/ui-manager";

const { ccclass, menu, property } = cc._decorator


@ccclass
@menu("components/FinishLayer")
export default class FinishLayer extends BaseLayer<{ label: string }> {

    @property(cc.Label)
    public titleLabel: cc.Label = null

    protected start(): void {
        this.titleLabel.string = this.options.label
    }

    async enterGame() {
        await UI.openLayer("prefab/layers/GameLayer", null)
        this.close()
    }

}