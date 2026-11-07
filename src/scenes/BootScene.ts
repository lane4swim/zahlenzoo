import Phaser from 'phaser';

/** Startszene; lädt später Assets und Daten. Zeigt vorerst nur einen Platzhalter. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Zahlen-Zoo', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#4a3426',
      })
      .setOrigin(0.5);
  }
}
