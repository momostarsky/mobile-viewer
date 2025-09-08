// svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {{preprocess: PreprocessorGroup, compilerOptions: {dev: boolean, css: string}}} */
const config = {
  // 参考: https://svelte.dev/docs/configuration
  preprocess: vitePreprocess({ script: true }),
  compilerOptions: {
    // 开发模式下启用更多检查
    dev: true,
    css: 'injected',
  },
};
export default config;