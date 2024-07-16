export default class UndertakingItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 560,
      height: 400,
      classes: ["undertaking", "sheet", "item"],
      resizable: true,
      scrollY: [".tab.details"],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
      dragDrop: []
    });
  }

  get template(){
    return `systems/undertaking/templates/sheets/${this.item.type}-sheet.hbs`;
  }

  async getData(){
    const context = super.getData();
    context.config = CONFIG.undertaking;
    const item = context.item;

    if(context.item.actor){
      context.hasOwner = true;
      context.casters = context.item.actor.items.filter(function(item){ return item.type == "class" && item.system.categorization.spellcaster.progression && item.system.categorization.spellcaster.progression != 'none'});
    }
    else{
      context.hasOwner = false;
    }

    if(!item.system.description.value){
      item.system.description.value = '&nbsp;';
    }

    context.descriptionHTML = await TextEditor.enrichHTML(item.system.description.value, {
      secrets: item.isOwner,
      async: true,
      relativeTo: this.item,
      rollData: context.rollData
    });

    context.unidentifiedHTML = await TextEditor.enrichHTML(item.system.description.unidentified, {
      secrets: item.isOwner,
      async: true,
      relativeTo: this.item,
      rollData: context.rollData
    });

    if(item.type == 'class' || item.type == 'archetype' || item.type == 'race'){
      context.classDetails = await TextEditor.enrichHTML(item.system.classDetails, {
        secrets: item.isOwner,
        async: true,
        relativeTo: this.item,
        rollData: context.rollData
      });
    }

    const typesWithAction = ["consumable", "equipment", "ability", "customAttack", "spell", "weapon"];
    const typesWithAttack = ["mwak", "rwak", "msak", "rsak"];
    if(typesWithAction.includes(item.type)){
      let hasAttack = typesWithAttack.includes(item.system.actionType);
      item.system.hasAttack = hasAttack;
    }

    return context;
  }

  _getSubmitData(updateData={}){
    const formData = foundry.utils.expandObject(super._getSubmitData(updateData));

    // Handle Damage array
    const damage = formData.system?.damage;
    if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || "", d[1] || ""]);

    // Return the flattened submission data
    return foundry.utils.flattenObject(formData);
  }

  activateListeners(html){
    html.find(".input-dropdown").on("change", event => {
      this._changeDropdown(event);
    });
    html.find(".input-checkbox").on("change", event => {
      this._changeCheckbox(event);
    });
    html.find(".damage-control.add-damage").on("click", event => {
      this._addDamagePart(event);
    });
    html.find(".damage-control.delete-damage").on("click", event => {
      this._removeDamagePart(event);
    });
    html.find(".chat-description").on("click", event => {
      this._chatDescription(event);
    });

    super.activateListeners(html);
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

  _addDamagePart(event){
    event.preventDefault();
    const item = this.item;
    const damage = item.system.damage;
    item.update({['system.damage.parts']: damage.parts.concat([["",""]])});
  }

  _chatDescription(event){
    event.preventDefault();
    const item = this.item;
    const description = item.system.description.value;
    let messageData = {
      speaker: ChatMessage.getSpeaker(),
      flavor: item.name,
      content: description
    };
    ChatMessage.create(messageData);
  }

  async _removeDamagePart(event){
    event.preventDefault();
    const parent = event.currentTarget.closest(".damage-part");
    const index = parent.dataset.damagePart;
    const item = this.item;
    await this._onSubmit(event);
    const damage = foundry.utils.deepClone(item.system.damage);
    damage.parts.splice(Number(index), 1);
    item.update({['system.damage.parts']: damage.parts});
  }

}
