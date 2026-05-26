import Phaser from 'phaser';
import { BootScene } from './view/BootScene.js';
import { TitleScene } from './view/TitleScene.js';
import { StyleDoodleScene } from './view/styles/StyleDoodle.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#f5efde',
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, TitleScene, StyleDoodleScene],
});
