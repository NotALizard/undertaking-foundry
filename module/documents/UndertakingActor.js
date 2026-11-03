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
    super.prepareDerivedData();
    this._prepareCharacterData(this)
  }

  _prepareNPCData(actorData){
    const system = actorData.system;
    system.stats.profBonus = system.stats.profBonus || 0;
    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(system.attributes)) {
      attribute.mod = Math.floor((attribute.value - 10) / 2);
    }
    system.stats.init.total = system.attributes.dex.mod;
    system.stats.mana.max = system.stats.mana.max ? system.stats.mana.max : 0;

    let spellcasting = system.stats.spellcasting || 'int';
    let spellcastingAttribute;
    try{
      spellcastingAttribute = JSON.parse(JSON.stringify(system.attributes[spellcasting]));
    }
    catch(err){
      spellcastingAttribute = system.attributes['int'];
    }
    spellcastingAttribute.attack = spellcastingAttribute.mod + system.stats.profBonus + system.bonuses.attack.spell.all.attack;
    spellcastingAttribute.dc = 8 + spellcastingAttribute.mod + system.stats.profBonus + system.bonuses.spell.dc;
    system.stats.spellcastingAttribute = spellcastingAttribute;
  }

  _prepareCharacterData(actorData){
    if(actorData.type == 'npc') return this._prepareNPCData(actorData);
    if (actorData.type !== 'character') return;
    
    const classes = actorData.items.filter(function (item) { return item.type == "class"});
    console.log(classes);
    const system = actorData.system;

    //calc level
    let level = 0;
    let casterLevel = 0;
    let maxMana = 0;
    //First, calculate the overall level of the character, used to determine which growth bracket they are in
    for(let c of classes){
      level += c.system.levels;
    }
    for(let c of classes){
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
            mage = 0.334;
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
        //Growth Mana
        if(mage > 0 && level >= 11){
          mana += c.system.levels;
        }
      }
      maxMana += mana;
    }
    system.details.overallLevel = level;

    //calc spellcaster stats
    system.stats.mana.max = maxMana + system.stats.mana.bonus;
    let divisor = Number.isInteger(system.stats.mana.shortRestGain.divisor) ? system.stats.mana.shortRestGain.divisor : 2;
    system.stats.mana.shortRestGain.value = Math.ceil(maxMana/divisor) + system.stats.mana.shortRestGain.bonus;
    let chargeLimit = Math.max(1, casterLevel + Math.floor((level - casterLevel)/2) - 1);
    system.stats.mana.chargeLimit.value = chargeLimit + system.stats.mana.chargeLimit.bonus;

    //calc pb
    system.stats.profBonus = Math.floor((level + 7) / 4);

    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(system.attributes)) {
      attribute.mod = Math.floor((attribute.value - 10) / 2);

      let checkGlobalBonus = system.bonuses.check.all;
      let checkAttrBonus = attribute.bonuses.check.all;
      attribute.check = attribute.mod + checkAttrBonus + checkGlobalBonus;

      let saveGlobalBonus = system.bonuses.check.all + system.bonuses.check.save;
      let saveAttrBonus = attribute.bonuses.check.all + attribute.bonuses.check.save;
      let saveProfBonus = Math.floor(system.stats.profBonus * attribute.proficient);

      attribute.save = attribute.mod + saveProfBonus + saveAttrBonus + saveGlobalBonus;

      attribute.globalBonus = 0 + checkAttrBonus + checkGlobalBonus;
    }

    let spellcasting;
    if(system.details.classFilter == 'all' || system.details.classFilter == 'prepared'){
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
    let spellcastingAttribute;
    try{
      spellcastingAttribute = JSON.parse(JSON.stringify(system.attributes[spellcasting]));
    }
    catch(err){
      spellcastingAttribute = system.attributes['int'];
    }
    spellcastingAttribute.attack = spellcastingAttribute.mod + (system.stats.mana.useFocus ? system.stats.mana.focus : 0) + system.bonuses.attack.spell.all.attack;
    spellcastingAttribute.attackWithFocus = spellcastingAttribute.mod + system.stats.mana.focus + system.bonuses.attack.spell.all.attack;
    spellcastingAttribute.attackWithoutFocus = spellcastingAttribute.mod + system.bonuses.attack.spell.all.attack;

    spellcastingAttribute.dc = 8 + spellcastingAttribute.mod + (system.stats.mana.useFocus ? system.stats.mana.focus : 0) + system.bonuses.spell.dc;
    spellcastingAttribute.dcWithFocus = 8 + spellcastingAttribute.mod + system.stats.mana.focus + system.bonuses.spell.dc;
    spellcastingAttribute.dcWithoutFocus = 8 + spellcastingAttribute.mod + system.bonuses.spell.dc;
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
    system.stats.carryCapacity = (system.stats.carry || 15) * system.attributes.str.value;
    system.stats.init.total = system.attributes[system.stats.init.attribute].mod + system.stats.init.bonus + system.attributes[system.stats.init.attribute].bonuses.check.all + system.bonuses.check.all;

    //calc AC
    let unshielded = system.stats.ac.base;
    let shield = system.stats.ac.shield;
    if(system.stats.ac.attributes.dex.enabled){
      let dex = system.attributes.dex.mod;
      if(system.stats.ac.attributes.dex.limit){
        dex = Math.min(dex, system.stats.ac.attributes.dex.limit);
      }
      unshielded += dex;
    }
    if(system.stats.ac.attributes.str.enabled){
      let str = system.attributes.str.mod;
      if(system.stats.ac.attributes.str.limit){
        str = Math.min(str, system.stats.ac.attributes.str.limit);
      }
      unshielded += str;
    }
    if(system.stats.ac.attributes.con.enabled){
      let con = system.attributes.con.mod;
      if(system.stats.ac.attributes.con.limit){
        con = Math.min(con, system.stats.ac.attributes.con.limit);
      }
      unshielded += con;
    }
    if(system.stats.ac.attributes.int.enabled){
      let int = system.attributes.int.mod;
      if(system.stats.ac.attributes.int.limit){
        int = Math.min(int, system.stats.ac.attributes.int.limit);
      }
      unshielded += int;
    }
    if(system.stats.ac.attributes.wis.enabled){
      let wis = system.attributes.wis.mod;
      if(system.stats.ac.attributes.wis.limit){
        wis = Math.min(wis, system.stats.ac.attributes.wis.limit);
      }
      unshielded += wis;
    }
    if(system.stats.ac.attributes.pre.enabled){
      let pre = system.attributes.pre.mod;
      if(system.stats.ac.attributes.pre.limit){
        pre = Math.min(pre, system.stats.ac.attributes.pre.limit);
      }
      unshielded += pre;
    }


    system.stats.ac.unshielded = unshielded;
    system.stats.ac.total = unshielded + (system.stats.ac.useShield * shield);
  }

  _getSpellcastingAttribute(classIdentifier){
    let classes = this.items.filter(function (item) { return item.type == "class"});
    let classItem = classes.filter(function (item) { return item.system.identifier == classIdentifier})[0];
    if(classItem){
      return classItem.system.categorization.spellcaster.attribute;
    }
    return null;
  }

  _getClassLevels(){
    let classes = this.items.filter(function (item) { return item.type == "class"});
    let levels = {};
    let casterLevel = 0;
    let overallLevel = 0;
    for(let c of classes){
      levels[c.system.identifier] = c.system.levels;
      overallLevel += c.system.levels;
      if(c.system.categorization.spellcaster.progression != 'none'){
        casterLevel += c.system.levels;
      }
    }
    levels.caster = casterLevel;
    levels.level = overallLevel;
    return levels;
  }

  _getRollMods(){
    let levels = this._getClassLevels();
    let profBonus = Math.floor((levels.level + 7) / 4);
    let attributes = {};

    // Loop through attribute scores, and add their modifiers to our sheet output.
    for (let [key, attribute] of Object.entries(this.system.attributes)) {
      let mod = Math.floor((attribute.value - 10) / 2);
      attributes[key] = mod;
    }

    // vital strike
    let rogue = levels.rogue ? levels.rogue : 0;
    let vitalLevels = rogue + Math.floor((levels.level - rogue) / 2);
    let vital = 0;
    if(vitalLevels >= 18){
        vital = 10;
    }
    else if(vitalLevels >= 17){
        vital = 9;
    }
    else{
        vital = Math.ceil(vitalLevels / 2);
    }

    return {
      ...levels,
      ...attributes,
      prof: profBonus,
      pb: profBonus,
      sneak: vital,
      vital: vital
    }
  }

  static migrateData(source){
    if(source?.system?.stats?.ac){
      if(!(source?.system?.stats?.ac?.weighty)){
        console.warn(`Migrating actor ${source.name} to add weighty armor data structure`);
        source.system.stats.ac.weighty = {enabled: false, strength: 0}
      }
      if(!(source?.system?.stats?.ac?.equippedArmorId)){
        console.warn(`Migrating actor ${source.name} to add equippedArmorId to AC data structure`);
        source.system.stats.ac.equippedArmorId = null;
      }
    }

    const expectedSpellFocus = {
      amulet: 0,
      grimoire: 0,
      orb: 0,
      spellstaff: 0,
      wand: 0
    };
    const existingSpellFocus = source?.system?.traits?.weaponProf?.spellFocus || {};
    const migratedSpellFocus = {
      amulet: existingSpellFocus.amulet ?? expectedSpellFocus.amulet,
      grimoire: existingSpellFocus.grimoire ?? expectedSpellFocus.grimoire,
      orb: existingSpellFocus.orb ?? expectedSpellFocus.orb,
      spellstaff: existingSpellFocus.spellstaff ?? expectedSpellFocus.spellstaff,
      wand: existingSpellFocus.wand ?? expectedSpellFocus.wand
    };
    const spellFocusNeedsMigration = !source?.system?.traits?.weaponProf?.spellFocus ||
      Object.keys(expectedSpellFocus).some(key => existingSpellFocus[key] === undefined);

    if(spellFocusNeedsMigration){
      console.warn(`Migrating actor ${source.name} to normalize spell focus proficiencies`);
    }

    const expectedSimpleM = {
      club: 0,
      dagger: 0,
      greatclub: 0,
      hammer: 0,
      hatchet: 0,
      javelin: 0,
      mace: 0,
      quarterstaff: 0,
      scythe: 0,
      sickle: 0,
      spearlong: 0,
      spear: 0,
      unarmed: 0
    };
    const existingSimpleM = source?.system?.traits?.weaponProf?.simpleM || {};
    const migratedSimpleM = {
      club: existingSimpleM.club ?? expectedSimpleM.club,
      dagger: existingSimpleM.dagger ?? expectedSimpleM.dagger,
      greatclub: existingSimpleM.greatclub ?? expectedSimpleM.greatclub,
      hammer: existingSimpleM.hammer ?? expectedSimpleM.hammer,
      hatchet: existingSimpleM.hatchet ?? expectedSimpleM.hatchet,
      javelin: existingSimpleM.javelin ?? expectedSimpleM.javelin,
      mace: existingSimpleM.mace ?? expectedSimpleM.mace,
      quarterstaff: existingSimpleM.quarterstaff ?? expectedSimpleM.quarterstaff,
      scythe: existingSimpleM.scythe ?? expectedSimpleM.scythe,
      sickle: existingSimpleM.sickle ?? expectedSimpleM.sickle,
      spearlong: existingSimpleM.spearlong ?? expectedSimpleM.spearlong,
      spear: existingSimpleM.spear ?? expectedSimpleM.spear,
      unarmed: existingSimpleM.unarmed ?? expectedSimpleM.unarmed
    };
    const simpleMNeedsMigration = !source?.system?.traits?.weaponProf?.simpleM ||
      Object.keys(expectedSimpleM).some(key => existingSimpleM[key] === undefined);
    if(simpleMNeedsMigration){
      console.warn(`Migrating actor ${source.name} to normalize simple melee proficiencies`);
    }

    source.system = source.system || {};
    source.system.traits = source.system.traits || {};
    source.system.traits.weaponProf = source.system.traits.weaponProf || {};
    source.system.traits.weaponProf.simpleM = migratedSimpleM;
    source.system.traits.weaponProf.spellFocus = migratedSpellFocus;

    return super.migrateData(source);
  }

  static _buildLegacyResourceItemData(oldResources, existingItems = []){
    if(!oldResources) return [];

    const migratedKeys = new Set(existingItems
      .map(item => item?.flags?.undertaking?.migration?.legacyResourceKey)
      .filter(Boolean));

    const resourceItems = [];
    for(let [key, resource] of Object.entries(oldResources)){
      if(!resource || (!resource.label && !resource.value && !resource.max)) continue;
      if(migratedKeys.has(key)) continue;

      let resourceItemData = {
        name: key + "." + (resource.label || "Legacy Resource"),
        type: "ability",
        flags: {
          undertaking: {
            migration: {
              legacyResourceKey: key
            }
          }
        },
        system: {
          description: {
            "value": "<p>Migrated from old resources structure</p>",
            "chat": "",
            "unidentified": ""
          },
          "resource": {
            "showOnSheet": true,
            "value": resource.value || 0,
            "style": resource.type == "target" ? "single" : "counter",
            "name": resource.label || key,
            "valueFrom": "manual",
            "maxFormula": "",
            "maxFlat": resource.max || 0,
            "rechargeOn": resource.recharge == "LR" ? "long" : resource.recharge == "SR" ? "short" : "none",
            "rechargeStyle": "fill",
            "rechargeFormula": "",
            "rechargeMessage": "",
            "overfilledMessage": "",
            "dropdownIdentifier": "",
            "addOptionsTo": "",
            "dropdownOptions": []
          }
        }
      };
      resourceItems.push(resourceItemData);
    }

    return resourceItems;
  }

  async migrateLegacyResourcesToEmbeddedItems(){
    const oldResources = this.system?.resources;
    if(!oldResources) return 0;

    const resourceItems = this.constructor._buildLegacyResourceItemData(oldResources, this.items);
    if(resourceItems.length > 0){
      await this.createEmbeddedDocuments("Item", resourceItems);
    }

    await this.update({"system.-=resources": null});
    return resourceItems.length;
  }
}
