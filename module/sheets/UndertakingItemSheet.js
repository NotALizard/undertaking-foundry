export default class UndertakingItemSheet extends ItemSheet {
  get template(){
    return `systems/undertaking1e/templates/sheets/${this.item.type}-sheet.html`;
  }

  async getData(){
    const context = super.getData();
    const item = context.item;

    context.config = CONFIG.undertaking1e;

    context.descriptionHTML = await TextEditor.enrichHTML(item.system.description.value, {
      secrets: item.isOwner,
      async: true,
      relativeTo: this.item,
      rollData: context.rollData
    });
    return context;
  }

}
