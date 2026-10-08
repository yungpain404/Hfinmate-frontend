/**
 * Safely decodes a Google ID Token (JWT) payload in any JavaScript environment (Hermes, JSC, Node, Web).
 * Extracts email, name, picture, sub without requiring external libraries.
 */
export interface GoogleJwtPayload {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  [key: string]: any;
}

export function decodeGoogleIdToken(token: string): GoogleJwtPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let binaryStr = '';
    base64 = base64.replace(/=+$/, '');

    for (
      let bc = 0, bs = 0, buffer, idx = 0;
      (buffer = base64.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (binaryStr += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    let decodedStr = '';
    if (typeof TextDecoder !== 'undefined') {
      decodedStr = new TextDecoder().decode(bytes);
    } else {
      // Fallback for older JS engines
      decodedStr = decodeURIComponent(escape(binaryStr));
    }

    return JSON.parse(decodedStr);
  } catch (err) {
    console.warn('[decodeGoogleIdToken] Warning decoding JWT:', err);
    return null;
  }
}
