export function drawPlayerStick(g, angle = 0) {
  g.clear();
  g.lineStyle(3, 0xffffff, 1);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, 14);

  const armLen = 18;
  g.lineBetween(-armLen * sin, armLen * cos, armLen * sin, -armLen * cos);

  const legLen = 16;
  g.lineBetween(0, 8, -8, 8 + legLen);
  g.lineBetween(0, 8, 8, 8 + legLen);

  const gunLen = 22;
  g.lineStyle(4, 0xffe066, 1);
  g.lineBetween(0, 0, cos * gunLen, sin * gunLen);
}

export function drawZombieStick(g, wobble = 0) {
  g.clear();

  g.fillStyle(0xff4444, 1);
  g.fillCircle(0, 0, 14);

  g.fillStyle(0xffffff, 1);
  g.fillCircle(-5, -3, 4);
  g.fillCircle(5, -3, 4);
  g.fillStyle(0x111111, 1);
  g.fillCircle(-5 + wobble, -3, 2);
  g.fillCircle(5 - wobble, -3, 2);

  g.lineStyle(2, 0xcc2222, 1);
  const legWobble = Math.sin(wobble * 3) * 4;
  g.lineBetween(0, 10, -6 + legWobble, 24);
  g.lineBetween(0, 10, 6 - legWobble, 24);
}
