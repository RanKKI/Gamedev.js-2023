import { userData } from "../user/userdata"

export enum Sound {
    COMMON = "sound/qubodup-hover2",
    BGM = "sound/bgm",
    BLOCK = "sound/swing",
    ATTACK = "sound/sword-unsheathe",
    VENGEANCE = "sound/sword-unsheathe4",
    STRENGTH = "sound/random5",
}


class SoundManager {

    private bgmID: number
    private clips: { [key: string]: cc.AudioClip }
    private isSharing = false // 分享或视频切出去时， 不会播放音乐
    private isHiding = false

    constructor() {
        // userEvent.on(() => {
        //     this.onBGMSwitchChange()
        // })
        // wechatEvent.on(res => {
        //     if (res.onShow) {
        //         this.isHiding = false
        //         this.onSoundChange()
        //     } else if (res.onHide) {
        //         this.isHiding = true
        //         this.onSoundChange()
        //     }
        // })
        // adEvent.on(evt => {
        //     this.isSharing = evt == AdEvent.SHARE || evt == AdEvent.VIDEO
        //     this.onSoundChange()
        // })
        this.clips = {}
    }

    private delayKey: number = 0
    private onSoundChange() {
        clearTimeout(this.delayKey)
        this.delayKey = setTimeout(() => {
            clearTimeout(this.delayKey)
            this.delayKey = 0
            if (this.isSharing || this.isHiding) {
                this.stopAll()
            } else {
                this.resumeAll()
            }
        }, 100);
    }

    private resumeAll() {
        cc.audioEngine.resumeMusic()
        cc.audioEngine.resumeAllEffects()
        this.onBGMSwitchChange()
    }

    private stopAll() {
        cc.audioEngine.stopMusic()
        cc.audioEngine.stopAllEffects()
    }

    async play(item: Sound | cc.AudioClip, volume: number = 1) {
        /** 用户关闭了音效 */
        if (userData.setting.getValue("bgm") === false) {
            return
        }
        volume = Math.min(1, Math.max(0, volume));
        let clip: cc.AudioClip
        if (item instanceof cc.AudioClip) {
            clip = item
        } else if (this.clips[item] != null) {
            clip = this.clips[item]
        } else {
            clip = await new Promise(resolve => {
                cc.resources.load(item, cc.AudioClip, (err, asset: cc.AudioClip) => {
                    err ? resolve(null) : resolve(asset)
                })
            })
            this.clips[item] = clip
        }
        if (!clip) {
            return
        }
        cc.audioEngine.playEffect(clip, false)
        cc.audioEngine.setEffectsVolume(volume)
    }

    async playBGM() {
        /** 用户关闭了音效 */
        if (!userData.setting.getValue("bgm")) {
            return;
        }
        this.bgmID = 0

        const clip = await new Promise<cc.AudioClip>(resolve => {
            cc.resources.load(Sound.BGM, cc.AudioClip, (err, asset: cc.AudioClip) => {
                err ? resolve(null) : resolve(asset)
            })
        })

        this.bgmID = cc.audioEngine.playMusic(clip, true)
        cc.audioEngine.setMusicVolume(0.2)
    }

    onBGMSwitchChange() {
        const hasMusic = cc.audioEngine.getState(this.bgmID) != cc.audioEngine.AudioState.ERROR

        if (userData.setting.getValue("bgm")) {
            if (!hasMusic) {
                this.playBGM()
            } else {
                cc.audioEngine.resumeMusic()
            }
        } else {
            if (hasMusic) {
                cc.audioEngine.stopMusic()
            }
        }

    }

}

export const sound = new SoundManager()
window['sound'] = sound;