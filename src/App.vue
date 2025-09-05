<script setup lang="ts">
import { onMounted } from 'vue';
import { init as coreInit, Enums as csEnums } from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import { RenderingEngine } from '@cornerstonejs/core';
import createImageIdsAndCacheMetaData from './helpers/createImageIdsAndCacheMetaData';

// 初始化应用
const initializeApp = async () => {
  await coreInit();
  await dicomImageLoaderInit();
  
  // Get Cornerstone imageIds and fetch metadata into RAM
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
  });

  // Create element inside the async function after DOM is ready
  const content = document.getElementById('content');
  const element = document.createElement('div');
  
  // Ensure proper sizing before enabling the element
  element.style.width = '500px';
  element.style.height = '500px';
  element.style.display = 'block'; // Ensure it takes space
  
  // Clear any existing content and append new element
  if (content) {
    content.innerHTML = '';
    content.appendChild(element);
  }

  const renderingEngineId = 'myRenderingEngine';
  const renderingEngine = new RenderingEngine(renderingEngineId);

  const viewportId = 'CT_AXIAL_STACK';

  const viewportInput = {
    viewportId,
    element,
    type: csEnums.ViewportType.STACK,
  };

  // Enable element after it's properly added to DOM
  renderingEngine.enableElement(viewportInput);

  const viewport = renderingEngine.getViewport(viewportId);

  viewport.setStack(imageIds, 60);
  viewport.render();
};

onMounted(() => {
  console.log('App component mounted');
  initializeApp();
});
</script>

<template>
  <div id="content" style="width: 1000px; height: 800px; border: #535bf2 2px solid; text-align: center;"></div>
</template>