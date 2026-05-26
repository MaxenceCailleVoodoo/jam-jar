export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.audio('bgm', 'assets/audio/techno-bgm.mp3');
  }

  create() {
    this.scene.start('StylePickerScene');
  }
}
