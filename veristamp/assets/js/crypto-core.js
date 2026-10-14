const CryptoCore = {
    ALLOWED_AUTHORS: ["ABDELWADOUD JBEL", "AJ"],

    // توليد أو جلب مفتاح التوقيع الرقمي بشكل آمن وسليم
    async getOrCreateSigningKey() {
        let privKeyJwk = localStorage.getItem('v_priv_jwk');
        let pubKeyJwk = localStorage.getItem('v_pub_jwk');

        if (!privKeyJwk || !pubKeyJwk) {
            const keyPair = await window.crypto.subtle.generateKey(
                { name: "ECDSA", namedCurve: "P-256" },
                true,
                ["sign", "verify"]
            );

            const exportedPriv = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
            const exportedPub = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);

            localStorage.setItem('v_priv_jwk', JSON.stringify(exportedPriv));
            localStorage.setItem('v_pub_jwk', JSON.stringify(exportedPub));

            return keyPair;
        } else {
            const privKey = await window.crypto.subtle.importKey(
                "jwk", JSON.parse(privKeyJwk),
                { name: "ECDSA", namedCurve: "P-256" },
                true, ["sign"]
            );
            const pubKey = await window.crypto.subtle.importKey(
                "jwk", JSON.parse(pubKeyJwk),
                { name: "ECDSA", namedCurve: "P-256" },
                true, ["verify"]
            );
            return { privateKey: privKey, publicKey: pubKey };
        }
    },

    async signData(dataString) {
        const keyPair = await this.getOrCreateSigningKey();
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(dataString);
        
        const signature = await window.crypto.subtle.sign(
            { name: "ECDSA", hash: { name: "SHA-256" } },
            keyPair.privateKey,
            dataBytes
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    },

    async verifyData(dataString, signatureBase64) {
        try {
            let pubKeyJwk = localStorage.getItem('v_pub_jwk');
            if (!pubKeyJwk) return false;

            const pubKey = await window.crypto.subtle.importKey(
                "jwk", JSON.parse(pubKeyJwk),
                { name: "ECDSA", namedCurve: "P-256" },
                true, ["verify"]
            );

            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(dataString);
            
            const sigBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

            return await window.crypto.subtle.verify(
                { name: "ECDSA", hash: { name: "SHA-256" } },
                pubKey,
                sigBytes,
                dataBytes
            );
        } catch (e) {
            return false;
        }
    },

    async hashMessage(str) {
        const buffer = new TextEncoder().encode(str);
        const hash = await window.crypto.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
};