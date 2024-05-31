export const
  GR = 1.618033,

  HUM = 1,
  COM = 0,
  NONE = -1,

  SCALE = 1,
  SIZE = 800,
  TILE = 50,
  T_CNT = ~~(SIZE / TILE),

  random = (i: number = 1, a?: number): number => {
    if (!a) return Math.random() * i;
    return Math.random() * (a - i) + i;
  },

  choose = (arr: any[]): any => {
    return arr[~~random(arr.length)];
  };