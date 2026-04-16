// 纯物理引擎与数据模型层，无任何 DOM 操作

export class GameModel {
  constructor() {
    // 游戏常量
    this.WORLD_WIDTH = 600;
    this.WORLD_HEIGHT = 600;
    this.SNAKE_NODE_RADIUS = 8;
    this.SNAKE_SPEED = 2.5;
    this.TURN_RATE = 4; // BUGFIX: 平衡转向灵敏度，6太快调回4，兼顾响应与操控性
    this.NODE_DISTANCE = 16; // 身体节点之间的固定距离
    this.FOOD_RADIUS = 6;
    this.OBSTACLE_RADIUS = 12;
    this.OBSTACLE_SPEED = 0.8;
    this.MUD_RADIUS = 150; // 泥潭区域半径
    this.MUD_SPEED_FACTOR = 0.5; // 泥潭速度衰减因子
    this.SPEED_RECOVER_DURATION = 1000; // 速度恢复时间（毫秒）

    this.reset();
  }

  reset() {
    this.score = 0;
    this.gameOver = false;
    this.isInMud = false;
    this.speedMultiplier = 1.0;
    this.speedRecoveryTimer = null;
    this.boostActive = false;
    // BUGFIX: 初始化持续转向状态变量
    this.turnDirection = 0;

    // 初始化蛇（10个节点）
    this.snake = [];
    const startX = this.WORLD_WIDTH / 2;
    const startY = this.WORLD_HEIGHT / 2;
    for (let i = 0; i < 10; i++) {
      this.snake.push({
        x: startX - i * this.NODE_DISTANCE,
        y: startY,
        vx: 0,
        vy: 0
      });
    }

    // 蛇头状态
    this.snakeHead = {
      x: startX,
      y: startY,
      angle: 0, // 朝向角度（度）
      speed: this.SNAKE_SPEED
    };

    // 生成食物
    this.food = this.randomFoodPosition();

    // 生成障碍物
    this.obstacles = [];
    for (let i = 0; i < 3; i++) {
      this.obstacles.push({
        x: Math.random() * (this.WORLD_WIDTH - 40) + 20,
        y: Math.random() * (this.WORLD_HEIGHT - 40) + 20,
        vx: (Math.random() - 0.5) * this.OBSTACLE_SPEED,
        vy: (Math.random() - 0.5) * this.OBSTACLE_SPEED
      });
    }
  }

  // 随机食物位置
  randomFoodPosition() {
    let x, y;
    do {
      x = Math.random() * (this.WORLD_WIDTH - 40) + 20;
      y = Math.random() * (this.WORLD_HEIGHT - 40) + 20;
    } while (this.isPositionTooCloseToSnake(x, y));
    return { x, y };
  }

  // 检查位置是否靠近蛇身
  isPositionTooCloseToSnake(x, y) {
    for (const node of this.snake) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.SNAKE_NODE_RADIUS + this.FOOD_RADIUS + 10) {
        return true;
      }
    }
    return false;
  }

  // 平滑转向
  turn(direction) {
    // direction: -1 左转向, 1 右转向
    this.snakeHead.angle += direction * this.TURN_RATE;
    // 角度归一化到 0-360
    this.snakeHead.angle = (this.snakeHead.angle + 360) % 360;
  }

  // 计算速度向量
  calculateVelocityVector(angle, speed) {
    // 角度转弧度
    const rad = (angle * Math.PI) / 180;
    return {
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed
    };
  }

  // 身体节点跟随算法（核心物理约束）
  updateBodyNodes() {
    // 蛇头位置更新
    const velocity = this.calculateVelocityVector(
      this.snakeHead.angle,
      this.snakeHead.speed * this.speedMultiplier
    );
    this.snakeHead.x += velocity.vx;
    this.snakeHead.y += velocity.vy;

    // 边界反弹
    if (this.snakeHead.x < this.SNAKE_NODE_RADIUS || this.snakeHead.x > this.WORLD_WIDTH - this.SNAKE_NODE_RADIUS) {
      this.snakeHead.angle = 180 - this.snakeHead.angle;
      this.snakeHead.x = Math.max(this.SNAKE_NODE_RADIUS, Math.min(this.WORLD_WIDTH - this.SNAKE_NODE_RADIUS, this.snakeHead.x));
    }
    if (this.snakeHead.y < this.SNAKE_NODE_RADIUS || this.snakeHead.y > this.WORLD_HEIGHT - this.SNAKE_NODE_RADIUS) {
      this.snakeHead.angle = -this.snakeHead.angle;
      this.snakeHead.y = Math.max(this.SNAKE_NODE_RADIUS, Math.min(this.WORLD_HEIGHT - this.SNAKE_NODE_RADIUS, this.snakeHead.y));
    }

    // 更新身体节点
    for (let i = 0; i < this.snake.length; i++) {
      const node = this.snake[i];
      const target = i === 0 ? this.snakeHead : this.snake[i - 1];

      // 计算方向向量
      const dx = target.x - node.x;
      const dy = target.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 距离约束：如果超过最大距离，则移动
      if (distance > this.NODE_DISTANCE) {
        const ratio = this.NODE_DISTANCE / distance;
        node.x += dx * ratio;
        node.y += dy * ratio;
      }
    }
  }

  // 碰撞检测
  checkCollisions() {
    // 食物碰撞
    const foodDx = this.snakeHead.x - this.food.x;
    const foodDy = this.snakeHead.y - this.food.y;
    const foodDistance = Math.sqrt(foodDx * foodDx + foodDy * foodDy);
    if (foodDistance < this.SNAKE_NODE_RADIUS + this.FOOD_RADIUS) {
      this.score += 10;
      this.food = this.randomFoodPosition();
      // 增加一个身体节点
      const lastNode = this.snake[this.snake.length - 1];
      this.snake.push({ x: lastNode.x, y: lastNode.y, vx: 0, vy: 0 });
    }

    // 自身碰撞
    // BUGFIX: 从i=4开始检测，跳过前3个节点，避免转向时蛇头与靠近的身体节点误碰撞
    for (let i = 4; i < this.snake.length; i++) {
      const bodyDx = this.snakeHead.x - this.snake[i].x;
      const bodyDy = this.snakeHead.y - this.snake[i].y;
      const bodyDistance = Math.sqrt(bodyDx * bodyDx + bodyDy * bodyDy);
      if (bodyDistance < this.SNAKE_NODE_RADIUS * 1.8) {
        this.gameOver = true;
        return;
      }
    }

    // 障碍物碰撞（弹性碰撞）
    for (const obstacle of this.obstacles) {
      const dx = this.snakeHead.x - obstacle.x;
      const dy = this.snakeHead.y - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.SNAKE_NODE_RADIUS + this.OBSTACLE_RADIUS) {
        // 计算碰撞法线
        const normalX = dx / distance;
        const normalY = dy / distance;

        // 计算反弹向量
        const dotProduct = this.calculateVelocityVector(this.snakeHead.angle, this.snakeHead.speed).vx * normalX +
                          this.calculateVelocityVector(this.snakeHead.angle, this.snakeHead.speed).vy * normalY;

        // 反弹后速度
        this.snakeHead.angle = Math.atan2(
          this.calculateVelocityVector(this.snakeHead.angle, this.snakeHead.speed).vy - 2 * dotProduct * normalY,
          this.calculateVelocityVector(this.snakeHead.angle, this.snakeHead.speed).vx - 2 * dotProduct * normalX
        ) * 180 / Math.PI;

        // 扣分
        this.score = Math.max(0, this.score - 5);

        // 分离碰撞
        this.snakeHead.x = obstacle.x + normalX * (this.SNAKE_NODE_RADIUS + this.OBSTACLE_RADIUS + 1);
        this.snakeHead.y = obstacle.y + normalY * (this.SNAKE_NODE_RADIUS + this.OBSTACLE_RADIUS + 1);
      }
    }

    // 泥潭区域检测
    const mudDx = this.snakeHead.x - this.WORLD_WIDTH / 2;
    const mudDy = this.snakeHead.y - this.WORLD_HEIGHT / 2;
    const mudDistance = Math.sqrt(mudDx * mudDx + mudDy * mudDy);
    this.isInMud = mudDistance < this.MUD_RADIUS;

    // 速度衰减与恢复
    if (this.isInMud) {
      this.speedMultiplier = this.MUD_SPEED_FACTOR;
      if (this.speedRecoveryTimer) {
        clearTimeout(this.speedRecoveryTimer);
        this.speedRecoveryTimer = null;
      }
    } else if (this.speedMultiplier < 1.0 && !this.speedRecoveryTimer) {
      this.speedRecoveryTimer = setTimeout(() => {
        this.speedMultiplier = 1.0;
        this.speedRecoveryTimer = null;
      }, this.SPEED_RECOVER_DURATION);
    }

    // 加速状态
    if (this.boostActive) {
      this.snakeHead.speed = this.SNAKE_SPEED * 1.5;
    } else {
      this.snakeHead.speed = this.SNAKE_SPEED;
    }
  }

  // 更新障碍物
  updateObstacles() {
    for (const obstacle of this.obstacles) {
      obstacle.x += obstacle.vx;
      obstacle.y += obstacle.vy;

      // 边界反弹
      if (obstacle.x < this.OBSTACLE_RADIUS || obstacle.x > this.WORLD_WIDTH - this.OBSTACLE_RADIUS) {
        obstacle.vx *= -1;
      }
      if (obstacle.y < this.OBSTACLE_RADIUS || obstacle.y > this.WORLD_HEIGHT - this.OBSTACLE_RADIUS) {
        obstacle.vy *= -1;
      }
    }
  }

  // 游戏主循环更新
  update() {
    if (this.gameOver) return;

    // BUGFIX: 按住方向键时每帧持续转向
    if (this.turnDirection !== 0) {
      this.turn(this.turnDirection);
    }

    this.updateBodyNodes();
    this.updateObstacles();
    this.checkCollisions();
  }

  // 获取游戏状态
  getState() {
    return {
      snake: [...this.snake],
      snakeHead: { ...this.snakeHead },
      food: { ...this.food },
      obstacles: [...this.obstacles],
      score: this.score,
      gameOver: this.gameOver,
      speedMultiplier: this.speedMultiplier,
      isInMud: this.isInMud
    };
  }
}