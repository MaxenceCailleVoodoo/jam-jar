export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.audio('bgm', 'assets/audio/techno-bgm.mp3');
    this.load.audio('jam-explosion', 'assets/audio/jam-explosion.mp3');
    this.load.image('toast-slice', 'assets/toast-slice.png');
  }

  create() {
    document.fonts?.ready.then(() => this.scene.start('TitleScene'));
  }
}
