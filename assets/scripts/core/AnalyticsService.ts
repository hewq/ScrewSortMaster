export class AnalyticsService {
  static track(eventName: string, params: Record<string, unknown> = {}): void {
    console.log(`[Analytics] ${eventName}`, params);
  }
}
