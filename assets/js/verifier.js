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

            // Extract fields using robust regex parsing to handle wrapped lines
            const msgMatch = rawText.match(/MSG:\s*([\s\S]*?)(?=\nAUTH:|$)/);
            const authMatch = rawText.match(/AUTH:\s*([^\n]+)/);
            const timeMatch = rawText.match(/TIME:\s*([^\n]+)/);
            const hashMatch = rawText.match(/HASH:\s*([a-fA-F0-9]{64})/);
            
            // For signature, capture everything between SIG: and VERIFY:
            const sigMatch = rawText.match(/SIG:\s*([\s\S]*?)(?=\nVERIFY:|$)/);

            if (!msgMatch || !authMatch || !timeMatch || !hashMatch || !sigMatch) {
                showResult(false, "Invalid block format. Missing required cryptographic parameters.");
                return;
            }

            const msg = msgMatch[1].trim();
            const auth = authMatch[1].trim();
            const time = timeMatch[1].trim();
            const hash = hashMatch[1].trim();
            const sig = sigMatch[1].replace(/\s+/g, '').trim(); // Remove any internal spaces or line breaks in signature

            const stringToSign = `${msg}|${auth}|${time}`;
            
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
