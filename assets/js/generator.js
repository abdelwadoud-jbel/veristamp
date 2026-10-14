document.addEventListener('DOMContentLoaded', () => {
    const TARGET_PASS = "AJ2026";

    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const lockScreen = document.getElementById('lock-screen');
    const generatorContainer = document.getElementById('generator-container');
    const unlockBtn = document.getElementById('unlock-btn');
    const passwordInput = document.getElementById('master-password');
    const lockError = document.getElementById('lock-error');

    async function verifyAuth(input) {
        try {
            const inputClean = input.trim();
            const inputHash = await hashString(inputClean);
            const targetHash = await hashString(TARGET_PASS);
            return inputHash === targetHash;
        } catch (e) {
            return false;
        }
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const inputVal = passwordInput.value;
            const isValid = await verifyAuth(inputVal);
            if (isValid) {
                lockScreen.classList.add('hidden');
                generatorContainer.classList.remove('hidden');
            } else {
                lockError.classList.remove('hidden');
                passwordInput.value = "";
            }
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') unlockBtn.click();
        });
    }

    const generateBtn = document.getElementById('generate-btn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        try {
            const errorDiv = document.getElementById('error-msg');
            const errorText = document.getElementById('error-text');
            if (errorDiv) errorDiv.classList.add('hidden');

            const authorSelect = document.getElementById('author-input');
            const authorInput = authorSelect ? authorSelect.value.trim() : "ABDELWADOUD JBEL (AJ)";

            const messageInput = document.getElementById('message-input');
            const rawMessage = messageInput ? DOMPurify.sanitize(messageInput.value.trim().replace(/\r\n/g, '\n')) : "";

            if (!rawMessage) {
                if (errorText && errorDiv) {
                    errorText.textContent = "Please enter a message.";
                    errorDiv.classList.remove('hidden');
                }
                return;
            }

            const now = new Date();
            const year = now.getUTCFullYear();
            const month = String(now.getUTCMonth() + 1).padStart(2, '0');
            const day = String(now.getUTCDate()).padStart(2, '0');
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes} UTC`;

            const stringToSign = `${rawMessage}|${authorInput}|${timestamp}`;
            
            const hashSig = await CryptoCore.hashMessage(stringToSign);
            const digitalSig = await CryptoCore.signData(stringToSign);
            const verifyUrl = `${window.location.origin}/veristamp/verify.html`;

            const formattedText = `[VeriStamp Secure Message]
MSG: ${rawMessage}
AUTH: ${authorInput}
TIME: ${timestamp}
HASH: ${hashSig}
SIG: ${digitalSig}
VERIFY: ${verifyUrl}`;

            document.getElementById('final-output').textContent = formattedText;
            document.getElementById('output-section').classList.remove('hidden');
        } catch (err) {
            console.error(err);
        }
    });

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const text = document.getElementById('final-output').textContent;
            navigator.clipboard.writeText(text);
        });
    }
});
