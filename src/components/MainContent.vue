<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { downloadJsonMetadata } from '../utils/wado_downloader'
import type { DownloadErrorHandler } from '../utils/wado_downloader'

defineProps<{ msg: string }>()

const count = ref(0)
const route = useRoute()
const studyMetadata = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 添加调试日志
console.log('Route object:', route)
console.log('Route query:', route.query)
console.log('Route params:', route.params)
console.log('Window location search:', window.location.search)

// 多种方式获取 studyUid
const studyUid = route.params.studyUid as string ||
                route.query.studyUid as string ||
                route.query.study_uid as string ||
                new URLSearchParams(window.location.search).get('study_uid') ||
                new URLSearchParams(window.location.search).get('studyUid')

// 错误处理回调
const handleError: DownloadErrorHandler = (err, response) => {
  error.value = err.message
  loading.value = false
  console.error('Download error:', err)
}

// 获取 Study 元数据
const fetchStudyMetadata = async () => {
  if (!studyUid) {
    error.value = 'No study UID provided'
    return
  }

  loading.value = true
  error.value = null

  try {
    const metadata = await downloadJsonMetadata(
      studyUid,
      undefined, // seriesUid
      undefined, // objectUid
      handleError
    )

    studyMetadata.value = metadata
    console.log('Study metadata:', metadata)
  } finally {
    loading.value = false
  }
}

// 组件挂载时自动获取元数据
onMounted(() => {
  console.log('Component mounted. Study UID value:', studyUid)
  if (studyUid) {
    console.log('Found study UID in query parameters:', studyUid)
    fetchStudyMetadata()
  } else {
    console.log('No study UID found in route params or query')
  }
})
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <div class="study-section">
    <div v-if="!studyUid" class="warning">
      No Study UID provided in route parameters or query.<br>
      Please use URL format: http://localhost:3000/?study_uid=YOUR_STUDY_UID<br>
      Current route query: {{ JSON.stringify(route.query) }}<br>
      Window location search: {{ window.location.search }}
    </div>

    <div v-else>
      <p>Study UID: {{ studyUid }}</p>
      <button @click="fetchStudyMetadata" :disabled="loading">
        {{ loading ? 'Loading...' : 'Fetch Study Metadata' }}
      </button>

      <div v-if="error" class="error">
        Error: {{ error }}
      </div>

      <div v-if="studyMetadata" class="metadata-result">
        <h3>Study Metadata</h3>
        <pre>{{ JSON.stringify(studyMetadata, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}

.study-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.warning {
  color: orange;
  font-weight: bold;
  padding: 10px;
  background-color: #fff8e1;
  border-radius: 4px;
}

.error {
  color: #d32f2f;
  margin: 10px 0;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.metadata-result {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
}

.metadata-result h3 {
  margin-top: 0;
  color: #333;
}

.metadata-result pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-size: 12px;
  background-color: #fff;
  padding: 8px;
  border-radius: 4px;
}
</style>
