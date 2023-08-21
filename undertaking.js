import {undertaking} from "./module/config.js";
import UndertakingItemSheet from "./module/sheets/UndertakingItemSheet.js";

Hooks.once("init",function(){
  console.log("Undertaking | Initializing the system");

  CONFIG.undertaking = undertaking;

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("undertaking", UndertakingItemSheet, { makeDefault: true});
});
