<script setup lang="ts">
import { ref } from 'vue'

// 接收从 App.vue 传递的属性
const props = defineProps<{
  studyMetadata?: any,
  studyUid?: string
}>()
ref(0);
</script>

<template>
  <div class="study-section">
    <div v-if="studyUid">
      <p>Study UID: {{ studyUid }}</p>
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
