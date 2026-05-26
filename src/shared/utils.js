export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function randomEdge(width, height, margin = 40) {
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0:
      return { x: Math.random() * width, y: -margin };
    case 1:
      return { x: width + margin, y: Math.random() * height };
    case 2:
      return { x: Math.random() * width, y: height + margin };
    default:
      return { x: -margin, y: Math.random() * height };
  }
}

export function clampToScreen(x, y, width, height, margin = 20) {
  return {
    x: clamp(x, margin, width - margin),
    y: clamp(y, margin, height - margin),
  };
}

export function formatScore(score) {
  return String(score).padStart(6, '0');
}
