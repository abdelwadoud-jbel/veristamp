document.addEventListener("DOMContentLoaded", () => {
    const verifyBtn = document.getElementById("verify-btn");
    const verifyInput = document.getElementById("verify-input");
    const verifyResult = document.getElementById("verify-result");

    if (!verifyBtn || !verifyInput || !verifyResult) return;

    verifyBtn.addEventListener("click", async () => {
        try {
            const rawText = verifyInput.value.trim();
            if (!rawText) {
                showResult(false, "Please paste a valid VeriStamp message block.");
                return;
            }

            const fields = parseBlock(rawText);

            if (!fields.id || !fields.version || !fields.message || !fields.author ||
                !fields.time || !fields.hash || !fields.signature) {
                showResult(false, "Invalid block format. Missing required VeriStamp v2 fields.");
                return;
            }

            if (fields.version !== "2") {
                showResult(false, "Unsupported VeriStamp version.");
                return;
            }

            const stringToSign = [
                "VERISTAMP-V2",
                fields.id,
                fields.message,
                fields.author,
                fields.time
            ].join("|");

            const actualHash = await CryptoCore.hashMessage(stringToSign);
            const hashValid = actualHash === fields.hash;

            if (!hashValid) {
                showResult(false, "Verification failed: message integrity check failed.");
                return;
            }

            const signatureValid = await CryptoCore.verifySignature(
                stringToSign,
                fields.signature
            );

            if (!signatureValid) {
                showResult(false, "Verification failed: invalid cryptographic signature.");
                return;
            }

            const decodedMessage = decodeBase64Utf8(fields.message);
            const issuedAt = new Date(fields.time);
            const now = new Date();

            if (isNaN(issuedAt.getTime())) {
                showResult(false, "Verification failed: invalid timestamp.");
                return;
            }

            if (issuedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
                showResult(false, "Verification failed: timestamp is in the future.");
                return;
            }

            showResult(
                true,
                `Verified by ${fields.author}\nIssued: ${issuedAt.toUTCString()}\nID: ${fields.id}\n\n${decodedMessage}`
            );
        } catch (error) {
            console.error(error);
            showResult(false, "Error processing verification block.");
        }
    });

    function parseBlock(text) {
        const result = {
            id: "",
            version: "",
            message: "",
            author: "",
            time: "",
            hash: "",
            signature: ""
        };

        for (const line of text.split(/\r?\n/)) {
            const [key, ...rest] = line.split(": ");
            const value = rest.join(": ").trim();

            switch (key) {
                case "ID": result.id = value; break;
                case "VER": result.version = value; break;
                case "MSG-B64": result.message = value; break;
                case "AUTH": result.author = value; break;
                case "TIME": result.time = value; break;
                case "HASH": result.hash = value; break;
                case "SIG": result.signature = value; break;
            }
        }

        return result;
    }

    function decodeBase64Utf8(base64) {
        const bytes = CryptoCore.base64ToBytes(base64);
        return new TextDecoder().decode(bytes);
    }

    function showResult(success, message) {
        verifyResult.textContent = message;
        verifyResult.classList.remove("hidden");

        verifyResult.style.background = success
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(239, 68, 68, 0.1)";

        verifyResult.style.borderColor = success
            ? "rgba(16, 185, 129, 0.2)"
            : "rgba(239, 68, 68, 0.2)";

        verifyResult.style.color = success ? "#34d399" : "#f87171";
        verifyResult.style.whiteSpace = "pre-wrap";
        verifyResult.style.textAlign = "left";
    }
});
