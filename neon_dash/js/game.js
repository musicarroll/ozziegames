import { SKINS, UPGRADES, PETS, saveData, addMoney, setHighScore } from './data.js';
import { drawNeonRect, drawNeonCircle, drawNeonText } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
export const W = canvas.width;
export const H = canvas.height;

const overlay = document.getElementById('overlay');
const shoutBar = document.getElementById('shout-bar');
const shoutFill = document.getElementById('shout-fill');
const shoutLabel = document.getElementById('shout-label');
const dashBar = document.getElementById('dash-bar');
const dashFill = document.getElementById('dash-fill');
const dashLabel = document.getElementById('dash-label');
const slowmoBar = document.getElementById('slowmo-bar');
const slowmoFill = document.getElementById('slowmo-fill');
const slowmoLabel = document.getElementById('slowmo-label');

let gameState = 'start';
let score = 0, frame = 0, level = 1, speed = 4, player, obstacles = [], orbs = [], moneyThisRun = 0;
let shieldActive = false, petShieldUsed = false, autoShoutUsed = false, thornsUsed = 0, playerLives = 1;
let timeThisLevel = 0, levelingUp = false, bossStunTime = 0, bossReward = 500;
let shoutCooldown = 0, dashCooldown = 0, dashActive = false, dashTimer = 0, dashDir = {x:0,y:0};
let slowmoCooldown = 0, slowmoActive = false, slowmoTimer = 0;
let input = { left:false, right:false, up:false, down:false };
let petX = 0, petY = 0;
const LEVEL_TIME = 22;
let bossObj = null; let bossTimer = 0;

export function showOverlay(html){
  overlay.innerHTML = html;
  overlay.style.display = 'flex';
}

export function createPlayer(){
  return { x: W/2-22, y: H-96, size: 44, alive: true };
}

export function startGame(){
  score = 0; speed = 4; frame = 0; moneyThisRun = 0;
  player = createPlayer();
  obstacles = []; orbs = [];
  shieldActive = saveData.upgrades.shield > 0;
  petShieldUsed = false; autoShoutUsed = false; thornsUsed = 0;
  level = 1; timeThisLevel = 0; levelingUp = false;
  shoutCooldown = 0; dashCooldown = 0; dashActive = false; dashTimer = 0; dashDir = {x:0,y:0};
  slowmoCooldown = 0; slowmoActive = false; slowmoTimer = 0;
  bossStunTime = 0; bossObj = null;
  playerLives = 1 + (saveData.upgrades.extraLife||0);
  overlay.innerHTML = '';
  overlay.style.display = 'none';
  shoutBar.style.display = 'block';
  dashBar.style.display = 'block';
  slowmoBar.style.display = 'block';
  updatePowerBars();
  petX = player.x-36; petY = player.y+player.size/2;
  requestAnimationFrame(loop);
}

export function showLevelUpPopup(msg){
  const popup = document.getElementById('levelup-popup');
  popup.style.display = 'flex';
  popup.innerHTML = `<div style="font-size:3em;background:#222c;padding:1em 3em;border-radius:1.5em;box-shadow:0 0 24px #0ff8;text-align:center;color:#fff;">${msg}</div>`;
  setTimeout(()=>{ popup.style.display='none'; },1600);
}

export function updatePowerBars(){
  const frac = Math.max(0, Math.min(1, 1-shoutCooldown/10));
  shoutFill.style.width = (232*frac)+"px";
  shoutBar.style.display = (gameState==='playing'?'block':'none');
  shoutLabel.innerHTML = shoutCooldown<=0 ? '[S] SHOUT READY!' : `SHOUT: ${shoutCooldown.toFixed(1)}s`;
  shoutFill.style.background = shoutCooldown<=0 ? '#0ff' : '#0ff6';
  const hasDash = saveData.upgrades.hyperDash>0;
  dashBar.style.display = hasDash && gameState==='playing' ? 'block' : 'none';
  dashFill.style.width = (150*Math.max(0,Math.min(1,1-dashCooldown/4)))+'px';
  dashLabel.innerHTML = dashCooldown<=0 ? '[D] DASH!' : `DASH: ${dashCooldown.toFixed(1)}s`;
  const hasSlowmo = saveData.upgrades.slowmo>0;
  slowmoBar.style.display = hasSlowmo && gameState==='playing' ? 'block' : 'none';
  slowmoFill.style.width = (150*Math.max(0,Math.min(1,1-slowmoCooldown/7)))+'px';
  slowmoLabel.innerHTML = slowmoCooldown<=0 ? '[F] SLOWMO!' : `SLOWMO: ${slowmoCooldown.toFixed(1)}s`;
}

function rectsCollide(a,b,bw=b.w,bh=b.h){
  return a.x<b.x+bw && a.x+a.size>b.x && a.y<b.y+bh && a.y+a.size>b.y;
}

function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }

function spawnObstacle(){
  const w = 48+Math.random()*48, h = 32+Math.random()*32;
  const x = Math.random()*(W-w), y=-h;
  let color='#f33', glow='#f338';
  if(Math.random()<0.2){color='#ff0';glow='#ff08';}
  if(Math.random()<0.11){color='#0ff';glow='#0ff8';}
  if(Math.random()<0.07){color='#a3f';glow='#a3f8';}
  return {x,y,w,h,color,glow};
}

function spawnOrb(){
  const size=24;
  const x=Math.random()*(W-size), y=-size;
  const dbl = saveData.upgrades.doubleOrb && Math.random()<(0.1+0.1*(saveData.upgrades.doubleOrb||0));
  const color = dbl? '#ff0':'#0ff';
  const glow = dbl? '#ff08':'#0ff8';
  return {x,y,size,color,glow,double:dbl};
}

function getActiveSkin(){
  let s = SKINS.find(s=>s.key===saveData.equippedSkin);
  if(!s) s = SKINS[0];
  return s;
}

function tryShout(){
  if(shoutCooldown>0) return;
  obstacles = obstacles.filter(o=>o.isBoss);
  if(bossObj){
    const power = 2.0 + (saveData.upgrades.shoutPower||0)*0.5;
    bossStunTime = power;
  }
  shoutCooldown = 10;
  updatePowerBars();
  const popup = document.getElementById('levelup-popup');
  popup.style.display='flex';
  popup.innerHTML = `<div style="font-size:2.5em;background:#0ff4;padding:1em 2em;border-radius:1em;box-shadow:0 0 24px #fffa;text-align:center;color:#222;">SHOUT!</div>`;
  setTimeout(()=>{popup.style.display='none';},600);
}

function tryDash(){
  if((saveData.upgrades.hyperDash||0)<1) return;
  if(dashCooldown>0||dashActive) return;
  let dx=(input.left?-1:0)+(input.right?1:0);
  let dy=(input.up?-1:0)+(input.down?1:0);
  if(dx===0&&dy===0) return;
  const mag=Math.hypot(dx,dy); if(mag>0){dx/=mag;dy/=mag;}
  dashDir={x:dx,y:dy};
  dashActive=true; dashTimer=0.21+0.11*(saveData.upgrades.hyperDash||0); dashCooldown=4;
  updatePowerBars();
}

function trySlowmo(){
  if((saveData.upgrades.slowmo||0)<1) return;
  if(slowmoCooldown>0||slowmoActive) return;
  slowmoActive=true; slowmoTimer=1.5+(saveData.upgrades.slowmo||0)*0.8; slowmoCooldown=7;
  updatePowerBars();
}

export function endGame(){
  gameState='gameover';
  setHighScore(score);
  const milestone = Math.floor(score/1000)*15;
  if(milestone>0) moneyThisRun += milestone;
  addMoney(moneyThisRun);
  showOverlay(`
    <h1>Game Over</h1>
    <div class="score">Score: <b>${score}</b></div>
    <div class="money">Coins: <b>+${moneyThisRun}</b></div>
    <div class="score">High Score: <b>${saveData.highScore}</b></div>
    <button class="button" onclick="window.showShop()">Shop & Upgrades</button>
    <div class="desc">Press [Enter] or [Space] to shop</div>
    ${saveData.bossBeaten ? `<div style="color:#0f0;font-size:1.2em;margin-top:1em;">🏆 Boss Beaten!<br>Special reward unlocked.</div>` : ''}
  `);
  shoutBar.style.display='none'; dashBar.style.display='none'; slowmoBar.style.display='none';
}

function handleBoss(bossIndex, stunned){
  if(!bossObj){
    bossObj = {x:W/2-120,y:150,w:240,h:44,vx:5+bossIndex*1.1,dir:1,t:0,color:'#a3f',glow:'#fff8',isBoss:true,fireCooldown:0};
    obstacles.push(bossObj); bossTimer=0;
  }
  bossObj.t += 1/60;
  const speed = bossObj.vx * (stunned?0:bossObj.dir);
  bossObj.x += speed;
  if(bossObj.x<30 || bossObj.x+bossObj.w>W-30) bossObj.dir*=-1;
  if(!stunned) bossObj.fireCooldown -= 1/60;
  if(!stunned && bossObj.fireCooldown<=0){
    bossObj.fireCooldown = Math.max(0.5,1.1-bossIndex*0.08);
    const bx = bossObj.x + bossObj.w/2;
    obstacles.push({x:bx-12,y:bossObj.y+bossObj.h,w:24,h:28,color:'#ff0',glow:'#fff8',vy:13+bossIndex*2.1});
  }
  drawNeonRect(ctx,bossObj.x,bossObj.y,bossObj.w,bossObj.h,bossObj.color,bossObj.glow);
  drawNeonText(ctx,'BOSS',bossObj.x+bossObj.w/2,bossObj.y+bossObj.h/2+10,28,'#fff','#a3f8');
  for(let i=obstacles.length-1;i>=0;--i){
    const o=obstacles[i];
    if(!o.isBoss && o.vy){
      o.y += o.vy;
      drawNeonRect(ctx,o.x,o.y,o.w,o.h,o.color,o.glow);
      if(rectsCollide(player,o)){
        if(saveData.equippedPet==='bouncer'&&!petShieldUsed){petShieldUsed=true;obstacles.splice(i,1);continue;}
        if(shieldActive){shieldActive=false;obstacles.splice(i,1);continue;}
        if(saveData.upgrades.thorns>0 && thornsUsed<saveData.upgrades.thorns){thornsUsed++;obstacles.splice(i,1);continue;}
        if(playerLives>1){playerLives--;obstacles.splice(i,1);continue;}
        if(saveData.upgrades.autoShout>0 && !autoShoutUsed){autoShoutUsed=true;tryShout();obstacles.splice(i,1);continue;}
        player.alive=false;
      }
      if(o.y>H) obstacles.splice(i,1);
    }
  }
  if(stunned){
    drawNeonText(ctx,'STUNNED!',bossObj.x+bossObj.w/2,bossObj.y+bossObj.h+20,20,'#fff','#fff8');
  }
  if(bossStunTime>0) bossStunTime -= 1/60;
}

function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(gameState==='playing'){
    let moveSpeed = 8 + (saveData.upgrades.speed||0);
    if(dashActive){
      player.x += dashDir.x*18; player.y += dashDir.y*18; dashTimer -= 1/60; if(dashTimer<=0) dashActive=false;
    } else {
      const actSpd = moveSpeed*(slowmoActive?0.38:1);
      if(input.left) player.x -= actSpd;
      if(input.right) player.x += actSpd;
      if(input.up) player.y -= actSpd;
      if(input.down) player.y += actSpd;
    }
    player.x=Math.max(0,Math.min(W-player.size,player.x));
    player.y=Math.max(0,Math.min(H-player.size,player.y));
    const isBoss = (level%5===0); const bossIndex=Math.floor(level/5);
    const currentSpeed = speed + (level-1)*0.45 + (isBoss ? 2+bossIndex*0.24 : 0);
    const obsRate = Math.max(30,100-level*1.2);
    const orbRate = Math.max(90,220-Math.floor(level*2.4)-(saveData.upgrades.orbValue||0)*10);
    if(isBoss){
      handleBoss(bossIndex,isBoss && bossStunTime>0);
    } else if(frame % obsRate === 0){
      obstacles.push(spawnObstacle());
    }
    if(frame % orbRate === 0){
      orbs.push(spawnOrb());
    }
    for(let i=obstacles.length-1;i>=0;--i){
      const o=obstacles[i];
      if(isBoss && o.isBoss) continue;
      o.y += currentSpeed*(slowmoActive?0.5:1);
      drawNeonRect(ctx,o.x,o.y,o.w,o.h,o.color,o.glow);
      if(rectsCollide(player,o)){
        if(saveData.equippedPet==='bouncer'&&!petShieldUsed){petShieldUsed=true;obstacles.splice(i,1);continue;}
        if(shieldActive){shieldActive=false;obstacles.splice(i,1);continue;}
        if(isBoss && saveData.upgrades.thorns>0 && thornsUsed<saveData.upgrades.thorns){thornsUsed++;obstacles.splice(i,1);continue;}
        if(playerLives>1){playerLives--;obstacles.splice(i,1);continue;}
        if(saveData.upgrades.autoShout>0 && !autoShoutUsed){autoShoutUsed=true;tryShout();obstacles.splice(i,1);continue;}
        player.alive=false;
      }
      if(o.y>H) obstacles.splice(i,1);
    }
    for(let i=orbs.length-1;i>=0;--i){
      const orb=orbs[i];
      const magnetLv = saveData.upgrades.magnet||0;
      const magnetRange = magnetLv?90+magnetLv*30:0;
      if(magnetLv && dist(player.x+player.size/2,player.y+player.size/2,orb.x+orb.size/2,orb.y+orb.size/2)<magnetRange){
        orb.x += (player.x-orb.x)*0.1*magnetLv;
        orb.y += (player.y-orb.y)*0.1*magnetLv;
      }
      if(saveData.equippedPet==='robofox'){
        const dx=(petX+22)-(orb.x+orb.size/2), dy=(petY+22)-(orb.y+orb.size/2); const d=Math.hypot(dx,dy);
        if(d<140){ orb.x += (player.x-orb.x)*0.14; orb.y += (player.y-orb.y)*0.14; }
      }
      orb.y += currentSpeed*0.85*(slowmoActive?0.7:1);
      drawNeonCircle(ctx,orb.x+orb.size/2,orb.y+orb.size/2,orb.size/2,orb.color,orb.glow);
      if(rectsCollide(player,orb,orb.size,orb.size)){
        let baseValue = 10 + 5*(saveData.upgrades.orbValue||0);
        if(orb.double) baseValue *= 2;
        if(saveData.equippedPet==='starpup') baseValue = Math.floor(baseValue*1.25);
        moneyThisRun += baseValue; score += orb.double?2:1; orbs.splice(i,1);
      } else if(orb.y>H){ orbs.splice(i,1); }
    }
    if(saveData.equippedPet){
      const pet=PETS.find(p=>p.key===saveData.equippedPet);
      petX = lerp(petX, player.x-36, 0.13); petY = lerp(petY, player.y+player.size/2, 0.13);
      pet.draw(ctx, petX+player.size/2, petY+player.size/2);
    }
    const skin = getActiveSkin();
    drawNeonRect(ctx,player.x,player.y,player.size,player.size,skin.color,skin.glow);
    if(shieldActive){
      ctx.save();
      ctx.strokeStyle='#fff'; ctx.lineWidth=5; ctx.shadowColor='#fff'; ctx.shadowBlur=10;
      ctx.strokeRect(player.x-3,player.y-3,player.size+6,player.size+6); ctx.restore();
    }
    if(playerLives>1){
      drawNeonText(ctx,`LIVES: ${playerLives}`,W-100,130,20,'#fff','#0ff8','right');
    }
    if(shoutCooldown>0) shoutCooldown=Math.max(0,shoutCooldown-1/60);
    if(dashCooldown>0) dashCooldown=Math.max(0,dashCooldown-1/60);
    if(slowmoCooldown>0) slowmoCooldown=Math.max(0,slowmoCooldown-1/60);
    if(slowmoActive){ slowmoTimer -= 1/60; if(slowmoTimer<=0){ slowmoActive=false; } }
    updatePowerBars();
    if(player.alive){
      score += 1; frame++; timeThisLevel += 1/60;
      if(!levelingUp && timeThisLevel >= (isBoss ? bossLength(bossIndex) : LEVEL_TIME)){
        if(isBoss && level===50){
          setTimeout(()=>{
            saveData.bossBeaten=true; addMoney(bossReward); showOverlay(`<h1>🏆 BOSS DEFEATED!</h1><div style="font-size:1.5em;color:#0f0;margin:1em 0;">You beat all bosses!</div><div class="money">Boss Bonus: <b>+${bossReward}</b></div><button class="button" onclick="window.showShop()">SHOP & UPGRADES</button><div class="desc">Press [Enter] or [Space] for shop</div>`); gameState='shop'; shoutBar.style.display='none';
          },1400); return;
        }
        levelingUp = true;
        setTimeout(()=>{
          level++; timeThisLevel=0; obstacles=[]; orbs=[]; levelingUp=false; bossObj=null; bossStunTime=0; petShieldUsed=false; thornsUsed=0;
        },1600);
        showLevelUpPopup((level%5===0)?'BOSS LEVEL':`LEVEL ${level}`);
      }
    } else { endGame(); return; }
    drawNeonText(ctx,`LEVEL ${level}/50`,W/2,54,32,isBoss?'#f0f':'#0ff',isBoss?'#f0f8':'#0ff8');
    const secs = Math.max(0,Math.ceil((isBoss?bossLength(bossIndex):LEVEL_TIME)-timeThisLevel));
    drawNeonText(ctx,`${isBoss?'BOSS':'TIME'}: ${secs}s`,W-100,54,22,isBoss?'#f0f':'#ff0',isBoss?'#f0f8':'#ff08','right');
    drawNeonText(ctx,`💰 ${saveData.money+moneyThisRun}`,W-70,92,23,'#ff0','#ff08','right');
    if(shieldActive) drawNeonText(ctx,'SHIELD',82,54,18,'#fff','#fff8');
    drawNeonText(ctx,`SCORE: ${score}`,W/2,H-16,22,'#0ff','#0ff8');
  } else if(gameState==='start') {
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
    shoutBar.style.display='none'; dashBar.style.display='none'; slowmoBar.style.display='none';
  }
  requestAnimationFrame(loop);
}

function lerp(a,b,t){ return a+(b-a)*t; }

window.addEventListener('keydown', e => {
  if(e.key==='ArrowLeft') input.left=true;
  if(e.key==='ArrowRight') input.right=true;
  if(e.key==='ArrowUp') input.up=true;
  if(e.key==='ArrowDown') input.down=true;
  if(gameState==='start' && (e.key===' '||e.key==='Enter')) startGame();
  if(gameState==='gameover' && (e.key===' '||e.key==='Enter')) window.showShop();
  if(gameState==='shop' && (e.key===' '||e.key==='Enter')) startGame();
  if(gameState==='playing' && e.key.toLowerCase()==='s') tryShout();
  if(gameState==='playing' && e.key.toLowerCase()==='d') tryDash();
  if(gameState==='playing' && e.key.toLowerCase()==='f') trySlowmo();
});
window.addEventListener('keyup', e => {
  if(e.key==='ArrowLeft') input.left=false;
  if(e.key==='ArrowRight') input.right=false;
  if(e.key==='ArrowUp') input.up=false;
  if(e.key==='ArrowDown') input.down=false;
});

export { tryShout, tryDash, trySlowmo };

requestAnimationFrame(loop);
