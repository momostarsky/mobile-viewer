import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.wasm'],
  plugins: [vue(), svelte(), viteCommonjs()],
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