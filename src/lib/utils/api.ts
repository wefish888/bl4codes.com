import { rsaCrypto } from './rsa';
import { aesCrypto } from './aes';

/**
 * API 请求配置接口
 */
interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * 获取 API 基础 URL
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return import.meta.env.PUBLIC_API_BASE_URL || 'https://api.bl4codes.com';
  }
  return import.meta.env.PUBLIC_API_BASE_URL || 'https://api.bl4codes.com';
};

/**
 * 初始化 RSA 加密（获取公钥）
 */
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

export const initializeRSA = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      await rsaCrypto.fetchPublicKey(apiBaseUrl);
      isInitialized = true;
      console.log('[API] RSA initialized successfully');
    } catch (error) {
      console.error('[API] Failed to initialize RSA:', error);
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * 生成随机 AES 密钥（Base64 编码）
 */
function generateAESKey(): string {
  // 生成 32 字节（256 位）的随机密钥
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);

  // 转换为 Base64
  return btoa(String.fromCharCode(...keyBytes));
}

/**
 * 发起 API 请求（默认加密）
 */
export async function apiRequest<T = any>(
  endpoint: string,
  config: ApiRequestConfig = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {}
  } = config;

  const apiBaseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiBaseUrl}${endpoint}`;

  // 确保 RSA 已初始化
  if (!rsaCrypto.hasPublicKey()) {
    await initializeRSA();
  }

  // 生成 AES 密钥用于响应加密
  const aesKeyBase64 = generateAESKey();

  // 使用 RSA 公钥加密 AES 密钥
  const encryptedAesKey = rsaCrypto.encrypt(aesKeyBase64);

  // 准备请求头（发送加密的 AES 密钥）
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-AES-Key': encryptedAesKey,  // RSA 加密的 AES 密钥
    ...headers
  };

  // 准备请求体（默认加密）
  let requestBody: string | undefined;

  if (body) {
    // 加密请求体
    try {
      const encryptedData = rsaCrypto.encrypt(body);
      requestBody = JSON.stringify({
        encrypted: true,
        data: encryptedData
      });
    } catch (error) {
      console.error('[API] Failed to encrypt request:', error);
      throw new Error('Failed to encrypt request data');
    }
  }

  // 发起请求
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();

    // 检查响应是否加密
    if (responseData.encrypted && responseData.data && responseData.iv && responseData.authTag) {
      try {
        console.log('[API] Decrypting response...');

        // 使用客户端生成的 AES 密钥解密响应数据
        const decryptedData = aesCrypto.decrypt(
          responseData.data,
          aesKeyBase64,
          responseData.iv,
          responseData.authTag
        );

        console.log('[API] Response decrypted successfully');
        return decryptedData as T;
      } catch (error) {
        console.error('[API] Failed to decrypt response:', error);
        throw new Error('Failed to decrypt response data');
      }
    }

    // 如果响应未加密，返回原始数据
    return responseData as T;
  } catch (error) {
    console.error('[API] Request failed:', error);
    throw error;
  }
}

/**
 * 便捷的 GET 请求方法
 */
export const apiGet = <T = any>(endpoint: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> => {
  return apiRequest<T>(endpoint, { ...config, method: 'GET' });
};

/**
 * 便捷的 POST 请求方法
 */
export const apiPost = <T = any>(endpoint: string, body?: any, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> => {
  return apiRequest<T>(endpoint, { ...config, method: 'POST', body });
};

/**
 * 便捷的 PUT 请求方法
 */
export const apiPut = <T = any>(endpoint: string, body?: any, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> => {
  return apiRequest<T>(endpoint, { ...config, method: 'PUT', body });
};

/**
 * 便捷的 DELETE 请求方法
 */
export const apiDelete = <T = any>(endpoint: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> => {
  return apiRequest<T>(endpoint, { ...config, method: 'DELETE' });
};

/**
 * 便捷的 PATCH 请求方法
 */
export const apiPatch = <T = any>(endpoint: string, body?: any, config?: Omit<ApiRequestConfig, 'method' | 'body'>): Promise<T> => {
  return apiRequest<T>(endpoint, { ...config, method: 'PATCH', body });
};