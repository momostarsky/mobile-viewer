// src/utils/cornerstoneInit.ts
import { init as csRenderInit } from '@cornerstonejs/core';
import { init as initLoader } from '@cornerstonejs/dicom-image-loader';

let isCornerstoneInitialized = false;

export async function initializeCornerstone() {
  if (isCornerstoneInitialized) {
    return;
  }

  try {
    csRenderInit();
    await initLoader();
    isCornerstoneInitialized = true;
    console.log('Cornerstone initialized globally');
  } catch (error) {
    console.error('Error initializing Cornerstone globally:', error);
    throw error;
  }
}
