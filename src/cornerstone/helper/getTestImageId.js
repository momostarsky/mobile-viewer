import createImageIdsAndCacheMetaData from '../dicomwebClient/createImageIdsAndCacheMetaData';

export default async function () {


    return createImageIdsAndCacheMetaData({
        StudyInstanceUID:
            '1.2.156.112605.0.1685486876.2025061710152134339.2.1.1',
        SeriesInstanceUID:
            '1.2.156.112605.137174099554043.250617024538.3.3108.27211',
        wadoRsRoot: 'http://localhost:9000',
    });
}
