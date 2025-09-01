// src/utils/seriesFirstImageDownloader.ts
import { downloadDicomInstance } from './wado_downloader';
import type { DownloadErrorHandler } from './wado_downloader';
import type { StudyMetadata, SeriesData } from './getFirstDicomOfEachSeries';

/**
 * 下载单个序列的第一张DICOM图像
 * @param studyUid 研究UID
 * @param seriesData 序列数据
 * @param onError 错误处理函数
 * @returns Promise<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }>
 */
async function downloadFirstImageOfSeries(
  studyUid: string,
  seriesData: SeriesData,
  onError: DownloadErrorHandler
): Promise<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }> {
  try {
    // 获取序列 UID
    const seriesUid = seriesData['0020000E'];

    if (!seriesUid) {
      return {
        seriesUid: 'unknown',
        dicomBlob: null,
        error: new Error('Series UID not found')
      };
    }

    // 获取该序列的第一张图像
    if (seriesData.sopData && seriesData.sopData.length > 0) {
      const firstSop = seriesData.sopData[0];
      const objectUid = firstSop['00080018'];

      if (!objectUid) {
        return {
          seriesUid,
          dicomBlob: null,
          error: new Error('Object UID not found')
        };
      }

      // 下载 DICOM 文件
      const dicomBlob = await downloadDicomInstance(
        studyUid,
        seriesUid,
        objectUid,
        true, // 使用缓存
        onError
      );

      return { seriesUid, dicomBlob };
    } else {
      return {
        seriesUid,
        dicomBlob: null,
        error: new Error('No SOP data found')
      };
    }
  } catch (error) {
    const seriesUid = seriesData['0020000E'] || 'unknown';
    return {
      seriesUid,
      dicomBlob: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

/**
 * 下载所有序列的第一张DICOM图像
 * @param studyMetadata 研究元数据
 * @param studyUid 研究UID
 * @param onError 错误处理函数
 * @returns Promise<Array<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }>>
 */
export async function downloadFirstImageOfAllSeries(
  studyMetadata: StudyMetadata,
  studyUid: string,
  onError: DownloadErrorHandler
): Promise<Array<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }>> {
  // 创建结果数组
  const results: Array<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }> = [];

  // 遍历所有序列并下载第一张图像
  for (const seriesData of studyMetadata.seriesData) {
    const result = await downloadFirstImageOfSeries(studyUid, seriesData, onError);
    results.push(result);
  }

  return results;
}

/**
 * 批量下载所有序列的第一张DICOM图像（并行处理）
 * @param studyMetadata 研究元数据
 * @param studyUid 研究UID
 * @param options 下载选项
 * @returns Promise<Array<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }>>
 */
export async function downloadFirstImageOfAllSeriesBatch(
  studyMetadata: StudyMetadata,
  studyUid: string,
  options?: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
    onError?: DownloadErrorHandler;
  }
): Promise<Array<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }>> {
  const {
    concurrency = 3,
    onProgress,
    onError
  } = options || {};

  // 创建结果数组
  const results: Array<{ seriesUid: string; dicomBlob: Blob | null; error?: Error }> = [];
  const total = studyMetadata.seriesData.length;
  let completed = 0;

  // 创建一个信号量来控制并发
  const semaphore = {
    count: concurrency,
    queue: [] as Array<() => void>
  };

  const acquire = (): Promise<void> => {
    return new Promise(resolve => {
      if (semaphore.count > 0) {
        semaphore.count--;
        resolve();
      } else {
        semaphore.queue.push(resolve);
      }
    });
  };

  const release = (): void => {
    semaphore.count++;
    if (semaphore.queue.length > 0) {
      const resolve = semaphore.queue.shift();
      if (resolve) {
        semaphore.count--;
        resolve();
      }
    }
  };

  // 下载单个序列的第一张图像
  const downloadSingleSeries = async (seriesData: SeriesData): Promise<void> => {
    await acquire();

    try {
      // 获取序列 UID
      const seriesUid = seriesData['0020000E'];

      if (!seriesUid) {
        console.warn('Series UID not found in series data');
        return;
      }

      // 获取该序列的第一张图像
      if (seriesData.sopData && seriesData.sopData.length > 0) {
        const firstSop = seriesData.sopData[0];
        const objectUid = firstSop['00080018'];

        if (!objectUid) {
          console.warn(`Object UID not found for series ${seriesUid}`);
          results.push({ seriesUid, dicomBlob: null, error: new Error('Object UID not found') });
          return;
        }

        // 下载 DICOM 文件
        const dicomBlob = await downloadDicomInstance(
          studyUid,
          seriesUid,
          objectUid,
          true, // 使用缓存
          onError || (() => {})
        );

        results.push({ seriesUid, dicomBlob });
      } else {
        console.warn(`No SOP data found for series ${seriesUid}`);
        results.push({ seriesUid, dicomBlob: null, error: new Error('No SOP data found') });
      }
    } catch (error) {
      const seriesUid = seriesData['0020000E'] || 'unknown';
      console.error(`Error downloading DICOM for series ${seriesUid}:`, error);
      results.push({
        seriesUid,
        dicomBlob: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      });
    } finally {
      completed++;
      onProgress?.(completed, total);
      release();
    }
  };

  // 并行处理所有序列
  const downloadPromises = studyMetadata.seriesData.map(seriesData => downloadSingleSeries(seriesData));
  await Promise.all(downloadPromises);

  return results;
}
