function drawNeonRect(ctx, x, y, w, h, color, glow){
  ctx.save();
  if(color === "rainbow"){
    const grad = ctx.createLinearGradient(x, y, x+w, y+h);
    grad.addColorStop(0, "#0ff");
    grad.addColorStop(0.2, "#ff0");
    grad.addColorStop(0.4, "#f0f");
    grad.addColorStop(0.6, "#0f0");
    grad.addColorStop(0.8, "#f33");
    grad.addColorStop(1, "#fff");
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = color;
  }
  ctx.shadowColor = glow;
  ctx.shadowBlur = 24;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawNeonCircle(ctx, x, y, r, color, glow){
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawNeonText(ctx, txt, x, y, size, color, glow, align='center'){
  ctx.save();
  ctx.font = `bold ${size}px Segoe UI, Arial, sans-serif`;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 20;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
  ctx.restore();
}
