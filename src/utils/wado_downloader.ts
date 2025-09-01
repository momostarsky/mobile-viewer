import { getRequestInformation } from './helpers';
/**
 * 错误处理回调函数类型定义
 */
export type DownloadErrorHandler = (error: Error, response?: Response) => void;

/**
 * 通用下载函数，用于从WADO-RS服务获取JSON或DICOM文件流
 * @param studyUid - 研究实例UID
 * @param seriesUid - 系列实例UID（可选）
 * @param objectUid - 对象实例UID（可选）
 * @param responseType - 响应类型 ('json' | 'blob')
 * @param queryParams - 额外的查询参数
 * @param onError - 错误处理回调函数（可选）
 * @returns Promise<Response> - fetch响应对象
 */
export async function downloadFromWadoRs(
    studyUid: string,
    seriesUid?: string,
    objectUid?: string,
    responseType: 'json' | 'blob' = 'blob',
    queryParams: Record<string, string> = {},
    onError?: DownloadErrorHandler
): Promise<any> {
    // 获取应用配置
    const appConfig: AppConfig | undefined = window.APP_CONFIG;

    if (!appConfig) {
        const error = new Error('Application configuration is not available');
        if (onError) {
            onError(error);
            return responseType === 'json' ? {} : new Blob();
        } else {
            throw error;
        }
    }

    // 构建基础URL
    const baseUrl = appConfig.wado_config.base_url;
    if (!baseUrl) {
        const error = new Error('WADO-RS base URL is not configured');
        if (onError) {
            onError(error);
            return responseType === 'json' ? {} : new Blob();
        } else {
            throw error;
        }
    }

    // 构建请求URL路径 - 修改为符合实际接口的路径
    let urlPath = '';
    if (studyUid) {
        urlPath += `/studies/${studyUid}`;
        if (seriesUid && objectUid) {
            urlPath += `/series/${seriesUid}/instances/${objectUid}`;
        } else if (!seriesUid && !objectUid) {
            // 只有studyUid的情况，用于获取study的metadata
            urlPath += '/metadata';
        }
    }

    // 构建完整URL
    const url = new URL(urlPath, baseUrl);

    // 设置请求头 - 修改Accept头以符合实际接口要求
    const headers: Record<string, string> = {
        'Accept': responseType === 'json' ? 'application/dicom+json' : 'application/dicom'
    };

    // 添加认证信息（如果存在JWT token）
    const requestInfo = getRequestInformation();
    if (requestInfo.jwtToken.isValid && requestInfo.jwtToken.token) {
        headers['Authorization'] = `Bearer ${requestInfo.jwtToken.token}`;
    }

    try {
        // 发起请求
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`);
            if (onError) {
                onError(error, response);
                return responseType === 'json' ? {} : new Blob();
            } else {
                throw error;
            }
        }

        // 根据响应类型处理结果
        if (responseType === 'json') {
            return await response.json();
        } else {
            return await response.blob();
        }
    } catch (error) {
        console.error('Error downloading from WADO-RS:', error);
        // 确保即使在没有 onError 回调的情况下也能正确处理错误
        if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
            return responseType === 'json' ? {} : new Blob();
        } else {
            // 如果没有提供 onError 回调，仍然抛出错误以便调用者可以处理
            throw error instanceof Error ? error : new Error(String(error));
        }
    }
}


/**
 * 下载JSON元数据
 * @param studyUid - 研究实例UID
 * @param seriesUid - 系列实例UID（可选）
 * @param objectUid - 对象实例UID（可选）
 * @param onError - 错误处理回调函数（可选）
 * @returns Promise<any> - JSON数据
 */
export async function downloadJsonMetadata(
    studyUid: string,
    seriesUid?: string,
    objectUid?: string,
    onError?: DownloadErrorHandler
): Promise<any> {
    return await downloadFromWadoRs(studyUid, seriesUid, objectUid, 'json', {}, onError);
}

/**
 * 下载DICOM文件流
 * @param studyUid - 研究实例UID
 * @param seriesUid - 系列实例UID
 * @param objectUid - 对象实例UID
 * @param useCache - 是否使用缓存（默认为true）
 * @param onError - 错误处理回调函数（可选）
 * @returns Promise<Blob> - DICOM文件流
 */
export async function downloadDicomInstance(
    studyUid: string,
    seriesUid: string,
    objectUid: string,
    useCache: boolean = true,
    onError?: DownloadErrorHandler
): Promise<Blob> {
    // 如果启用缓存，先尝试从缓存获取
    if (useCache) {
        try {
            const cachedBlob = await dicomCache.getInstance(objectUid);
            if (cachedBlob) {
                console.log(`Loaded DICOM instance ${objectUid} from cache`);
                return cachedBlob;
            }
        } catch (error) {
            console.warn('Failed to load from cache:', error);
        }
    }

    // 从服务器下载
    const blob = await downloadFromWadoRs(studyUid, seriesUid, objectUid, 'blob', {}, onError);

    // 立即返回数据，异步处理缓存写入
    if (useCache && blob.size > 0) {
        // 异步写入缓存，不影响主流程
        dicomCache.saveInstance(objectUid, studyUid, seriesUid, blob)
            .then(() => console.log(`Saved DICOM instance ${objectUid} to cache`))
            .catch(error => console.warn('Failed to save to cache:', error));
    }

    return blob;
}
