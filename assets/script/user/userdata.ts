interface ISetting {
    bgm: boolean
}

interface IData {
    cards: UserCardData
}

class UserSettings {

    private settings: ISetting = {
        bgm: true
    }

    private proxy = new Proxy(this.settings, {
        set(target, property, value) {
            target[property] = value;
            console.log(`Set ${String(property)} to ${value}`);
            return true;
        }
    })

    constructor() {
        this.load();
    }

    save() {
        localStorage.setItem("user_settings", JSON.stringify(this.settings));
    }

    load() {
        const jsonStr = localStorage.getItem("user_settings");
        if (!jsonStr) { return }
        const json = JSON.parse(jsonStr)
        Object.keys(json).forEach(key => {
            this.settings[key] = json[key]
        });
    }

    getValue(key: keyof ISetting) {
        return this.proxy[key];
    }

    setValue(key: keyof ISetting, value: boolean) {
        this.proxy[key] = value;
        this.save();
    }

}

class UserData implements IData {

    setting: UserSettings = new UserSettings();

    /* 游戏数据 */
    cards: UserCardData = [];

    constructor() {

    }

    load() {
        const jsonStr = localStorage.getItem("user_data");
        if (!jsonStr) { return }
        const json = JSON.parse(jsonStr)
        this.cards = json.cards;
    }

    save() {
        const saveData = {
            cards: this.cards,
        }
        const jsonStr = JSON.stringify(saveData);
        localStorage.setItem("user_data", jsonStr);
    }

    loadDebug() {
        this.cards = [
            { id: 1, level: 1 },
            { id: 2, level: 1 },
            { id: 1, level: 2 },
        ]
    }
}

export const userData = new UserData();