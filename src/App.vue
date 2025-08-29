<script setup lang="ts">
import MainContent from './components/MainContent.vue';
import ErrorConent from "./components/ErrorConent.vue";
import { ref, onMounted } from 'vue';
import { getRequestInformation } from './utils/helpers';
import type { AppConfig } from './configManager';

// 可以添加响应式状态
const appReady = ref(false);
const errorInfo = ref<string>('');

// 可以将初始化逻辑封装为函数
const initializeApp = async () => {
  try {
    const requestInfo = getRequestInformation();
    console.log('Request info:', requestInfo);

    const config = (window as any).APP_CONFIG as AppConfig;
    if (config) {
      console.log('App config:', config);
      // 执行基于配置的初始化
      appReady.value = true;
    } else {
      // 配置不存在，设置错误信息
      const errorMsg = 'Application configuration is not available. Please check your configuration file.';
      console.error(errorMsg);
      errorInfo.value = errorMsg;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred during app initialization';
    console.error('App initialization failed:', errorMsg);
    errorInfo.value = errorMsg;
  }
};

onMounted(() => {
  initializeApp();
});
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo"/>
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo"/>
    </a>
  </div>

  <!-- 根据状态显示内容 -->
  <MainContent v-if="appReady" msg="Vite + Vue"/>
  <ErrorConent v-else id="txt_error" :error_info="errorInfo"/>
</template>
