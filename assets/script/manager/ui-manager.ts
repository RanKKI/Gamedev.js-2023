import BaseLayer from "../components/base/base-layer";
import BasePanel from "../components/base/base-panel";
import { LayerPrefab, PanelPrefab } from "../components/prefab";
import { LayerManager } from "./layer-manager";
import { PanelOption, PanelShowResult, PanelManager } from "./panel-manager";

export class UI {

    static tmpP: string;

    public static async openPanel<T extends keyof PanelPrefab, K>(path: T, data: PanelPrefab[T], opt?: PanelOption): Promise<{
        panelResult: PanelShowResult,
        values?: K
    }> {
        // if (this.getPanelByName(path.replace(/.w+$/, ''))) return;
        return PanelManager.ins.open(path, data, opt)
    }

    public static async openLayer<T extends keyof LayerPrefab>(path: T, data: LayerPrefab[T]): Promise<boolean> {
        return LayerManager.ins.open(path, data)
    }

    public static getTopView(): BaseLayer | BasePanel {
        const panels = PanelManager.ins.panelList
        if (panels.length > 0) {
            const panel = panels[panels.length - 1]
            if (panel.node) {
                return panel.node.getComponent(BasePanel)
            }
        }
        const layers = LayerManager.ins.layers
        if (layers.length > 0) {
            const layer = layers[layers.length - 1]
            return layer.getComponent(BaseLayer)
        }
    }

    public static getTopLayer(): BaseLayer {
        const layers = LayerManager.ins.layers
        if (layers.length > 0) {
            const layer = layers[layers.length - 1]
            return layer.getComponent(BaseLayer)
        }
    }

    public static getTopPanel() {
        const panels = PanelManager.ins.panelList
        if (panels.length > 0) {
            const panel = panels[panels.length - 1]
            return panel.node
        }
    }

    public static getPanelByName(panelName: string) {
        const panels = PanelManager.ins.panelList
        for (let i = 0; i < panels.length; ++i) {
            if (panels[i].node.name == panelName) {
                return panels[i].node
            }
        }
        return null
    }
}