document.addEventListener('DOMContentLoaded', () => {
    const verifyBtn = document.getElementById('verify-btn');
    const verifyInput = document.getElementById('verify-input');
    const verifyResult = document.getElementById('verify-result');

    if (!verifyBtn || !verifyInput || !verifyResult) return;

    verifyBtn.addEventListener('click', async () => {
        try {
            const rawText = verifyInput.value.trim();
            if (!rawText) {
                showResult(false, "Please paste a valid VeriStamp message block.");
                return;
            }

            // Parsing block fields
            const lines = rawText.split('\n');
            let msg = "", auth = "", time = "", hash = "", sig = "";

            for (let line of lines) {
                if (line.startsWith("MSG: ")) msg = line.substring(5).trim();
                if (line.startsWith("AUTH: ")) auth = line.substring(6).trim();
                if (line.startsWith("TIME: ")) time = line.substring(6).trim();
                if (line.startsWith("HASH: ")) hash = line.substring(6).trim();
                if (line.startsWith("SIG: ")) sig = line.substring(5).trim();
            }

            if (!msg || !auth || !time || !hash || !sig) {
                showResult(false, "Invalid block format. Missing required cryptographic parameters.");
                return;
            }

            const stringToSign = `${msg}|${auth}|${time}`;
            
            // Re-verify hash and signature via CryptoCore
            const isValidHash = await CryptoCore.verifyMessageHash(stringToSign, hash);
            const isValidSig = await CryptoCore.verifySignature(stringToSign, sig);

            if (isValidHash && isValidSig) {
                showResult(true, "✓ Cryptographic Signature Valid & Authentic! Message is unmodified.");
            } else {
                showResult(false, "✗ Verification Failed! Signature or hash mismatch detected.");
            }
        } catch (err) {
            console.error(err);
            showResult(false, "Error processing verification block.");
        }
    });

    function showResult(success, message) {
        verifyResult.textContent = message;
        verifyResult.classList.remove('hidden');
        if (success) {
            verifyResult.style.background = "rgba(16, 185, 129, 0.1)";
            verifyResult.style.borderColor = "rgba(16, 185, 129, 0.2)";
            verifyResult.style.color = "#34d399";
        } else {
            verifyResult.style.background = "rgba(239, 68, 68, 0.1)";
            verifyResult.style.borderColor = "rgba(239, 68, 68, 0.2)";
            verifyResult.style.color = "#f87171";
        }
    }
});
