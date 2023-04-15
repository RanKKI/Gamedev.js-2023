import { loadLocalRes } from "../manager/resources";


/**
 * @func 显示吐司气泡
 * @param text 显示文案
 * @param duration 显示时长
 */
export async function showToast(text: string, duration: number = 3000) {

    if (text == null || text == "") {
        return;
    }

    const canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);

    // 清除上一节点node
    const oldToast = canvas.node.getChildByName('Toast')
    if (oldToast) oldToast.destroy()

    const bgSpriteImg: cc.SpriteFrame = await loadLocalRes('ui/guide/common_txt_bg', cc.SpriteFrame);

    const toastBgNode = new cc.Node('Toast');
    toastBgNode.opacity = 0

    // Label
    const textNode = new cc.Node('LabelNode');
    const toastLabel = textNode.addComponent(cc.Label);
    toastLabel.enableBold = true;
    toastLabel.fontSize = 50;
    toastLabel.lineHeight = 50;
    textNode.addComponent(cc.LabelOutline).color = cc.Color.BLACK;
    textNode.getComponent(cc.LabelOutline).width = 4;
    toastLabel.string = text;

    // Background
    const toastLayout = toastBgNode.addComponent(cc.Layout);
    toastLayout.resizeMode = cc.Layout.ResizeMode.NONE;
    toastLayout.paddingLeft = 30;
    toastLayout.paddingRight = 30;
    toastLayout.paddingTop = 25;
    toastLayout.paddingBottom = 20;


    let bgSprite = toastBgNode.addComponent(cc.Sprite);
    bgSprite.type = cc.Sprite.Type.SLICED;
    bgSprite.spriteFrame = bgSpriteImg

    toastBgNode.addChild(textNode)
    canvas.node.addChild(toastBgNode)

    const showed = cc.callFunc(() => {
        cc.tween(toastBgNode)
            .to(.3, { opacity: 255 })
            .start();
    })

    let finished = cc.callFunc(() => {
        const timer = setTimeout(() => {
            toastBgNode.destroy();
            clearTimeout(timer)
        }, duration);
    }, this);

    const action = cc.sequence(
        showed,
        finished
    )
    toastBgNode.runAction(action);
}