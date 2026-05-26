import { Game3D } from './engine/Game3D.js';
import { UI } from './view/UI.js';

const canvas = document.getElementById('game');
const game = new Game3D(canvas);
new UI(game);
