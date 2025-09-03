<script setup lang="ts">
import MainContent from './components/MainContent.vue';
import ErrorConent from "./components/ErrorConent.vue";
import {ref, onMounted} from 'vue';
import {useRoute} from 'vue-router';
import {getRequestInformation} from './utils/helpers';
import {downloadJsonMetadata} from './utils/wado_downloader';
import type {DownloadErrorHandler} from './utils/wado_downloader';
import type {AppConfig} from './configManager';
import {useStudyStore} from './stores/studyStore'
import {octMetadataLoader} from "./utils/metadataLoader.ts";
// 添加响应式状态
const appReady = ref(false);
const errorInfo = ref<string>('');
const route = useRoute();
const studyMetadata = ref<any>(null);
const loading = ref(false);
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


// 确保 handleError 正确设置错误状态
const handleError: DownloadErrorHandler = (err, response) => {
  loading.value = false;
  appReady.value = false; // 确保不会显示主内容
  console.error('Download error:', err);

  // 提供更详细的错误信息
  if (response) {
    errorInfo.value = `Download study metadata failed with status ${response.status}: ${response.statusText}`;
  } else {
    errorInfo.value = `Download study metadata failed: ${err.message || err}`;
  }
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
  appReady.value = false; // 确保初始状态正确


  try {
    const metadata = await downloadJsonMetadata(
        studyUid,
        undefined, // seriesUid
        undefined, // objectUid
        handleError
    );

    // 检查元数据是否有效，空对象应视为错误
    if (!metadata || (typeof metadata === 'object' && Object.keys(metadata).length === 0)) {
      loading.value = false;
      const errorMsg = 'Received empty metadata from server';
      errorInfo.value = `Download study metadata failed: ${errorMsg}`;
      console.error('Error: Empty metadata received');
      return false;
    }
    studyMetadata.value = metadata;
    console.log('Study metadata:', metadata);
    // 使用 store 保存数据
    studyStore.setStudyData(metadata, studyUid);
    loading.value = false;
    return true;
  } catch (error) {
    // 这里捕获未被 onError 处理的异常（理论上不应该发生）
    loading.value = false;
    appReady.value = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred while fetching metadata';
    errorInfo.value = `Download study metadata failed: ${errorMsg}`;
    console.error('Error downloading metadata:', error);
    studyStore.setError(errorMsg);
    return false;
  }
};

// 初始化应用
const initializeApp = async () => {
  try {
    getRequestInformation();
    const config = (window as any).APP_CONFIG as AppConfig;
    if (config) {
      // 配置存在，尝试下载元数据


      const success = await fetchStudyMetadata();
      if (success) {
        // 只有在成功获取元数据后才设置应用就绪状态
        appReady.value = true;
      }
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

    <MainContent/>

</template>

<style scoped>
.loading {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}
</style>
