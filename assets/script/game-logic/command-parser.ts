class CommandParser {

    private parsers: { [key: string]: (components: string[]) => CardCommand } = {

    }

    constructor() {
        this.parsers['attack'] = (components: string[]) => this.parserAttack(components)
        this.parsers['energy'] = (components: string[]) => this.parserEnergy(components)
        this.parsers['effect'] = (components: string[]) => this.parserEffect(components)
    }

    /*
        如果是 % 结尾，就是百分比，
        否则就是数字
    */
    private parsePercent(percent: string): number {
        if (percent.endsWith('%')) {
            return parseInt(percent.slice(0, percent.length - 1)) / 100
        }
        return parseInt(percent)
    }

    private getValueType(value: string): 'percent' | 'number' {
        if (value.endsWith('%')) {
            return 'percent'
        }
        return 'number'
    }

    private parserAttack(components: string[]): AttackCommand {
        return {
            type: 'attack',
            value: parseInt(components[0])
        }
    }

    private parserEnergy(components: string[]): EnergyCommand {
        return {
            type: 'energy',
            value: parseInt(components[0])
        }
    }

    private parserEffect(components: string[]): EffectCommand {
        return {
            type: 'effect',
            value: this.parsePercent(components[0]),
            buff: {
                type: 'buff',
                on: components[2] as Commands,
                value: this.parsePercent(components[1]),
                valueType: this.getValueType(components[1])
            }
        }
    }

    parse(rawStr: string): CardCommand {
        const components = rawStr.split(' ')
        const type = components[0] as Commands
        const parser = this.parsers[type]
        if (!parser) {
            throw new Error('unknown command type: ' + type)
        }
        return parser(components.slice(1, components.length))
    }
}


export const cmdParser = new CommandParser()