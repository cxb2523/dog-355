// 纯渲染与 UI 层，仅负责绘制和更新显示
export class GameView {
  constructor(canvas, scoreEl, speedEl) {
    this.ctx = canvas.getContext('2d');
    this.scoreEl = scoreEl;
    this.speedEl = speedEl;
    this.WORLD_WIDTH = 600;
    this.WORLD_HEIGHT = 600;
    this.SNAKE_NODE_RADIUS = 8;
    this.FOOD_RADIUS = 6;
    this.OBSTACLE_RADIUS = 12;
  }

  render(state) {
    // 清空画布
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);

    // 绘制泥潭区域
    this.ctx.save();
    const mudGradient = this.ctx.createRadialGradient(
      this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, 0,
      this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, 150
    );
    mudGradient.addColorStop(0, 'rgba(75, 85, 99, 0.2)');
    mudGradient.addColorStop(1, 'rgba(75, 85, 99, 0)');
    this.ctx.fillStyle = mudGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2, 150, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // 绘制障碍物
    for (const obstacle of state.obstacles) {
      this.ctx.save();
      const obstacleGradient = this.ctx.createRadialGradient(
        obstacle.x, obstacle.y, 0,
        obstacle.x, obstacle.y, this.OBSTACLE_RADIUS
      );
      obstacleGradient.addColorStop(0, '#4b5563');
      obstacleGradient.addColorStop(0.7, '#374151');
      obstacleGradient.addColorStop(1, '#1f2937');
      this.ctx.fillStyle = obstacleGradient;
      this.ctx.beginPath();
      this.ctx.arc(obstacle.x, obstacle.y, this.OBSTACLE_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#6b7280';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 绘制食物
    this.ctx.save();
    const foodGradient = this.ctx.createRadialGradient(
      state.food.x, state.food.y, 0,
      state.food.x, state.food.y, this.FOOD_RADIUS
    );
    foodGradient.addColorStop(0, '#e94560');
    foodGradient.addColorStop(0.7, '#d13b55');
    foodGradient.addColorStop(1, '#b82f46');
    this.ctx.fillStyle = foodGradient;
    this.ctx.beginPath();
    this.ctx.arc(state.food.x, state.food.y, this.FOOD_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // 绘制蛇身
    for (let i = 0; i < state.snake.length; i++) {
      const node = state.snake[i];
      this.ctx.save();
      const bodyGradient = this.ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, this.SNAKE_NODE_RADIUS
      );
      const green = i === 0 ? '#7ef29d' : '#4ade80';
      const darkGreen = i === 0 ? '#68e08a' : '#34d369';
      bodyGradient.addColorStop(0, green);
      bodyGradient.addColorStop(0.7, darkGreen);
      bodyGradient.addColorStop(1, '#22c55e');
      this.ctx.fillStyle = bodyGradient;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.SNAKE_NODE_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 绘制蛇头方向指示器
    this.ctx.save();
    this.ctx.translate(state.snakeHead.x, state.snakeHead.y);
    this.ctx.rotate((state.snakeHead.angle * Math.PI) / 180);
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.moveTo(this.SNAKE_NODE_RADIUS, 0);
    this.ctx.lineTo(this.SNAKE_NODE_RADIUS - 5, -3);
    this.ctx.lineTo(this.SNAKE_NODE_RADIUS - 5, 3);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 更新 UI 面板
    this.scoreEl.textContent = String(state.score);
    this.speedEl.textContent = String(Math.round(state.speedMultiplier * 100));

    // 游戏结束提示
    if (state.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.WORLD_WIDTH, this.WORLD_HEIGHT);
      this.ctx.fillStyle = '#e94560';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('游戏结束', this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2 - 20);
      this.ctx.fillStyle = '#7ef29d';
      this.ctx.font = '24px Arial';
      this.ctx.fillText('最终分数：' + state.score, this.WORLD_WIDTH / 2, this.WORLD_HEIGHT / 2 + 20);
    }
  }
}