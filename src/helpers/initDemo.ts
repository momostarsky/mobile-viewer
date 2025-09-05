import initProviders from './initProviders';
import initVolumeLoader from './initVolumeLoader';
import {
    init as csRenderInit,
    imageLoader,
    volumeLoader,
    metaData,
} from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import * as cornerstone from '@cornerstonejs/core';
import {init as csToolsInit} from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';

window.cornerstone = cornerstone;
window.cornerstoneTools = cornerstoneTools;

export default async function initDemo(config: any = {}) {
    initProviders();
    cornerstoneDICOMImageLoader.init();
    initVolumeLoader();
    csRenderInit();

    await csToolsInit();

}
