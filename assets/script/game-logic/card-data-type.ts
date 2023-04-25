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
    effects: string[]
}

interface RawCard extends Omit<Card, 'effects'> {
    effects: string[] | string
}

type UserCardData = {
    id: CardID
    level: number
}[]


type Commands = 'attack' | 'effect' | 'buff' | "energy" | "skipturn" | "block" | "strength";

interface NormalCommand {
    type: Commands,
    value: number
}

interface EffectCommand extends NormalCommand {
    type: 'effect',
    value: number // 概率
    buff: BuffCommand
}

interface BuffCommand extends NormalCommand {
    type: 'buff',
    on: Commands,
    value: number,
    valueType: 'percent' | 'number'
}


/*

{
    "type": "attack",
    "value": 10
}

{
    "type": "attack",
    "value": 10
}


*/