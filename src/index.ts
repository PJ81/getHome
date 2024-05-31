import Board from "./board.js";
import { SCALE, SIZE, TILE } from "./consts.js";

class GetHome {

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  lastTime: number;
  board: Board;
  loop: (time?: number) => void;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.addEventListener("click", (me) => this.click(me));
    this.canvas.id = "main";
    this.canvas.style.imageRendering = "pixelated";
    this.canvas.width = SIZE * SCALE;
    this.canvas.height = SIZE * SCALE;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(SCALE, SCALE);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.font = `${TILE * .75}px Consolas`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle"

    document.body.appendChild(this.canvas);

    this.lastTime = 0;
    this.board = new Board(this.ctx);

    this.loop = (time = 0) => {
      this.update(Math.min((time - this.lastTime) / 1000, .25));
      this.ctx.clearRect(0, 0, SIZE, SIZE);
      this.draw();
      this.lastTime = time;
      requestAnimationFrame(this.loop);
    }

    this.loop();
  }

  click(ev: MouseEvent): void {
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.board.click(~~((ev.clientX - rect.left) / TILE), ~~((ev.clientY - rect.top) / TILE));
  }

  update(dt: number): void {
    this.board.update(dt);
  }

  draw(): void {
    this.board.draw();
  }

}

const gh = new GetHome();