<script setup lang="ts">
import {onMounted, ref} from 'vue'
import type {Types} from '@cornerstonejs/core';
import {Enums, init as csRenderInit, RenderingEngine,} from '@cornerstonejs/core';

import {init as initLoader} from '@cornerstonejs/dicom-image-loader';
import {ctVoiRange,} from '../helper';

const { ViewportType } = Enums;
import {demoCtImages} from "../utils/demoCtImages.ts";

// 接收从 App.vue 传递的属性
const props = defineProps<{
  studyMetadata?: any,
  studyUid?: string
}>()
ref(0);


// Instantiate a rendering engine
const renderingEngineId = 'myRenderingEngine';
const viewportId = 'CT_STACK';

onMounted(async ()=>{
  // 初始化 Cornerstone
  csRenderInit();
  await initLoader();
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create a stack viewport
  const viewportInput = {
    viewportId,
    type: ViewportType.STACK,
    element: document.querySelector("#cornerstone-element"),
  };

  renderingEngine.enableElement(viewportInput);

  // Get the stack viewport that was created
  const viewport = renderingEngine.getViewport(
      viewportId
  ) as Types.IStackViewport;

  // Define a stack containing a single image
  // Set the stack on the viewport
  await viewport.setStack(demoCtImages);

  // Set the VOI of the stack
  viewport.setProperties({ voiRange: ctVoiRange });

  // Render the image
  viewport.render();

})


</script>

<template>
  <div class="study-section">
    <div v-if="studyUid">
      <div id="cornerstone-element" style="width: 500px; height: 500px;"></div>
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
