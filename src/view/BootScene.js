import { CHARACTERS } from '../model/CharacterConfig.js';
import { registerPixelTextures } from './PixelArt.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    for (const char of CHARACTERS) {
      if (char.faceSource) {
        this.load.image(`face-src-${char.id}`, char.faceSource);
      }
    }
  }

  create() {
    registerPixelTextures(this, CHARACTERS);
    this.scene.start('MainMenuScene');
  }
}
