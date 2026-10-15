document.addEventListener("DOMContentLoaded", () => {
    const verifyBtn = document.getElementById("verify-btn");
    const verifyInput = document.getElementById("verify-input");
    const verifyResult = document.getElementById("verify-result");
    const fileUploadContainer = document.getElementById("file-upload-container");
    const verifyFileInput = document.getElementById("verify-file-input");
    const verifyFileName = document.getElementById("verify-file-name");

    let attachedFileBuffer = null;

    if (!verifyBtn || !verifyInput || !verifyResult) return;

    // Detect if pasted block is a file block or text block
    verifyInput.addEventListener("input", () => {
        const text = verifyInput.value;
        if (text.includes("[VeriStamp Secure File v2]")) {
            fileUploadContainer.classList.remove("hidden");
        } else {
            fileUploadContainer.classList.add("hidden");
            attachedFileBuffer = null;
            verifyFileInput.value = "";
            verifyFileName.textContent = "";
        }
    });

    verifyFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
            attachedFileBuffer = await file.arrayBuffer();
            verifyFileName.textContent = `Attached: ${file.name}`;
        }
    });

    verifyBtn.addEventListener("click", async () => {
        try {
            const rawText = verifyInput.value.trim();
            if (!rawText) {
                showResult(false, "Please paste a valid VeriStamp message block.");
                return;
            }

            const isFileBlock = rawText.includes("[VeriStamp Secure File v2]");
            const fields = parseBlock(rawText, isFileBlock);

            if (!fields.id || !fields.version || !fields.author || !fields.time || !fields.hash || !fields.signature) {
                showResult(false, "Invalid block format. Missing required fields.");
                return;
            }

            let stringToSign = "";

            if (isFileBlock) {
                if (!fields.fileName || !fields.fileHash) {
                    showResult(false, "Invalid file block format.");
                    return;
                }

                if (!attachedFileBuffer) {
                    showResult(false, "Verification failed: Please attach the target file to verify its integrity.");
                    return;
                }

                // Compute hash of the uploaded file
                const computedHashBuffer = await crypto.subtle.digest("SHA-256", attachedFileBuffer);
                const computedHashHex = [...new Uint8Array(computedHashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");

                if (computedHashHex !== fields.fileHash) {
                    showResult(false, "Verification failed: File integrity mismatch! The uploaded file has been modified or does not match the signed hash.");
                    return;
                }

                stringToSign = [
                    "VERISTAMP-FILE-V2",
                    fields.id,
                    fields.fileName,
                    fields.fileHash,
                    fields.author,
                    fields.time
                ].join("|");

            } else {
                if (!fields.message) {
                    showResult(false, "Invalid message block format.");
                    return;
                }

                stringToSign = [
                    "VERISTAMP-V2",
                    fields.id,
                    fields.message,
                    fields.author,
                    fields.time
                ].join("|");
            }

            // Verify Block Hash
            const actualHash = await CryptoCore.hashMessage(stringToSign);
            if (actualHash !== fields.hash) {
                showResult(false, "Verification failed: block integrity check failed.");
                return;
            }

            // Verify ECDSA Signature
            const signatureValid = await CryptoCore.verifySignature(stringToSign, fields.signature);
            if (!signatureValid) {
                showResult(false, "Verification failed: invalid cryptographic signature.");
                return;
            }

            const issuedAt = new Date(fields.time);

            if (isFileBlock) {
                showResult(
                    true,
                    `✓ File Signature & Integrity Valid!\nVerified by: ${fields.author}\nFile Name: ${fields.fileName}\nIssued: ${issuedAt.toUTCString()}\nID: ${fields.id}`
                );
            } else {
                showResult(
                    true,
                    `✓ Signature Valid & Authentic!\nVerified by: ${fields.author}\nIssued: ${issuedAt.toUTCString()}\nID: ${fields.id}\n\nMessage Content:\n${fields.message}`
                );
            }

        } catch (error) {
            console.error(error);
            showResult(false, "Error processing verification block.");
        }
    });

    function parseBlock(text, isFileBlock) {
        const result = {
            id: "",
            version: "",
            message: "",
            fileName: "",
            fileHash: "",
            author: "",
            time: "",
            hash: "",
            signature: ""
        };

        const lines = text.split(/\r?\n/);
        let currentKey = null;
        let messageLines = [];

        for (let line of lines) {
            const match = line.match(/^(ID|VER|MSG|FILENAME|FILE-HASH|AUTH|TIME|HASH|SIG|VERIFY): (.*)$/);
            
            if (match) {
                currentKey = match[1];
                const value = match[2];

                if (currentKey === "MSG") {
                    messageLines = [value];
                } else if (currentKey === "ID") result.id = value;
                else if (currentKey === "VER") result.version = value;
                else if (currentKey === "FILENAME") result.fileName = value;
                else if (currentKey === "FILE-HASH") result.fileHash = value;
                else if (currentKey === "AUTH") result.author = value;
                else if (currentKey === "TIME") result.time = value;
                else if (currentKey === "HASH") result.hash = value;
                else if (currentKey === "SIG") result.signature = value;
            } else if (currentKey === "MSG") {
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
