/**
 * api.js - عميل API للاتصال بـ Google Apps Script
 * أكاديمية اقرأ للاستشارات والتدريب
 * 
 * يحل محل جميع استدعاءات google.script.run
 */

// ==========================================
// إعدادات الاتصال
// ==========================================

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbx51syLRrRu0JrDhhgaySviP0hOp0yOhe-ymywoVb_nF2O2Gt2B-2AclzzL6fjRUzTu/exec';

// ==========================================
// الدالة الأساسية للاتصال بالـ API
// ==========================================

async function callAPI(action, data = {}) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            redirect: 'follow', 
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action, data })
        });
        
        // استلام الرد كنص أولاً لمنع أخطاء الترجمة
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('API Parse Error:', text);
            return { 
                success: false, 
                message: 'استجابة غير صالحة من السيرفر. قد يحتاج سكريبت جوجل إلى تجديد الصلاحيات.' 
            };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        return { 
            success: false, 
            message: error.message || 'فشل الاتصال بالخادم' 
        };
    }
}
// ==========================================
// 1. دوال المصادقة
// ==========================================

async function authenticateUser(username, password) {
    return await callAPI('authenticateUser', { username, password });
}

// ==========================================
// 2. دوال التسجيل
// ==========================================

async function registerTraineeFinal(studentData) {
    return await callAPI('registerTrainee', { studentData });
}

async function generateOrderID() {
    return await callAPI('generateOrderID');
}

// ==========================================
// 3. دوال لوحة التحكم والإحصائيات
// ==========================================

async function fetchAdminAnalytics() {
    return await callAPI('fetchAdminAnalytics');
}

async function getAdminStats(role, code, userName) {
    return await callAPI('getAdminStats', { role, code, userName });
}

async function fetchDashboardDataFinal(role, code, userName) {
    return await callAPI('fetchDashboardData', { role, code, userName });
}

async function getAdminDashboardStats() {
    return await callAPI('getAdminDashboardStats');
}

// ==========================================
// 4. دوال إدارة المتدربين
// ==========================================

async function updateStudentState(orderId, newStatus) {
    return await callAPI('updateStudentState', { orderId, newStatus });
}

async function updateStudentFullStatus(rowNum, regStatus, payStatus) {
    return await callAPI('updateStudentFullStatus', { rowNum, regStatus, payStatus });
}

// ==========================================
// 5. دوال إدارة الدورات
// ==========================================

async function fetchCoursesFromSheet() {
    return await callAPI('fetchCourses');
}

async function addCourseFromAdmin(courseData) {
    return await callAPI('addCourse', { courseData });
}

async function updateCourseFromAdmin(id, data) {
    return await callAPI('updateCourse', { id, data });
}

async function removeCourseFinal(identifier) {
    return await callAPI('deleteCourse', { identifier });
}

async function fetchCourseLandingData(courseTitle) {
    return await callAPI('fetchCourseLandingData', { courseTitle });
}

async function saveDetailsToSheet(detailsData) {
    return await callAPI('saveCourseDetails', { detailsData });
}

// ==========================================
// 6. دوال إدارة الأخبار
// ==========================================

async function fetchNewsFromSheet() {
    return await callAPI('fetchNews');
}

async function addNewsFromAdmin(newsData) {
    return await callAPI('addNews', { newsData });
}

async function removeNewsFinal(identifier) {
    return await callAPI('deleteNews', { identifier });
}

// ==========================================
// 7. دوال إدارة الإعلانات
// ==========================================

async function fetchActiveAdsFromSheet() {
    return await callAPI('fetchAds');
}

async function addAdFromAdmin(adData) {
    return await callAPI('addAd', { adData });
}

async function deleteAdFromAdmin(adId) {
    return await callAPI('deleteAd', { adId });
}

// ==========================================
// 8. دوال آراء العملاء
// ==========================================

async function fetchTestimonialsFromSheet() {
    return await callAPI('fetchTestimonials');
}

async function addTestimonialFromAdmin(testimonialData) {
    return await callAPI('addTestimonial', { testimonialData });
}

async function deleteTestimonialFromAdmin(id) {
    return await callAPI('deleteTestimonial', { id });
}

// ==========================================
// 9. دوال نظام المدفوعات
// ==========================================

async function fetchActivePaymentMethods() {
    return await callAPI('fetchPaymentMethods');
}

async function submitPaymentForm(paymentData) {
    return await callAPI('submitPayment', { paymentData });
}

async function fetchAdminPayments() {
    return await callAPI('fetchPayments');
}

async function processPaymentAction(rowNum, orderId, status, reason) {
    return await callAPI('processPayment', { rowNum, orderId, status, reason });
}

// ==========================================
// 10. دوال التحقق من الشهادات
// ==========================================

async function verifyCertificate(certId) {
    return await callAPI('verifyCertificate', { certId });
}

// ==========================================
// 11. دوال الإعدادات
// ==========================================

async function getSystemSettings() {
    return await callAPI('getSettings');
}

async function saveSettingsFromAdmin(settingsData) {
    return await callAPI('saveSettings', { settingsData });
}

// ==========================================
// 12. دوال رفع الملفات
// ==========================================

async function uploadImage(base64Data, fileName) {
    return await callAPI('uploadImage', { base64Data, fileName });
}

async function uploadReceipt(base64Data, fileName) {
    return await callAPI('uploadReceipt', { base64Data, fileName });
}
// ==========================================
// دوال تتبع الزوار (للمدير فقط)
// ==========================================
function logVisitorActivity(pageName, sessionId) {
    // لا نستخدم await لكي لا نؤخر تصفح الزائر، يتم الإرسال في الخلفية
    callAPI('logVisit', { pageName, sessionId }).catch(e => console.log(e));
}
async function fetchVisitorLogs() {
    return await callAPI('fetchVisitorLogs');
}
