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

            const lines = rawText.split('\n');
            let msg = "", auth = "", time = "", hash = "", sig = "";
            let currentField = null;
            let msgLines = [], sigLines = [];

            for (let line of lines) {
                if (line.startsWith("MSG: ")) {
                    currentField = "MSG";
                    msgLines.push(line.substring(5));
                } else if (line.startsWith("AUTH: ")) {
                    currentField = "AUTH";
                    auth = line.substring(6).trim();
                } else if (line.startsWith("TIME: ")) {
                    currentField = "TIME";
                    time = line.substring(6).trim();
                } else if (line.startsWith("HASH: ")) {
                    currentField = "HASH";
                    hash = line.substring(6).trim();
                } else if (line.startsWith("SIG: ")) {
                    currentField = "SIG";
                    sigLines.push(line.substring(5));
                } else if (line.startsWith("VERIFY: ")) {
                    currentField = "VERIFY";
                } else {
                    if (currentField === "MSG") msgLines.push(line);
                    else if (currentField === "SIG") sigLines.push(line);
                }
            }

            msg = msgLines.join('\n').trim();
            sig = sigLines.join('').trim();

            if (!msg || !auth || !time || !hash || !sig) {
                showResult(false, "Invalid block format. Missing required cryptographic parameters.");
                return;
            }

            const stringToSign = `${msg}|${auth}|${time}`;
            
            const isValidHash = await CryptoCore.verifyMessageHash(stringToSign, hash);
            const isValidSig = await CryptoCore.verifySignature(stringToSign, sig);

            if (isValidHash && isValidSig) {
                showResult(true, `✓ Authenticated & Verified By: ${auth} — Message is intact and unmodified.`);
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
