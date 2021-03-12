var sw = 25,  // 一个方块的宽度
    sh = 25,  // 一个方块的高度
    tr = 25,  //行数
    td = 25;  //列数
var snake = null, //蛇的实例
    food = null,  //食物的实例
    game = null;  //游戏的实例
//方块构造函数
function Square(x, y, classname) {  
  this.x = x * sw;
  this.y = y * sh;
  this.class = classname;

  this.domContent = document.createElement('div');
  this.domContent.className = this.class;
  this.parent = document.querySelector('.snakeWrap');
};
Square.prototype.create = function () { //创建方块DOM，并添加到页面里
  this.domContent.style.position = 'absolute';
  this.domContent.style.width = sw + 'px';
  this.domContent.style.height = sh + 'px';
  this.domContent.style.left = this.x + 'px';
  this.domContent.style.top = this.y + 'px';
  
  this.parent.appendChild(this.domContent);
};

Square.prototype.remove = function () {  
  this.parent.removeChild(this.domContent);
};

//蛇
function Snake() {  
  this.head = null; //存一下蛇头的信息
  this.tail = null; //存一下蛇尾的信息
  this.pos = []; //存储蛇身上的每一个方块的位置

  this.directionNum = { //存储蛇走的方向，用一个对象来表示
    left : {
      x : -1,
      y : 0,
      rotate : 180
    },
    right : {
      x : 1,
      y : 0,
      rotate : 0
    },
    up : {
      x : 0,
      y : -1,
      rotate : -90
    },
    down : {
      x : 0,
      y : 1,
      rotate : 90
    }
  }
};

// 初始化
Snake.prototype.init = function () {  
  //创建蛇头
  var snakeHead = new Square(2, 0, 'snakeHead');
  snakeHead.create();
  this.head = snakeHead;  //存储蛇头信息
  this.pos.push([2, 0]);  //把蛇头的位置存起来

  //创建蛇身体1
  var snakeBody1 = new Square(1, 0, 'snakeBody');
  snakeBody1.create();
  this.pos.push([1, 0]);  //把蛇身1的坐标也存起来
  
  //创建蛇身体2
  var snakeBody2 = new Square(0, 0, 'snakeBody');
  snakeBody2.create();
  this.tail = snakeBody2; //把蛇尾的信息存起来
  this.pos.push([0, 0]);  //把蛇身1的坐标也存起来

  //形成链表关系
  snakeHead.last = null;
  snakeHead.next = snakeBody1;

  snakeBody1.last = snakeHead;
  snakeBody1.next = snakeBody2;

  snakeBody2.last = snakeBody1;
  snakeBody2.next = null;

  //给蛇添加一条属性，用来表示蛇走的方向
  this.direction = this.directionNum.right; //默认让蛇往右走
};


//这个方法用来获取蛇头的下一个位置对应的元素，要根据元素做不同的事情
Snake.prototype.getNextPos = function () {  
  var nextPos = [ //蛇头要走的下一个点的坐标
    this.head.x / sw + this.direction.x,
    this.head.y / sh + this.direction.y
  ]

  // 下个点是自己，代表撞到了自己，gameover
  var selfCollide = false;
  this.pos.forEach(it => {
    if (it[0] == nextPos[0] && it[1] == nextPos[1]) {
      selfCollide = true;
    }
  });
  if (selfCollide) {
    this.strategies.over.call(this);
    return;
  }

  // 下个点是围墙， gameover
  if (nextPos[0] < 0 || nextPos[0] > td - 1 || nextPos[1] < 0 || nextPos[1] > tr - 1) {

    this.strategies.over.call(this);
    return;
  }
  // 下个点是food， eat
  if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
    // 如果这个条件成立，说明蛇头要走的下一个点是食物
    console.log('eat');
    this.strategies.eat.call(this);
    return;
  }
  // 下个点啥也不是， go
  this.strategies.move.call(this);  //将this指向Snake

};

//  处理碰撞后要做的事
Snake.prototype.strategies = {  // 重点  掐头去尾原则
  move : function (format) {  //这份参数用来决定要不要删除最后一个方块（蛇尾），当传了这个参数表示是要吃
    //创建新身体 他的位置在旧蛇头的位置
    var newBody = new Square(this.head.x / sw, this.head.y / sh,'snakeBody');
    //更新链表的关系
    newBody.next = this.head.next;
    newBody.next.last = newBody;
    newBody.last = null;

    this.head.remove(); //把就蛇头从原来的位置删除
    newBody.create();

    //创建一个新蛇头 
    var newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, 'snakeHead');
    //更新链表的关系
    newHead.next = newBody;
    newHead.last = null;
    newBody.last = newHead;
    newHead.domContent.style.transform = 'rotate('+this.direction.rotate+'deg)';
    newHead.create();

    //蛇身上的每一个方块的坐标也要更新
    this.pos.splice(0, 0, [this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y]);
    this.head = newHead;  //还要把this.head的信息更新一下

    if (!format) {  //如果fromat的值为false，表示需要删除（除了吃之外的操作）
      this.tail.remove();
      this.tail = this.tail.last;
      this.pos.pop();
    }
  },
  eat : function () {  
    this.strategies.move.call(this, true);
    createFood();
    game.score ++;
  },
  over : function () {  
    game.over();
  }
}
snake = new Snake();

//创建食物
function createFood() {  
  //食物小方块的随机坐标
  var x = null;
  var y = null;

  var include = true; //循环跳出的条件，true表示食物的坐标在蛇身上，false表示食物的坐标不在蛇身上。
  
  while(include) {
    x = Math.round(Math.random() * (td - 1));
    y = Math.round(Math.random() * (tr - 1));
    var snakeMap = new Map(Array.from(snake));
    include = snakeMap.get(x) == y;


    // var flag = true;
    // for (var i = 0; i < snake.length; i ++) {
    //   if (snake[i][0] == x && snake[i][1] == y) {
    //     flag = false;
    //     break;
    //   }
    // }
    // if (flag) include = false;
  }

  //生成食物
  food = new Square(x, y, 'snakeFood');
  food.pos = [x, y]; // 存储一下生成食物的坐标，用于跟蛇头下一次生成的坐标做对比
  
  var foodDom = document.querySelector('.snakeFood');
  if (foodDom) {
    foodDom.style.left = x * sw + 'px';
    foodDom.style.top = y * sh + 'px';
  }else {
    food.create();
  }
}

//创建游戏
function Game() {  
  this.timer = null;
  this.score = 0;
}
Game.prototype.init = function () {  
  snake.init();
  createFood();
  document.onkeydown = function (e) {  
    if (e.code == 'ArrowLeft' && snake.direction !== snake.directionNum.right) { //用户按下左键的时候，蛇不能向右走
      snake.direction = snake.directionNum.left;
    }else if (e.code == 'ArrowUp' && snake.direction !== snake.directionNum.down) {
      snake.direction = snake.directionNum.up;
    }else if (e.code == 'ArrowRight' && snake.direction !== snake.directionNum.left) {
      snake.direction = snake.directionNum.right;
    }else if (e.code == 'ArrowDown' && snake.direction !== snake.directionNum.up) {
      snake.direction = snake.directionNum.down;
    }
  }
  this.start();
}
Game.prototype.start = function () {  
  this.timer = setInterval(function () {  
    snake.getNextPos();
  }, 200);
}
Game.prototype.over = function () {  
  clearInterval(this.timer);
  alert('你的得分为：'+ this.score);

  //游戏回到初始状态
  var snakeWrap = document.querySelector('.snakeWrap');
  snakeWrap.innerHTML = '';
  snake = new Snake();
  game = new Game();

  var startBtn = document.querySelector('.startBtn');
  startBtn.style.display = 'block';
}
Game.prototype.pause = function () {  
  clearInterval(this.timer);
}

//开始游戏
game = new Game();
var startBtn_Btn = document.querySelector('.startBtn button');
startBtn_Btn.onclick = function () {  
  startBtn_Btn.parentNode.style.display = 'none';
  game.init();
}

//暂停游戏
var snakeWrap = document.querySelector('.snakeWrap');
var pauseBtn_Btn = document.querySelector('.pauseBtn button')
snakeWrap.onclick = function () {  
  game.pause();
  pauseBtn_Btn.parentNode.style.display = 'block';
}
pauseBtn_Btn.onclick = function () {  
  game.start();
  pauseBtn_Btn.parentNode.style.display = 'none';
}
