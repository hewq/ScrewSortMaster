export type ColorId = number;

export interface LevelConfig {
  id: number;
  maxStack: number;
  slots: ColorId[][];
}
