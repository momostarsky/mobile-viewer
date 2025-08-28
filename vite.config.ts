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
      copyDevConfig(),
      copyProdFiles([
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
  publicDir: 'public', // 确保 public 目录中的文件会被 serve
  server: {
    port: 3000,
    host: true, // 允许局域网访问，方便手机测试
  },
    // 构建配置
    build: {
        rollupOptions: {
            external: ['site_config.json'] // 构建时排除配置文件
        }
    }
})



// 自定义插件：开发时复制配置文件

function copyDevConfig() {
    return {
        name: 'copy-dev-config',
        apply: 'serve' as const,
        buildStart() {
            const source = 'src/site_config.json';
            const target = 'public/site_config.json';

            if (existsSync(source)) {
                try {
                    copyFileSync(source, target);
                    console.log('site_config.json copied to public/');
                } catch (error) {
                    console.warn('Failed to copy site_config.json to public/:', error);
                }
            } else {
                console.warn('site_config.json not found in project root');
            }
        }
    };
}

// 通用文件复制插件函数
// 通用文件复制插件函数
function copyProdFiles(files: { from: string; to: string }[]) {
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