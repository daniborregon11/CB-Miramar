// Arranque de la app: primero se cargan los datos guardados y después se pinta la pantalla
import "./fonts.css";
import "./styles.css";
import { initData } from "./state.js";
import { setupEvents } from "./actions.js";
import { render } from "./ui/layout.js";
import { setupPWA } from "./ui/pwa.js";

initData({ onStorageChange: render }).then(function(){
  setupEvents();
  render();
  setupPWA();
});
