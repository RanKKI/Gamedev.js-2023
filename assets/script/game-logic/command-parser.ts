class CommandParser {

    private parsers: { [key: string]: (components: string[]) => NormalCommand } = {

    }

    constructor() {
        this.parsers['energy'] = (components: string[]) => this.parseNormalCommand(components)
        this.parsers["attack"] = (components: string[]) => this.parseNormalCommand(components)
        this.parsers["skipturn"] = (components: string[]) => this.parseNormalCommand(components)
        this.parsers['effect'] = (components: string[]) => this.parseEffect(components)
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

    private parseNormalCommand(components: string[]): NormalCommand {
        return {
            type: components[0] as Commands,
            value: parseInt(components[1])
        }
    }

    private parseEffect(components: string[]): EffectCommand {
        return {
            type: 'effect',
            value: this.parsePercent(components[1]),
            buff: {
                type: 'buff',
                on: components[3] as Commands,
                value: this.parsePercent(components[2]),
                valueType: this.getValueType(components[2])
            }
        }
    }

    parse(rawStr: string): NormalCommand {
        const components = rawStr.split(' ')
        const type = components[0] as Commands
        const parser = this.parsers[type]
        if (!parser) {
            throw new Error('unknown command type: ' + type)
        }
        return parser(components)
    }
}


export const cmdParser = new CommandParser()