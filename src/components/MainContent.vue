<!-- src/components/MainContent.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Types } from '@cornerstonejs/core';
import { Enums, init as csRenderInit, RenderingEngine } from '@cornerstonejs/core';

import { init as initLoader } from '@cornerstonejs/dicom-image-loader';
// 修正导入语句 - 使用命名导入而不是默认导入
import { ctVoiRange , addButtonToToolbar } from '../helper';
import { demoCtImages } from "../utils/demoCtImages.ts";
import { useStudyStore } from '../stores/studyStore'
import {initializeCornerstone} from "../utils/cornerstoneInit.ts";

const { ViewportType } = Enums;

// 接收从 App.vue 传递的属性
const props = defineProps<{
  studyMetadata?: any,
  studyUid?: string
}>()

const studyStore = useStudyStore();

// 添加初始化状态跟踪
let isInitialized = false;

// Instantiate a rendering engine
const renderingEngineId = 'myRenderingEngine';
const viewportId = 'CT_STACK';

onMounted(async () => {
  try {
    // 检查是否已经初始化
    await initializeCornerstone();

    const content = document.getElementById('content');
    const element = document.createElement('div');
    element.id = 'cornerstone-element';
    element.style.width = '500px';
    element.style.height = '500px';

    content.appendChild(element);

    const info = document.createElement('div');
    content.appendChild(info);

    const rotationInfo = document.createElement('div');
    info.appendChild(rotationInfo);

    const flipHorizontalInfo = document.createElement('div');
    info.appendChild(flipHorizontalInfo);

    const flipVerticalInfo = document.createElement('div');
    info.appendChild(flipVerticalInfo);

    addButtonToToolbar({
      title: 'Next Image',
      onClick: () => {
        // Get the rendering engine
        const renderingEngine = getRenderingEngine(renderingEngineId);

        // Get the stack viewport
        const viewport = renderingEngine.getViewport(
            viewportId
        ) as Types.IStackViewport;

        // Get the current index of the image displayed
        const currentImageIdIndex = viewport.getCurrentImageIdIndex();

        // Increment the index, clamping to the last image if necessary
        const numImages = viewport.getImageIds().length;
        let newImageIdIndex = currentImageIdIndex + 1;

        newImageIdIndex = Math.min(newImageIdIndex, numImages - 1);

        // Set the new image index, the viewport itself does a re-render
        viewport.setImageIdIndex(newImageIdIndex);
      },
    });


    // Instantiate a rendering engine
    const renderingEngine = new RenderingEngine(renderingEngineId);

    // Create a stack viewport

    const viewportInput = {
      viewportId,
      type: ViewportType.STACK,
      element,
    };

    renderingEngine.enableElement(viewportInput);

    // Get the stack viewport that was created
    const viewport = renderingEngine.getViewport(
        viewportId
    ) as Types.IStackViewport;

    // Define a stack containing a few images


    // Set the stack on the viewport
    await viewport.setStack(demoCtImages);

    // Set the VOI of the stack
    viewport.setProperties({ voiRange: ctVoiRange });

    // Render the image
    viewport.render();

  } catch (error) {
    console.error('Error initializing Cornerstone:', error);
  }
})
</script>

<template>


      <div id="content" style="width: 500px; height: 500px;"></div>

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
