interface ISetting {
    bgm: boolean
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

class UserData {

    setting: UserSettings = new UserSettings();

}

export const userData = new UserData();