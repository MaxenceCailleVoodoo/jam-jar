/** Procedural pixel-art — shared jam jar base + per-character face & color. */

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

function drawJarBody(ctx, colors, cracks = 0) {
  px(ctx, 16, 4, 32, 8, colors.lid);
  px(ctx, 20, 0, 24, 6, colors.lidDark);
  px(ctx, 14, 12, 36, 40, colors.outer);
  px(ctx, 18, 16, 28, 32, colors.mid);
  px(ctx, 20, 20, 24, 24, colors.inner);
  px(ctx, 22, 22, 8, 8, colors.shine);
  px(ctx, 38, 28, 4, 12, colors.deep);

  if (cracks >= 1) {
    px(ctx, 28, 18, 2, 14, '#ffffff');
    px(ctx, 30, 26, 8, 2, '#ffffff');
    px(ctx, 24, 34, 2, 10, '#cccccc');
  }
  if (cracks >= 2) {
    px(ctx, 34, 14, 2, 20, '#ffffff');
    px(ctx, 20, 40, 16, 2, '#ffffff');
    px(ctx, 36, 36, 2, 12, '#dddddd');
    px(ctx, 26, 48, 4, 6, colors.blob);
    px(ctx, 30, 50, 2, 4, colors.inner);
  }
  if (cracks >= 3) {
    px(ctx, 16, 20, 32, 2, '#ffffff');
    px(ctx, 32, 16, 2, 28, '#ffffff');
    px(ctx, 14, 44, 36, 4, colors.inner);
    px(ctx, 22, 52, 8, 4, colors.blob);
    px(ctx, 34, 50, 6, 6, colors.blob);
  }
}

function drawFacePlate(ctx, faceCanvas) {
  ctx.drawImage(faceCanvas, 20, 6, 24, 24);
}

function pixelizePhoto(scene, textureKey, size = 24) {
  const tex = scene.textures.get(textureKey);
  const img = tex.getSourceImage();
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, size, size);
  return canvas;
}

function drawProceduralFace(ctx, type) {
  ctx.clearRect(0, 0, 24, 24);

  if (type === 'pauline') {
    px(ctx, 4, 2, 16, 8, '#662244');
    px(ctx, 6, 10, 12, 10, '#ffddcc');
    px(ctx, 8, 14, 3, 3, '#222222');
    px(ctx, 14, 14, 3, 3, '#222222');
    px(ctx, 10, 19, 4, 2, '#cc6677');
  } else if (type === 'lucas') {
    px(ctx, 5, 2, 14, 5, '#332211');
    px(ctx, 6, 10, 12, 10, '#e8c4a0');
    px(ctx, 8, 14, 3, 3, '#222222');
    px(ctx, 14, 14, 3, 3, '#222222');
    px(ctx, 9, 18, 6, 2, '#886644');
    px(ctx, 8, 20, 8, 3, '#554433');
  } else if (type === 'sophie') {
    px(ctx, 4, 1, 16, 9, '#ffcc44');
    px(ctx, 6, 10, 12, 10, '#ffe8d0');
    px(ctx, 8, 14, 3, 3, '#224422');
    px(ctx, 14, 14, 3, 3, '#224422');
    px(ctx, 10, 19, 4, 2, '#ff6688');
  }
}

function buildFaceCanvas(scene, character) {
  if (character.faceSource && scene.textures.exists(`face-src-${character.id}`)) {
    return pixelizePhoto(scene, `face-src-${character.id}`, 24);
  }
  const { canvas, ctx } = makeCanvas(24, 24);
  drawProceduralFace(ctx, character.faceType ?? 'pauline');
  return canvas;
}

function drawCharacterJar(ctx, faceCanvas, colors, cracks) {
  drawJarBody(ctx, colors, cracks);
  drawFacePlate(ctx, faceCanvas);
}

function drawJamBlob(ctx, colors) {
  px(ctx, 4, 4, 8, 8, colors.blob);
  px(ctx, 6, 2, 4, 2, colors.blobLight);
  px(ctx, 2, 6, 2, 4, colors.inner);
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

function drawFloor(ctx) {
  px(ctx, 0, 0, 64, 64, '#2a1f14');
  for (let y = 0; y < 64; y += 16) {
    for (let x = 0; x < 64; x += 16) {
      px(ctx, x, y, 14, 14, (x + y) % 32 === 0 ? '#3d2e1a' : '#332618');
    }
  }
}

export function registerPixelTextures(scene, characters) {
  for (const char of characters) {
    const colors = {
      ...char.jam,
      lid: char.lid,
      lidDark: char.lidDark,
    };
    const faceCanvas = buildFaceCanvas(scene, char);

    for (let stage = 0; stage <= 3; stage++) {
      const { canvas, ctx } = makeCanvas(64, 64);
      drawCharacterJar(ctx, faceCanvas, colors, 3 - stage);
      scene.textures.addCanvas(`jar-${char.id}-${stage}`, canvas);
    }

    const blob = makeCanvas(16, 16);
    drawJamBlob(blob.ctx, colors);
    scene.textures.addCanvas(`jam-blob-${char.id}`, blob.canvas);
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
    const { canvas, ctx } = makeCanvas(64, 64);
    drawFloor(ctx);
    scene.textures.addCanvas('floor-tile', canvas);
  }
}

export function jarTextureForLives(lives, characterId = 'maxence', maxLives = 3) {
  return `jar-${characterId}-${Math.max(0, Math.min(maxLives, lives))}`;
}

export function jamBlobTexture(characterId = 'maxence') {
  return `jam-blob-${characterId}`;
}

export function previewJarTexture(characterId = 'maxence') {
  return `jar-${characterId}-3`;
}
