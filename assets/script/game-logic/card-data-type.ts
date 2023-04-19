type CardType = 'attack' | 'defense' | 'skill' | 'item';

interface CardEffect {
    id: string
    /*
        如果是攻击卡，value表示伤害值
        如果是防御卡，value表示防御值
        如果是技能卡，value表示技能ID
        如果是道具卡，value表示道具ID
    */
    value: number
    type: CardType
    name: string
    description: string | null
}

interface Skill {

}

interface Item {

}

type CardID = number

interface Card {
    id: CardID
    name: string
    description: string
    resource: string
    levels: { [key : number] : string[] }
}

interface RawCard extends Omit<Card, 'levels'> {
    levels: { [key : number] : string[] | string }
}

type UserCardData = {
    id: CardID
    level: number
}[]

interface CardCommand {

}