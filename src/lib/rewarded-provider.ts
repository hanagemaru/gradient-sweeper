/**
 * 広告プロバイダインターフェース
 */
export interface RewardedProvider {
  init(config: unknown): void;
  isAvailable(): boolean;
  show(): Promise<"completed" | "skipped" | "failed">;
}

/**
 * モック広告プロバイダ（MVP用）
 * 即座に completed を返す
 */
export class MockRewardedProvider implements RewardedProvider {
  private initialized = false;

  init(_config: unknown): void {
    this.initialized = true;
    console.log("[MockRewardedProvider] Initialized");
  }

  isAvailable(): boolean {
    return this.initialized;
  }

  async show(): Promise<"completed" | "skipped" | "failed"> {
    console.log("[MockRewardedProvider] Showing mock ad...");
    
    // 実際の広告視聴を模擬するため少し待機
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    console.log("[MockRewardedProvider] Ad completed");
    return "completed";
  }
}

// シングルトンインスタンス
let rewardedProvider: RewardedProvider | null = null;

export function getRewardedProvider(): RewardedProvider {
  if (!rewardedProvider) {
    rewardedProvider = new MockRewardedProvider();
    rewardedProvider.init({});
  }
  return rewardedProvider;
}

/**
 * 広告を表示して結果を返す
 */
export async function showRewardedAd(): Promise<"completed" | "skipped" | "failed"> {
  const provider = getRewardedProvider();
  
  if (!provider.isAvailable()) {
    console.warn("[RewardedProvider] Not available");
    return "failed";
  }
  
  return provider.show();
}
