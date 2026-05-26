import Phaser from 'phaser';
import { BootScene } from './view/BootScene.js';
import { MainMenuScene } from './view/MainMenuScene.js';
import { GameScene } from './view/GameScene.js';
import { HUDScene } from './view/HUDScene.js';
import { GameOverScene } from './view/GameOverScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1208',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, MainMenuScene, GameScene, HUDScene, GameOverScene],
});
