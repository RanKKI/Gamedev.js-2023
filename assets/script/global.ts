import { isTouchLocked } from "./common/locker";
import { Sound, sound } from "./common/sound";

(() => {
    console.log("Global script initd")

    /**
     * 给 cc.Button 设置点击音效
     */
    cc.Button.prototype["touchEndClone"] = cc.Button.prototype["_onTouchEnded"];
    cc.Button.prototype["clickSoundEffect"] = true;
    cc.Button.prototype["_onTouchEnded"] = function (evt) {
        if (this.interactable && this.enabledInHierarchy && this._pressed && this.clickSoundEffect) {
            //播放通用按钮音效
            sound.play(Sound.COMMON);
        }
        this.touchEndClone(evt);
    }

    if (!CC_EDITOR) {
        cc.internal.inputManager["oldTouchHandler"] = cc.internal.inputManager.handleTouchesBegin
        cc.internal.inputManager.handleTouchesBegin = function (touches: any) {
            if (isTouchLocked()) {
                return
            }
            cc.internal.inputManager["oldTouchHandler"].call(this, touches);
        }
    }

    /**
     * 关闭多点触摸
     */
    cc.macro.ENABLE_MULTI_TOUCH = false;

    /// 屏蔽 2.3.1 版本 prefab 嵌套 prefab 的弹框问题
    if (CC_EDITOR && !window["Editor"].isBuilder) {
        window["_Scene"].DetectConflict.beforeAddChild = function () {
            return false
        }
    }

    sound.playBGM()

})()