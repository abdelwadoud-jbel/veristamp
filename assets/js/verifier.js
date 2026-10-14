document.addEventListener('DOMContentLoaded', () => {
    const verifyBtn = document.getElementById('verify-now-btn');
    if (!verifyBtn) return;

    verifyBtn.addEventListener('click', async () => {
        // تنظيف شامل للنص الملصق ومعالجة اختلاف الأسطر بين الهواتف والحواسيب
        const rawText = document.getElementById('paste-message-input').value.trim().replace(/\r\n/g, '\n');
        const statusCard = document.getElementById('status-card');
        const detailsCard = document.getElementById('details-card');

        statusCard.classList.add('hidden');
        detailsCard.classList.add('hidden');

        if (!rawText) {
            statusCard.classList.remove('hidden');
            statusCard.className = "glass-card p-6 md:p-8 rounded-3xl text-center space-y-2 border border-amber-500/50 bg-amber-950/30";
            statusCard.innerHTML = `<div class="text-3xl">⚠️</div><h2 class="text-lg font-bold text-amber-400">يرجى لصق الختم أولاً</h2>`;
            return;
        }

        try {
            const msgMatch = rawText.match(/MSG:\s*([\s\S]+?)(?=\nAUTH:|$)/);
            const authMatch = rawText.match(/AUTH:\s*(.+)/);
            const timeMatch = rawText.match(/TIME:\s*(.+)/);
            const hashMatch = rawText.match(/HASH:\s*([a-fA-F0-9]{64})/);
            const sigMatch = rawText.match(/SIG:\s*([\s\S]+?)(?=\nVERIFY:|$)/);

            if (!msgMatch || !authMatch || !timeMatch || !hashMatch || !sigMatch) {
                throw new Error("Invalid Structure");
            }

            const message = msgMatch[1].trim();
            let rawAuthor = authMatch[1].trim();
            if (rawAuthor.includes("AJ")) rawAuthor = "AJ";

            const time = timeMatch[1].trim();
            const originalHash = hashMatch[1].trim();
            const digitalSig = sigMatch[1].trim().replace(/\s+/g, '');

            // إعادة بناء السلسلة الرياضية تماماً كما تم توليدها
            const stringToVerify = `${message}|${rawAuthor}|${time}`;
            const computedHash = await CryptoCore.hashMessage(stringToVerify);
            const isSignatureValid = await CryptoCore.verifyData(stringToVerify, digitalSig);

            let displayAuthor = rawAuthor === "AJ" ? "AJ (ABDELWADOUD JBEL)" : rawAuthor;

            document.getElementById('v-author').textContent = displayAuthor;
            document.getElementById('v-time').textContent = time;
            document.getElementById('v-hash').textContent = originalHash;
            document.getElementById('v-message').textContent = message;

            if (computedHash === originalHash && isSignatureValid && CryptoCore.ALLOWED_AUTHORS.includes(rawAuthor)) {
                statusCard.classList.remove('hidden');
                detailsCard.classList.remove('hidden');
                statusCard.className = "glass-card p-6 md:p-8 rounded-3xl text-center space-y-3 border border-emerald-500/50 bg-emerald-950/30";
                statusCard.innerHTML = `
                    <div class="inline-flex p-3 bg-emerald-500/10 rounded-full text-emerald-400 text-3xl mb-1 shadow-inner">✅</div>
                    <h2 class="text-xl font-bold text-emerald-400">رسالة أصلية 100% (سليمة تماماً)</h2>
                    <p class="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">طابق الفحص الرياضي التوقيع وبصمة SHA-256 بدقة ذرة. هذه الرسالة أصلية وصادرة عن ${displayAuthor}.</p>
                `;
            } else {
                throw new Error("Cryptographic Mismatch");
            }

        } catch (e) {
            statusCard.classList.remove('hidden');
            detailsCard.classList.add('hidden');
            statusCard.className = "glass-card p-6 md:p-8 rounded-3xl text-center space-y-3 border border-rose-500/50 bg-rose-950/30";
            statusCard.innerHTML = `
                <div class="inline-flex p-3 bg-rose-500/10 rounded-full text-rose-400 text-3xl mb-1 shadow-inner">🚨</div>
                <h2 class="text-xl font-bold text-rose-400">فشل التشفير التحقيقي: رسالة معدّلة أو مزيفة!</h2>
                <p class="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">فشلت مطابقة بصمة الهاش أو التوقيع الرقمي. تم التلاعب بمحتوى الرسالة.</p>
            `;
        }
    });
});