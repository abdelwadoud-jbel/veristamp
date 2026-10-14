class CryptoCore {
    // المفتاح العام المعتمد لتوقيعات ECDSA P-256 الخاصة بك
    static PUBLIC_KEY_JWK = {
        "crv": "P-256",
        "ext": true,
        "key_ops": [
            "verify"
        ],
        "kty": "EC",
        "x": "oa8JoplcU17eLp3jM0U9WUrXkF-nxO_RwEJS2mC8Rig",
        "y": "NAN15tf7mL3Wfd9oLCvaV0GpifR8w1AbYaOJ8295vtk"
    };

    static encoder = new TextEncoder();

    static async hashMessage(message) {
        const data = this.encoder.encode(message);
        const digest = await crypto.subtle.digest("SHA-256", data);
        return [...new Uint8Array(digest)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    static bytesToBase64(bytes) {
        let binary = "";
        bytes.forEach(byte => binary += String.fromCharCode(byte));
        return btoa(binary);
    }

    static base64ToBytes(base64) {
        const binary = atob(base64.trim());
        return Uint8Array.from(binary, char => char.charCodeAt(0));
    }

    static async importPublicKey() {
        if (!this.PUBLIC_KEY_JWK) {
            throw new Error("Public verification key is not configured.");
        }

        return crypto.subtle.importKey(
            "jwk",
            this.PUBLIC_KEY_JWK,
            { name: "ECDSA", namedCurve: "P-256" },
            true,
            ["verify"]
        );
    }

    static async verifySignature(message, signatureBase64) {
        const publicKey = await this.importPublicKey();
        const signature = this.base64ToBytes(signatureBase64);
        const data = this.encoder.encode(message);

        return crypto.subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            publicKey,
            signature,
            data
        );
    }
}
