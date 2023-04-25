import { loadLocalRes } from "../manager/resources"
import { cmdParser } from "./command-parser"

class CardManager {

    private cardConfig: { [key: number]: Card }
    private skillConfig: Skill[]
    private itemConfig: Item[]

    private async loadJSONConfig(name: string) {
        return loadLocalRes<cc.JsonAsset>('configs/' + name)
    }

    public getCard(id: number): Card {
        const result = this.cardConfig[id]
        if (!result) {
            throw new Error('card not found: ' + id)
        }
        return result
    }

    private async loadCardConfig() {
        console.log('load card config')
        const conf = await this.loadJSONConfig('card')
        if (!conf || !conf.json) {
            throw new Error('load card config failed')
        }
        const rawCards = conf.json as RawCard[]
        this.cardConfig = {}
        for (const rawCard of rawCards) {
            const card: Card = {
                id: rawCard.id,
                name: rawCard.name,
                description: rawCard.description,
                resource: rawCard.resource,
                effects: Array.isArray(rawCard.effects) ? rawCard.effects : [rawCard.effects],
            }
            this.cardConfig[card.id] = card
        }
        console.log('load card config done')
    }

    private async validateCards() {
        // no duplicate id
        const ids = Object.keys(this.cardConfig)
        const uniqueIds = new Set(ids)
        if (ids.length !== uniqueIds.size) {
            throw new Error('duplicate card id')
        }
    }

    async loadConfigs() {
        console.log('load configs')
        await Promise.all([
            this.loadCardConfig(),
        ])
        this.validateCards()
        console.log('load configs done')
    }

    public convertToCommands(card: Card): NormalCommand[] {
        if (card.effects == null) {
            throw new Error('no effect for card ' + card.id)
        }

        const result: NormalCommand[] = []
        for (const effect of card.effects) {
            result.push(cmdParser.parse(effect))
        }

        return result
    }
}

export const cardConfigManager = new CardManager()