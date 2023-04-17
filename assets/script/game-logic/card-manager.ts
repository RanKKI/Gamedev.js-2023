import { loadLocalRes } from "../manager/resources"

interface Command {

}

class CardManager {

    private cardConfig: Card[]
    private effectConfig: { [key: string]: CardEffect }
    private skillConfig: Skill[]
    private itemConfig: Item[]

    private async loadJSONConfig(name: string) {
        return loadLocalRes<cc.JsonAsset>('configs/' + name)
    }

    private async validateCards() {
        // no duplicate id
        const ids = this.cardConfig.map(c => c.id)
        const uniqueIds = new Set(ids)
        if (ids.length !== uniqueIds.size) {
            throw new Error('duplicate card id')
        }
    }

    async loadConfigs() {
        return;

        // const result = await Promise.all([
        //     this.loadJSONConfig('card'),
        //     this.loadJSONConfig('skills'),
        //     this.loadJSONConfig('items'),
        //     this.loadJSONConfig('effect'),
        // ]).then(res => res.map(r => r.json))

        // // load effect, effect.id as key as key
        // this.effectConfig = {}
        // for (const effect of result[3]) {
        //     this.effectConfig[effect.key] = effect.value
        // }

        // // 处理卡牌配置
        // const cards: RawCard[] = result[0]
        // const formattedCards: Card[] = []
        // for (const card of cards) {
        //     const levels: { [key: number]: string[] } = {}
        //     for (const level in card.levels) {
        //         const effect = card.levels[level]
        //         levels[level] = Array.isArray(effect) ? effect : [effect]
        //     }
        //     formattedCards.push({
        //         ...card,
        //         levels,
        //     })
        // }
        // this.cardConfig = formattedCards

        // this.skillConfig = result[1]
        // this.itemConfig = result[2]

        // this.validateCards()
    }

}

export const cardManager = new CardManager()