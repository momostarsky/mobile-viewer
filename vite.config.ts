import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {viteCommonjs} from "@originjs/vite-plugin-commonjs";

export default defineConfig({
    assetsInclude: ['**/*.wasm'],
    plugins: [
        vue(),
        svelte(),
        viteCommonjs(),
    ],
    resolve: {
        alias: {
            'cornerstone-core': '@cornerstonejs/core',
            'cornerstone-tools': '@cornerstonejs/tools',
        },
    },
    optimizeDeps: {
        include: [

        ],
        exclude: [
            'cornerstone-math',
            'cornerstone-tools',
            'cornerstone-wado-image-loader',
            'cornerstone-web-image-loader',
            'cornerstone-file-image-loader',
            'cornerstone-streaming-image-loader',
            'cornerstone-dicom-pdf-loader',
            'cornerstone-dicom-video-loader',
            'decodeImageFrameWorker.js',
            '@cornerstonejs/dicom-image-loader/dist/esm/decodeImageFrameWorker.js'
        ],
        // 强制预构建，解决某些环境下动态导入问题
        force: true
    },
    publicDir: 'public', // 确保 public 目录中的文件会被 serve
    server: {
        port: 3000,
        host: true, // 允许局域网访问，方便手机测试
        open: '/?study_uid=1.2.156.112605.0.1685486876.2025061710152134339.2.1.1'
    },
    worker: {
        format: 'es',
        plugins: () => []  // 改为函数形式
    },
    // 构建配置
    build: {
        rollupOptions: {
            external: ['site_config.json'] // 构建时排除配置文件
        }
    },
    test: {
        environment: 'jsdom', // 使用 jsdom 环境提供浏览器 API
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{ts,js}'],

        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**'
        ]
    }
})