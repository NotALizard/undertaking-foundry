export default class UndertakingCharacterSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 800,
      height: 960,
      template: "systems/undertaking/templates/sheets/character-sheet.hbs",
      classes: ["undertaking", "sheet", "character"],
      resizable: true,
      scrollY: [".tab.details"],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "features"}],
      dragDrop: []
    });
  }

  async getData(){
    const context = super.getData();
    context.config = CONFIG.undertaking;

    context.weapons = context.items.filter(function (item) { return item.type == "weapon"})
    context.equipment = context.items.filter(function (item) { return item.type == "equipment"})

    return context;
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
    super.activateListeners(html);
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
}
