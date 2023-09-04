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
    const system = actorData.system;

    //calc level
    const level = 1;
    system.details.overallLevel = level

    //calc spellcaster stats
    system.stats.mana.max = 0 + system.stats.mana.bonus;
    system.stats.mana.chargeLimit = 1;
    system.stats.mana.shortRestGain = 1;

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
