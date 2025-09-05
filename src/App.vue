<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useRoute} from 'vue-router';
import {getRequestInformation} from './utils/helpers';
import type {AppConfig} from './configManager';
import { useStudyStore } from './stores/studyStore';

// 添加响应式状态
const appReady = ref(false);
const errorInfo = ref<string>('');
const route = useRoute();
const studyStore = useStudyStore();

// 添加调试日志
console.log('Route object:', route);
console.log('Route query:', route.query);
console.log('Window location search:', window.location.search);

// 多种方式获取 studyUid
const getStudyUid = (): string | null => {
  // 方法1: 从 Vue Router 查询参数获取
  if (route.query.study_uid) return route.query.study_uid as string;
  if (route.query.studyUid) return route.query.studyUid as string;

  // 方法2: 直接从 URLSearchParams 获取
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('study_uid')) return urlParams.get('study_uid');
  if (urlParams.has('studyUid')) return urlParams.get('studyUid');

  // 方法3: 手动解析查询字符串
  const search = window.location.search.substring(1);
  const params = search.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=');
    if (key && value) {
      acc[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);

  if (params['study_uid']) return params['study_uid'];
  if (params['studyUid']) return params['studyUid'];

  return null;
};

// 获取 studyUid
const studyUid = getStudyUid();

console.log('Extracted studyUid:', studyUid);

// 初始化应用
const initializeApp = async () => {
  try {
    getRequestInformation();
    const config = (window as any).APP_CONFIG as AppConfig;
    if (config) {
      // 设置 store 数据
      if (studyUid) {
        studyStore.setStudyData(null, studyUid);
      }
      // 配置存在，尝试下载元数据
      // 只有在成功获取元数据后才设置应用就绪状态
      appReady.value = true;
      // 如果下载失败，errorInfo 已经被设置，将显示错误内容
    } else {
      // 配置不存在，设置错误信息
      const errorMsg = 'Application configuration is not available. Please check your configuration file.';
      console.error(errorMsg);
      errorInfo.value = errorMsg;
      appReady.value = false; // 确保不显示主内容
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred during app initialization';
    console.error('App initialization failed:', errorMsg);
    errorInfo.value = errorMsg;
    appReady.value = false; // 确保不显示主内容
  }
};

onMounted(() => {
  console.log('App component mounted');
  initializeApp();
});
</script>

<template>
  <!-- 使用 router-view 来显示路由匹配的组件 -->
  <router-view v-if="appReady" />

  <!-- 只有当 appReady 为 true 时才显示 MainContent -->
  <div v-if="!appReady && !errorInfo" class="loading">
    Loading...
  </div>

  <!-- 错误信息显示 -->
  <div v-if="errorInfo" class="error">
    Error: {{ errorInfo }}
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}

.error {
  text-align: center;
  padding: 20px;
  font-size: 18px;
  color: red;
}
</style>
