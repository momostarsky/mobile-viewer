<script setup lang="ts">
import type {Types} from '@cornerstonejs/core';
import {
  RenderingEngine,
  Enums,

} from '@cornerstonejs/core';
import {
  initDemo,
  createImageIdsAndCacheMetaData,

  ctVoiRange,
} from './helpers';
import {onMounted} from "vue";

const {ViewportType, Events} = Enums;

// ======== Constants ======= //
const renderingEngineId = 'myRenderingEngine';
const viewportId = 'CT_STACK';
let element: HTMLElement;


// 初始化 DOM 元素的函数
function initializeDOMElements() {


  element = document.querySelector ('#dicomViewer');


}

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  // 就版本的检查: http://192.168.1.92:9000/studies/1.2.156.112605.0.1685486876.2025061710152134339.2.1.1/metadata


  //内网测试服务器. 多张300多
  // const imageIds = await createImageIdsAndCacheMetaData({
  //   StudyInstanceUID:
  //       '1.2.156.112605.0.1685486876.2025061710152134339.2.1.1',
  //   SeriesInstanceUID:
  //       '1.2.156.112605.137174099554043.250617024436.3.3108.66301',
  //   wadoRsRoot: 'http://localhost:9000',
  // });
  //


  //内网测试服务器. 2张DICOM文件
  // const imageIds = await createImageIdsAndCacheMetaData({
  //   StudyInstanceUID:
  //       '1.2.840.113704.1.111.1228.1579187877.1',
  //   SeriesInstanceUID:
  //       '1.3.46.670589.33.1.16444683661560846915.3068712560708100564',
  //   wadoRsRoot: 'http://localhost:9000',
  // });
  //



  //公网测试服务器
  const imageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
    SeriesInstanceUID:
        '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
  });

  // Instantiate a rendering engine
  const renderingEngine = new RenderingEngine(renderingEngineId);

  // Create a stack viewport

  const viewportInput = {
    viewportId,
    type: ViewportType.STACK,
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

  // Define a stack containing a few images
  const stack = [imageIds[0]];

  // Set the stack on the viewport
  await viewport.setStack(stack);

  // Set the VOI of the stack
  viewport.setProperties({voiRange: ctVoiRange});

  // Render the image
  viewport.render();



}

onMounted(async () => {
  // 初始化 DOM 元素
  initializeDOMElements();


  // 运行应用
  await run();
})
</script>

<template>
  <div id="content"  style="width: 800px; height: 800px; border: #535bf2 2px solid; display: flex ; justify-content: center">
    <div id="dicomViewer" style="top: 0; left: 0; width: 512px;height: 512px;text-align: center ">
    </div>
  </div>
</template>
<style>
.viewport-element {
  display: flex;

}
</style>

