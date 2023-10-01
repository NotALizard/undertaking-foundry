import {undertaking} from "./module/config.js";

import UndertakingActor from "./module/documents/UndertakingActor.js";

import UndertakingItemSheet from "./module/sheets/UndertakingItemSheet.js";
import UndertakingCharacterSheet from "./module/sheets/UndertakingCharacterSheet.js";

async function preloadHandlebarsTemplates(){
  const templatePaths = [
    "systems/undertaking/templates/partials/character/character-resources.hbs",
    "systems/undertaking/templates/partials/character/equipment-card.hbs",
    "systems/undertaking/templates/partials/character/class-card.hbs",
    "systems/undertaking/templates/partials/character/archetype-card.hbs",
    "systems/undertaking/templates/partials/character/ability-card.hbs",
    "systems/undertaking/templates/partials/character/spell-card.hbs"
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

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("undertaking", UndertakingItemSheet, { makeDefault: true});

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("undertaking", UndertakingCharacterSheet, { makeDefault: true});

  preloadHandlebarsTemplates();
});
