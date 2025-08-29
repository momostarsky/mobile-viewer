import { vi } from 'vitest';
import 'fake-indexeddb/auto';
// 确保在每个测试前清理 fetch mock
beforeEach(() => {
    // 确保 fetch 被正确模拟
    global.fetch = vi.fn();
});

afterEach(() => {
    vi.resetAllMocks();
});