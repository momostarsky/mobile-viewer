// src/utils/cornerstoneInit.ts
import {RenderingEngine, Enums, init as coreInit} from '@cornerstonejs/core';
import {init as dicomImageLoaderInit} from '@cornerstonejs/dicom-image-loader';

export async function initializeCornerstone() {
    try {
        // 初始化 Cornerstone Core
        coreInit();
        await dicomImageLoaderInit();
        console.log('Cornerstone3D initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Cornerstone3D:', error);
    }
}
