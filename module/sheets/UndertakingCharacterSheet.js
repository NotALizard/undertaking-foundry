export default class UndertakingCharacterSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 800,
      height: 960,
      classes: ["undertaking", "sheet", "character"],
      resizable: true,
      scrollY: [".tab.details"],
      tabs: [{navSelector: ".sheet-navigation.tabs", contentSelector: ".sheet-body", initial: "features"}],
      dragDrop: [{
        dragSelector: ".item-list .item",
        dropSelector: null
      }]
    });
  }

  get height(){
    switch(this.actor.type){
      case "npc":
        return 400;
      default:
        return 960;
    }
  }

  get template(){
    switch(this.actor.type){
      case "npc":
        return "systems/undertaking/templates/sheets/npc-sheet.hbs";
      default:
        return "systems/undertaking/templates/sheets/character-sheet.hbs";
    }
  }

  async getData(){
    const context = super.getData();
    context.config = CONFIG.undertaking;
    const actor = context.actor;

    if(actor.type == 'npc'){
      if(!actor.system.description.value){
        actor.system.description.value = '&nbsp;';
      }

      context.descriptionHTML = await TextEditor.enrichHTML(actor.system.description.value, {
        secrets: true,
        async: true,
        relativeTo: this.actor,
        rollData: context.rollData
      });
    }

    context.attacks = context.items.filter(function (item) { return (item.type == "weapon" && item.system.showInAttacks ) || (item.type == "spell" && item.system.showInAttacks ) || item.type == "customAttack"});
    context.equipment = context.items.filter(function (item) { return item.type == "equipment" || item.type == "weapon"});
    context.classes = context.items.filter(function (item) { return item.type == "class"});
    context.archetypes = context.items.filter(function (item) { return item.type == "archetype"});
    context.abilities = context.items.filter(function (item) { return item.type == "ability"});
    context.languages = context.items.filter(function (item) { return item.type == "language"});

    context.cantrips = context.items.filter(function (item) { return item.type == "spell" && item.system.level == 0});
    context.spells = context.items.filter(function (item) { return item.type == "spell" && item.system.level != 0});
    const filter = context.actor.system.details.classFilter;
    if(filter != 'all'){
      context.cantrips = context.cantrips.filter(function (item) { return item.system.classIdentifier == filter});
      context.spells = context.spells.filter(function (item) { return item.system.classIdentifier == filter});
    }

    context.casters = context.classes.filter(function(item){ return item.system.categorization.spellcaster.progression && item.system.categorization.spellcaster.progression != 'none'});
    let carryLoad = 0;
    for(let e of context.equipment){
      carryLoad += parseInt(e.system.weight);
    }
    context.carryLoad = carryLoad;

    console.log(context);
    return context;
  }

  /*
  _onDrop(event){
    super._onDrop(event);
  }
  */

  async _onDropItem(event, data){
    if(!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    const actor = this.actor;
    let sameActor = (item.actor && item.actor.id === actor.id);

    if(sameActor) return this._onSortItem(event, itemData);

    if(itemData.type == 'class'){
      let id = itemData.system.identifier
      let existingClass = actor.items.filter(function(item){return item.type == "class" && item.system.identifier == id})[0];
      if(existingClass){
        let newLevel = existingClass.system.levels+1;
        //let classItem = actor.items.get(itemId);
        return existingClass.update({['system.levels']: newLevel});
      }
    }
    else if(itemData.type == 'spell'){
      let classes = this.actor.items.filter(function (item) { return item.type == "class" && item.system.categorization.spellcaster.progression && item.system.categorization.spellcaster.progression != 'none'});
      let filter = this.actor.system.details.classFilter;
      let assignedClass = await this._getClassSelectOptions(classes, filter);
      itemData.system.classIdentifier = assignedClass;
      return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    super._onDropItem(event, data);
  }

  async _getClassSelectOptions(classes, filter){
    const template = "systems/undertaking/templates/chat/class-select-dialog.hbs"
    const html = await renderTemplate(template, {classes: classes, filter: filter});

    return new Promise(resolve => {
      const data = {
        title: game.i18n.localize("undertaking.Chat.ForClass"),
        content: html,
        buttons: {
          normal: {
            label: game.i18n.localize("undertaking.Chat.Confirm"),
            callback: html => resolve(this._processClassSelectOptions(html[0].querySelector("form")))
          },
          cancel:{
            label: game.i18n.localize("undertaking.Chat.Cancel"),
            callback: html => resolve('')
          }
        },
        default: "normal",
        close: () => resolve('')
      }
      new Dialog(data, null).render(true);
    });
  }

  _processClassSelectOptions(form){
    return form.class.value;
  }

  async editLanguages(event){
    let allLanguages = CONFIG.undertaking.languages;
    let myLanguages = this.actor.system.traits.languages.value;
    let custom = this.actor.system.traits.languages.custom;
    let languages = {};
    for (const [key, value] of Object.entries(allLanguages)) {
      let lang = {
        title: value,
        known: myLanguages.includes(key)
      }
      languages[key] = lang;
    }
    let knownLanguages = await this._getLanguageSelectOptions(languages, custom);

    if(knownLanguages){
      this.actor.update({"system.traits.languages.value": knownLanguages.known});
      this.actor.update({"system.traits.languages.custom": knownLanguages.custom});
      let langItems = [];
      const existingLangs = this.actor.items.filter(function (item) { return item.type == "language"});
      const langIds = existingLangs.map(function (item) { return item.id });
      if(langIds.length){
        this.actor.deleteEmbeddedDocuments("Item", langIds);
      }
      for(let lang of knownLanguages.known){
        langItems.push({name: `Language (${lang})`, type:"language"});
      }
      for(let lang of knownLanguages.custom.split(',')){
        if(lang.trim())
          langItems.push({name: `Language (${lang.trim()})`, type:"language"});
      }
      return this.actor.createEmbeddedDocuments("Item", langItems);
    }
  }

  async _getLanguageSelectOptions(languages, custom){
    const template = "systems/undertaking/templates/chat/languages-select-dialog.hbs"
    const html = await renderTemplate(template, {languages: languages, custom: custom});

    return new Promise(resolve => {
      const data = {
        title: game.i18n.localize("undertaking.LanguagesTitle"),
        content: html,
        buttons: {
          normal: {
            label: game.i18n.localize("undertaking.Chat.Confirm"),
            callback: html => resolve(this._processLanguageSelectOptions(html[0].querySelector("form")))
          },
          cancel:{
            label: game.i18n.localize("undertaking.Chat.Cancel"),
            callback: html => resolve('')
          }
        },
        default: "normal",
        close: () => resolve('')
      }
      new Dialog(data, null).render(true);
    });
  }

  _processLanguageSelectOptions(form){
    let known = [];
    let custom = "";
    for (const [key, value] of Object.entries(form)) {
      if(value.name == 'custom'){
        custom = value.value;
      }
      else if(value.name.includes('known-')){
        if(value.checked){
          known.push(value.lang);
        }
      }
    }
    return {known: known, custom: custom};
  }


  activateListeners(html){
    html.find(".rollable").on("click", this._onRoll.bind(this));
    html.find(".input-checkbox").on("change", event => {
      this._changeCheckbox(event);
    });
    html.find(".profcheck.save-check").on("click", event => {
      this._toggleSaveProficiency(event);
    });
    html.find(".profcheck.skill-check").on("click", event => {
      this._toggleSkillProficiency(event);
    });
    html.find(".profcheck.skill-expert").on("click", event => {
      this._toggleSkillExpertise(event);
    });
    html.find(".profcheck.armor-prof").on("click", event => {
      this._toggleArmorProficiency(event);
    });
    html.find(".profcheck.armor-savvy").on("click", event => {
      this._toggleArmorSavvy(event);
    });
    html.find(".profcheck.weapon-prof").on("click", event => {
      this._toggleWeaponProficiency(event);
    });
    html.find(".profcheck.weapon-savvy").on("click", event => {
      this._toggleWeaponSavvy(event);
    });
    html.find(".edit-languages").on("click", event => {
      this.editLanguages(event);
    });
    html.find(".desperate-toggle").on("click", event => {
      this._toggleDesperate(event);
    });
    html.find(".shield-toggle").on("click", event => {
      this._toggleShield(event);
    });
    html.find(".death-button.success").on("click", event => {
      this._addDeathSuccess(event);
    });
    html.find(".death-button.fail").on("click", event => {
      this._addDeathFail(event);
    });
    html.find(".death-reset-button").on("click", event => {
      this._resetDeathSaves(event);
    });
    html.find(".res-type-button").on("click", event => {
      this._changeResourceType(event);
    });
    html.find(".res-recharge-button").on("click", event => {
      this._changeResourceRecharge(event);
    });
    html.find(".res-button.remove").on("click", event => {
      this._removeResourceRow(event);
    });
    html.find(".res-button.add").on("click", event => {
      this._addResourceRow(event);
    });
    html.find(".toggle-lock").on("click", event => {
      this._toggleEditLock(event);
    });

    html.find(".item-create").on("click", event => {
      this._onItemCreate(event);
    });
    html.find(".item-open").on("click", event => {
      this._onItemOpen(event);
    });
    html.find(".item-delete").on("click", event => {
      this._onItemDelete(event);
    });
    html.find(".item-roll.attack").on("click", event => {
      this._onItemRoll(event);
    });
    html.find(".inline-edit").on("change", event => {
      this._onItemEdit(event);
    });
    

    html.find(".item.class-filter").on("click", event => {
      this._changeClassFilter(event);
    });
    html.find(".input-dropdown").on("change", event => {
      this._changeDropdown(event);
    });
    html.find(".duplicate-input").on("change", event => {
      this._duplicateInput(event);
    });

    this._fixElementSizes(html);

    super.activateListeners(html);
  }

  _onRoll(event){
    event.preventDefault();
    const clicked = event.currentTarget.closest(".rollable");
    const data = clicked.dataset;
    switch(data.rolltype){
      case "attribute":
        return this._rollAttribute(data.attribute);
      case "save":
        return this._rollSave(data.attribute);
      case "skill":
        return this._rollSkill(data.skill);
      case "initiative":
        return this._rollInitiative();
      case "restdie":
        return this._rollRestDie(data.die);
    }
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

  async _rollAttribute(attribute){
    const title = `${game.i18n.localize(this.actor.system.attributes[attribute].label)} ${game.i18n.localize("undertaking.Check")}`;
    const dice = await this._getRollModeOptions(title);
    if(!dice) return;
    let rollFormula = `${dice} + @mod`;
    let rollData = {
      mod: this.actor.system.attributes[attribute].mod
    };
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      flavor: title
    };
    let rollResult = await new Roll(rollFormula, rollData).roll();
    //let rollResult = await new CONFIG.Dice.D20Roll(rollFormula, rollData).roll();
    await rollResult.toMessage(messageData);
  }

  async _rollSave(attribute){
    const title = `${game.i18n.localize(this.actor.system.attributes[attribute].label)} ${game.i18n.localize("undertaking.SaveCheck")}`;
    const dice = await this._getRollModeOptions(title);
    if(!dice) return;
    let rollFormula = `${dice} + @save`;
    let rollData = {
      save: this.actor.system.attributes[attribute].save
    };
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      flavor: title
    };
    let rollResult = await new Roll(rollFormula, rollData).roll();
    await rollResult.toMessage(messageData);
  }

  async _rollSkill(skill){
    const title = `${game.i18n.localize(this.actor.system.skills[skill].label)} ${game.i18n.localize("undertaking.Check")}`;
    const dice = await this._getRollModeOptions(title);
    if(!dice) return;
    let rollFormula = `${dice} + @bonus`;
    let rollData = {
      bonus: this.actor.system.skills[skill].total
    };
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      flavor: title
    };
    let rollResult = await new Roll(rollFormula, rollData).roll();
    await rollResult.toMessage(messageData);
  }

  async _rollInitiative(){
    const title = `${game.i18n.localize("undertaking.Initiative")}`;
    const dice = await this._getRollModeOptions(title);
    if(!dice) return;
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      flavor: title
    };
    const formula = `${dice} + @attributes.dex.mod + @stats.init.bonus`;
    let initiativeOptions = {
      formula: formula,
      messageOptions: messageData
    }
    
    await this.actor.rollInitiative({createCombatants: true, rerollInitiative: true, initiativeOptions: initiativeOptions});
    /*
    try{
      let combat = game.combat;
      let combatant = combat.getCombatantByActor(this.actor);
      await combat.rollInitiative(combatant.id, {formula: formula});
      return;
    }
    catch(err){
      console.log(err);
    }
    
    
    let rollFormula = "1d20 + @bonus";
    let rollData = {
      bonus: this.actor.system.stats.init.total
    };
    
    let rollResult = await new Roll(rollFormula, rollData).roll();
    await rollResult.toMessage(messageData);
    */
  }

  async _rollRestDie(die){
    let rollFormula = `1${die} + @mod`;
    let rollData = {
      mod: this.actor.system.attributes.con.mod
    };
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      flavor: `${die} ${game.i18n.localize("undertaking.RestDice")}`
    };
    let rollResult = await new Roll(rollFormula, rollData).roll();
    await rollResult.toMessage(messageData);
  }

  _changeCheckbox(event){
    event.preventDefault();
    const dropdown = event.currentTarget.closest(".input-checkbox");
    const target = dropdown.dataset.for;
    const root = event.currentTarget.closest(".sheet-body");
    const field = root.querySelector(target);

    if(field.value == 'true'){
      field.value = false;
    }
    else{
      field.value = true;
    }
    return this._onSubmit(event);
  }

  _fixElementSizes(html){
    try{
      let targetHeight = html.find(".res-col")[0].offsetHeight;
      let equipCol = html.find(".list-container.equipment")[0];
      equipCol.style.height = (targetHeight-36) + "px";
    }
    catch(err){
      console.log("Error fixing equipment height: " + err);
    }
  }

  _changeDropdown(event){
    event.preventDefault();
    const dropdown = event.currentTarget.closest(".input-dropdown");
    const target = dropdown.dataset.for;
    const root = event.currentTarget.closest(".sheet-body");
    const field = root.querySelector(target);

    field.value = dropdown.value;
    return this._onSubmit(event);
  }

  _duplicateInput(event){
    event.preventDefault();
    const dupe = event.currentTarget.closest(".duplicate-input");
    const target = dupe.dataset.for;
    const root = event.currentTarget.closest(".sheet-body");
    const field = root.querySelector(target);

    field.value = dupe.value;
    return this._onSubmit(event);
  }

  _toggleEditLock(event){
    event.preventDefault();
    const parent = event.currentTarget.closest(".sheet-body");
    const field = parent.querySelector('.input-edit-lock');
    if(field.value == 'true'){
      field.value = false;
    }
    else{
      field.value = true;
    }
    return this._onSubmit(event);
  }

  _onItemCreate(event){
    event.preventDefault();
    let element = event.currentTarget;

    let name;
    switch(element.dataset.type){
      case 'ability':
        name = 'New Ability';
        break;
      case 'customAttack':
        name = 'New Attack';
        break;
      default:
        name = "New Item";
        break;
    }
    let itemData = {
      name: name,
      type: element.dataset.type
    };

    return this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  _onItemDelete(event){
    event.preventDefault();
    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    return this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }

  _onItemOpen(event){
    event.preventDefault();
    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    let item = this.actor.items.get(itemId);

    item.sheet.render(true);
  }

  _onItemEdit(event){
    event.preventDefault();
    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    let item = this.actor.items.get(itemId);
    let field = element.dataset.field;

    return item.update({[field]: element.value});
  }

  async _onItemRoll(event){
    event.preventDefault();
    let element = event.currentTarget;
    let itemId = element.closest(".item").dataset.itemId;
    let item = this.actor.items.get(itemId);
    let data = await this.getData();

    item.roll();
  }

  _toggleSaveProficiency(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-save-prof');
    const value = field.value;

    if(value == 1){
      field.value = 0;
    }
    else{
      field.value = 1;
    }
    return this._onSubmit(event);
  }

  _toggleSkillProficiency(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-skill-prof');
    const value = field.value;

    if(value > 0){
      field.value = 0;
    }
    else{
      field.value = 1;
    }
    return this._onSubmit(event);
  }

  _toggleSkillExpertise(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-skill-prof');
    const value = field.value;

    if(value > 1){
      field.value = 1;
    }
    else{
      field.value = 2;
    }
    return this._onSubmit(event);
  }

  _toggleArmorProficiency(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-armor-prof');
    const value = field.value;

    if(value > 0){
      field.value = 0;
    }
    else{
      field.value = 1;
    }
    return this._onSubmit(event);
  }

  _toggleArmorSavvy(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-armor-prof');
    const value = field.value;

    if(value > 1){
      field.value = 1;
    }
    else{
      field.value = 2;
    }
    return this._onSubmit(event);
  }

  _toggleWeaponProficiency(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-weapon-prof');
    const value = field.value;

    if(value > 0){
      field.value = 0;
    }
    else{
      field.value = 1;
    }
    return this._onSubmit(event);
  }

  _toggleWeaponSavvy(event){
    const parent = event.currentTarget.closest(".prof-row");
    const field = parent.querySelector('.input-weapon-prof');
    const value = field.value;

    if(value > 1){
      field.value = 1;
    }
    else{
      field.value = 2;
    }
    return this._onSubmit(event);
  }

  _toggleDesperate(event){
    const parent = event.currentTarget.closest(".desperate-container");
    const field = parent.querySelector('.input-desperate');
    if(field.value == 'true'){
      field.value = false;
    }
    else{
      field.value = true;
    }
    return this._onSubmit(event);
  }

  _toggleShield(event){
    const parent = event.currentTarget.closest(".shield-info");
    const field = parent.querySelector('.input-shield-equip');
    const value = field.value;

    if(value > 0){
      field.value = 0;
    }
    else{
      field.value = 1;
    }
    return this._onSubmit(event);
  }

  _addDeathSuccess(event){
    const parent = event.currentTarget.closest(".death-buttons");
    const field = parent.querySelector('.input-death-success');
    field.value++;
    if(field.value > 3) field.value = 3;
    return this._onSubmit(event);
  }

  _addDeathFail(event){
    const parent = event.currentTarget.closest(".death-buttons");
    const field = parent.querySelector('.input-death-fail');
    field.value++;
    if(field.value > 3) field.value = 3;
    return this._onSubmit(event);
  }

  _resetDeathSaves(event){
    const parent = event.currentTarget.closest(".death-buttons");
    const s = parent.querySelector('.input-death-success');
    const f = parent.querySelector('.input-death-fail');

    s.value = 0;
    f.value = 0;
    return this._onSubmit(event);
  }

  _changeResourceType(event){
    const parent = event.currentTarget.closest(".res-buttons");
    const field = parent.querySelector('.input-res-type');
    const current = field.value;

    switch(current){
      case "count":
        field.value = "target";
        break;
      case "target":
        field.value = "count";
        break;
    }
    return this._onSubmit(event);
  }

  _changeResourceRecharge(event){
    const parent = event.currentTarget.closest(".res-buttons");
    const field = parent.querySelector('.input-res-recharge');
    const current = field.value;

    switch(current){
      case "N":
        field.value = "LR";
        break;
      case "LR":
        field.value = "SR";
        break;
      case "SR":
        field.value = "N";
        break;
    }
    return this._onSubmit(event);
  }

  _addResourceRow(event){
    const parent = event.currentTarget.closest(".res-count-buttons");
    const field = parent.querySelector('.res-row-count');

    if(field.value < 4){
      field.value = +field.value+1;
    }
    return this._onSubmit(event);
  }

  _removeResourceRow(event){
    const parent = event.currentTarget.closest(".res-count-buttons");
    const field = parent.querySelector('.res-row-count');

    if(field.value > 1){
      field.value = +field.value-1;
    }
    return this._onSubmit(event);
  }

  _changeClassFilter(event){
    const element = event.currentTarget;
    const value = element.closest(".item").dataset.tab;

    const parent = event.currentTarget.closest(".spells-container");
    const field = parent.querySelector('#input-class-filter');
    field.value = value;
    return this._onSubmit(event);
  }
}
