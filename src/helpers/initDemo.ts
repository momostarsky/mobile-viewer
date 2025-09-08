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
let initOnce=false;

export default async function initDemo(config: any = {}) {
    initProviders();
    if(!initOnce){
        cornerstoneDICOMImageLoader.init();
        initOnce=true;
    }

    initVolumeLoader();
    csRenderInit();

    await csToolsInit();

}
