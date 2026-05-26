import Phaser from 'phaser';
import { BootScene } from './view/BootScene.js';
import { StylePickerScene } from './view/StylePickerScene.js';
import { StyleACartoonScene } from './view/styles/StyleACartoon.js';
import { StyleBNoirScene } from './view/styles/StyleBNoir.js';
import { StyleCNeonScene } from './view/styles/StyleCNeon.js';
import { MainMenuScene } from './view/MainMenuScene.js';
import { GameScene } from './view/GameScene.js';
import { HUDScene } from './view/HUDScene.js';
import { GameOverScene } from './view/GameOverScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#06030a',
  pixelArt: true,
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
    StyleACartoonScene,
    StyleBNoirScene,
    StyleCNeonScene,
    MainMenuScene,
    GameScene,
    HUDScene,
    GameOverScene,
  ],
});
