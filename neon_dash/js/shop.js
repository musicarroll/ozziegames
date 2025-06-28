import { SKINS, UPGRADES, PETS, saveData, saveGame } from './data.js';
import { showOverlay, startGame } from './game.js';

let shopTab = 'skins';

export function showShop(tab){
  shopTab = tab || shopTab || 'skins';
  let html = `
    <div class="shop-title">SHOP</div>
    <div class="shop-tabs">
      <div class="shop-tab${shopTab==='skins'?' selected':''}" onclick="showShop('skins')">Skins</div>
      <div class="shop-tab${shopTab==='upgrades'?' selected':''}" onclick="showShop('upgrades')">Upgrades</div>
      <div class="shop-tab${shopTab==='pets'?' selected':''}" onclick="showShop('pets')">Pets</div>
    </div>
    <div class="shop-money">Your Coins: <b>${saveData.money}</b></div>
  `;
  if(shopTab==='skins'){
    html += `<div class="shop-list">`;
    for(const skin of SKINS){
      html += `<div class="shop-item${saveData.equippedSkin===skin.key?' selected':''}">
        <div class="skin-preview" style="background:${skin.color==='rainbow'?'linear-gradient(90deg,#0ff,#f0f,#ff0,#0f0,#f33,#fff)':skin.color};box-shadow:0 0 18px ${skin.glow};"></div>
        <div>${skin.name}</div>
        ${saveData.unlockedSkins[skin.key] ? `
          <button class="shop-button" id="equip-skin-${skin.key}"${saveData.equippedSkin===skin.key?' disabled':''}>${saveData.equippedSkin===skin.key?'Equipped':'Equip'}</button>
        ` : `
          <div class="shop-price">💰 ${skin.price}</div>
          <button class="shop-button" id="buy-skin-${skin.key}"${saveData.money < skin.price ? ' disabled':''}>Buy</button>
        `}
      </div>`;
    }
    html += `</div>`;
  }
  if(shopTab==='upgrades'){
    html += `<div class="shop-list">`;
    for(const upg of UPGRADES){
      const level = saveData.upgrades[upg.key]||0;
      const maxed = level >= upg.maxLevel;
      const price = upg.price[level]||0;
      html += `
        <div class="shop-item${maxed?' selected':''}">
          <div style="font-size:1.15em;margin-bottom:0.3em;">${upg.name}</div>
          <div class="desc">${upg.desc}</div>
          <div class="upgrade-level">Level: ${level}/${upg.maxLevel}</div>
          ${maxed ? `<div style="color:#0f0;font-weight:bold;margin-top:0.6em;">MAXED</div>`
            : `<div class="shop-price">💰 ${price}</div>
              <button id="buy-upg-${upg.key}" class="shop-button"${saveData.money < price ? ' disabled':''}>Buy</button>`}
        </div>
      `;
    }
    html += `</div>`;
  }
  if(shopTab==='pets'){
    html += `<div class="shop-list">`;
    for(const pet of PETS){
      html += `<div class="shop-item${saveData.equippedPet===pet.key ? ' selected' : ''}">
        <canvas class="pet-preview" id="petprev-${pet.key}" width="44" height="44"></canvas>
        <div>${pet.name}</div>
        <div class="desc">${pet.desc}</div>
        ${saveData.pets[pet.key] ? `
          <button class="shop-button" id="equip-pet-${pet.key}"${saveData.equippedPet===pet.key?' disabled':''}>${saveData.equippedPet===pet.key?'Equipped':'Equip'}</button>
        ` : `
          <div class="shop-price">💰 ${pet.price}</div>
          <button class="shop-button" id="buy-pet-${pet.key}"${saveData.money < pet.price ? ' disabled':''}>Buy</button>
        `}
      </div>`;
    }
    html += `</div>`;
  }
  html += `
    <button class="button" id="shop-play-btn" style="margin-top:2em;">PLAY</button>
    <div class="desc" style="margin-top:1em;">
      Skins: just for style.<br>
      Upgrades: improve your abilities.<br>
      Pets: passive powers. Only one equipped.<br>
      [Arrow keys] Move | [S] Shout | [D] Dash | [F] Slowmo
    </div>
  `;
  showOverlay(html);
  setTimeout(() => {
    if(shopTab==='pets'){
      for(const pet of PETS){
        const c = document.getElementById(`petprev-${pet.key}`);
        if(c && pet.draw) pet.draw(c.getContext('2d'),22,22);
      }
    }
    for(const skin of SKINS){
      if(!saveData.unlockedSkins[skin.key]){
        const btn = document.getElementById('buy-skin-'+skin.key);
        if(btn) btn.onclick = () => buySkin(skin.key);
      } else {
        const btn = document.getElementById('equip-skin-'+skin.key);
        if(btn) btn.onclick = () => equipSkin(skin.key);
      }
    }
    for(const upg of UPGRADES){
      const btn = document.getElementById('buy-upg-'+upg.key);
      if(btn) btn.onclick = () => buyUpgrade(upg.key);
    }
    for(const pet of PETS){
      if(!saveData.pets[pet.key]){
        const btn = document.getElementById(`buy-pet-${pet.key}`);
        if(btn) btn.onclick = () => buyPet(pet.key);
      } else {
        const btn = document.getElementById(`equip-pet-${pet.key}`);
        if(btn) btn.onclick = () => equipPet(pet.key);
      }
    }
    const playBtn = document.getElementById('shop-play-btn');
    if(playBtn) playBtn.onclick = () => startGame();
  },30);
}

export function buySkin(key){
  const skin = SKINS.find(s=>s.key===key);
  if(!skin || saveData.money<skin.price || saveData.unlockedSkins[key]) return;
  saveData.money -= skin.price;
  saveData.unlockedSkins[key] = true;
  equipSkin(key);
  saveGame();
  showShop();
}

export function equipSkin(key){
  if(!saveData.unlockedSkins[key]) return;
  saveData.equippedSkin = key;
  saveGame();
  showShop();
}

export function buyUpgrade(key){
  const upg = UPGRADES.find(u=>u.key===key);
  const level = saveData.upgrades[key]||0;
  if(!upg || level>=upg.maxLevel) return;
  const price = upg.price[level];
  if(saveData.money<price) return;
  saveData.money -= price;
  saveData.upgrades[key] = level+1;
  saveGame();
  showShop();
}

export function buyPet(key){
  const pet = PETS.find(p=>p.key===key);
  if(!pet || saveData.money<pet.price || saveData.pets[key]) return;
  saveData.money -= pet.price;
  saveData.pets[key] = true;
  equipPet(key);
  saveGame();
  showShop();
}

export function equipPet(key){
  if(!saveData.pets[key]) return;
  saveData.equippedPet = key;
  saveGame();
  showShop();
}
