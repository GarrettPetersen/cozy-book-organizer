import Phaser from 'phaser';
import { startingBooks } from '../game/catalog';
import type { Book } from '../game/types';

const INK = 0x302631;
const PAPER = 0xffffff;
const BOOK_WIDTH = 92;
const BOOK_HEIGHT = 22;

type ShelfSlot = { x: number; y: number; bookId: string | null };
type BookVisual = {
  data: Book;
  sprite: Phaser.Physics.Matter.Image;
  title: Phaser.GameObjects.Text;
  slot: number | null;
};

export class BookstoreScene extends Phaser.Scene {
  private books = new Map<string, BookVisual>();
  private slots: ShelfSlot[] = [];
  private slotGuides!: Phaser.GameObjects.Graphics;
  private activeDrag: string | null = null;
  private pointerDown = new Map<string, { x: number; y: number; time: number }>();
  private lastTap = new Map<string, number>();
  private coverLayer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('bookstore');
  }

  create() {
    this.cameras.main.setBackgroundColor(PAPER);
    this.drawRoom();
    this.createShelfSlots();
    this.createBoundaries();
    this.createBooks();
    this.bindInput();
    this.input.keyboard?.on('keydown-ESC', () => this.closeCover());
  }

  update() {
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

    ink.beginPath();
    ink.moveTo(132, 514);
    ink.lineTo(132, 116);
    ink.lineTo(145, 127);
    ink.lineTo(334, 127);
    ink.lineTo(384, 109);
    ink.lineTo(455, 112);
    ink.lineTo(508, 121);
    ink.lineTo(578, 140);
    ink.lineTo(701, 140);
    ink.lineTo(679, 166);
    ink.lineTo(660, 279);
    ink.lineTo(660, 509);
    ink.strokePath();

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
    this.drawClerk(ink);
    this.drawCustomer(ink);
    this.drawShelf(ink);
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

  private drawClerk(ink: Phaser.GameObjects.Graphics) {
    ink.lineStyle(6, INK, 1);
    ink.strokeEllipse(201, 313, 39, 55);
    ink.beginPath();
    ink.moveTo(184, 323);
    ink.lineTo(190, 301);
    ink.lineTo(210, 296);
    ink.lineTo(222, 317);
    ink.moveTo(194, 341);
    ink.lineTo(194, 421);
    ink.lineTo(229, 421);
    ink.lineTo(229, 360);
    ink.moveTo(196, 368);
    ink.lineTo(167, 348);
    ink.lineTo(151, 374);
    ink.lineTo(181, 399);
    ink.moveTo(151, 374);
    ink.lineTo(142, 369);
    ink.moveTo(151, 374);
    ink.lineTo(142, 382);
    ink.strokePath();
  }

  private drawCustomer(ink: Phaser.GameObjects.Graphics) {
    ink.lineStyle(6, INK, 1);
    ink.strokeEllipse(762, 308, 40, 56);
    ink.beginPath();
    ink.moveTo(745, 319);
    ink.lineTo(751, 296);
    ink.lineTo(772, 294);
    ink.lineTo(784, 314);
    ink.moveTo(762, 337);
    ink.lineTo(760, 441);
    ink.lineTo(738, 486);
    ink.moveTo(760, 441);
    ink.lineTo(789, 485);
    ink.moveTo(760, 368);
    ink.lineTo(727, 404);
    ink.lineTo(702, 404);
    ink.moveTo(760, 368);
    ink.lineTo(791, 402);
    ink.lineTo(780, 420);
    ink.moveTo(702, 404);
    ink.lineTo(692, 398);
    ink.moveTo(702, 404);
    ink.lineTo(691, 412);
    ink.strokePath();
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

  private createShelfSlots() {
    const xs = [415, 473, 531, 589];
    const ys = [232, 343, 456];
    ys.forEach(y => xs.forEach(x => this.slots.push({ x, y, bookId: null })));

    this.slotGuides = this.add.graphics().setDepth(3).setVisible(false);
    this.slots.forEach(slot => {
      this.slotGuides.lineStyle(2, INK, 0.18);
      this.slotGuides.strokeRoundedRect(slot.x - 17, slot.y - 49, 34, 98, 3);
    });
  }

  private createBoundaries() {
    const wallOptions = { isStatic: true, friction: 0.9, restitution: 0.08, render: { visible: false } };
    this.matter.add.rectangle(500, 532, 1000, 20, wallOptions);
    this.matter.add.rectangle(122, 325, 20, 420, wallOptions);
    this.matter.add.rectangle(902, 325, 20, 420, wallOptions);
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
      sprite.setInteractive(new Phaser.Geom.Rectangle(-8, -12, BOOK_WIDTH + 16, BOOK_HEIGHT + 24), Phaser.Geom.Rectangle.Contains);
      this.input.setDraggable(sprite);

      const title = this.add.text(sprite.x, sprite.y, book.title, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#302631',
        align: 'center',
        fixedWidth: 82,
      }).setOrigin(0.5).setDepth(6);

      this.books.set(book.id, { data: book, sprite, title, slot: null });
    });
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
      this.slotGuides.setVisible(true);
    });

    this.input.on('drag', (_pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject, x: number, y: number) => {
      const sprite = object as Phaser.Physics.Matter.Image;
      if (!sprite.getData('bookId') || this.coverLayer) return;
      sprite.setPosition(x, y);
    });

    this.input.on('dragend', (pointer: Phaser.Input.Pointer, object: Phaser.GameObjects.GameObject) => {
      const sprite = object as Phaser.Physics.Matter.Image;
      const id = sprite.getData('bookId') as string | undefined;
      if (!id) return;
      const book = this.books.get(id);
      if (!book) return;
      const slotIndex = this.nearestOpenSlot(sprite.x, sprite.y);
      if (slotIndex !== null) {
        this.shelve(book, slotIndex);
      } else {
        sprite.setStatic(false);
        sprite.setIgnoreGravity(false);
        sprite.setVelocity(
          Phaser.Math.Clamp(pointer.velocity.x * 0.08, -7, 7),
          Phaser.Math.Clamp(pointer.velocity.y * 0.08, -5, 7),
        );
        sprite.setAngularVelocity(Phaser.Math.Clamp(pointer.velocity.x * 0.0008, -0.08, 0.08));
        sprite.setDepth(5);
      }
      this.activeDrag = null;
      this.slotGuides.setVisible(false);
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
    if (book.slot === null) return;
    this.slots[book.slot].bookId = null;
    book.slot = null;
  }

  private nearestOpenSlot(x: number, y: number) {
    let best: number | null = null;
    let bestDistance = 76;
    this.slots.forEach((slot, index) => {
      if (slot.bookId) return;
      const distance = Phaser.Math.Distance.Between(x, y, slot.x, slot.y);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    });
    return best;
  }

  private shelve(book: BookVisual, slotIndex: number) {
    const slot = this.slots[slotIndex];
    slot.bookId = book.data.id;
    book.slot = slotIndex;
    book.sprite.setStatic(true);
    book.sprite.setIgnoreGravity(true);
    book.sprite.setVelocity(0, 0);
    book.sprite.setAngularVelocity(0);
    book.sprite.setPosition(slot.x, slot.y);
    book.sprite.setAngle(-90);
    book.sprite.setDepth(5);
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
