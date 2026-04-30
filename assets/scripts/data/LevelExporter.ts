import { LevelConfig } from './LevelTypes';
import { LevelGenerator } from "./LevelGenerator";

export class LevelExporter {
  static exportGeneratedLevels(): void {
    const levels = LevelGenerator.generateBatch();

    const code = this.toTypeScriptCode(levels);

    console.log("====== COPY LEVEL CONFIG START ======");
    console.log(code);
    console.log("====== COPY LEVEL CONFIG END ======");
  }

  private static toTypeScriptCode(levels: LevelConfig[]): string {
    const levelTexts = levels.map((level) => {
      const slotsText = level.slots
        .map((slot) => `      [${slot.join(", ")}]`)
        .join(",\n");

      return `  {
    id: ${level.id},
    maxStack: ${level.maxStack},
    slots: [
${slotsText}
    ],
  }`;
    });

    return `import { LevelConfig } from './LevelConfig';

export const FixedLevelConfigs: LevelConfig[] = [
${levelTexts.join(",\n")}
];`;
  }
}
