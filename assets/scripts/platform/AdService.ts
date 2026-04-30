export type RewardAdPlacement =
  | "hint"
  | "extra_slot"
  | "coin_double"
  | "skip_level";

export interface ShowRewardAdOptions {
  placement: RewardAdPlacement;
  onSuccess: () => void;
  onFail?: (reason: string) => void;
  onCancel?: () => void;
}

interface TTRewardedVideoAd {
  show: () => Promise<void>;
  load: () => Promise<void>;
  onLoad: (callback: () => void) => void;
  offLoad?: (callback: () => void) => void;
  onError: (
    callback: (error: { errCode?: number; errMsg?: string }) => void,
  ) => void;
  offError?: (
    callback: (error: { errCode?: number; errMsg?: string }) => void,
  ) => void;
  onClose: (
    callback: (result: { isEnded?: boolean; count?: number }) => void,
  ) => void;
  offClose?: (
    callback: (result: { isEnded?: boolean; count?: number }) => void,
  ) => void;
  destroy?: () => void;
}

declare const tt:
  | {
      createRewardedVideoAd?: (options: {
        adUnitId: string;
      }) => TTRewardedVideoAd;
    }
  | undefined;

const REWARD_AD_UNIT_IDS: Record<RewardAdPlacement, string> = {
  hint: "填写你的提示广告位ID",
  extra_slot: "填写你的空柱广告位ID",
  coin_double: "填写你的金币翻倍广告位ID",
  skip_level: "填写你的跳关广告位ID",
};

export class AdService {
  private static rewardedVideoAd: TTRewardedVideoAd | null = null;
  private static currentAdUnitId = "";

  static showRewardAd(options: ShowRewardAdOptions): void {
    if (!this.isDouyinRuntime()) {
      this.showMockRewardAd(options);
      return;
    }

    const adUnitId = REWARD_AD_UNIT_IDS[options.placement];

    if (!adUnitId || adUnitId.includes("填写你的")) {
      console.warn("[AdService] missing adUnitId, fallback to mock", {
        placement: options.placement,
      });

      this.showMockRewardAd(options);
      return;
    }

    this.showDouyinRewardAd(adUnitId, options);
  }

  private static isDouyinRuntime(): boolean {
    return (
      typeof tt !== "undefined" &&
      typeof tt.createRewardedVideoAd === "function"
    );
  }

  private static showMockRewardAd(options: ShowRewardAdOptions): void {
    console.log("[AdService] mock showRewardAd", {
      placement: options.placement,
    });

    setTimeout(() => {
      console.log("[AdService] mock reward success", {
        placement: options.placement,
      });

      options.onSuccess();
    }, 500);
  }

  private static showDouyinRewardAd(
    adUnitId: string,
    options: ShowRewardAdOptions,
  ): void {
    const ad = this.getRewardedVideoAd(adUnitId);

    let hasSettled = false;

    const cleanup = (): void => {
      if (ad.offClose) ad.offClose(handleClose);
      if (ad.offError) ad.offError(handleError);
    };

    const settleSuccess = (): void => {
      if (hasSettled) return;
      hasSettled = true;
      cleanup();

      console.log("[AdService] reward success", {
        placement: options.placement,
      });

      options.onSuccess();
    };

    const settleCancel = (): void => {
      if (hasSettled) return;
      hasSettled = true;
      cleanup();

      console.log("[AdService] reward cancel", {
        placement: options.placement,
      });

      options.onCancel?.();
    };

    const settleFail = (reason: string): void => {
      if (hasSettled) return;
      hasSettled = true;
      cleanup();

      console.warn("[AdService] reward fail", {
        placement: options.placement,
        reason,
      });

      options.onFail?.(reason);
    };

    const handleClose = (result: {
      isEnded?: boolean;
      count?: number;
    }): void => {
      const hasReward =
        typeof result?.count === "number"
          ? result.count > 0
          : result?.isEnded === true;

      if (hasReward) {
        settleSuccess();
      } else {
        settleCancel();
      }
    };

    const handleError = (error: {
      errCode?: number;
      errMsg?: string;
    }): void => {
      const reason = `${error.errCode ?? "unknown"}:${error.errMsg ?? "unknown_error"}`;
      settleFail(reason);
    };

    ad.onClose(handleClose);
    ad.onError(handleError);

    ad.show()
      .then(() => {
        console.log("[AdService] reward ad show success");
      })
      .catch((showError) => {
        console.warn(
          "[AdService] reward ad show failed, try load then show",
          showError,
        );

        ad.load()
          .then(() => ad.show())
          .catch((loadError) => {
            const reason =
              loadError?.errMsg ??
              loadError?.message ??
              "reward_ad_load_or_show_failed";
            settleFail(reason);
          });
      });
  }

  private static getRewardedVideoAd(adUnitId: string): TTRewardedVideoAd {
    if (this.rewardedVideoAd && this.currentAdUnitId === adUnitId) {
      return this.rewardedVideoAd;
    }

    if (this.rewardedVideoAd?.destroy) {
      this.rewardedVideoAd.destroy();
    }

    this.currentAdUnitId = adUnitId;

    this.rewardedVideoAd = tt.createRewardedVideoAd!({
      adUnitId,
    });

    return this.rewardedVideoAd;
  }
}
