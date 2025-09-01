import dicomParser from 'dicom-parser';

// 你的自定义 loader
export function customDicomLoader(imageId: string) {
    // imageId 例如: 'rawdicom://<some-unique-key>'
    // options 里可以传入你的 ArrayBuffer
    const arrayBuffer = options?.arrayBuffer;
    if (!arrayBuffer) {
        throw new Error('No ArrayBuffer provided to customDicomLoader');
    }

    // 解析 DICOM
    const dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
    // 提取像素数据、元数据等
    const pixelDataElement = dataSet.elements.x7fe00010;
    const pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length);

    // 构建 Cornerstone 期望的 image 对象
    const image = {
        imageId,
        minPixelValue: 0,
        maxPixelValue: 255,
        slope: 1.0,
        intercept: 0,
        windowCenter: 128,
        windowWidth: 256,
        getPixelData: () => pixelData,
        rows: dataSet.uint16('x00280010'),
        columns: dataSet.uint16('x00280011'),
        height: dataSet.uint16('x00280010'),
        width: dataSet.uint16('x00280011'),
        color: false,
        columnPixelSpacing: null,
        rowPixelSpacing: null,
        invert: false,
        sizeInBytes: pixelData.length,
    };

    return Promise.resolve(image);
}