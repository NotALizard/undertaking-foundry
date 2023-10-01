export default class UndertakingActor extends Actor {

  prepareData(){
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  prepareBaseData(){
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  prepareDerivedData(){
    this._prepareCharacterData(this)
  }

  _prepareCharacterData(actorData){
    if (actorData.type !== 'character') return;
    
    const classes = actorData.items.filter(function (item) { return item.type == "class"});
    console.log(classes);
    const system = actorData.system;

    //calc level
    let level = 0;
    let casterLevel = 0;
    let maxMana = 0;
    for(let c of classes){
      level += c.system.levels;
      let mage = 0;
      try{
        switch(c.system.categorization.spellcaster.progression){
          case 'full':
            mage = 1;
            break;
          case 'three-quarter':
            mage = 0.75;
            break;
          case 'half':
            mage = 0.5;
            break;
          case 'third':
            mage = 0.3333333333333334;
            break;
        }
      }
      catch(err){
        console.log(err);
      }
      casterLevel += Math.floor(mage*c.system.levels);
      let mana = 0;
      if(c.system.levels > 0){
        mana += c.system.manaAtFirstLevel;
        let remainingLevels = c.system.levels - 1;
        mana += c.system.manaPerLevel*remainingLevels;
      }
      maxMana += mana;
    }
    system.details.overallLevel = level;

    //calc spellcaster stats
    system.stats.mana.max = maxMana + system.stats.mana.bonus;
    let divisor = Number.isInteger(system.stats.mana.shortRestGain.divisor) ? system.stats.mana.shortRestGain.divisor : 4;
    system.stats.mana.shortRestGain.value = Math.ceil(casterLevel/divisor) + system.stats.mana.shortRestGain.bonus;
    let chargeLimit = 0;
    if(false){
      //reserved for legendary spells
    }
    else if(level >= 13 && casterLevel >= 12){
      chargeLimit = 12;
    }
    else if(level >= 11 && casterLevel >= 10){
      chargeLimit = 10;
    }
    else if(level >= 9 && casterLevel >= 8){
      chargeLimit = 8;
    }
    else if(level >= 7 && casterLevel >= 6){
      chargeLimit = 6;
    }
    else if(level >= 5 && casterLevel >= 4){
      chargeLimit = 4;
    }
    else if(level >= 3 && casterLevel >= 2){
      chargeLimit = 2;
    }
    else if(casterLevel >= 1){
      chargeLimit = 1;
    }
    system.stats.mana.chargeLimit.value = chargeLimit + system.stats.mana.chargeLimit.bonus;

    //calc pb
    system.stats.profBonus = Math.floor((level + 7) / 4);

    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(system.attributes)) {
      attribute.mod = Math.floor((attribute.value - 10) / 2);

      let globalBonus = system.bonuses.check.all + system.bonuses.check.save;
      let attrBonus = attribute.bonuses.check.all + attribute.bonuses.check.save;
      let profBonus = Math.floor(system.stats.profBonus * attribute.proficient);

      attribute.save = attribute.mod + profBonus + attrBonus + globalBonus;
    }

    let spellcasting;
    if(system.details.classFilter == 'all'){
      spellcasting = system.stats.spellcasting || 'int';
    }
    else{
      let selectedClass = classes.filter(function (item) { return item.system.identifier == system.details.classFilter})[0];
      if(selectedClass){
        spellcasting = selectedClass.system.categorization.spellcaster.attribute
      }
      else{
        spellcasting = 'int';
      }
    }
    const spellcastingAttribute = JSON.parse(JSON.stringify(system.attributes[spellcasting]));
    spellcastingAttribute.attack = spellcastingAttribute.mod + system.stats.profBonus + system.bonuses.attack.spell.all.attack;
    spellcastingAttribute.dc = 8 + spellcastingAttribute.mod + system.stats.profBonus + system.bonuses.spell.dc;
    system.stats.spellcastingAttribute = spellcastingAttribute;

    // Loop through skills
    const attributes = Object.entries(system.attributes)
    for (let [key, skill] of Object.entries(system.skills)) {
      let attribute = system.attributes[skill.attribute] //Relavent attr mod

      let globalBonus = system.bonuses.check.all + system.bonuses.check.skill;
      let attrBonus = attribute.bonuses.check.all + attribute.bonuses.check.skill;
      let profBonus = Math.floor(system.stats.profBonus * skill.value);
      let skillBonus = skill.bonuses.check;

      skill.total = attribute.mod + profBonus + skillBonus + attrBonus + globalBonus; 
      skill.passive = 10 + skill.total + skill.bonuses.passive; //Set the passive score
    }

    //calc misc vals
    system.stats.carryCapacity = 15 * system.attributes.str.value;
    system.stats.init.total = system.attributes[system.stats.init.attribute].mod + system.stats.init.bonus;

    //calc AC
    let unshielded = 10 + system.attributes.dex.mod;
    let shield = system.stats.ac.shield;
    system.stats.ac.unshielded = unshielded;
    system.stats.ac.total = unshielded + (system.stats.ac.useShield * shield);
  }
}
