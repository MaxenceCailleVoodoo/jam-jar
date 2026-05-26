import { registerPixelTextures } from './PixelArt.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    registerPixelTextures(this);
    this.scene.start('MainMenuScene');
  }
}
