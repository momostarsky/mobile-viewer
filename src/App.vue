<script setup lang="ts">
import MainContent from './components/MainContent.vue';
import ErrorConent from "./components/ErrorConent.vue";
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getRequestInformation } from './utils/helpers';
import { downloadJsonMetadata } from './utils/wado_downloader';
import type { DownloadErrorHandler } from './utils/wado_downloader';
import type { AppConfig } from './configManager';

// 添加响应式状态
const appReady = ref(false);
const errorInfo = ref<string>('');
const route = useRoute();
const studyMetadata = ref<any>(null);
const loading = ref(false);

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

// 错误处理回调
const handleError: DownloadErrorHandler = (err, response) => {
  loading.value = false;
  console.error('Download error:', err);
  errorInfo.value = `Failed to download study metadata: ${err.message}`;
};

// 获取 Study 元数据
const fetchStudyMetadata = async () => {
  console.log('Fetching study metadata for UID:', studyUid);

  if (!studyUid) {
    errorInfo.value = 'No study UID provided in query parameters';
    console.log('No study UID found');
    return false;
  }

  loading.value = true;
  errorInfo.value = '';

  try {
    const metadata = await downloadJsonMetadata(
      studyUid,
      undefined, // seriesUid
      undefined, // objectUid
      handleError
    );

    studyMetadata.value = metadata;
    console.log('Study metadata:', metadata);
    loading.value = false;
    return true;
  } catch (error) {
    loading.value = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while fetching metadata';
    errorInfo.value = `Failed to download study metadata: ${errorMsg}`;
    console.error('Error downloading metadata:', error);
    return false;
  }
};

// 初始化应用
const initializeApp = async () => {
  try {
    const requestInfo = getRequestInformation();
    console.log('Request info:', requestInfo);

    const config = (window as any).APP_CONFIG as AppConfig;
    if (config) {
      console.log('App config:', config);

      // 配置存在，尝试下载元数据
      const success = await fetchStudyMetadata();
      if (success) {
        // 下载成功，准备显示主内容
        appReady.value = true;
      }
      // 如果下载失败，errorInfo 已经被设置，将显示错误内容
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
  console.log('App component mounted');
  initializeApp();
});
</script>

<template>
  <!-- 根据状态显示内容 -->
  <div v-if="loading" class="loading">
    Loading study metadata...
  </div>
  <MainContent
    v-else-if="appReady"
    :study-metadata="studyMetadata"
    :study-uid="studyUid || ''"
  />
  <ErrorConent
    v-else
    id="txt_error"
    :error_info="errorInfo"
  />
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}
</style>
