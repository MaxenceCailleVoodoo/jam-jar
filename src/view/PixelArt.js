/** Procedural pixel-art textures — no external assets. */

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx };
}

function drawJar(ctx, cracks = 0) {
  px(ctx, 16, 4, 32, 8, '#cc3333');
  px(ctx, 20, 0, 24, 6, '#aa2222');
  px(ctx, 14, 12, 36, 40, '#ff6688');
  px(ctx, 18, 16, 28, 32, '#ff4466');
  px(ctx, 20, 20, 24, 24, '#ff2244');
  px(ctx, 22, 22, 8, 8, '#ff8899');
  px(ctx, 38, 28, 4, 12, '#ff5577');
  px(ctx, 20, 30, 24, 10, '#ffe066');
  px(ctx, 22, 32, 20, 6, '#ffffff');

  if (cracks >= 1) {
    px(ctx, 28, 18, 2, 14, '#ffffff');
    px(ctx, 30, 26, 8, 2, '#ffffff');
    px(ctx, 24, 34, 2, 10, '#cccccc');
  }
  if (cracks >= 2) {
    px(ctx, 34, 14, 2, 20, '#ffffff');
    px(ctx, 20, 40, 16, 2, '#ffffff');
    px(ctx, 36, 36, 2, 12, '#dddddd');
    px(ctx, 18, 22, 10, 2, '#eeeeee');
    px(ctx, 26, 48, 4, 6, '#ff0033');
    px(ctx, 30, 50, 2, 4, '#cc0022');
  }
  if (cracks >= 3) {
    px(ctx, 16, 20, 32, 2, '#ffffff');
    px(ctx, 32, 16, 2, 28, '#ffffff');
    px(ctx, 14, 44, 36, 4, '#aa1133');
    px(ctx, 22, 52, 8, 4, '#ff0033');
    px(ctx, 34, 50, 6, 6, '#ff0033');
  }
}

function drawBread(ctx, variant = 0) {
  const crust = variant % 2 === 0 ? '#c4883a' : '#a86e28';
  px(ctx, 8, 12, 32, 28, crust);
  px(ctx, 12, 16, 24, 20, '#f5deb3');
  px(ctx, 10, 14, 4, 24, '#8b5a2b');
  px(ctx, 16, 20, 4, 4, '#222222');
  px(ctx, 28, 20, 4, 4, '#222222');
  px(ctx, 17, 21, 2, 2, '#ffffff');
  px(ctx, 29, 21, 2, 2, '#ffffff');
  px(ctx, 18, 30, 12, 2, '#222222');
}

function drawNutella(ctx) {
  px(ctx, 20, 8, 56, 12, '#ffffff');
  px(ctx, 24, 0, 48, 10, '#cc3333');
  px(ctx, 16, 20, 64, 64, '#3d2314');
  px(ctx, 20, 24, 56, 56, '#5c3a1e');
  px(ctx, 24, 28, 48, 44, '#4a2810');
  px(ctx, 28, 36, 40, 24, '#ffffff');
  px(ctx, 32, 40, 32, 16, '#3d2314');
  px(ctx, 36, 42, 8, 12, '#ffffff');
  px(ctx, 48, 42, 4, 12, '#ffffff');
  px(ctx, 52, 42, 8, 12, '#ffffff');
  px(ctx, 32, 52, 8, 8, '#ffffff');
  px(ctx, 56, 52, 8, 8, '#ffffff');
  px(ctx, 34, 54, 4, 4, '#ff0000');
  px(ctx, 58, 54, 4, 4, '#ff0000');
}

function drawJamBlob(ctx) {
  px(ctx, 4, 4, 8, 8, '#ff0033');
  px(ctx, 6, 2, 4, 2, '#ff3355');
  px(ctx, 2, 6, 2, 4, '#cc0022');
}

function drawFloor(ctx) {
  px(ctx, 0, 0, 64, 64, '#2a1f14');
  for (let y = 0; y < 64; y += 16) {
    for (let x = 0; x < 64; x += 16) {
      px(ctx, x, y, 14, 14, (x + y) % 32 === 0 ? '#3d2e1a' : '#332618');
    }
  }
}

export function registerPixelTextures(scene) {
  for (let stage = 0; stage <= 3; stage++) {
    const { canvas, ctx } = makeCanvas(64, 64);
    drawJar(ctx, 3 - stage);
    scene.textures.addCanvas(`jar-${stage}`, canvas);
  }

  for (let v = 0; v < 3; v++) {
    const { canvas, ctx } = makeCanvas(48, 48);
    drawBread(ctx, v);
    scene.textures.addCanvas(`bread-${v}`, canvas);
  }

  {
    const { canvas, ctx } = makeCanvas(96, 96);
    drawNutella(ctx);
    scene.textures.addCanvas('nutella-boss', canvas);
  }

  {
    const { canvas, ctx } = makeCanvas(16, 16);
    drawJamBlob(ctx);
    scene.textures.addCanvas('jam-blob', canvas);
  }

  {
    const { canvas, ctx } = makeCanvas(64, 64);
    drawFloor(ctx);
    scene.textures.addCanvas('floor-tile', canvas);
  }
}

export function jarTextureForLives(lives, maxLives = 3) {
  return `jar-${Math.max(0, Math.min(maxLives, lives))}`;
}
