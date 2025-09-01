// src/utils/dcmImageLoader.ts
import { init as coreInit, RenderingEngine} from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';
import { registerImageLoader } from '@cornerstonejs/core';
import { customDicomLoader } from './customDicomLoader';

export const renderingEngineId = 'myRenderingEngine';
let renderingEngine: RenderingEngine | null = null;

export async function dicomViewerInit() {
    // 初始化core
    coreInit();

    // 初始化dicom-image-loader
    await dicomImageLoaderInit();
// registration
    cornerstone.imageLoader.registerImageLoader('hzraw', loadImage);
    // 创建渲染引擎
    renderingEngine = new RenderingEngine(renderingEngineId);

    console.log('DICOM viewer initialized');
}

// 加载并渲染图像
export async function loadAndRenderImage(
    buffer: ArrayBuffer,
    viewportId: string = 'CT_AXIAL_STACK',
    viewerElement: HTMLElement
) {
    if (!renderingEngine) {
        throw new Error('Rendering engine not initialized. Call dicomViewerInit() first.');
    }

    try {
        // 创建viewport输入配置
        const viewportInput = {
            viewportId: viewportId,
            element: viewerElement,
            type: 'stack',
        };
        // 启用元素
        renderingEngine.enableElement(viewportInput);

        // 解析DICOM数据以验证格式
        const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
        console.log('DICOM parsed successfully, study instance UID:',
            dataSet.string('x0020000d'));

        // 对于原始ArrayBuffer，您可能需要创建一个自定义的图像加载器
        // 或者将其转换为适当的格式

        console.log('DICOM image processing completed, buffer size:', buffer.byteLength);

    } catch (error) {
        console.error('Error in loadAndRenderImage:', error);
        throw error;
    }
}
