// src/configManager.ts
class ConfigManager {
  private static instance: ConfigManager;
  private config: Readonly<Record<string, any>> | null = null;
  private loadingPromise: Promise<Readonly<Record<string, any>>> | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // 添加重置方法用于测试
  static resetForTesting(): void {
    if (ConfigManager.instance) {
      ConfigManager.instance.config = null;
      ConfigManager.instance.loadingPromise = null;
    }
  }

  async loadConfig(): Promise<Readonly<Record<string, any>>> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    if (this.config) {
      return this.config;
    }

    this.loadingPromise = this.fetchConfig();
    this.config = await this.loadingPromise;
    return this.config;
  }

  private async fetchConfig(): Promise<Readonly<Record<string, any>>> {
    try {
      const response = await fetch('/site_config.json');

      // 更严格的类型检查
      if (!response || !response.ok) {
        throw new Error(`Failed to load config: ${response?.status || 'unknown'} ${response?.statusText || ''}`);
      }

      const config = await response.json();
      return Object.freeze(config);
    } catch (error: unknown) {
      console.warn('Failed to load site_config.json, using empty config:', error);
      return Object.freeze({});
    }
  }

  getConfig(): Readonly<Record<string, any>> | null {
    return this.config;
  }
}

export const configManager = ConfigManager.getInstance();
