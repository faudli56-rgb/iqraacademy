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
// الدالة الأساسية للاتصال بالـ API (مع الجدار الناري)
// ==========================================
async function callAPI(action, data = {}) {
    try {
        // جلب المفتاح السري من المتصفح (سيكون فارغاً للزوار)
        const token = sessionStorage.getItem('authToken'); 
        
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            redirect: 'follow', 
            keepalive: true,
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            // إرسال المفتاح مع كل طلب
            body: JSON.stringify({ action: action, data: data, token: token })
        });
        
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            
            // 🚨 الجدار الناري: إذا رفض السيرفر المفتاح (محاولة اختراق أو انتهاء الجلسة)
            if (json.error === 'AUTH_FAILED') {
                console.warn("تم صد محاولة دخول غير مصرحة");
                sessionStorage.clear();
                localStorage.removeItem('is_team_member');
                alert("عذراً، جلسة الإدارة غير صالحة أو منتهية. سيتم طردك للصفحة الرئيسية.");
                window.location.reload();
                return { success: false };
            }
            
            return json;
        } catch (e) {
            console.error('API Parse Error:', text);
            return { success: false, message: 'استجابة غير صالحة من السيرفر.' };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: error.message || 'فشل الاتصال بالخادم' };
    }
}

// ==========================================
// 1. دوال المصادقة (هذه الدالة التي انحذفت بالخطأ)
// ==========================================
async function authenticateUser(username, password) {
    return await callAPI('authenticateUser', { username, password });
}            
            return json;
        } catch (e) {
            console.error('API Parse Error:', text);
            return { success: false, message: 'استجابة غير صالحة من السيرفر.' };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: error.message || 'فشل الاتصال بالخادم' };
    }
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
// دوال تتبع الزوار (محدثة لمنع التكرار والزيارات الوهمية)
// ==========================================
function getStableVisitorId() {
    // نستخدم التخزين الدائم للحفاظ على هوية الزائر حتى لو أغلق المتصفح
    var sessionId = localStorage.getItem('visitor_session');
    if (!sessionId) {
        sessionId = 'زائر-' + Math.floor(10000 + Math.random() * 90000); // توليد رقم خماسي لتجنب التكرار
        localStorage.setItem('visitor_session', sessionId);
    }
    return sessionId;
}

function logVisitorActivity(pageName) {
    // 1. إيقاف الرادار تماماً إذا كان المستخدم مسجل دخول أو تم تمييز جهازه كجهاز إدارة
    if (sessionStorage.getItem('loggedIn') === 'true' || localStorage.getItem('is_team_member') === 'true') {
        return; 
    }

    // 2. جلب المعرف الثابت للزائر
    var sessionId = getStableVisitorId();

    // 3. منع تكرار نفس الصفحة لنفس الزائر في نفس الجلسة النشطة
    var cacheKey = 'visited_' + pageName.trim();
    if (sessionStorage.getItem(cacheKey)) {
        return; 
    }

    sessionStorage.setItem(cacheKey, 'true');
    callAPI('logVisit', { pageName: pageName, sessionId: sessionId }).catch(e => console.log(e));
}
async function fetchVisitorLogs() {
    return await callAPI('fetchVisitorLogs');
}
// ==========================================
// 13. دوال لوحة المسوق الجديدة وسجل السحوبات
// ==========================================

async function getMarketerFullData(code) {
    return await callAPI('getMarketerFullData', { code });
}

async function requestWithdrawalAction(code, amount) {
    return await callAPI('requestWithdrawalAction', { code, amount });
}

async function fetchWithdrawalsHistory(code) {
    return await callAPI('fetchWithdrawalsHistory', { code });
}
