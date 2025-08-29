import type {AppConfig} from '../configManager';

// 定义 JWT token 信息接口
export interface JwtTokenInfo {
    token: string | null;
    isValid: boolean;
    payload?: Record<string, any>;
    error?: string;
}

// 定义请求信息的强类型接口
export interface RequestInformation {
    // 基本请求信息
    url: string;
    origin: string;
    pathname: string;
    search: string;
    hash: string;

    // URL查询参数 (支持单个值或多个值)
    queryParams: Record<string, string | string[]>;

    // 浏览器信息
    userAgent: string;
    // JWT Token 信息
    jwtToken: JwtTokenInfo;
}
// 验证 JWT token 的辅助函数
function validateJwtToken(token: string): JwtTokenInfo {
    try {
        // 检查 token 格式
        if (!token || token.length == 0) {
            return {
                token: null,
                isValid: false,
                error: 'Token is missing or invalid format'
            };
        }

        // JWT token 通常由三部分组成，用点分隔
        const parts = token.split('.');
        if (parts.length !== 3) {
            return {
                token,
                isValid: false,
                error: 'Token format is invalid'
            };
        }

        // 解码 payload 部分（第二部分）
        let payload: Record<string, any> = {};
        try {
            // Base64 解码 payload
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const decodedPayload = atob(payloadBase64);
            payload = JSON.parse(decodedPayload);

            // 检查是否过期
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                return {
                    token,
                    isValid: false,
                    payload,
                    error: 'Token has expired'
                };
            }
        } catch (decodeError) {
            return {
                token,
                isValid: false,
                error: 'Failed to decode token payload'
            };
        }

        // Token 有效
        return {
            token,
            isValid: true,
            payload
        };
    } catch (error) {
        return {
            token: null,
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

//获取当前请求的参数信息.
export function getRequestInformation() {
    // 获取请求信息
    // 解析URL查询参数，支持同一个key多个值的情况
    const urlParams: Record<string, string | string[]> = {};
    const searchParams = new URLSearchParams(window.location.search);

    // 遍历所有参数
    for (const [key, value] of searchParams) {
        if (urlParams.hasOwnProperty(key)) {
            // 如果key已存在，转换为数组或添加到数组中
            if (Array.isArray(urlParams[key])) {
                (urlParams[key] as string[]).push(value);
            } else {
                urlParams[key] = [urlParams[key] as string, value];
            }
        } else {
            // 如果key不存在，直接赋值
            urlParams[key] = value;
        }
    }

    // 获取 JWT token
    let token: string | null = null;

    // 从 Authorization header 获取 token
    const authHeader = typeof window !== 'undefined' ?
        (window as any).Authorization ||
        (document.querySelector('meta[name="Authorization"]') as HTMLMetaElement)?.content :
        null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // 移除 "Bearer " 前缀
    }

    // 如果 header 中没有，尝试从 localStorage 获取
    if (!token) {
        try {
            token = typeof window !== 'undefined' ?
                localStorage.getItem('authToken') ||
                sessionStorage.getItem('authToken') :
                null;
        } catch (e) {
            // 忽略存储访问错误
        }
    }

    // 如果 still 没有 token，尝试从查询参数获取（不推荐，但有时用于开发）
    if (!token && urlParams['token'] && typeof urlParams['token'] === 'string') {
        token = urlParams['token'] as string;
    }
    // 验证 token
    const jwtTokenInfo: JwtTokenInfo = validateJwtToken(token || '');

    const requestInfo: RequestInformation = {
        // 基本请求信息
        url: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        // URL查询参数
        queryParams: urlParams,
        // 浏览器信息
        userAgent: navigator.userAgent,
        // JWT Token 信息
        jwtToken: jwtTokenInfo
    };

    return requestInfo;
}