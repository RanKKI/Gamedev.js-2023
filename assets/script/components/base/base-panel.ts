import { disableTouch, tempDisableButton } from "../../common/common";
import { Sound, sound } from "../../common/sound";

const { ccclass, property, disallowMultiple } = cc._decorator

@ccclass
@disallowMultiple
export default class BasePanel<Options = {}, K = {}> extends cc.Component {

    @property(cc.Node)
    content: cc.Node = null;

    /** 展示/隐藏动画的时长 */
    public animDuration: number = 0.5;

    /** 弹窗选项 */
    protected options: Options;

    /**
     * 展示弹窗
     * @param options 弹窗选项
     * @param duration 动画时长
     */
    public show(options?: Options, duration: number = this.animDuration) {
        // 储存选项
        this.options = options;
        // 初始化节点
        this.playEnterAnima(duration)

        // 初始化
        this.init(this.options);
        // 更新样式
        this.updateDisplay(this.options);
    }

    protected playEnterAnima(duration: number) {
        const main = this.content;
        this.node.active = true;
        main.active = true;
        main.scale = 0.5;
        main.opacity = 0;
        cc.tween(main)
            .to(duration, { scale: 1, opacity: 255 }, { easing: 'backOut' })
            .call(() => {
                // 弹窗已完全展示
                this.onShow && this.onShow();
            })
            .start();
    }

    /**
     * 隐藏弹窗
     */
    public hide(evt?: cc.Event.EventTouch): Promise<void> {
        tempDisableButton(evt, 1)
        disableTouch(this.node, true)
        const node = this.node;
        // 播放弹窗主体动画
        const tween = cc.tween(this.content)
            .to(3 / 24, { scale: 1.1 }, { easing: cc.easing.quadOut })
            .parallel(
                cc.tween(this.content).to(6 / 24, { scale: 0.5 }, { easing: cc.easing.quadIn }),
                cc.tween(this.content).delay(1 / 24).to(6 / 24, { opacity: 0 })
            )
            .call(() => {
                // 关闭节点
                node.active = false;
                // 弹窗已完全隐藏（动画完毕）
                this.onHide && this.onHide();
                disableTouch(this.node, false)
                // 弹窗完成回调
                this.finishCallback && this.finishCallback(node, this.returnValue);
            })
        return new Promise(resolve => {
            tween.call(() => {
                resolve()
            }).start()
        })
    }

    /**
     * 初始化（派生类请重写此函数以实现自定义逻辑）
     */
    protected init(options: Options) { }

    /**
     * 更新样式（派生类请重写此函数以实现自定义样式）
     * @param options 弹窗选项
     */
    protected updateDisplay(options: Options) { }

    /**
     * 弹窗已完全展示（派生类请重写此函数以实现自定义逻辑）
     */
    protected onShow() { }

    /**
     * 弹窗已完全隐藏（派生类请重写此函数以实现自定义逻辑）
     */
    protected onHide() { }

    /**
     * 弹窗流程结束回调（注意：该回调为 PopupManager 专用，重写 hide 函数时记得调用该回调）
     */
    protected finishCallback: (node: cc.Node, values?: any) => void = null;

    /**
     * 设置弹窗完成回调（该回调为 PopupManager 专用）
     * @param callback 回调
     */
    public setFinishCallback(callback: (node: cc.Node, values?: K) => void) {
        this.finishCallback = callback;
    }

    private returnValue: K = null

    protected setReturnValue(val: K) {
        this.returnValue = val
    }

}