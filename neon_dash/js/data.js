export const SKINS = [
  { key: "cyan", name: "Cyan", color: "#0ff", glow: "#0ff8", price: 0 },
  { key: "red",  name: "Red", color: "#f33", glow: "#f338", price: 150 },
  { key: "green", name: "Green", color: "#3f3", glow: "#3f38", price: 150 },
  { key: "yellow",name: "Yellow", color: "#ff0", glow: "#ff08", price: 250 },
  { key: "purple",name: "Purple", color: "#a3f", glow: "#a3f8", price: 350 },
  { key: "rainbow", name: "Rainbow", color: "rainbow", glow: "#fff8", price: 800 }
];

export const UPGRADES = [
  { key: "speed", name: "Move Speed", desc: "+1 max speed per level", price: [120,220,370], maxLevel: 3 },
  { key: "orbValue", name: "Orb Value", desc: "+5 money per orb per level", price: [100,180,300], maxLevel: 3 },
  { key: "shield", name: "Shield", desc: "Start with a shield (1 hit)", price: [240], maxLevel: 1 },
  { key: "magnet", name: "Magnet", desc: "Orbs attract toward you", price: [300,500], maxLevel: 2 },
  { key: "doubleOrb", name: "Double Orb", desc: "10-20% chance for double orbs", price: [220,350], maxLevel: 2 },
  { key: "hyperDash", name: "Dash", desc: "Unlock dash ability [D]", price: [350,500,650], maxLevel: 3 },
  { key: "slowmo", name: "Slowmo", desc: "Unlock slow motion [F]", price: [400,600,800], maxLevel: 3 },
  { key: "autoShout", name: "Auto-Shout", desc: "Auto SHOUT on first hit", price: [600], maxLevel: 1 },
  { key: "thorns", name: "Thorns", desc: "Reflects 1 boss projectile per boss", price: [500,700], maxLevel: 2 },
  { key: "extraLife", name: "Extra Life", desc: "1 extra life per run", price: [850], maxLevel: 1 },
  { key: "shoutPower", name: "Shout+", desc: "Shout clears projectiles/boss longer", price: [400,750,1100], maxLevel: 3 }
];

export const PETS = [
  {
    key: "robofox", name: "RoboFox", price: 400,
    desc: "Auto-collects nearby orbs (magnet)",
    draw: (ctx, x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, 2*Math.PI); ctx.fillStyle = "#fdc"; ctx.fill();
      ctx.beginPath();
      ctx.arc(6,-2,7,Math.PI*0.9,Math.PI*1.9); ctx.fillStyle="#e84"; ctx.fill();
      ctx.beginPath();
      ctx.arc(-6,-2,7,Math.PI*1.1,Math.PI*2.1); ctx.fillStyle="#e84"; ctx.fill();
      ctx.fillStyle="#222"; ctx.fillRect(-6,-2,12,6);
      ctx.beginPath(); ctx.arc(-4,0,2,0,2*Math.PI); ctx.arc(4,0,2,0,2*Math.PI); ctx.fillStyle="#000"; ctx.fill();
      ctx.restore();
    }
  },
  {
    key: "bouncer", name: "Bouncer", price: 500,
    desc: "Blocks 1 hit every level (shield)",
    draw: (ctx, x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0,0,14,0,2*Math.PI); ctx.fillStyle="#acf"; ctx.fill();
      ctx.beginPath();
      ctx.arc(0,-10,7,Math.PI,0); ctx.fillStyle="#fff"; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0,5,4,0,2*Math.PI); ctx.fillStyle="#58e"; ctx.fill();
      ctx.restore();
    }
  },
  {
    key: "starpup", name: "Starpup", price: 600,
    desc: "+25% coins from orbs",
    draw: (ctx, x, y) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI/10);
      ctx.fillStyle = "#ff8";
      for(let i=0;i<5;i++){
        ctx.beginPath();
        ctx.moveTo(0,-14);
        for(let j=1;j<=5;j++){
          let angle = Math.PI*2*j/5 + i*2*Math.PI/5;
          let r = j%2===0?6:14;
          ctx.lineTo(Math.sin(angle)*r,-Math.cos(angle)*r);
        }
        ctx.fill();
        ctx.rotate(Math.PI/5);
      }
      ctx.restore();
    }
  }
];

export const defaultSave = {
  money: 0,
  highScore: 0,
  unlockedSkins: { cyan: true },
  equippedSkin: "cyan",
  upgrades: {},
  pets: { robofox:false, bouncer:false, starpup:false },
  equippedPet: null,
  bossBeaten: false
};
for (const u of UPGRADES) defaultSave.upgrades[u.key] = 0;

export let saveData = null;

export function loadSave(){
  try {
    const data = JSON.parse(localStorage.getItem("neonDashSave") || "null");
    if(!data) throw new Error("No data");
    for(const k in defaultSave) if(!(k in data)) data[k] = defaultSave[k];
    for(const k in defaultSave.upgrades) if(!(k in data.upgrades)) data.upgrades[k] = 0;
    for(const s of SKINS) if(!(s.key in data.unlockedSkins)) data.unlockedSkins[s.key] = false;
    for(const p of PETS) if(!(p.key in data.pets)) data.pets[p.key] = false;
    saveData = data;
  } catch(e){
    saveData = JSON.parse(JSON.stringify(defaultSave));
  }
}

export function saveGame(){
  localStorage.setItem("neonDashSave", JSON.stringify(saveData));
}

export function addMoney(amount){
  saveData.money += amount;
  saveGame();
}

export function setHighScore(score){
  if(score > saveData.highScore){
    saveData.highScore = score;
    saveGame();
  }
}

loadSave();
