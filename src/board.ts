import { COM, GR, HUM, NONE, SIZE, TILE, T_CNT, choose, random } from "./consts.js";
import Point from "./point.js";

export default class Board {
  losingSpots: Point[];
  legalMoves: Point[];
  tile: Point;
  pos: Point;
  home: Point;
  target: Point;
  dir: Point;
  moving: boolean;
  gameOver: boolean;
  initialized: boolean;
  ctx: CanvasRenderingContext2D;
  goTimer: number;
  playerStart: number;
  player: number;
  curPlayer: number;
  thinking: number;
  board: number[][];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.moving = false;
    this.gameOver = false;
    this.initialized = false;
    this.home = new Point(0, T_CNT - 1);
    this.tile = new Point();
    this.pos = new Point();
    this.dir = new Point();
    this.target = new Point();
    this.legalMoves = [];
    this.thinking = 0;
    this.player = COM;
    this.curPlayer = COM;
    this.playerStart = COM;

    this.createBoard();
    this.calculateLosingSpots();
  }

  createBoard(): void {
    this.board = [];
    let a = 0;
    for (let y = 0; y < T_CNT; y++) {
      this.board.push([]);
      for (let x = 0; x < T_CNT; x++) {
        this.board[y].push(a);
        a = a === 0 ? 1 : 0;
      }
      if (T_CNT % 2 === 0) a = a === 0 ? 1 : 0;
    }
  }

  inBounds(x: number, y: number): boolean {
    return (x >= 0 && y >= 0 && x < T_CNT && y < T_CNT);
  }

  calculateLosingSpots(): void {
    this.losingSpots = [];
    const GR2 = GR * GR, cnt = T_CNT - 1;
    let x: number, y: number;
    for (let e = 0; e < T_CNT; e++) {

      x = ~~(e * GR);
      y = ~~(cnt - ~~(e * GR2));
      if (this.inBounds(x, y)) this.losingSpots.push(new Point(x, y));

      x = ~~(e * GR2);
      y = ~~(cnt - ~~(e * GR));
      if (this.inBounds(x, y)) this.losingSpots.push(new Point(x, y));
    }

    this.losingSpots.sort(() => { return random(-1, 1) })
  }

  click(x: number, y: number): void {
    if (this.player !== HUM) return;

    this.curPlayer = NONE;

    if (!this.initialized) {
      this.setPiece(x, y);
    } else {
      this.movePiece(x, y);
    }
  }

  nextPlayer(): void {
    this.player = this.player === COM ? HUM : COM;
    this.curPlayer = this.player;
  }

  setPiece(x: number = 0, y: number = 0): void {
    if (y > 0) return;

    this.initialized = true;
    this.tile.set(x, y);
    this.pos.set(x * TILE, y * TILE);
    this.board[y][x] += 2;
    this.getAllLegalMoves();
    this.nextPlayer();
  }

  getAllLegalMoves(): void {
    this.legalMoves.length = 0;

    for (let a = this.tile.x - 1; a >= 0; a--) {
      this.legalMoves.push(new Point(a, this.tile.y));
    }

    for (let b = this.tile.y + 1; b < T_CNT; b++) {
      this.legalMoves.push(new Point(this.tile.x, b));
    }

    for (let a = this.tile.x - 1, b = this.tile.y + 1; a >= 0 && b < T_CNT; a--, b++) {
      this.legalMoves.push(new Point(a, b));
    }
  }

  movePiece(x: number, y: number): void {
    if (this.moving || (this.tile.x === x && this.tile.y === y)) return;
    const pt = new Point(x, y);
    if (this.legalMoves.find(m => m.equals(pt)) === undefined) return;

    this.board[this.tile.y][this.tile.x] = (this.board[this.tile.y][this.tile.x] ^ 2);
    this.target.set(x * TILE, y * TILE);
    this.dir.set(this.target.x - this.pos.x, this.target.y - this.pos.y);
    this.dir.normalize();
    this.moving = true;
  }

  computerMove(): void {
    if (!this.initialized) {
      this.setPiece(~~random(T_CNT - 5) + 4, 0);
    } else {
      // try to win
      if (this.legalMoves.find(m => m.equals(this.home)) !== undefined) {
        this.movePiece(this.home.x, this.home.y);
      } else {
        // search for a losing spot
        for (const t of this.losingSpots) {
          if (this.legalMoves.find(m => m.equals(t)) !== undefined) {
            this.movePiece(t.x, t.y);
            return;
          }
        }

        // random position
        const mx = T_CNT - 1;
        let maxSearch = 0;
        let pt = new Point(0, T_CNT - 1);

        while (true) {
          pt = choose(this.legalMoves);
          if (pt.x !== 0 && pt.y !== mx && (mx - pt.y !== pt.x))
            break;
          if (++maxSearch > 500) break;
        }
        this.movePiece(pt.x, pt.y);
      }
    }

    this.thinking = 1;
  }

  update(dt: number): void {
    if (this.gameOver) {
      if ((this.goTimer -= dt) < 0) {
        this.gameOver = false;
        this.player = this.playerStart;
        this.playerStart = this.playerStart === COM ? HUM : COM;
        this.board[this.tile.y][this.tile.x] = (this.board[this.tile.y][this.tile.x] ^ 2);
        this.nextPlayer();
        this.initialized = false;
      }
      return;
    }

    if (this.curPlayer === COM && (this.thinking -= dt) < 0) {
      this.curPlayer = NONE;
      this.computerMove();
    }

    if (!this.moving) return;

    const spd = dt * 150;
    this.pos.x += this.dir.x * spd;
    this.pos.y += this.dir.y * spd;

    if (this.pos.distSqr(this.target) < 2) {
      this.pos.setPt(this.target);
      this.tile.set(this.pos.x / TILE, this.pos.y / TILE);
      this.moving = false;
      this.nextPlayer();
      this.getAllLegalMoves();

      if (this.legalMoves.length === 0) {
        this.gameOver = true;
        this.goTimer = 3;
        this.curPlayer = NONE;
      }
    }
  }

  drawQuad(pt: Point, clr: string): void {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = clr;
    this.ctx.rect(pt.x * TILE + 4, pt.y * TILE + 4, TILE - 8, TILE - 8);
    this.ctx.stroke();
    this.ctx.restore();
  }

  draw(): void {
    let clr: string;
    this.ctx.beginPath();

    for (let y = 0; y < T_CNT; y++) {
      for (let x = 0; x < T_CNT; x++) {
        if ((this.board[y][x] & 1) === 0) {
          clr = "#777";
        } else {
          clr = "#aaa";
        }

        this.ctx.fillStyle = clr;
        this.ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        this.ctx.rect(x * TILE, y * TILE, TILE, TILE);
      }
    }

    this.ctx.stroke();

    this.legalMoves.forEach(m => this.drawQuad(m, "#048"));
    //this.losingSpots.forEach(m => this.drawQuad(m, "#700"));
    this.drawQuad(this.home, "#070");

    if (this.initialized) {
      const z = TILE >> 1, w = z >> 2;
      this.ctx.fillStyle = "#000";
      this.ctx.fillText("♝", z + this.pos.x, w + z + this.pos.y);
    }

    if (this.gameOver) {
      this.ctx.save();
      this.ctx.font = "100px Consolas";
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = "#fff";
      this.ctx.fillStyle = "#62f";
      this.ctx.fillText("GAME OVER!", SIZE >> 1, SIZE >> 1);
      this.ctx.restore();
    }
  }
}