import type { TileInfo } from './types';

export const TILE_DISTRIBUTION: Record<string, TileInfo> = {
  'A': { count: 10, points: 1 }, 'B': { count: 2, points: 5 }, 'C': { count: 5, points: 1 },
  'D': { count: 4, points: 3 }, 'E': { count: 9, points: 1 }, 'F': { count: 2, points: 4 },
  'G': { count: 2, points: 6 }, 'H': { count: 1, points: 8 }, 'I': { count: 11, points: 1 },
  'J': { count: 1, points: 10 }, 'L': { count: 5, points: 1 }, 'M': { count: 3, points: 4 },
  'N': { count: 6, points: 1 }, 'O': { count: 5, points: 2 }, 'P': { count: 4, points: 2 },
  'R': { count: 6, points: 1 }, 'S': { count: 6, points: 1 }, 'T': { count: 7, points: 1 },
  'U': { count: 5, points: 1 }, 'V': { count: 2, points: 4 }, 'X': { count: 1, points: 10 },
  'Z': { count: 1, points: 8 }, ' ': { count: 2, points: 0, blank: true },
};

export const RACK_SIZE = 7;
export const BOARD_SIZE = 15;
export const CENTER = 7;

export const BONUS = { DW: 'dw', TW: 'tw', DL: 'dl', TL: 'tl', CENTER: 'center' } as const;
export type BonusType = (typeof BONUS)[keyof typeof BONUS];

export const BONUS_MAP: Record<string, BonusType> = (() => {
  const m: Record<string, BonusType> = {};
  const set = (r: number, c: number, type: BonusType) => { m[`${r},${c}`] = type; };
  set(CENTER, CENTER, BONUS.CENTER);
  const symPairs: [number, number, BonusType][] = [
    [0, 0, BONUS.TW], [0, 3, BONUS.DL], [0, 7, BONUS.TW],
    [1, 1, BONUS.DW], [1, 5, BONUS.TL], [2, 2, BONUS.DW], [2, 6, BONUS.DL],
    [3, 0, BONUS.DL], [3, 3, BONUS.DW], [3, 7, BONUS.DL],
    [4, 4, BONUS.DW], [5, 1, BONUS.TL], [5, 5, BONUS.TL],
    [6, 2, BONUS.DL], [6, 6, BONUS.DL], [7, 0, BONUS.TW], [7, 3, BONUS.DL]
  ];
  symPairs.forEach(([r, c, t]) => {
    set(r, c, t); set(r, 14 - c, t); set(14 - r, c, t); set(14 - r, 14 - c, t);
  });
  return m;
})();

export const BONUS_LABELS: Partial<Record<BonusType, string>> = {
  [BONUS.DL]: '2\nLitera', [BONUS.TL]: '3\nLitera', [BONUS.DW]: '2\nCuvânt', [BONUS.TW]: '3\nCuvânt', [BONUS.CENTER]: '★'
};

export const DICT_URLS = ['/loc-reduse-6.0.txt'];
export const ROMANIAN_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'x', 'z'];
