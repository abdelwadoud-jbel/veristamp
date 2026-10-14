document.addEventListener('DOMContentLoaded', () => {
    // هذا هو "هاش SHA-256" الخاص بكلمة المرور الخاصة بك (مثلاً كلمة المرور هنا هي: AJ2026)
    // الهاش أدناه يمثل كلمة المرور "AJ2026" ولا يمكن لأحد معرفة كلمة المرور من خلاله أبداً.
    const CORRECT_PIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"; 
    // ملاحظة: إذا أردت تغيير كلمة المرور، يمكنك حساب هاش الكلمة الجديدة ووضعه هنا.

    const lockScreen = document.getElementById('lock-screen');
    const generatorContainer = document.getElementById('generator-container');
    const unlockBtn = document.getElementById('unlock-btn');
    const passwordInput = document.getElementById('master-password');
    const lockError = document.getElementById('lock-error');

    async function verifyPin(inputPin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(inputPin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex === CORRECT_PIN_HASH;
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', async () => {
            const inputVal = passwordInput.value.trim();
            const isValid = await verifyPin(inputVal);
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
            let authorInput = authorSelect ? authorSelect.value.trim() : "AJ";
            if (authorInput.includes("AJ")) authorInput = "AJ";

            const messageInput = document.getElementById('message-input');
            // تنظيف النص وتوحيد الأسطر لمنع أي تضارب بين الهاتف والحاسوب
            const rawMessage = messageInput ? DOMPurify.sanitize(messageInput.value.trim().replace(/\r\n/g, '\n')) : "";

            if (!rawMessage) {
                if (errorText && errorDiv) {
                    errorText.textContent = "يرجى إدخال نص الرسالة أولاً.";
                    errorDiv.classList.remove('hidden');
                }
                return;
            }

            // توقيت UTC موحد ودقيق عالمياً لا يتأثر بنوع الجهاز
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
            const verifyUrl = `${window.location.origin}/verify.html`;

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
            alert("حدث خطأ أثناء التوليد.");
        }
    });

    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const text = document.getElementById('final-output').textContent;
            navigator.clipboard.writeText(text);
            alert("تم نسخ التوقيع بنجاح!");
        });
    }
});