/**
 * cert_ui.js - وحدة إدارة واجهة الشهادات
 */

async function handleIssueCertificate(orderId, btnElement) {
    if(!confirm("تأكيد إصدار واعتماد الشهادة الآلية لهذا المتدرب؟")) return;
    
    var originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإصدار...';
    btnElement.disabled = true;
    btnElement.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const res = await issueStudentCertificate(orderId);
        
        if (res && res.success) {
            showToast("✅ تم إصدار الشهادة بنجاح! رقم القيد: " + res.certId);
            // إعادة تحميل الجدول لتحديث حالة المتدرب إلى "مكتمل"
            var currentRole = sessionStorage.getItem('role');
            var currentCode = sessionStorage.getItem('code');
            var currentName = sessionStorage.getItem('name');
            loadDashboardData(currentRole, currentCode, currentName);
        } else {
            showToast("❌ خطأ: " + (res.error || "حدث خطأ غير معروف"), true);
            btnElement.innerHTML = originalHTML;
            btnElement.disabled = false;
            btnElement.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } catch (err) {
        showToast("❌ خطأ في الاتصال بالخادم.", true);
        btnElement.innerHTML = originalHTML;
        btnElement.disabled = false;
        btnElement.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}