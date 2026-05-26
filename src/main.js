import Phaser from 'phaser';
import { BootScene } from './view/BootScene.js';
import { StylePickerScene } from './view/StylePickerScene.js';
import { StyleJuicyScene } from './view/styles/StyleJuicy.js';
import { StyleNeonLiquidScene } from './view/styles/StyleNeonLiquid.js';
import { StyleDoodleScene } from './view/styles/StyleDoodle.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a14',
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
  scene: [
    BootScene,
    StylePickerScene,
    StyleJuicyScene,
    StyleNeonLiquidScene,
    StyleDoodleScene,
  ],
});
