import forge from 'node-forge';

/**
 * AES 加密解密工具类（前端）
 * 用于解密服务器响应数据
 */
class AESCrypto {
  private static instance: AESCrypto;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): AESCrypto {
    if (!AESCrypto.instance) {
      AESCrypto.instance = new AESCrypto();
    }
    return AESCrypto.instance;
  }

  /**
   * 使用 AES-GCM 解密数据
   * @param encrypted Base64 编码的加密数据
   * @param keyBase64 Base64 编码的 AES 密钥
   * @param ivBase64 Base64 编码的 IV
   * @param authTagBase64 Base64 编码的认证标签
   * @returns 解密后的数据对象
   */
  public decrypt(
    encrypted: string,
    keyBase64: string,
    ivBase64: string,
    authTagBase64: string
  ): any {
    try {
      // 解码参数
      const key = forge.util.decode64(keyBase64);
      const iv = forge.util.decode64(ivBase64);
      const authTag = forge.util.decode64(authTagBase64);
      const encryptedData = forge.util.decode64(encrypted);

      // 创建解密器
      const decipher = forge.cipher.createDecipher('AES-GCM', key);

      // 设置参数
      decipher.start({
        iv: iv,
        tag: forge.util.createBuffer(forge.util.hexToBytes(authTag))
      });

      // 解密数据
      decipher.update(forge.util.createBuffer(encryptedData));
      const success = decipher.finish();

      if (!success) {
        throw new Error('AES decryption failed - authentication failed');
      }

      // 获取解密后的数据
      const decrypted = decipher.output.toString();

      // 尝试解析为 JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('[AES] Decryption failed:', error);
      throw error;
    }
  }

  /**
   * 使用 AES-GCM 加密数据（前端通常不需要，但保留接口）
   * @param data 要加密的数据
   * @param keyBase64 Base64 编码的 AES 密钥
   * @returns 包含加密数据、IV 和认证标签的对象
   */
  public encrypt(data: any, keyBase64: string): { encrypted: string; iv: string; authTag: string } {
    try {
      // 将数据转换为字符串
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // 解码密钥
      const key = forge.util.decode64(keyBase64);

      // 生成随机 IV（16 字节）
      const iv = forge.random.getBytesSync(16);

      // 创建加密器
      const cipher = forge.cipher.createCipher('AES-GCM', key);

      // 加密数据
      cipher.start({ iv: iv });
      cipher.update(forge.util.createBuffer(dataString, 'utf8'));
      cipher.finish();

      // 获取加密结果和认证标签
      const encrypted = cipher.output.getBytes();
      const authTag = cipher.mode.tag.getBytes();

      return {
        encrypted: forge.util.encode64(encrypted),
        iv: forge.util.encode64(iv),
        authTag: forge.util.encode64(authTag)
      };
    } catch (error) {
      console.error('[AES] Encryption failed:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const aesCrypto = AESCrypto.getInstance();