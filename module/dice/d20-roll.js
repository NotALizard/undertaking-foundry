export default class D20Roll extends Roll {
    constructor(formula, data, options = {}) {
        if ( !Number.isNumeric(options.critical) )  options.critical = 20;
        if ( !Number.isNumeric(options.fumble) )  options.fumble = 1;
        super(formula, data, options);
    }

    static fromRoll(roll) {
        const newRoll = new this(roll.formula, roll.data, roll.options);
        Object.assign(newRoll, roll);
        return newRoll;
    }

    async toMessage(messageData={}, options={}) {
        messageData.flavor = messageData.flavor || this.options.flavor;
        return super.toMessage(messageData, options);
    }

    get isCritical() {
        if ( !this._evaluated ) return undefined;
        //if ( !Number.isNumeric(this.options.critical) ) return false;
        return this.dice[0].total >= this.options.critical;
    }
    
    get isFumble() {
        if ( !this._evaluated ) return undefined;
        //if ( !Number.isNumeric(this.options.fumble) ) return false;
        return this.dice[0].total <= this.options.fumble;
    }
}