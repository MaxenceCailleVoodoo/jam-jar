export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.audio('bgm', 'assets/audio/techno-bgm.mp3');
    this.load.audio('jam-explosion', 'assets/audio/jam-explosion.wav');
  }

  create() {
    this.scene.start('StyleDoodle');
  }
}
