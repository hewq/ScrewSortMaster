import { sys } from "cc";

const CURRENT_LEVEL_KEY = "screw_sort_current_level";
const TUTORIAL_DONE_KEY = "screw_sort_tutorial_done";

export class SaveManager {
  static getCurrentLevelIndex(): number {
    try {
      const value = sys.localStorage.getItem(CURRENT_LEVEL_KEY);
      if (!value) return 0;

      const index = Number(value);
      if (Number.isNaN(index)) return 0;

      return index;
    } catch (error) {
      console.warn("[SaveManager] getCurrentLevelIndex failed", error);
      return 0;
    }
  }

  static setCurrentLevelIndex(index: number): void {
    try {
      sys.localStorage.setItem(CURRENT_LEVEL_KEY, String(index));
    } catch (error) {
      console.warn("[SaveManager] setCurrentLevelIndex failed", error);
    }
  }

  static isTutorialDone(): boolean {
    try {
      return sys.localStorage.getItem(TUTORIAL_DONE_KEY) === "1";
    } catch (error) {
      console.warn("[SaveManager] isTutorialDone failed", error);
      return false;
    }
  }

  static setTutorialDone(done: boolean): void {
    try {
      sys.localStorage.setItem(TUTORIAL_DONE_KEY, done ? "1" : "0");
    } catch (error) {
      console.warn("[SaveManager] setTutorialDone failed", error);
    }
  }

  static clear(): void {
    try {
      sys.localStorage.removeItem(CURRENT_LEVEL_KEY);
      sys.localStorage.removeItem(TUTORIAL_DONE_KEY);
    } catch (error) {
      console.warn("[SaveManager] clear failed", error);
    }
  }
}
