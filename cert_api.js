/**
 * cert_api.js - وحدة الاتصال الخاصة بالشهادات
 */

async function issueStudentCertificate(orderId) {
    // نستخدم دالة callAPI الموجودة مسبقاً في النظام الأساسي
    return await callAPI('issueCertificate', { orderId: orderId });
}