export default class UndertakingItem extends Item {

    static chatRollDamage(event){
        let button = event.currentTarget;
        let weaponId = button.dataset.weapon;
        let actorId = button.dataset.actor;
        let actor = game.actors.get(actorId);
        if(!actor) return;
        let weapon = actor.items.get(weaponId);
        if(weapon){
            weapon._rollDamage(button.dataset.versatile);
        }
    }

    async roll(){
        switch(this.system.actionType){
            case "rwak":
            case "rsak":
            case "mwak":
            case "msak":
                return await this._rollAttack();
            case "save":
                return await this._rollSave();
            case "heal":
            case "util":
            case "abil":
            case "other":
                if(this.system.damage.parts.length > 0){
                    return await this._rollDamage(false);
                }
                return;
            
          }
    }

    _getMod(owner, attr){
        let mod = 0;
        switch(attr){
            case "dex":
                mod = owner.system.attributes.dex.mod;
                break;
            case "str":
                mod = owner.system.attributes.str.mod;
                break;
            case "con":
                mod = owner.system.attributes.con.mod;
                break;
            case "int":
                mod = owner.system.attributes.int.mod;
                break;
            case "wis":
                mod = owner.system.attributes.wis.mod;
                break;
            case "pre":
                mod = owner.system.attributes.str.mod;
                break;
            case "spell":
                mod = this._getSpellMod(owner);
        }
        return mod;
    }

    _getSpellMod(owner){
        if(!this.system.classIdentifier) return 0;
        let attr = owner._getSpellcastingAttribute(this.system.classIdentifier);
        let mod = 0;
        switch(attr){
            case "dex":
                mod = owner.system.attributes.dex.mod;
                break;
            case "str":
                mod = owner.system.attributes.str.mod;
                break;
            case "con":
                mod = owner.system.attributes.con.mod;
                break;
            case "int":
                mod = owner.system.attributes.int.mod;
                break;
            case "wis":
                mod = owner.system.attributes.wis.mod;
                break;
            case "pre":
                mod = owner.system.attributes.str.mod;
                break;
        }
        return mod;
    }

    _getRollMods(owner){
        let spellMod = this._getSpellMod(owner);
        let mod = 0;
        switch(this.system.attribute){
            case "dex":
                mod = owner.system.attributes.dex.mod;
                break;
            case "str":
                mod = owner.system.attributes.str.mod;
                break;
            case "con":
                mod = owner.system.attributes.con.mod;
                break;
            case "int":
                mod = owner.system.attributes.int.mod;
                break;
            case "wis":
                mod = owner.system.attributes.wis.mod;
                break;
            case "pre":
                mod = owner.system.attributes.str.mod;
                break;
            case "spell":
                mod = spellMod;
        }
        let mods = {
            ...owner._getClassLevels(),
            mod: mod,
            prof: owner.system.stats.profBonus,
            pb: owner.system.stats.profBonus,
            level: owner.system.details.overallLevel,
            dex: owner.system.attributes.dex.mod,
            str: owner.system.attributes.str.mod,
            con: owner.system.attributes.con.mod,
            int: owner.system.attributes.int.mod,
            wis: owner.system.attributes.wis.mod,
            pre: owner.system.attributes.pre.mod
        }
        let rogue = mods.rogue ? mods.rogue : 0;
        let sneak = rogue + Math.floor((owner.system.details.overallLevel - rogue) / 2);
        if(sneak >= 18){
            sneak = 10;
        }
        else if(sneak >= 17){
            sneak = 9;
        }
        else{
            sneak = Math.ceil(sneak / 2);
        }
        mods.sneak = sneak;
        return mods;
    }

    async _getRollModeOptions(title){
        return new Promise(resolve => {
            const data = {
            title: title,
            content: '',
            buttons: {
                advantage: {
                label: game.i18n.localize("undertaking.Advantage"),
                callback: () => resolve('2d20k')
                },
                normal: {
                label: game.i18n.localize("undertaking.Normal"),
                callback: () => resolve('1d20')
                },
                disadvantage:{
                label: game.i18n.localize("undertaking.Disadvantage"),
                callback: () => resolve('2d20kl')
                }
            },
            default: "normal",
            close: () => resolve('')
            }
            new Dialog(data, null).render(true);
        });
    }

    async _rollAttack(){
        const owner = this.actor;
        const aType = this.system.actionType;
        let mod = 0;
        let prof = 0;
        let bonus = 0;

        let attr = this.system.attribute;
        mod = this._getMod(owner, attr);

        if(aType == "msak" || aType == "rsak" || this.system.proficient){
            prof = owner.system.stats.profBonus;
        }

        
        bonus = +(this.system.attackBonus)  || 0;
        let bonusAll = 0;
        let bonusSome = 0;
        if(aType == "mwak" || aType == "rwak"){
            bonusAll = +(owner.system.bonuses.attack.weapon.all) || 0;
            if(aType == "mwak"){
            bonusSome = +(owner.system.bonuses.attack.weapon.melee) || 0;
            }
            if(aType == "rwak"){
            bonusSome = +(owner.system.bonuses.attack.weapon.ranged) || 0;
            }
        }
        if(aType == "msak" || aType == "rsak"){
            bonusAll = +(owner.system.bonuses.attack.spell.all) || 0;
            if(aType == "msak"){
            bonusSome = +(owner.system.bonuses.attack.spell.melee) || 0;
            }
            if(aType == "rsak"){
            bonusSome = +(owner.system.bonuses.attack.spell.ranged) || 0;
            }
        }
        bonus = bonus + bonusAll + bonusSome;


        const title = `${this.name}`;
        const dice = await this._getRollModeOptions(title);
        if(!dice) return;
        let rollFormula = `${dice} + @mod + @prof + @bonus`;
        let rollData = {
            mod: mod,
            prof: prof,
            bonus: bonus
        };
        let rollOptions = {
            fumble: 1,
            critical: this.system.critical.threshold || 20
        }
        let messageData = {
            speaker: ChatMessage.getSpeaker(),
            flavor: title
        };
        //let rollResult = await new Roll(rollFormula, rollData).roll();
        let rollResult = await new CONFIG.Dice.D20Roll(rollFormula, rollData, rollOptions).roll();
        await rollResult.toMessage(messageData);
        const versatile = (this.system.properties && this.system.properties.ver);
        const normalButton = `<button class="undertaking-roll-damage" data-weapon="${this.id}" data-actor="${this.actor.id}">${game.i18n.localize("undertaking.Damage")}</button>`;
        const versatileButton = versatile ? `<button class="undertaking-roll-damage" data-weapon="${this.id}" data-actor="${this.actor.id}" data-versatile="true">${game.i18n.localize("undertaking.WeaponTraits.ver")}</button>` : "";
        let buttonsHtml = `<div class="undertaking-damage-buttons frow">${normalButton}${versatileButton}</div>`;
        let buttonsData = {
            speaker: ChatMessage.getSpeaker(),
            content: buttonsHtml,
            flavor: title
        };
        const buttonMsg = ChatMessage.create(buttonsData);
    }

    async _rollDamage(versatile){
        const owner = this.actor;
        let rollData = this._getRollMods(owner);

        for(let i = 0; i < this.system.damage.parts.length; i++){
            let d = this.system.damage.parts[i];
            let rollFormula;
            if(i == 0 && versatile && this.system.damage.versatile){
                rollFormula = this.system.damage.versatile;
            }
            else{
                rollFormula = d[0];
            }
            let damageType = d[1];

            rollFormula = rollFormula.replaceAll("@sneak", rollData.sneak);
            
            
            let messageData = {
                speaker: ChatMessage.getSpeaker(),
                flavor: `${this.name} - ${damageType}`
            };
            let rollResult = await new Roll(rollFormula, rollData).roll();
            await rollResult.toMessage(messageData);
        }
    }

    async _rollSave(){
        const owner = this.actor;
        const title = `${this.name}`;
        let dc = "";
        let mod = 0;
        let prof = 0;
        let dcTot = 0;
        let bonus = 0;
        let attr = this.system.save.scaling;
        if(attr == "flat"){
            dcTot = +this.system.save.dc;
        }
        else{
            switch(attr){
                case "dex":
                    mod = owner.system.attributes.dex.mod;
                    break;
                case "str":
                    mod = owner.system.attributes.str.mod;
                    break;
                case "con":
                    mod = owner.system.attributes.con.mod;
                    break;
                case "int":
                    mod = owner.system.attributes.int.mod;
                    break;
                case "wis":
                    mod = owner.system.attributes.wis.mod;
                    break;
                case "pre":
                    mod = owner.system.attributes.str.mod;
                    break;
                case "spell":
                    mod = this._getSpellMod(owner);
            }
            prof = owner.system.stats.profBonus;
            if(this.type == "spell"){
                bonus = +(owner.system.bonuses.spell.dc) || 0;
            }
            dcTot = 8 + prof + mod + bonus;
        }
        dc = `DC ${dcTot} ${game.i18n.localize(`undertaking.AttributesAbbrev.${this.system.save.attribute}`)}`;
        let dcHtml = `<div class="dice-roll">
                    <div class="dice-result">
                        <h4 class="dice-total">${dc}</h4>
                    </div>
                </div>`;
        let dcData = {
            speaker: ChatMessage.getSpeaker(),
            content: dcHtml,
            flavor: title
        };
        const dcMsg = ChatMessage.create(dcData);
        let buttonsHtml = `<div class="undertaking-damage-buttons frow"><button class="undertaking-roll-damage" data-weapon="${this.id}" data-actor="${this.actor.id}">${game.i18n.localize("undertaking.Damage")}</button></div>`;
        let buttonsData = {
            speaker: ChatMessage.getSpeaker(),
            content: buttonsHtml,
            flavor: title
        };
        const buttonMsg = ChatMessage.create(buttonsData);

    }
}