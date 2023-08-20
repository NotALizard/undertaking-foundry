import {undertaking1e} from "./module/config.js";
import UndertakingItemSheet from "./module/sheets/UndertakingItemSheet.js";

Hooks.once("init",function(){
  console.log("Undertaking1e | Initializing the system");

  CONFIG.undertaking1e = undertaking1e;

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("undertaking1e", UndertakingItemSheet, { makeDefault: true});
});
