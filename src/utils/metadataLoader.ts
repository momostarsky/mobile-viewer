// octMetadataLoader.ts

import {getRequestInformation} from './helpers';
import dicomParser, {ParseDicomOptions} from "dicom-parser";

/**
 * 错误处理回调函数类型定义
 */
export type OctDownloadErrorHandler = (error: Error, response?: Response) => void;

/**
 * OCT元数据加载器
 * 用于从OCT流服务获取并解析元数据
 */
export class OctMetadataLoader {
    private baseUrl: string;

    constructor(baseUrl?: string) {
        const appConfig: AppConfig | undefined = window.APP_CONFIG;

        // 优先使用传入的baseUrl，否则从配置中获取，最后使用默认值
        if (baseUrl) {
            this.baseUrl = baseUrl;
        } else if (appConfig?.wado_config?.base_url) {
            this.baseUrl = appConfig.wado_config.base_url;
        }
    }

    /**
     * 从OCT流服务加载元数据
     * @param studyUid - 研究实例UID
     * @param onError - 错误处理回调函数
     * @returns Promise<any> - 解析后的元数据
     */
    async loadMetadata(studyUid: string, onError?: OctDownloadErrorHandler): Promise<any> {
        // 获取应用配置
        const appConfig: AppConfig | undefined = window.APP_CONFIG;

        if (!appConfig) {
            const error = new Error('Application configuration is not available');
            if (onError) {
                onError(error);
                return {};
            } else {
                throw error;
            }
        } else if(!this.baseUrl){
            this.baseUrl=appConfig.wado_config.base_url;
        }

        // 构建请求URL
        const urlPath = `/octstream/studies/${studyUid}/metadata`;
        const url = new URL(urlPath, this.baseUrl);

        // 设置请求头
        const headers: Record<string, string> = {
            'Accept': 'multipart/related; type=application/octet-stream'
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
                    return {};
                } else {
                    throw error;
                }
            }

            // 解析multipart/related响应
            return await this.parseMultipartResponse(response);
        } catch (error) {
            console.error('Error loading OCT metadata:', error);
            if (onError) {
                onError(error instanceof Error ? error : new Error(String(error)));
                return {};
            } else {
                throw error;
            }
        }
    }

    /**
     * 解析multipart/related响应
     * @param response - fetch响应对象
     * @returns Promise<any> - 解析后的数据
     */
    private async parseMultipartResponse(response: Response): Promise<any> {
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('multipart/related')) {
            throw new Error('Response is not multipart/related');
        }

        // 提取boundary
        const boundaryMatch = contentType.match(/boundary=([^;]+)/);
        if (!boundaryMatch) {
            throw new Error('Boundary not found in Content-Type header');
        }
        const boundary = boundaryMatch[1];

        // 获取响应体为ArrayBuffer
        const buffer = await response.arrayBuffer();

        // 解析multipart数据
        return this.parseMultipartData(new Uint8Array(buffer), boundary);
    }

    /**
     * 解析multipart数据
     * @param data - 原始二进制数据
     * @param boundary - boundary字符串
     * @returns 解析后的数据对象
     */
    private parseMultipartData(data: Uint8Array, boundary: string): any {
        // 标准化boundary格式
        const normalizedBoundary = '--' + boundary.trim();
        const endBoundary = normalizedBoundary + '--';

        // 将Uint8Array转换为字符串以便处理boundary
        const dataString = this.uint8ArrayToString(data);

        // 按boundary分割数据
        const parts = dataString.split(normalizedBoundary)
            .filter(part => part.trim() !== '' && !part.includes(endBoundary));

        // 解析每个部分
        const result: any[] = [];

        for (const part of parts) {
            const trimmedPart = part.trim();
            if (!trimmedPart) continue;

            // 分割头部和主体
            const splitIndex = trimmedPart.indexOf('\r\n\r\n');
            if (splitIndex === -1) continue;

            const headers = trimmedPart.substring(0, splitIndex);
            const bodyStartIndex = splitIndex + 4;

            // 解析头部信息
            const headerLines = headers.split('\r\n');
            const headerMap: Record<string, string> = {};

            for (const headerLine of headerLines) {
                const [key, ...values] = headerLine.split(':');
                if (key && values.length > 0) {
                    headerMap[key.trim().toLowerCase()] = values.join(':').trim();
                }
            }

            // 只处理指定的格式
            const contentType = headerMap['content-type'];
            if (contentType && contentType.includes('application/octet-stream')) {
                // 计算主体在原始数据中的位置
                const partStartIndex = dataString.indexOf(trimmedPart);
                const actualBodyStartIndex = partStartIndex + bodyStartIndex;

                // 找到主体的结束位置（下一个boundary或数据末尾）
                let actualBodyEndIndex = data.length;
                const nextBoundaryIndex = dataString.indexOf(normalizedBoundary, partStartIndex + 1);
                if (nextBoundaryIndex !== -1) {
                    // 找到下一个boundary，主体结束位置是下一个boundary的开始位置
                    const nextBoundaryInData = dataString.indexOf(normalizedBoundary, partStartIndex + trimmedPart.length);
                    if (nextBoundaryInData !== -1) {
                        actualBodyEndIndex = nextBoundaryInData;
                    }
                }

                // 提取二进制数据
                // 移除可能的尾随换行符
                let finalData = data.slice(actualBodyStartIndex, actualBodyEndIndex);
                if (finalData.length >= 2 &&
                    finalData[finalData.length - 2] === 13 &&
                    finalData[finalData.length - 1] === 10) {
                    finalData = finalData.slice(0, finalData.length - 2);
                }
                // 使用untilTag选项，指定在遇到x7fe00010（像素数据）时停止解析
                const options: dicomParser.ParseDicomOptions= {
                    untilTag: 'x7fe00010'
                };
                const dataSet = dicomParser.parseDicom( finalData,options);
                // Add the dataSet to the cache immediately, since createImage()
                // already reads metadata.
                console.log('Adding to cache:', dataSet);
                result.push({
                    headers: headerMap,
                    content: finalData
                });
            } else {
                console.warn(`Unsupported content type: ${contentType}`);
            }
        }

        return result.length === 1 ? result[0] : result;
    }

    /**
     * 将Uint8Array转换为字符串
     * @param array - Uint8Array数据
     * @returns 字符串表示
     */
    private uint8ArrayToString(array: Uint8Array): string {
        return new TextDecoder().decode(array);
    }
}

// 导出单例实例以方便使用
export const octMetadataLoader = new OctMetadataLoader();
