import { startGame, showOverlay } from './game.js';
import { showShop } from './shop.js';

console.log('main.js loaded');

window.startGame = startGame;
window.showShop = showShop;

// Display start screen on load
showOverlay(`
  <h1>NEON DASH: ULTIMATE EDITION</h1>
  <div class="desc">
    <b>All features enabled.</b><br>
    50 Levels, bosses, upgrades, skins, PETS!<br>
    Arrow keys to move. [S]=Shout, [D]=Dash, [F]=Slowmo.<br>
    Go to <b>SHOP</b> for pets, skins, upgrades.
  </div>
  <div class="desc">Press <b>[Space]</b> to play, or click <b>Shop</b>.</div>
  <button class="button" onclick="showShop()">SHOP</button>
`);
