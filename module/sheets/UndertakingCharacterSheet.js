export default class UndertakingCharacterSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 800,
      height: 960,
      template: "systems/undertaking/templates/sheets/character-sheet.hbs",
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

  async getData(){
    const context = super.getData();
    context.config = CONFIG.undertaking;

    context.attacks = context.items.filter(function (item) { return item.type == "weapon"});
    context.equipment = context.items.filter(function (item) { return item.type == "equipment" || item.type == "weapon"});
    context.classes = context.items.filter(function (item) { return item.type == "class"});
    context.archetypes = context.items.filter(function (item) { return item.type == "archetype"});
    context.abilities = context.items.filter(function (item) { return item.type == "ability"});

    context.cantrips = context.items.filter(function (item) { return item.type == "spell" && item.system.level == 0});
    context.spells = context.items.filter(function (item) { return item.type == "spell" && item.system.level != 0});
    const filter = context.actor.system.details.classFilter;
    if(filter != 'all'){
      context.cantrips = context.cantrips.filter(function (item) { return item.system.classIdentifier == filter});
      context.spells = context.spells.filter(function (item) { return item.system.classIdentifier == filter});
    }

    context.casters = context.classes.filter(function(item){ return item.system.categorization.spellcaster.progression && item.system.categorization.spellcaster.progression != 'none'});

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
    console.log(actor);
    console.log(item);
    let sameActor = (item.actor && item.actor.id === actor.id);

    if(sameActor) return this._onSortItem(event, itemData);

    if(item.type == 'class'){
      let id = item.system.identifier
      let existingClass = actor.items.filter(function(item){return item.type == "class" && item.system.identifier == id})[0];
      if(existingClass){
        console.log('found class');
        let newLevel = existingClass.system.levels+1;
        console.log(newLevel);
        //let classItem = actor.items.get(itemId);
        return existingClass.update({['system.levels']: newLevel});
      }
    }

    super._onDropItem(event, data);
  }


  activateListeners(html){
    html.find(".profcheck.save-check").on("click", event => {
      this._toggleSaveProficiency(event);
    });
    html.find(".profcheck.skill-check").on("click", event => {
      this._toggleSkillProficiency(event);
    });
    html.find(".profcheck.skill-expert").on("click", event => {
      this._toggleSkillExpertise(event);
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
