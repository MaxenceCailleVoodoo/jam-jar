/** Shared watercolor-doodle look (title + game). */
export const DOODLE_PALETTE = {
  paper: '#f5efde',
  paperDark: '#e8dcc0',
  ink: '#1a1410',
  uiText: '#2a1810',
  uiAccent: '#cc2244',
  toast: '#e8b860',
  crust: '#7a4818',
};

export const DOODLE_FONT = 'Arial, Helvetica, sans-serif';

/** Résolution texte = DPR × zoom FIT pour éviter le flou. */
export function textResolution(scene) {
  const canvas = scene?.game?.canvas;
  const gameW = scene?.scale?.gameSize?.width ?? 1280;
  const fitScale = canvas?.clientWidth ? canvas.clientWidth / gameW : 1;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(Math.ceil(dpr * fitScale * 1.25), 4);
}

/** Texte net sur canvas redimensionné (pas de scale sur le GameObject). */
export function crispDoodleText(scene, x, y, text, style = {}) {
  const resolution = textResolution(scene);
  const t = scene.add.text(Math.round(x), Math.round(y), text, {
    fontFamily: DOODLE_FONT,
    ...style,
  });
  if (typeof t.setResolution === 'function') t.setResolution(resolution);
  if (typeof t.setPadding === 'function') t.setPadding(6, 6, 6, 6);
  return t;
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { canvas: c, ctx: c.getContext('2d') };
}

export function buildPaperTexture(scene, key) {
  if (scene.textures.exists(key)) return;
  const W = 256;
  const H = 256;
  const { canvas, ctx } = makeCanvas(W, H);
  ctx.fillStyle = DOODLE_PALETTE.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(150, 120, 80, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 90; i++) {
    ctx.beginPath();
    const x1 = Math.random() * W;
    const y1 = Math.random() * H;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (Math.random() - 0.5) * 30, y1 + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(120, 90, 60, 0.06)';
  for (let i = 0; i < 120; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  scene.textures.addCanvas(key, canvas);
}

export function drawInkFrame(g, width, height, margin = 18) {
  g.lineStyle(6, 0x2a1810, 0.85);
  g.beginPath();
  g.moveTo(margin, margin);
  g.lineTo(width - margin, margin + 4);
  g.lineTo(width - margin - 4, height - margin);
  g.lineTo(margin + 2, height - margin - 2);
  g.lineTo(margin, margin + 2);
  g.strokePath();
}
