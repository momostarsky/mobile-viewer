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

    // 构建请求URL路径
    let urlPath = '/wado';
    if (studyUid) {
        urlPath += `/studies/${studyUid}`;
        if (seriesUid) {
            urlPath += `/series/${seriesUid}`;
            if (objectUid) {
                urlPath += `/instances/${objectUid}`;

                // 如果请求具体实例，添加frames路径获取第一帧
                if (responseType !== 'json') {
                    urlPath += '/frames/1';
                }
            }
        }
    }

    // 构建完整URL
    const url = new URL(urlPath, baseUrl);

    // 添加查询参数
    url.searchParams.append('requestType', 'WADO');
    if (objectUid) {
        url.searchParams.append('contentType', responseType === 'json' ? 'application/json' : 'application/dicom');
    }

    // 添加额外的查询参数
    Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    // 设置请求头
    const headers: Record<string, string> = {
        'Accept': responseType === 'json' ? 'application/json' : 'application/dicom'
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
        if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)));
            return responseType === 'json' ? {} : new Blob();
        } else {
            throw error;
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
 * @param onError - 错误处理回调函数（可选）
 * @returns Promise<Blob> - DICOM文件流
 */
export async function downloadDicomInstance(
    studyUid: string,
    seriesUid: string,
    objectUid: string,
    onError?: DownloadErrorHandler
): Promise<Blob> {
    return await downloadFromWadoRs(studyUid, seriesUid, objectUid, 'blob', {}, onError);
}
