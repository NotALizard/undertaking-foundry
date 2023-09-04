import {undertaking} from "./module/config.js";

import UndertakingActor from "./module/documents/UndertakingActor.js";

import UndertakingItemSheet from "./module/sheets/UndertakingItemSheet.js";
import UndertakingCharacterSheet from "./module/sheets/UndertakingCharacterSheet.js";

async function preloadHandlebarsTemplates(){
  const templatePaths = [];

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

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("undertaking", UndertakingItemSheet, { makeDefault: true});

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("undertaking", UndertakingCharacterSheet, { makeDefault: true});
});
