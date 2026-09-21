import Phaser from 'phaser';

const INK = 0x302631;

export type CharacterPose = 'idle' | 'walk' | 'search' | 'hold' | 'checkout';

type CharacterPalette = {
  skin: number;
  clothes: number;
  hair: number;
  cheeks: number;
};

export class PaperCharacter {
  readonly root: Phaser.GameObjects.Container;
  private readonly figure: Phaser.GameObjects.Container;
  private readonly limbs: Phaser.GameObjects.Graphics;
  private readonly face: Phaser.GameObjects.Graphics;
  private pose: CharacterPose = 'idle';
  private stride = 0;
  private baseY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly palette: CharacterPalette,
    scale = 1,
  ) {
    this.baseY = y;
    this.limbs = scene.add.graphics();

    const body = scene.add.triangle(0, -39, 0, 0, -23, 43, 23, 43, palette.clothes, 1)
      .setStrokeStyle(3, INK, 1);
    const hair = scene.add.circle(0, -82, 24, palette.hair, 1).setStrokeStyle(3, INK, 1);
    const leftEar = scene.add.circle(-21, -78, 6, palette.skin, 1).setStrokeStyle(2, INK, 1);
    const rightEar = scene.add.circle(21, -78, 6, palette.skin, 1).setStrokeStyle(2, INK, 1);
    const head = scene.add.circle(0, -78, 22, palette.skin, 1).setStrokeStyle(3, INK, 1);
    const fringe = scene.add.graphics();
    fringe.fillStyle(palette.hair, 1);
    fringe.beginPath();
    fringe.moveTo(-20, -88);
    fringe.lineTo(-10, -99);
    fringe.lineTo(2, -96);
    fringe.lineTo(12, -100);
    fringe.lineTo(20, -88);
    fringe.lineTo(18, -94);
    fringe.lineTo(-18, -95);
    fringe.closePath();
    fringe.fillPath();

    this.face = scene.add.graphics();
    this.figure = scene.add.container(0, 0, [this.limbs, body, hair, leftEar, rightEar, head, fringe, this.face]);
    this.root = scene.add.container(x, y, [this.figure]).setScale(scale).setDepth(3);
    this.redraw(0);
  }

  setPosition(x: number, y = this.baseY) {
    this.root.x = x;
    this.baseY = y;
  }

  setPose(pose: CharacterPose) {
    this.pose = pose;
  }

  setFacing(direction: -1 | 1) {
    this.figure.scaleX = direction;
  }

  setVisible(visible: boolean) {
    this.root.setVisible(visible);
  }

  update(delta: number) {
    const walking = this.pose === 'walk';
    this.stride += delta * (walking ? 0.014 : 0.003);
    const step = walking ? Math.sin(this.stride) : 0;
    this.root.y = this.baseY - (walking ? Math.abs(Math.sin(this.stride * 2)) * 2 : Math.sin(this.stride) * 0.7);
    this.redraw(step);
  }

  private redraw(step: number) {
    this.limbs.clear();
    this.limbs.lineStyle(5, INK, 1);

    const leftFoot = -12 + step * 9;
    const rightFoot = 12 - step * 9;
    this.limbs.beginPath();
    this.limbs.moveTo(-7, -19);
    this.limbs.lineTo(leftFoot, 0);
    this.limbs.moveTo(7, -19);
    this.limbs.lineTo(rightFoot, 0);

    const armSwing = step * 8;
    this.limbs.moveTo(-12, -51);
    this.limbs.lineTo(-25 - armSwing, -31);
    this.limbs.moveTo(12, -51);
    if (this.pose === 'search') {
      this.limbs.lineTo(39, -61);
      this.limbs.lineTo(45, -69);
    } else if (this.pose === 'hold') {
      this.limbs.lineTo(30, -37);
      this.limbs.lineTo(15, -30);
    } else if (this.pose === 'checkout') {
      this.limbs.lineTo(37, -48);
    } else {
      this.limbs.lineTo(25 + armSwing, -31);
    }
    this.limbs.strokePath();

    this.face.clear();
    this.face.fillStyle(INK, 1);
    const gaze = this.pose === 'search' ? 2 : 0;
    this.face.fillCircle(-8 + gaze, -80, 2.4);
    this.face.fillCircle(8 + gaze, -80, 2.4);
    this.face.lineStyle(2, INK, 1);
    this.face.beginPath();
    this.face.arc(0, -73, 7, 0.2, Math.PI - 0.2);
    this.face.strokePath();
    this.face.fillStyle(this.palette.cheeks, 0.8);
    this.face.fillCircle(-14, -72, 3);
    this.face.fillCircle(14, -72, 3);
  }
}
