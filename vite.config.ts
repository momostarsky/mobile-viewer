import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { copyFileSync, existsSync } from 'fs';
// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  plugins: [
      vue(),
      svelte(),
      viteCommonjs(),
      copyFiles([
          { from: 'src/site_config.json', to: 'dist/site_config.json' }
      ])
  ],
  resolve: {
    alias: {
      'cornerstone-core': '@cornerstonejs/core',
      'cornerstone-tools': '@cornerstonejs/tools',
    },
  },
  optimizeDeps: {
    include: [
      '@cornerstonejs/core',
      '@cornerstonejs/tools',
      'cornerstone-microscopy-tools'
    ],
    exclude: [
      'cornerstone-math',
      'cornerstone-tools',
      'cornerstone-wado-image-loader',
      'cornerstone-web-image-loader',
      'cornerstone-file-image-loader',
      'cornerstone-streaming-image-loader',
      'cornerstone-dicom-pdf-loader',
      'cornerstone-dicom-video-loader'
    ],
    // 强制预构建，解决某些环境下动态导入问题
    force: true
  },
  // 开发服务器配置 (可选)
  server: {
    port: 3000,
    host: true, // 允许局域网访问，方便手机测试
  }
})




// 通用文件复制插件函数
// 通用文件复制插件函数
function copyFiles(files: { from: string; to: string }[]) {
    return {
        name: 'copy-files',
        closeBundle() {
            files.forEach(({ from, to }) => {
                if (existsSync(from)) {
                    try {
                        copyFileSync(from, to);
                        console.log(`${from} copied to ${to}`);
                    } catch (error: unknown) {
                        // 方法1: 类型检查
                        if (error instanceof Error) {
                            console.warn(`Failed to copy ${from}:`, error.message);
                        } else {
                            console.warn(`Failed to copy ${from}:`, String(error));
                        }

                        // 或者方法2: 类型断言（更简单）
                        // console.warn(`Failed to copy ${from}:`, (error as Error).message);
                    }
                } else {
                    console.warn(`${from} not found, skipping copy`);
                }
            });
        }
    };
}