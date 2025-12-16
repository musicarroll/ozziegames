console.log('main.js loaded');

// Expose entry points for inline handlers and other scripts
window.startGame = startGame;
window.showShop = showShop;
window.showOverlay = showOverlay;

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
  <button class="button" id="start-shop-btn">SHOP</button>
`);

// Guard against inline handler issues: wire the Shop button explicitly
setTimeout(() => {
  const btn = document.getElementById('start-shop-btn');
  if (btn) btn.onclick = () => window.showShop();
}, 0);
