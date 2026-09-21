import Phaser from 'phaser';
import { startingBooks } from '../game/catalog';
import type { Book } from '../game/types';
import { PaperCharacter } from './PaperCharacter';

const INK = 0x302631;
const PAPER = 0xffffff;
const BOOK_WIDTH = 92;
const BOOK_HEIGHT = 22;
const SHELF_FIRST_X = 410;
const SHELF_PITCH = BOOK_HEIGHT;
const SHELF_CAPACITY = 11;
const SHELF_ROWS = [
  { top: 164, bottom: 281, y: 233 },
  { top: 281, bottom: 392, y: 344 },
  { top: 392, bottom: 505, y: 457 },
];

type BookVisual = {
  data: Book;
  sprite: Phaser.Physics.Matter.Image;
  title: Phaser.GameObjects.Text;
  row: number | null;
  column: number | null;
  shelfAngle: number;
  shelfTargetAngle: number;
  shelfBaseX: number;
  shelfBoardY: number;
  titleScale: number;
};

type ShelfTarget = { row: number; index: number };
type CustomerPhase = 'waiting' | 'entering' | 'searching' | 'checkout-walk' | 'checkout' | 'leaving' | 'done';

export class BookstoreScene extends Phaser.Scene {
  private books = new Map<string, BookVisual>();
  private shelfRows: Array<Array<string | null>> = Array.from(
    { length: SHELF_ROWS.length },
    () => Array<string | null>(SHELF_CAPACITY).fill(null),
  );
  private shelfGuide!: Phaser.GameObjects.Graphics;
  private activeDrag: string | null = null;
  private pointerDown = new Map<string, { x: number; y: number; time: number }>();
  private lastTap = new Map<string, number>();
  private coverLayer: Phaser.GameObjects.Container | null = null;
  private clerk!: PaperCharacter;
  private visitor!: PaperCharacter;
  private customerPhase: CustomerPhase = 'waiting';
  private customerPhaseTime = 0;
  private customerTargetId: string | null = null;
  private carriedBookId: string | null = null;
  private checkoutMarks!: Phaser.GameObjects.Graphics;

  constructor() {
    super('bookstore');
  }

  create() {
    this.cameras.main.setBackgroundColor(PAPER);
    this.drawRoom();
    this.shelfGuide = this.add.graphics().setDepth(19);
    this.createBoundaries();
    this.createBooks();
    this.createCharacters();
    this.bindInput();
    this.input.keyboard?.on('keydown-ESC', () => this.closeCover());
  }

  update(_time: number, delta: number) {
    this.updateShelfPhysics(delta);
    this.updateCharacters(delta);
    this.books.forEach(book => {
      book.title.setPosition(book.sprite.x, book.sprite.y);
      book.title.setRotation(book.sprite.rotation);
      book.title.setDepth(book.sprite.depth + 1);
    });
  }

  private drawRoom() {
    const ink = this.add.graphics();
    ink.setDepth(0);
    ink.lineStyle(7, INK, 1);

    ink.strokeRect(132, 116, 736, 407);

    ink.lineStyle(8, INK, 1);
    ink.beginPath();
    ink.moveTo(0, 523);
    ink.lineTo(220, 524);
    ink.lineTo(410, 518);
    ink.lineTo(570, 511);
    ink.lineTo(742, 504);
    ink.lineTo(865, 505);
    ink.lineTo(1000, 505);
    ink.strokePath();

    this.drawCounter(ink);
    this.drawShelf(ink);
    this.drawDoor(ink);
  }

  private drawCounter(ink: Phaser.GameObjects.Graphics) {
    ink.lineStyle(6, INK, 1);
    ink.strokeRect(184, 390, 126, 121);
    ink.beginPath();
    ink.moveTo(172, 390);
    ink.lineTo(319, 390);
    ink.strokePath();

    ink.beginPath();
    ink.moveTo(252, 390);
    ink.lineTo(259, 359);
    ink.lineTo(299, 359);
    ink.lineTo(305, 390);
    ink.closePath();
    ink.strokePath();
    ink.strokeRect(263, 366, 31, 11);
  }

  private drawShelf(ink: Phaser.GameObjects.Graphics) {
    ink.lineStyle(7, INK, 1);
    ink.strokeRect(385, 164, 250, 342);
    [281, 392, 505].forEach(y => {
      ink.beginPath();
      ink.moveTo(380, y);
      ink.lineTo(640, y);
      ink.strokePath();
    });
    ink.beginPath();
    ink.moveTo(402, 506);
    ink.lineTo(402, 523);
    ink.moveTo(620, 506);
    ink.lineTo(620, 523);
    ink.strokePath();
  }

  private drawDoor(ink: Phaser.GameObjects.Graphics) {
    ink.fillStyle(PAPER, 1);
    ink.fillRect(863, 347, 14, 178);
    ink.lineStyle(7, INK, 1);
    ink.beginPath();
    ink.moveTo(868, 347);
    ink.lineTo(817, 347);
    ink.lineTo(817, 523);
    ink.strokePath();
    ink.fillStyle(INK, 1);
    ink.fillCircle(829, 432, 4);
  }

  private createBoundaries() {
    const wallOptions = { isStatic: true, friction: 0.9, restitution: 0.08, render: { visible: false } };
    this.matter.add.rectangle(500, 532, 1000, 20, wallOptions);
    this.matter.add.rectangle(500, 106, 736, 20, wallOptions);
    this.matter.add.rectangle(122, 325, 20, 420, wallOptions);
    this.matter.add.rectangle(878, 325, 20, 420, wallOptions);
  }

  private createBooks() {
    startingBooks.forEach((book, index) => {
      const key = `book-${book.id}`;
      this.createBookTexture(key, Phaser.Display.Color.HexStringToColor(book.cover).color);
      const sprite = this.matter.add.image(
        430 + (index % 4) * 42,
        350 - Math.floor(index / 4) * 34,
        key,
        undefined,
        {
          shape: { type: 'rectangle', width: BOOK_WIDTH, height: BOOK_HEIGHT },
          density: 0.0025,
          friction: 0.82,
          frictionStatic: 1.1,
          frictionAir: 0.012,
          restitution: 0.08,
          chamfer: { radius: 2 },
        },
      );
      sprite.setAngle([-7, 4, -3, 8][index % 4]);
      sprite.setDepth(5);
      sprite.setData('bookId', book.id);
      sprite.setInteractive();
      this.input.setDraggable(sprite);

      const title = this.add.text(sprite.x, sprite.y, book.title, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#302631',
        align: 'center',
      }).setOrigin(0.5).setDepth(6);
      const titleScale = Math.min(1, (BOOK_WIDTH - 14) / title.width, (BOOK_HEIGHT - 7) / title.height);
      title.setScale(titleScale);

      this.books.set(book.id, {
        data: book,
        sprite,
        title,
        row: null,
        column: null,
        shelfAngle: 0,
        shelfTargetAngle: 0,
        shelfBaseX: 0,
        shelfBoardY: 0,
        titleScale,
      });
    });
  }

  private createCharacters() {
    this.clerk = new PaperCharacter(this, 157, 509, {
      skin: 0xf1cfb5,
      clothes: 0xd98979,
      hair: 0x6f4e47,
      cheeks: 0xe99b91,
    }, 1.18);
    this.clerk.setFacing(1);

    this.visitor = new PaperCharacter(this, 930, 509, {
      skin: 0xe1b99c,
      clothes: 0x829fa6,
      hair: 0x4c5965,
      cheeks: 0xd98d88,
    }, 1.18);
    this.visitor.setFacing(-1);
    this.visitor.setVisible(false);
    this.visitor.root.setDepth(6);

    this.checkoutMarks = this.add.graphics().setDepth(8);
  }

  private createBookTexture(key: string, color: number) {
    const texture = this.add.graphics().setVisible(false);
    texture.fillStyle(color, 1);
    texture.fillRoundedRect(1, 1, BOOK_WIDTH - 2, BOOK_HEIGHT - 2, 2);
    texture.lineStyle(2, INK, 1);
    texture.strokeRoundedRect(1, 1, BOOK_WIDTH - 2, BOOK_HEIGHT - 2, 2);
    texture.lineStyle(1, PAPER, 0.38);
    texture.beginPath();
    texture.moveTo(8, 4);
    texture.lineTo(8, BOOK_HEIGHT - 4);
    texture.strokePath();
    texture.generateTexture(key, BOOK_WIDTH, BOOK_HEIGHT);
    texture.destroy();
  }

  private bindInput() {
    this.input.on('dragstart', (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
      const sprite = object as Phaser.Physics.Matter.Image;
      const id = sprite.getData('bookId') as string | undefined;
      if (!id || this.coverLayer) return;
      const book = this.books.get(id);
      if (!book) return;
      this.activeDrag = id;
      this.unshelve(book);
      sprite.setStatic(true);
      sprite.setIgnoreGravity(true);
      sprite.setVelocity(0, 0);
      sprite.setAngularVelocity(0);
      sprite.setAngle(0);
      sprite.setDepth(20);
      this.shelfGuide.clear();
    });

    this.input.on('drag', (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject, x: number, y: number) => {
      const sprite = object as Phaser.Physics.Matter.Image;
      if (!sprite.getData('bookId') || this.coverLayer) return;
      sprite.setPosition(
        Phaser.Math.Clamp(x, 132 + BOOK_WIDTH / 2, 868 - BOOK_WIDTH / 2),
        Phaser.Math.Clamp(y, 116 + BOOK_HEIGHT / 2, 523 - BOOK_HEIGHT / 2),
      );
      const target = this.shelfTarget(sprite.x, sprite.y);
      this.previewShelf(target);
    });

    this.input.on('dragend', (pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
      const sprite = object as Phaser.Physics.Matter.Image;
      const id = sprite.getData('bookId') as string | undefined;
      if (!id) return;
      const book = this.books.get(id);
      if (!book) return;
      const target = this.shelfTarget(sprite.x, sprite.y);
      if (target) {
        this.shelve(book, target, pointer.velocity.x);
      } else {
        this.layoutShelf();
        sprite.setStatic(false);
        sprite.setIgnoreGravity(false);
        sprite.setAwake();
        sprite.setVelocity(
          Phaser.Math.Clamp(pointer.velocity.x * 0.08, -7, 7),
          Phaser.Math.Clamp(pointer.velocity.y * 0.08, -5, 7),
        );
        sprite.setAngularVelocity(Phaser.Math.Clamp(pointer.velocity.x * 0.0008, -0.08, 0.08));
        sprite.setDepth(5);
      }
      this.activeDrag = null;
      this.shelfGuide.clear();
    });

    this.books.forEach(book => {
      book.sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.pointerDown.set(book.data.id, { x: pointer.x, y: pointer.y, time: pointer.downTime });
      });
      book.sprite.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.activeDrag || this.coverLayer) return;
        const down = this.pointerDown.get(book.data.id);
        if (!down || Phaser.Math.Distance.Between(down.x, down.y, pointer.x, pointer.y) > 9) return;
        const now = pointer.upTime;
        const previous = this.lastTap.get(book.data.id) ?? 0;
        if (now - previous < 360) {
          this.lastTap.delete(book.data.id);
          this.openCover(book);
        } else {
          this.lastTap.set(book.data.id, now);
        }
      });
    });
  }

  private unshelve(book: BookVisual) {
    if (book.row === null) return;
    const row = book.row;
    const column = this.shelfRows[row].indexOf(book.data.id);
    if (column >= 0) this.shelfRows[row][column] = null;
    book.row = null;
    book.column = null;
    this.layoutRow(row);
  }

  private shelfTarget(x: number, y: number): ShelfTarget | null {
    if (x < 380 || x > 640) return null;
    const row = SHELF_ROWS.findIndex(bounds => y >= bounds.top && y < bounds.bottom);
    if (row < 0 || !this.shelfRows[row].includes(null)) return null;
    let lastBook = -1;
    for (let column = SHELF_CAPACITY - 1; column >= 0; column -= 1) {
      if (this.shelfRows[row][column] !== null) {
        lastBook = column;
        break;
      }
    }
    const rightmostInsertion = Math.min(SHELF_CAPACITY - 1, lastBook + 1);
    const index = Phaser.Math.Clamp(
      Math.round((x - SHELF_FIRST_X) / SHELF_PITCH),
      0,
      rightmostInsertion,
    );
    return { row, index };
  }

  private shelve(book: BookVisual, target: ShelfTarget, releaseVelocityX: number) {
    const rowWithGap = this.rowWithGap(target.row, target.index);
    if (!rowWithGap) return;
    rowWithGap[target.index] = book.data.id;
    this.shelfRows[target.row] = rowWithGap;
    book.row = target.row;
    book.column = target.index;
    book.shelfAngle = Phaser.Math.Clamp(releaseVelocityX * 0.006, -3, 3);
    book.sprite.setStatic(true);
    book.sprite.setIgnoreGravity(true);
    book.sprite.setVelocity(0, 0);
    book.sprite.setAngularVelocity(0);
    book.sprite.setDepth(5);
    this.layoutShelf();
  }

  private previewShelf(target: ShelfTarget | null) {
    this.shelfGuide.clear();
    this.layoutShelf();
    if (!target) return;
    const preview = this.rowWithGap(target.row, target.index);
    if (!preview) return;
    this.layoutRow(target.row, preview, false);
    const markerX = SHELF_FIRST_X + target.index * SHELF_PITCH - SHELF_PITCH / 2;
    const row = SHELF_ROWS[target.row];
    this.shelfGuide.lineStyle(3, INK, 0.32);
    this.shelfGuide.beginPath();
    this.shelfGuide.moveTo(markerX, row.y - BOOK_WIDTH / 2);
    this.shelfGuide.lineTo(markerX, row.y + BOOK_WIDTH / 2);
    this.shelfGuide.strokePath();
  }

  private layoutShelf() {
    this.shelfRows.forEach((_books, row) => this.layoutRow(row));
  }

  private layoutRow(row: number, arrangement = this.shelfRows[row], updateLocation = true) {
    arrangement.forEach((id, column) => {
      if (!id) return;
      const book = this.books.get(id);
      if (!book) return;
      if (updateLocation) {
        book.row = row;
        book.column = column;
      }
      book.shelfBaseX = SHELF_FIRST_X + column * SHELF_PITCH;
      book.shelfBoardY = SHELF_ROWS[row].bottom;
      book.shelfTargetAngle = this.supportedLean(arrangement, column, id);
    });
  }

  private supportedLean(arrangement: Array<string | null>, column: number, id: string) {
    const supportLeft = column === 0 || arrangement[column - 1] !== null;
    const supportRight = column === SHELF_CAPACITY - 1 || arrangement[column + 1] !== null;
    if (supportLeft === supportRight) return 0;

    const characterSum = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
    const standsUnaided = characterSum % 4 === 0;
    if (standsUnaided) return 0;
    const lean = 7 + characterSum % 5;
    return supportLeft ? -lean : lean;
  }

  private updateShelfPhysics(delta: number) {
    const step = Math.min(delta / 1000, 0.04);
    const settle = 1 - Math.exp(-13 * step);
    this.books.forEach(book => {
      if (book.row === null) return;
      const error = book.shelfTargetAngle - book.shelfAngle;
      book.shelfAngle += error * settle;
      if (Math.abs(error) < 0.025) {
        book.shelfAngle = book.shelfTargetAngle;
      }

      const lean = Phaser.Math.DegToRad(book.shelfAngle);
      const angle = Phaser.Math.DegToRad(-90 + book.shelfAngle);
      const halfWidth = BOOK_WIDTH / 2;
      const halfThickness = BOOK_HEIGHT / 2;
      const lowestCorner = Math.abs(Math.sin(angle)) * halfWidth + Math.abs(Math.cos(angle)) * halfThickness;
      book.sprite.setPosition(
        book.shelfBaseX - Math.sin(lean) * halfWidth * 0.55,
        book.shelfBoardY - lowestCorner,
      );
      book.sprite.setAngle(-90 + book.shelfAngle);
    });
  }

  private rowWithGap(row: number, index: number) {
    const arrangement = [...this.shelfRows[row]];
    if (arrangement[index] === null) return arrangement;
    const openColumn = arrangement.findIndex((id, column) => column >= index && id === null);
    if (openColumn < 0) return null;
    for (let column = openColumn; column > index; column -= 1) {
      arrangement[column] = arrangement[column - 1];
    }
    arrangement[index] = null;
    return arrangement;
  }

  private updateCharacters(delta: number) {
    if (this.coverLayer) return;
    this.customerPhaseTime += delta;

    if (this.customerPhase === 'waiting') {
      const available = this.shelvedBooks();
      if (available.length && this.customerPhaseTime > 850) {
        this.customerTargetId = available[0].data.id;
        this.customerPhase = 'entering';
        this.customerPhaseTime = 0;
        this.visitor.setVisible(true);
        this.visitor.setPose('walk');
        this.visitor.setFacing(-1);
      }
    } else if (this.customerPhase === 'entering') {
      if (this.moveVisitorTo(724, 105, delta)) {
        this.customerPhase = 'searching';
        this.customerPhaseTime = 0;
      }
    } else if (this.customerPhase === 'searching') {
      let target = this.customerTargetId ? this.books.get(this.customerTargetId) : undefined;
      if (!target || target.row === null) {
        target = this.shelvedBooks()[0];
        this.customerTargetId = target?.data.id ?? null;
        this.customerPhaseTime = 0;
      }

      const browseX = this.customerPhaseTime < 700 ? 700 : this.customerPhaseTime < 1400 ? 682 : 696;
      if (!this.moveVisitorTo(browseX, 38, delta)) {
        this.visitor.setPose('search');
        this.visitor.setFacing(-1);
      }

      if (target && this.customerPhaseTime > 2350) {
        this.takeBookForCustomer(target);
        this.customerPhase = 'checkout-walk';
        this.customerPhaseTime = 0;
      }
    } else if (this.customerPhase === 'checkout-walk') {
      if (this.moveVisitorTo(344, 92, delta)) {
        this.customerPhase = 'checkout';
        this.customerPhaseTime = 0;
        this.visitor.setPose('checkout');
        this.visitor.setFacing(-1);
        this.clerk.setPose('checkout');
      }
    } else if (this.customerPhase === 'checkout') {
      this.drawCheckoutMarks();
      if (this.customerPhaseTime > 1250) {
        this.customerPhase = 'leaving';
        this.customerPhaseTime = 0;
        this.checkoutMarks.clear();
        this.clerk.setPose('idle');
        this.visitor.setPose('walk');
        this.visitor.setFacing(1);
      }
    } else if (this.customerPhase === 'leaving') {
      if (this.moveVisitorTo(930, 112, delta)) {
        this.customerPhase = 'done';
        this.visitor.setVisible(false);
        const book = this.carriedBookId ? this.books.get(this.carriedBookId) : undefined;
        book?.sprite.setVisible(false);
        book?.title.setVisible(false);
        this.carriedBookId = null;
      }
    }

    this.clerk.update(delta);
    this.visitor.update(delta);
    this.positionCarriedBook();
  }

  private shelvedBooks() {
    return [...this.books.values()]
      .filter(book => book.row !== null)
      .sort((left, right) => (left.row! - right.row!) || (left.column! - right.column!));
  }

  private moveVisitorTo(targetX: number, speed: number, delta: number) {
    const difference = targetX - this.visitor.root.x;
    if (Math.abs(difference) < 1.5) {
      this.visitor.setPosition(targetX);
      return true;
    }
    this.visitor.setPose('walk');
    this.visitor.setFacing(difference < 0 ? -1 : 1);
    const distance = Math.min(Math.abs(difference), speed * delta / 1000);
    this.visitor.setPosition(this.visitor.root.x + Math.sign(difference) * distance);
    return false;
  }

  private takeBookForCustomer(book: BookVisual) {
    if (book.row === null) return;
    const row = book.row;
    const column = this.shelfRows[row].indexOf(book.data.id);
    if (column >= 0) this.shelfRows[row][column] = null;
    book.row = null;
    book.column = null;
    this.layoutRow(row);

    this.carriedBookId = book.data.id;
    book.sprite.disableInteractive();
    book.sprite.setStatic(true);
    book.sprite.setIgnoreGravity(true);
    book.sprite.setVelocity(0, 0);
    book.sprite.setAngularVelocity(0);
    book.sprite.setScale(0.62);
    book.sprite.setDepth(7);
    book.title.setScale(book.titleScale * 0.62);
    book.title.setDepth(8);
    this.visitor.setPose('hold');
  }

  private positionCarriedBook() {
    if (!this.carriedBookId) return;
    const book = this.books.get(this.carriedBookId);
    if (!book) return;
    const leaving = this.customerPhase === 'leaving';
    const direction = leaving ? 1 : -1;
    book.sprite.setPosition(this.visitor.root.x + direction * 34, this.visitor.root.y - 43);
    book.sprite.setAngle(direction * 10);
  }

  private drawCheckoutMarks() {
    this.checkoutMarks.clear();
    this.checkoutMarks.fillStyle(0xd5aa55, 1);
    const count = Math.min(3, Math.floor(this.customerPhaseTime / 280) + 1);
    for (let index = 0; index < count; index += 1) {
      const lift = Math.sin(this.customerPhaseTime * 0.006 + index) * 3;
      this.checkoutMarks.fillCircle(309 + index * 10, 385 - index * 7 + lift, 4);
      this.checkoutMarks.lineStyle(1.5, INK, 1);
      this.checkoutMarks.strokeCircle(309 + index * 10, 385 - index * 7 + lift, 4);
    }
  }

  private openCover(book: BookVisual) {
    if (this.coverLayer) return;
    this.matter.world.pause();

    const backdrop = this.add.rectangle(500, 325, 1000, 650, PAPER, 0.93).setInteractive().setDepth(100);
    const shadow = this.add.rectangle(514, 338, 268, 390, INK, 0.1).setDepth(101).setAngle(-1);
    const cover = this.add.graphics().setDepth(102);
    const color = Phaser.Display.Color.HexStringToColor(book.data.cover).color;
    cover.fillStyle(color, 1);
    cover.fillRoundedRect(370, 126, 270, 390, 4);
    cover.lineStyle(5, INK, 1);
    cover.strokeRoundedRect(370, 126, 270, 390, 4);
    cover.lineStyle(10, INK, 1);
    cover.beginPath();
    cover.moveTo(378, 130);
    cover.lineTo(378, 512);
    cover.strokePath();
    cover.lineStyle(2, INK, 0.46);
    cover.strokeRect(387, 143, 236, 356);
    cover.lineStyle(4, INK, 1);
    cover.strokeCircle(505, 295, 72);
    cover.beginPath();
    cover.moveTo(461, 337);
    cover.lineTo(547, 252);
    cover.moveTo(473, 247);
    cover.lineTo(540, 340);
    cover.strokePath();
    cover.fillStyle(INK, 1);
    cover.fillCircle(478, 274, 7);
    cover.fillCircle(533, 282, 5);
    cover.fillCircle(520, 324, 6);

    const title = this.add.text(505, 438, book.data.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#302631',
      align: 'center',
      wordWrap: { width: 205 },
    }).setOrigin(0.5).setDepth(103);

    const closeInk = this.add.graphics().setDepth(104);
    closeInk.lineStyle(4, INK, 1);
    closeInk.beginPath();
    closeInk.moveTo(594, 158);
    closeInk.lineTo(617, 181);
    closeInk.moveTo(617, 158);
    closeInk.lineTo(594, 181);
    closeInk.strokePath();
    const closeHit = this.add.zone(606, 170, 54, 54).setInteractive().setDepth(105);

    this.coverLayer = this.add.container(0, 0, [backdrop, shadow, cover, title, closeInk, closeHit]).setDepth(100);
    backdrop.on('pointerup', () => this.closeCover());
    closeHit.on('pointerup', () => this.closeCover());
  }

  private closeCover() {
    if (!this.coverLayer) return;
    this.coverLayer.destroy(true);
    this.coverLayer = null;
    this.matter.world.resume();
  }
}
