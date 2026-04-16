// 控制与核心循环层，连接 Model 和 View
import { GameModel } from './GameModel.js';
import { GameView } from './GameView.js';

class GameController {
  constructor() {
    // 获取 DOM 元素
    this.canvas = document.getElementById('game');
    this.elScore = document.getElementById('score');
    this.elSpeed = document.getElementById('speed');
    this.btnRestart = document.getElementById('btnRestart');

    // 初始化 Model 和 View
    this.model = new GameModel();
    this.view = new GameView(
      this.canvas,
      this.elScore,
      this.elSpeed
    );

    this.loopId = null;

    // 绑定事件
    this.bindEvents();

    // 启动游戏
    this.model.reset();
    this.startLoop();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    this.btnRestart.addEventListener('click', () => this.resetGame());
  }

  handleKeyDown(e) {
    const k = e.key;
    if (this.model.gameOver) return;

    switch (k) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.model.turn(-1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.model.turn(1);
        break;
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        this.model.boostActive = true;
        break;
      default:
        break;
    }
  }

  handleKeyUp(e) {
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      this.model.boostActive = false;
    }
  }

  resetGame() {
    this.stopLoop();
    this.model.reset();
    this.startLoop();
  }

  stopLoop() {
    if (this.loopId != null) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }
  }

  startLoop() {
    const loop = () => {
      this.model.update();
      const state = this.model.getState();
      this.view.render(state);
      if (!this.model.gameOver) {
        this.loopId = requestAnimationFrame(loop);
      }
    };
    this.loopId = requestAnimationFrame(loop);
  }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  new GameController();
});