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
    const item = context.item;

    context.config = CONFIG.undertaking;

    if(!item.system.description.value){
      item.system.description.value = '&nbsp;';
    }

    context.descriptionHTML = await TextEditor.enrichHTML(item.system.description.value, {
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

    return context;
  }

}
