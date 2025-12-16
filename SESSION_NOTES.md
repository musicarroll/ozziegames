Session Notes - Neon Dash Fixes

- Converted Neon Dash JS from ES modules to plain scripts so file:// loading works; updated neon_dash/index.html to include data.js, render.js, game.js, shop.js, main.js as regular scripts and set page title.
- Inlined module exports replaced with locals and window bindings for entry points (startGame, showShop, showOverlay, tryShout/tryDash/trySlowmo) to keep inline handlers functional.
- Fixed start overlay re-rendering loop that wiped the Shop button; now only renders on entering start state and wires an explicit click handler to the Shop button.
- Shop UI now responds when loaded locally; awaiting player feedback for deeper gameplay validation.
