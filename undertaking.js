import {undertaking} from "./module/config.js";

import UndertakingActor from "./module/documents/UndertakingActor.js";

import UndertakingItemSheet from "./module/sheets/UndertakingItemSheet.js";
import UndertakingCharacterSheet from "./module/sheets/UndertakingCharacterSheet.js";

async function preloadHandlebarsTemplates(){
  const templatePaths = [
    "systems/undertaking/templates/partials/character/character-resources.hbs",
    "systems/undertaking/templates/partials/character/equipment-card.hbs",
    "systems/undertaking/templates/partials/character/attack-card.hbs",
    "systems/undertaking/templates/partials/character/class-card.hbs",
    "systems/undertaking/templates/partials/character/archetype-card.hbs",
    "systems/undertaking/templates/partials/character/ability-card.hbs",
    "systems/undertaking/templates/partials/character/spell-card.hbs",
    "systems/undertaking/templates/partials/item/edit-attack.hbs"
  ];

  return loadTemplates(templatePaths);
}

Hooks.once("init",function(){
  console.log("Undertaking | Initializing the system");

  CONFIG.undertaking = undertaking;

  CONFIG.Combat.initiative = {
    formula: "1d20 + @attributes.dex.mod",
    decimals: 2
  };

  CONFIG.Actor.documentClass = UndertakingActor;

  Handlebars.registerHelper('ifequal', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
  });
  
  Handlebars.registerHelper('ifnotequal', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
  });

  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
  });

  Handlebars.registerHelper('switch', function(value, options) {
    this.switch_value = value;
    this.switch_result = false;
    return options.fn(this);
  });
  
  Handlebars.registerHelper('case', function(value, options) {
    if (value == this.switch_value) {
      this.switch_result = true;
      return options.fn(this);
    }
  });
  
  Handlebars.registerHelper('default', function(options) {
    if(this.switch_result == false) {
      this.switch_result = true;
      return options.fn(this);
    }
  });

  Handlebars.registerHelper('time', function(value, unit, options) {
    switch(unit){
      case 'inst':
        return game.i18n.localize("undertaking.Time.Instant");
      case 'indef':
        return game.i18n.localize("undertaking.Time.Indefinite");
      case 'round':
        return `${value} ` + game.i18n.localize(`undertaking.Time.Round${value > 1 ? 's' : ''}`);
      case 'second':
        return `${value} ` + game.i18n.localize(`undertaking.Time.Second${value > 1 ? 's' : ''}`);
      case 'minute':
        return `${value} ` + game.i18n.localize(`undertaking.Time.Minute${value > 1 ? 's' : ''}`);
      case 'hour':
        return `${value} ` + game.i18n.localize(`undertaking.Time.Hour${value > 1 ? 's' : ''}`);
      case 'day':
        return `${value} ` + game.i18n.localize(`undertaking.Time.Day${value > 1 ? 's' : ''}`);
      case 'year':
        return `${value} ` + game.i18n.localize(`undertaking.Time.Year${value > 1 ? 's' : ''}`);
      case 'action':
        return `${value} ` + game.i18n.localize("undertaking.Time.Action");
      case 'minor':
        return `${value} ` + game.i18n.localize("undertaking.Time.MinorAction");
      case 'reaction':
        return `${value} ` + game.i18n.localize("undertaking.Time.Reaction");
      case 'desperate':
        return `${value} ` + game.i18n.localize("undertaking.Time.DesperateAction");
    }
  });

  Handlebars.registerHelper('plural', function(value, unit, options) {
    switch(unit){
      case 'creature':
        return `${value} ` + game.i18n.localize(`undertaking.Creature${value > 1 ? 's' : ''}`);
      case 'object':
        return `${value} ` + game.i18n.localize(`undertaking.Object${value > 1 ? 's' : ''}`);
    }
  });

  Handlebars.registerHelper('school', function(value, options) {
    const schools = ["abj","con","div","enc","evo","ill","nec","tra"];
    if(schools.includes(value)){
      return game.i18n.localize(`undertaking.SpellSchools.${value}`);
    }
    return value;
  });

  Handlebars.registerHelper('weaponTraits', function(item, options) {
    let props = [];
    if(item.system.range && (item.system.range.value > 0 || item.system.range.long > 0 )){
      props.push(`Range: ${item.system.range.value || 0} / ${item.system.range.long || 0} ${item.system.range.units ? item.system.range.units : ""}`);
    }
    for (const [key, value] of Object.entries(item.system.properties)) {
      if(value){
        switch(key){
          case 'ver':
            console.log('vers');
            let die = item.system.damage.versatile || " ";
            die = die.split('+')[0].trim();
            let localName = game.i18n.localize(`undertaking.WeaponTraits.${key}`);
            props.push(`${localName} (${die})`);
            break;
          default:
            props.push(game.i18n.localize(`undertaking.WeaponTraits.${key}`));
            break;
        }
      }
    }
    let propsStr = props.join(', ');
    let chatStr = item.system.chatFlavor;
    if(propsStr && propsStr != "" && chatStr && chatStr != ""){
      return `${propsStr}; ${chatStr}`;
    }
    else if (propsStr && propsStr != ""){
      return propsStr;
    }
    else if (chatStr && chatStr != ""){
      return chatStr;
    }
    return "";
  });

  Handlebars.registerHelper('hitDC', function(item, sheet, options) {
    if(item.name == "Deposition"){
      console.log(item);
    }
    let toHit = "";
    let aType = item.system.actionType;
    if(["mwak","rwak","msak","rsak"].includes(aType)){
      let mod = 0;
      let prof = 0;
      let attr = item.system.attribute;
      if(attr == "spell"){
        for (let c of sheet.casters){
          if(c.system.identifier == item.system.classIdentifier){
            attr = c.system.categorization.spellcaster.attribute;
          }
        }
      }
      switch(attr){
        case "dex":
          mod = sheet.actor.system.attributes.dex.mod;
          break;
        case "str":
          mod = sheet.actor.system.attributes.str.mod;
          break;
        case "con":
          mod = sheet.actor.system.attributes.con.mod;
          break;
        case "int":
          mod = sheet.actor.system.attributes.int.mod;
          break;
        case "wis":
          mod = sheet.actor.system.attributes.wis.mod;
          break;
        case "pre":
          mod = sheet.actor.system.attributes.str.mod;
          break;
      }
      if(aType == "msak" || aType == "rsak" || item.system.proficient){
        prof = sheet.actor.system.stats.profBonus;
      }

      let bonus = 0;
      bonus = +(item.system.attackBonus)  || 0;
      let bonusAll = 0;
      let bonusSome = 0;
      if(aType == "mwak" || aType == "rwak"){
        bonusAll = +(sheet.actor.system.bonuses.attack.weapon.all) || 0;
        if(aType == "mwak"){
          bonusSome = +(sheet.actor.system.bonuses.attack.weapon.melee) || 0;
        }
        if(aType == "rwak"){
          bonusSome = +(sheet.actor.system.bonuses.attack.weapon.ranged) || 0;
        }
      }
      if(aType == "msak" || aType == "rsak"){
        bonusAll = +(sheet.actor.system.bonuses.attack.spell.all) || 0;
        if(aType == "msak"){
          bonusSome = +(sheet.actor.system.bonuses.attack.spell.melee) || 0;
        }
        if(aType == "rsak"){
          bonusSome = +(sheet.actor.system.bonuses.attack.spell.ranged) || 0;
        }
      }
      let hitTot = 0 + mod + prof + bonus + bonusAll + bonusSome;
      toHit = `Hit: ${hitTot >= 0 ? "+" : ""}${hitTot}`;
    }
    let dc = "";
    if(item.system.save && item.system.save.attribute){
      let mod = 0;
      let prof = 0;
      let dcTot = 0;
      let bonus = 0;
      let attr = item.system.save.scaling;
      if(attr == "flat"){
        dcTot = +item.system.save.dc;
      }
      else{
        if(attr == "spell"){
          for (let c of sheet.casters){
            if(c.system.identifier == item.system.classIdentifier){
              attr = c.system.categorization.spellcaster.attribute;
            }
          }
        }
        switch(attr){
          case "dex":
            mod = sheet.actor.system.attributes.dex.mod;
            break;
          case "str":
            mod = sheet.actor.system.attributes.str.mod;
            break;
          case "con":
            mod = sheet.actor.system.attributes.con.mod;
            break;
          case "int":
            mod = sheet.actor.system.attributes.int.mod;
            break;
          case "wis":
            mod = sheet.actor.system.attributes.wis.mod;
            break;
          case "pre":
            mod = sheet.actor.system.attributes.str.mod;
            break;
        }
        prof = sheet.actor.system.stats.profBonus;
        bonus = +(sheet.actor.system.bonuses.spell.dc) || 0;
        dcTot = 8 + prof + mod + bonus;
      }
      dc = `DC ${dcTot} ${game.i18n.localize(`undertaking.AttributesAbbrev.${item.system.save.attribute}`)}`;
    }
    if(toHit && toHit != "" && dc && dc != ""){
      return `${toHit}<br>${dc}`;
    }
    else if (toHit && toHit != ""){
      return toHit;
    }
    else if (dc && dc != ""){
      return dc;
    }
    return "";
  });

  Handlebars.registerHelper('attackDamage', function(item, sheet, options) {
    let mod = 0;
    let attr = item.system.attribute;
    if(attr == "spell"){
      for (let c of sheet.casters){
        if(c.system.identifier == item.system.classIdentifier){
          attr = c.system.categorization.spellcaster.attribute;
        }
      }
    }
    switch(attr){
      case "dex":
        mod = sheet.actor.system.attributes.dex.mod;
        break;
      case "str":
        mod = sheet.actor.system.attributes.str.mod;
        break;
      case "con":
        mod = sheet.actor.system.attributes.con.mod;
        break;
      case "int":
        mod = sheet.actor.system.attributes.int.mod;
        break;
      case "wis":
        mod = sheet.actor.system.attributes.wis.mod;
        break;
      case "pre":
        mod = sheet.actor.system.attributes.str.mod;
        break;
    }

    let parts = [];

    for(let dmg of item.system.damage.parts){
      let dstr = dmg.join(" ");
      dstr = dstr.replaceAll("@mod", mod);
      dstr = dstr.replaceAll("@dex", sheet.actor.system.attributes.dex.mod);
      dstr = dstr.replaceAll("@str", sheet.actor.system.attributes.str.mod);
      dstr = dstr.replaceAll("@con", sheet.actor.system.attributes.con.mod);
      dstr = dstr.replaceAll("@int", sheet.actor.system.attributes.int.mod);
      dstr = dstr.replaceAll("@wis", sheet.actor.system.attributes.wis.mod);
      dstr = dstr.replaceAll("@pre", sheet.actor.system.attributes.pre.mod);
      parts.push(dstr);
    }
    return parts.join(", ");
  });

  Handlebars.registerHelper('spellTraits', function(item, options) {
    let spellStr = "";
    let parts = [];
    if(item.system.range.units == 'ft'){
      parts.push(`Range: ${item.system.range.value} ft`);
    }
    else if(item.system.range.units == 'touch'){
      parts.push(`Range: ${game.i18n.localize(`undertaking.Touch`)}`);
    }
    else if(item.system.range.units == 'self'){
      parts.push(`Range: ${game.i18n.localize(`undertaking.Self`)}`);
    }

    if(item.system.level == 0){
      //parts.push(`${game.i18n.localize(`undertaking.SpellSchools.${item.system.school}`)} ${game.i18n.localize(`undertaking.Cantrip`)}`);
      parts.push(`${game.i18n.localize(`undertaking.Cantrip`)}`);
    }
    else{
      //parts.push(`${game.i18n.localize(`undertaking.Level`)} ${item.system.level} ${game.i18n.localize(`undertaking.SpellSchools.${item.system.school}`)}`);
      parts.push(`${game.i18n.localize(`undertaking.Level`)} ${item.system.level}`);
    }

    let components = [];
    if(item.system.components.somatic){
      components.push('S');
    }
    if(item.system.components.verbal){
      components.push('V');
    }
    if(item.system.components.material){
      components.push('M');
    }
    if(components.length > 0){
      parts.push(components.join(' '));
    }

    if(item.system.components.concentration){
      parts.push(game.i18n.localize(`undertaking.Concentration`));
    }


    let chatStr = item.system.chatFlavor;
    if (chatStr && chatStr != ""){
      parts.push(chatStr);
    }
    spellStr = parts.join(", ");
    return spellStr;
  });

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("undertaking", UndertakingItemSheet, { makeDefault: true});

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("undertaking", UndertakingCharacterSheet, { makeDefault: true});

  preloadHandlebarsTemplates();
});
