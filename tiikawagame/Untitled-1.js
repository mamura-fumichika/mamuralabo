<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>スイカゲーム - スコア＆ゲームオーバー</title>
  <style>
    body {
      margin: 0;
      background: #f0f8ff;
      overflow: hidden;
    }
    canvas {
      display: block;
      margin: 0 auto;
      background: #d0f0c0;
      border: 2px solid #333;
    }
    #ui {
      position: absolute;
      top: 10px;
      left: 10px;
      font-family: sans-serif;
      font-size: 20px;
      color: #333;
      z-index: 10;
    }
    #restart {
      margin-top: 10px;
      padding: 5px 10px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="ui">
    <div id="score">スコア: 0</div>
    <button id="restart" style="display:none;">リスタート</button>
  </div>
  <canvas id="gameCanvas" width="400" height="600"></canvas>
  <script src="https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js"></script>
  <script>
    const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

    const width = 400;
    const height = 600;

    const fruitTypes = [
      { radius: 15, image: 'ちいかぶ.png' },
      { radius: 20, image: 'orange.png' },
      { radius: 25, image: 'lemon.png' },
      { radius: 30, image: 'kiwi.png' },
      { radius: 35, image: 'lychee.png' },
      { radius: 40, image: 'blueberry.png' },
      { radius: 45, image: 'grape.png' },
      { radius: 50, image: 'peach.png' },
      { radius: 55, image: 'dragon.png' },
      { radius: 60, image: 'pineapple.png' },
      { radius: 65, image: 'suika.png' }
    ];

    const engine = Engine.create();
    const world = engine.world;

    const render = Render.create({
      canvas: document.getElementById('gameCanvas'),
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#d0f0c0'
      }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const ground = Bodies.rectangle(width / 2, height + 25, width, 50, { isStatic: true });
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, { isStatic: true });
    World.add(world, [ground, leftWall, rightWall]);

    let currentFruit = null;
    let isWaiting = false;
    let gameOver = false;
    let score = 0;
    const fruits = [];

    const scoreDisplay = document.getElementById('score');
    const restartButton = document.getElementById('restart');

    function getRandomType() {
      return Math.floor(Math.random() * 5); // サクランボ〜ライチ
    }

    function createFruit(x) {
      const type = getRandomType();
      const { radius, image } = fruitTypes[type];
      const fruit = Bodies.circle(x, 80, radius, {
        isStatic: true,
        render: {
          sprite: {
            texture: image,
            xScale: (radius * 2) / 60,
            yScale: (radius * 2) / 60
          }
        }
      });
      fruit.fruitType = type;
      currentFruit = fruit;
      World.add(world, fruit);
      isWaiting = false;
    }

    function dropFruit() {
      if (currentFruit && !gameOver) {
        Body.setStatic(currentFruit, false);
        fruits.push(currentFruit);
        currentFruit = null;
        isWaiting = true;
        setTimeout(() => {
          if (!checkGameOver()) {
            createFruit(width / 2);
          }
        }, 1000);
      }
    }

    function addScore(points) {
      score += points;
      scoreDisplay.textContent = `スコア: ${score}`;
    }

    function checkGameOver() {
      for (let fruit of fruits) {
        if (fruit.position.y < 50) {
          gameOver = true;
          restartButton.style.display = 'block';
          return true;
        }
      }
      return false;
    }

    restartButton.addEventListener('click', () => {
      for (let body of Composite.allBodies(world)) {
        if (!body.isStatic) {
          World.remove(world, body);
        }
      }
      fruits.length = 0;
      score = 0;
      gameOver = false;
      scoreDisplay.textContent = 'スコア: 0';
      restartButton.style.display = 'none';
      createFruit(width / 2);
    });

    function mergeFruits(f1, f2) {
      const type = f1.fruitType;
      if (type !== f2.fruitType) return;

      if (type === fruitTypes.length - 1) {
        World.remove(world, f1);
        World.remove(world, f2);
        addScore(100);
        return;
      }

      const newType = type + 1;
      const { radius, image } = fruitTypes[newType];
      const newX = (f1.position.x + f2.position.x) / 2;
      const newY = (f1.position.y + f2.position.y) / 2;

      const newFruit = Bodies.circle(newX, newY, radius, {
        restitution: 0.2,
        render: {
          sprite: {
            texture: image,
            xScale: (radius * 2) / 60,
            yScale: (radius * 2) / 60
          }
        }
      });

      newFruit.fruitType = newType;
      World.remove(world, f1);
      World.remove(world, f2);
      World.add(world, newFruit);
      fruits.push(newFruit);

      addScore((newType + 1) * 10);
    }

    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (let pair of pairs) {
        const { bodyA, bodyB } = pair;
        if (bodyA.fruitType !== undefined && bodyB.fruitType !== undefined) {
          if (bodyA.fruitType === bodyB.fruitType) {
            mergeFruits(bodyA, bodyB);
          }
        }
      }
    });

    render.canvas.addEventListener('click', (e) => {
      if (currentFruit && !isWaiting && !gameOver) {
        const rect = render.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        Body.setPosition(currentFruit, { x, y: currentFruit.position.y });
        dropFruit();
      }
    });

    createFruit(width / 2);
  </script>
</body>
</html>
