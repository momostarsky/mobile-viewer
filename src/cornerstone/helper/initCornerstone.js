import {init as csRenderInit,} from "@cornerstonejs/core";
import {init as csToolsInit} from "@cornerstonejs/tools";
import initProviders from "./initProviders";
import initCornerstoneDICOMImageLoader from "./initCornerstoneDicomImageLoader";
import initVolumeLoader from "./initVolumeLoader";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";

export default async function initCornerstone( ) {





    initProviders();

    // 初始化 - Dicom文件加载器
    initCornerstoneDICOMImageLoader();

    // 初始化 - Volume加载器
    initVolumeLoader();

    // 初始化 - CornerStone
    csRenderInit();

    // 初始化 - CornerStone/tool
    await csToolsInit();
}
