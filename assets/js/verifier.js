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
                `✓ Signature Valid & Authentic!\nVerified by: ${fields.author}\nIssued: ${issuedAt.toUTCString()}\nID: ${fields.id}\n\nMessage Content:\n${fields.message}`
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

        const lines = text.split(/\r?\n/);
        let currentKey = null;
        let messageLines = [];

        for (let line of lines) {
            // التحقق مما إذا كانت السطر يبدأ بمفتاح جديد معروف
            const match = line.match(/^(ID|VER|MSG|AUTH|TIME|HASH|SIG|VERIFY): (.*)$/);
            
            if (match) {
                currentKey = match[1];
                const value = match[2];

                if (currentKey === "MSG") {
                    messageLines = [value];
                } else if (currentKey === "ID") {
                    result.id = value;
                } else if (currentKey === "VER") {
                    result.version = value;
                } else if (currentKey === "AUTH") {
                    result.author = value;
                } else if (currentKey === "TIME") {
                    result.time = value;
                } else if (currentKey === "HASH") {
                    result.hash = value;
                } else if (currentKey === "SIG") {
                    result.signature = value;
                }
            } else if (currentKey === "MSG") {
                // إذا كنا داخل حقل الرسالة وهذا سطر جديد تكميلي للرسالة
                messageLines.push(line);
            }
        }

        result.message = messageLines.join("\n").trim();
        return result;
    }

    function showResult(success, message) {
        verifyResult.textContent = message;
        verifyResult.classList.remove("hidden");

        verifyResult.className = "result-box " + (success ? "success" : "error");
        verifyResult.style.whiteSpace = "pre-wrap";
        verifyResult.style.textAlign = "left";
    }
});
