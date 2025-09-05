<!-- src/components/MainContent.vue -->
<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount} from 'vue';
import {useStudyStore} from '../stores/studyStore'; // 引入 store
import {ElMessage} from 'element-plus'
import {
  volumeLoader,
  RenderingEngine,
  Enums as csEnums,
  setVolumesForViewports,
  getRenderingEngine,
  ViewportType
} from "@cornerstonejs/core";

import type {Types} from '@cornerstonejs/core';

import getTestImageId from "../cornerstone/helper/getTestImageId";
import destoryCS from "../cornerstone/helper/destoryCS";
// 使用 store 获取 studyUid
const studyStore = useStudyStore();
// Instantiate a rendering engine
const renderingEngineId = 'myRenderingEngine';
onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  destoryCS(renderingEngineId, groupId);
});

async function init() {
  const content = document.getElementById('content');
  const element = document.createElement('div');
  element.id = 'cornerstone-element';
  element.style.width = '500px';
  element.style.height = '500px';

  content.appendChild(element);
// ============================= //
  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await getTestImageId( );


  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create a stack viewport
  const viewportId = 'CT_STACK';
  const viewportInput = {
    viewportId,
    type: csEnums.ViewportType.STACK,
    element,
    defaultOptions: {
      background: [0.2, 0, 0.2] as Types.Point3,
    },
  };

  renderingEngine.enableElement(viewportInput);

  // Get the stack viewport that was created
  const viewport = renderingEngine.getViewport(
      viewportId
  ) as Types.IStackViewport;

  // Define a stack containing a single image
  const stack = [imageIds[0]];

  // Set the stack on the viewport
  await viewport.setStack(stack);

  // Set the VOI of the stack
  viewport.setProperties({ voiRange: ctVoiRange });

  // Render the image
  viewport.render();


}
</script>

<template>
 <div id="content" style="width: 1000px;height: 800px;border: #535bf2 2px;text-align: center"></div>
</template>