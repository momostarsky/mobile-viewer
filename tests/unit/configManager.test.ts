// tests/unit/configManager.test.ts
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { configManager } from '../../src/configManager';

describe('ConfigManager', () => {
  beforeEach(() => {
    // 重置 ConfigManager 实例的状态
    (configManager.constructor as any).resetForTesting();
    vi.restoreAllMocks();
  });

  describe('loadConfig', () => {
    it('should load config successfully', async () => {
      // 模拟 fetch 返回成功响应
      const mockConfig = {
        name: 'Test App',
        version: '1.0.0',
        api: { url: 'https://api.test.com' }
      };

      // 正确模拟 fetch 返回值，确保包含所有必要的属性
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'content-type') {
              return 'application/json';
            }
            return null;
          })
        },
        json: vi.fn().mockResolvedValue(mockConfig)
      } as Response);

      const config = await configManager.loadConfig();

      expect(config).toEqual(mockConfig);
      expect(Object.isFrozen(config)).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/site_config.json');
    });

    it('should return cached config on subsequent calls', async () => {
      const mockConfig = { name: 'Test App' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'content-type') {
              return 'application/json';
            }
            return null;
          })
        },
        json: vi.fn().mockResolvedValue(mockConfig)
      } as Response);

      // 第一次加载
      const config1 = await configManager.loadConfig();
      // 第二次加载
      const config2 = await configManager.loadConfig();

      expect(config1).toBe(config2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      // 模拟网络错误
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const config = await configManager.loadConfig();

      expect(config).toEqual({});
      expect(Object.isFrozen(config)).toBe(true);
    });

    it('should handle non-ok responses', async () => {
      // 模拟 404 响应
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: vi.fn().mockReturnValue(null)
        },
        json: vi.fn().mockResolvedValue({})
      } as Response);

      const config = await configManager.loadConfig();

      expect(config).toEqual({});
      expect(Object.isFrozen(config)).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return null when config is not loaded', () => {
      (configManager.constructor as any).resetForTesting();
      expect(configManager.getConfig()).toBeNull();
    });

    it('should return config after loading', async () => {
      const mockConfig = { name: 'Test App' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'content-type') {
              return 'application/json';
            }
            return null;
          })
        },
        json: vi.fn().mockResolvedValue(mockConfig)
      } as Response);

      await configManager.loadConfig();
      const config = configManager.getConfig();

      expect(config).toEqual(mockConfig);
    });
  });

  describe('concurrent requests', () => {
    it('should share the same promise for concurrent calls', async () => {
      const mockConfig = { name: 'Test App' };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'content-type') {
              return 'application/json';
            }
            return null;
          })
        },
        json: vi.fn().mockResolvedValue(mockConfig)
      } as Response);

      // 同时发起多个请求
      const promises = [
        await configManager.loadConfig(),
        await configManager.loadConfig(),
        await configManager.loadConfig()
      ];

      const results = await Promise.all(promises);

      // 所有结果应该相同
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
      // fetch 只应该被调用一次
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
