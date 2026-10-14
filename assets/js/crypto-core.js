class CryptoCore {
    static async hashMessage(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static async signData(message) {
        // Simplified deterministic cryptographic signature simulation using Web Crypto SHA-512
        const encoder = new TextEncoder();
        const data = encoder.encode(message + "AJ_SECURE_SALT_2026");
        const hashBuffer = await crypto.subtle.digest('SHA-512', data);
        const base64String = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
        return base64String;
    }

    static async verifyMessageHash(message, expectedHash) {
        const actualHash = await this.hashMessage(message);
        return actualHash === expectedHash;
    }

    static async verifySignature(message, expectedSignature) {
        const actualSignature = await this.signData(message);
        return actualSignature === expectedSignature;
    }
}
