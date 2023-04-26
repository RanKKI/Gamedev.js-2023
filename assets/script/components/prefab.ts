export interface PanelPrefab {
    "prefab/common/confirm-panel": null,
    "prefab/select-card-panel": null,
}


/**
 * 界面预设的列表，以及需要使用的参数
 */
export interface LayerPrefab {
    'prefab/layers/GameLayer': null,
    "prefab/layers/StartLayer": null,
    "prefab/layers/FinishLayer": { label: string },
}