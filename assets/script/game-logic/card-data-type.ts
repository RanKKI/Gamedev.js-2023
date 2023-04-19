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
    levels: { [key: number]: string[] }
}

interface RawCard extends Omit<Card, 'levels'> {
    levels: { [key: number]: string[] | string }
}

type UserCardData = {
    id: CardID
    level: number
}[]


type Commands = 'attack' | 'effect' | 'buff' | "energy";

interface CardCommand {
    type: Commands,
    value: number
}

interface AttackCommand extends CardCommand {
    type: 'attack'
}

interface EnergyCommand extends CardCommand {
    type: 'energy'
}

interface EffectCommand extends CardCommand {
    type: 'effect',
    value: number // 概率
    buff: BuffCommand
}

interface BuffCommand extends CardCommand {
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