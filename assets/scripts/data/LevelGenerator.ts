import { LevelConfig } from './LevelTypes';

export interface GenerateLevelOptions {
  id: number;
  colorCount: number;
  maxStack: number;
  emptySlotCount: number;
  shuffleTimes: number;
}

export class LevelGenerator {
  static generate(options: GenerateLevelOptions): LevelConfig {
    const { id, colorCount, maxStack, emptySlotCount, shuffleTimes } = options;

    const slots: number[][] = [];

    // 1. 先生成完成状态
    // 例如 3 色，每色 4 个：
    // [1,1,1,1], [2,2,2,2], [3,3,3,3]
    for (let color = 1; color <= colorCount; color++) {
      const slot: number[] = [];

      for (let i = 0; i < maxStack; i++) {
        slot.push(color);
      }

      slots.push(slot);
    }

    // 2. 添加空柱
    for (let i = 0; i < emptySlotCount; i++) {
      slots.push([]);
    }

    // 3. 从完成状态反向随机移动，保证理论可还原
    for (let i = 0; i < shuffleTimes; i++) {
      const movablePairs = this.findMovablePairs(slots, maxStack);

      if (movablePairs.length === 0) break;

      const randomIndex = Math.floor(Math.random() * movablePairs.length);
      const pair = movablePairs[randomIndex];

      this.move(slots, pair.from, pair.to);
    }

    // 4. 避免生成仍然已经完成的关卡
    if (this.isSolved(slots, maxStack)) {
      return this.generate({
        ...options,
        shuffleTimes: shuffleTimes + 5,
      });
    }

    return {
      id,
      maxStack,
      slots,
    };
  }

  static generateBatch(): LevelConfig[] {
    const levels: LevelConfig[] = [];

    const configs: GenerateLevelOptions[] = [
      // 教学：2 色，1 空柱
      { id: 1, colorCount: 2, maxStack: 4, emptySlotCount: 1, shuffleTimes: 8 },
      {
        id: 2,
        colorCount: 2,
        maxStack: 4,
        emptySlotCount: 1,
        shuffleTimes: 12,
      },
      {
        id: 3,
        colorCount: 3,
        maxStack: 4,
        emptySlotCount: 1,
        shuffleTimes: 16,
      },
      {
        id: 4,
        colorCount: 3,
        maxStack: 4,
        emptySlotCount: 1,
        shuffleTimes: 20,
      },
      {
        id: 5,
        colorCount: 3,
        maxStack: 4,
        emptySlotCount: 1,
        shuffleTimes: 24,
      },

      // 轻难度：4 色，2 空柱
      {
        id: 6,
        colorCount: 4,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 28,
      },
      {
        id: 7,
        colorCount: 4,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 32,
      },
      {
        id: 8,
        colorCount: 4,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 36,
      },
      {
        id: 9,
        colorCount: 4,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 40,
      },
      {
        id: 10,
        colorCount: 4,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 44,
      },

      // 中等：5 色，2 空柱
      {
        id: 11,
        colorCount: 5,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 48,
      },
      {
        id: 12,
        colorCount: 5,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 52,
      },
      {
        id: 13,
        colorCount: 5,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 56,
      },
      {
        id: 14,
        colorCount: 5,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 60,
      },
      {
        id: 15,
        colorCount: 5,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 64,
      },

      // 中高：6 色，2 空柱
      {
        id: 16,
        colorCount: 6,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 68,
      },
      {
        id: 17,
        colorCount: 6,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 72,
      },
      {
        id: 18,
        colorCount: 6,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 76,
      },
      {
        id: 19,
        colorCount: 6,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 80,
      },
      {
        id: 20,
        colorCount: 6,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 84,
      },

      // 困难测试：7 色，2 空柱
      {
        id: 21,
        colorCount: 7,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 88,
      },
      {
        id: 22,
        colorCount: 7,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 92,
      },
      {
        id: 23,
        colorCount: 7,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 96,
      },
      {
        id: 24,
        colorCount: 7,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 100,
      },
      {
        id: 25,
        colorCount: 7,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 104,
      },

      // 广告点测试：8 色，2 空柱，难度较高
      {
        id: 26,
        colorCount: 8,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 108,
      },
      {
        id: 27,
        colorCount: 8,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 112,
      },
      {
        id: 28,
        colorCount: 8,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 116,
      },
      {
        id: 29,
        colorCount: 8,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 120,
      },
      {
        id: 30,
        colorCount: 8,
        maxStack: 4,
        emptySlotCount: 2,
        shuffleTimes: 124,
      },
    ];

    configs.forEach((config) => {
      levels.push(this.generate(config));
    });

    return levels;
  }

  private static findMovablePairs(
    slots: number[][],
    maxStack: number,
  ): Array<{ from: number; to: number }> {
    const pairs: Array<{ from: number; to: number }> = [];

    for (let from = 0; from < slots.length; from++) {
      const fromSlot = slots[from];
      if (fromSlot.length === 0) continue;

      for (let to = 0; to < slots.length; to++) {
        if (from === to) continue;

        const toSlot = slots[to];
        if (toSlot.length >= maxStack) continue;

        pairs.push({ from, to });
      }
    }

    return pairs;
  }

  private static move(slots: number[][], from: number, to: number): void {
    const color = slots[from].pop();
    if (color === undefined) return;

    slots[to].push(color);
  }

  private static isSolved(slots: number[][], maxStack: number): boolean {
    return slots.every((slot) => {
      if (slot.length === 0) return true;
      if (slot.length !== maxStack) return false;

      const firstColor = slot[0];
      return slot.every((color) => color === firstColor);
    });
  }
}
