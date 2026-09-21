import Phaser from 'phaser';
import { BookstoreScene } from './scenes/BookstoreScene';
import './ui/styles.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1000,
  height: 650,
  backgroundColor: '#ffffff',
  transparent: false,
  antialias: true,
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1.15 },
      enableSleeping: true,
      positionIterations: 8,
      velocityIterations: 6,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BookstoreScene],
});
