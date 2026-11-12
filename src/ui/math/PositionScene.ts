import Phaser from 'phaser';
import { Color, Stroke } from '../theme';

type Place = 'over' | 'under' | 'front' | 'behind' | 'next';

/**
 * Lagewörter: ein Tisch und ein Schmetterling über, unter, vor, hinter oder neben dem Tisch.
 * „Hinter“ ist teilweise vom Tisch verdeckt, „vor“ verdeckt den Tisch und steht tiefer.
 */
export class PositionScene extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, place: Place) {
    super(scene, x, y);
    const table = scene.add.graphics();
    // Tischplatte und Beine
    table.fillStyle(Color.erde, 1);
    table.lineStyle(Stroke.outline, Color.kontur, 1);
    table.fillRect(-110, 10, 16, 90);
    table.strokeRect(-110, 10, 16, 90);
    table.fillRect(94, 10, 16, 90);
    table.strokeRect(94, 10, 16, 90);
    table.fillRoundedRect(-140, -12, 280, 26, 6);
    table.strokeRoundedRect(-140, -12, 280, 26, 6);
    const floor = scene.add.graphics();
    floor.lineStyle(Stroke.inner, Color.kontur, 0.5);
    floor.lineBetween(-260, 100, 260, 100);

    const pos: Record<Place, [number, number, number]> = {
      over: [0, -115, 1],
      under: [0, 62, 0.8],
      front: [-30, 70, 1.25],
      behind: [40, 2, 0.75],
      next: [215, 52, 1],
    };
    const [bx, by, scale] = pos[place];
    const fly = butterfly(scene, bx, by, scale);
    // „hinter“: Schmetterling zuerst zeichnen, damit der Tisch ihn teilweise verdeckt
    if (place === 'behind') this.add([floor, fly, table]);
    else this.add([floor, table, fly]);
    this.add(scene.add.zone(0, 0, 540, 260));
    scene.add.existing(this);
  }
}

function butterfly(scene: Phaser.Scene, x: number, y: number, scale: number) {
  const g = scene.add.graphics({ x, y });
  g.setScale(scale);
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  g.fillStyle(Color.rosa, 1);
  g.fillEllipse(-20, -12, 38, 30);
  g.strokeEllipse(-20, -12, 38, 30);
  g.fillEllipse(20, -12, 38, 30);
  g.strokeEllipse(20, -12, 38, 30);
  g.fillStyle(Color.orange, 1);
  g.fillEllipse(-15, 14, 26, 22);
  g.strokeEllipse(-15, 14, 26, 22);
  g.fillEllipse(15, 14, 26, 22);
  g.strokeEllipse(15, 14, 26, 22);
  g.fillStyle(Color.erde, 1);
  g.fillRoundedRect(-5, -26, 10, 52, 5);
  g.strokeRoundedRect(-5, -26, 10, 52, 5);
  g.lineBetween(-2, -26, -10, -40);
  g.lineBetween(2, -26, 10, -40);
  return g;
}
