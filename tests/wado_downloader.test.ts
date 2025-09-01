import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadJsonMetadata } from '../src/utils/wado_downloader';
import { getRequestInformation } from '../src/utils/helpers';
import testData from './test.json';

// Mock helpers
vi.mock('../src/utils/helpers', () => ({
  getRequestInformation: vi.fn()
}));

// Mock window.APP_CONFIG
const mockAppConfig = {
  wado_config: {
    base_url: 'http://localhost:8080'
  }
};

describe('wado_downloader', () => {
  beforeEach(() => {
    // Mock window.APP_CONFIG
    (window as any).APP_CONFIG = mockAppConfig;

    // Mock getRequestInformation
    (getRequestInformation as jest.Mock).mockReturnValue({
      jwtToken: {
        isValid: false,
        token: null
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadJsonMetadata', () => {
    it('should download JSON metadata successfully', async () => {
      // Mock fetch
      const mockMetadata = [{
        "00080018": { "vr": "UI", "Value": ["1.2.156.112605.0.1685486876.2025061710152134339.2.1.1"] },
        "00080020": { "vr": "DA", "Value": ["20250617"] }
      }];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockMetadata)
      } as any);

      const onError = vi.fn();
      const result = await downloadJsonMetadata(
        '1.2.156.112605.0.1685486876.2025061710152134339.2.1.1',
        undefined,
        undefined,
        onError
      );

      // 验证结果
      expect(result).toEqual(mockMetadata);

      // 验证 fetch 调用
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/studies/1.2.156.112605.0.1685486876.2025061710152134339.2.1.1/metadata',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/dicom+json'
          }
        }
      );

      // 验证没有调用错误处理
      expect(onError).not.toHaveBeenCalled();
    });


    // 新增测试：验证返回与 test.json 一致的数据
    it('should return metadata consistent with test.json structure', async () => {
      // 模拟 fetch 返回 test.json 中的数据结构
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(testData.seriesData)
      } as any);

      const onError = vi.fn();
      const result = await downloadJsonMetadata(
        '1.2.156.112605.0.1685486876.2025061710152134339.2.1.1',
        undefined,
        undefined,
        onError
      );

      // 验证结果结构
      expect(result).toEqual(testData.seriesData);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // 验证第一个元素包含预期的属性
      const firstSeries = result[0];
      expect(firstSeries).toHaveProperty('00080020'); // Study Date
      expect(firstSeries).toHaveProperty('00080030'); // Study Time
      expect(firstSeries).toHaveProperty('00080060'); // Modality
      expect(firstSeries).toHaveProperty('0020000E'); // Series Instance UID
      expect(firstSeries).toHaveProperty('sopData');  // SOP 数据数组

      // 验证 sopData 结构
      expect(Array.isArray(firstSeries.sopData)).toBe(true);
      expect(firstSeries.sopData.length).toBeGreaterThan(0);

      const firstSop = firstSeries.sopData[0];
      expect(firstSop).toHaveProperty('00080018'); // SOP Instance UID
      expect(firstSop).toHaveProperty('00280010'); // Rows
      expect(firstSop).toHaveProperty('00280011'); // Columns

      // 验证没有调用错误处理
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
