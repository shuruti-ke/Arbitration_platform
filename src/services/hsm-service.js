// src/services/hsm-service.js
// Hardware Security Module service — real Node.js crypto operations
// NOTE: This is a software-backed implementation. For production, replace
// with calls to an actual HSM (e.g., Oracle OCI Vault / PKCS#11 provider).

'use strict';
const crypto = require('crypto');

class HSMService {
  constructor() {
    this.keys = new Map();
  }

  /**
   * Generate a real RSA key pair using Node.js crypto.
   * @param {string} algorithm - 'rsa' (only RSA supported in this implementation)
   * @param {number} keySize - Key size in bits (min 2048 recommended)
   * @returns {object} { publicKey, privateKey, algorithm, keySize }
   */
  generateKeyPair(algorithm = 'rsa', keySize = 2048) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey, algorithm, keySize };
  }

  /**
   * Hash a document using the specified algorithm.
   * @param {string|Buffer} data
   * @param {string} algorithm - e.g. 'sha256', 'sha512'
   * @returns {string} Hex digest
   */
  hashDocument(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Sign data with an RSA private key (PKCS8 PEM).
   * @param {string|Buffer} data
   * @param {string} privateKey - PEM-encoded RSA private key
   * @returns {string} Hex-encoded signature
   */
  signData(data, privateKey) {
    const signer = crypto.createSign('SHA256');
    signer.update(data);
    signer.end();
    return signer.sign(privateKey, 'hex');
  }

  /**
   * Verify an RSA signature.
   * @param {string|Buffer} data
   * @param {string} signature - Hex-encoded signature
   * @param {string} publicKey - PEM-encoded RSA public key
   * @returns {boolean}
   */
  verifySignature(data, signature, publicKey) {
    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(data);
      verifier.end();
      return verifier.verify(publicKey, signature, 'hex');
    } catch {
      return false;
    }
  }

  /**
   * Encrypt data using hybrid encryption:
   * - AES-256-GCM encrypts the payload
   * - RSA-OAEP encrypts the AES key
   * Returns a base64-encoded JSON bundle.
   * @param {string} data
   * @param {string} publicKey - PEM-encoded RSA public key
   * @returns {string} base64-encoded encrypted bundle
   */
  encryptData(data, publicKey) {
    // Generate ephemeral AES-256 key and IV
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // Encrypt payload with AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Encrypt AES key with RSA-OAEP
    const encryptedKey = crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      aesKey
    );

    const bundle = {
      encryptedKey: encryptedKey.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: encrypted.toString('base64')
    };

    return Buffer.from(JSON.stringify(bundle)).toString('base64');
  }

  /**
   * Decrypt data encrypted with encryptData().
   * @param {string} encryptedBundle - base64-encoded bundle from encryptData()
   * @param {string} privateKey - PEM-encoded RSA private key
   * @returns {string} Decrypted plaintext
   */
  decryptData(encryptedBundle, privateKey) {
    const bundle = JSON.parse(Buffer.from(encryptedBundle, 'base64').toString('utf8'));

    // Decrypt AES key with RSA private key
    const aesKey = crypto.privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      Buffer.from(bundle.encryptedKey, 'base64')
    );

    // Decrypt payload with AES-256-GCM
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.from(bundle.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(bundle.authTag, 'base64'));

    return decipher.update(Buffer.from(bundle.ciphertext, 'base64'), undefined, 'utf8') +
           decipher.final('utf8');
  }
}

module.exports = HSMService;
