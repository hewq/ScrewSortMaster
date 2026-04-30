declare const tt: unknown;

export class PlatformService {
  static isDouyinRuntime(): boolean {
    return typeof tt !== "undefined";
  }

  static isEditorOrBrowserRuntime(): boolean {
    return !this.isDouyinRuntime();
  }
}
