// src/configManager.ts
interface SiteInfo {
  name: string;
  description: string;
  author: string;
  version: string;
  license: string;
  contact: string;
  copyright: string;
}

interface WadoConfig {
  base_url: string;
  application_id: string;
  application_key: string;
}

interface OAuth2Config {
  authorization_url: string;
  client_id: string;
  client_secret: string;
}

export interface AppConfig {
  site_info: SiteInfo;
  wado_config: WadoConfig;
  oauth2_config: OAuth2Config;
}

// 扩展 Window 接口，为 APP_CONFIG 添加类型定义
declare global {
  interface Window {
    APP_CONFIG?: AppConfig;
  }
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: Readonly<AppConfig> | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  //todo: 采用WebAPI 获取配置信息，而不是使用静态文件
  async loadConfig(): Promise<Readonly<AppConfig>> {
    if (this.config) {
      return this.config;
    }

    this.config = Object.freeze({
      site_info: {
        name: "Medical Image Viewer",
        description: "A web application for viewing medical images using DICOM standards.",
        author: "momoStarSky",
        version: "1.0.0",
        license: "MIT",
        contact: "https://github.com/momostarsky/mobile-viewer",
        copyright: "Copyright © 2023 Starsky"
      },
      wado_config: {
        base_url: "http://localhost:8080",
        application_id: "1234567890",
        application_key: "hzxw4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2"
      },
      oauth2_config: {
        authorization_url: "https://example.com/oauth2/authorize",
        client_id: "1234567890",
        client_secret: "hzxw4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1"
      }
    });

    // 将配置赋值给全局 window 对象
    window.APP_CONFIG = this.config;

    return this.config;
  }

  getConfig(): Readonly<AppConfig> | null {
    return this.config;
  }
}

export const configManager = ConfigManager.getInstance();
export type { SiteInfo, WadoConfig, OAuth2Config };
