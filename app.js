/**
 * app.js - جافاسكربت الموقع الرئيسي
 * أكاديمية اقرأ للاستشارات والتدريب
 * 
 * تم تعديل جميع استدعاءات google.script.run لاستخدام دوال api.js
 */

// ==========================================
// المتغيرات العالمية
// ==========================================

var globalCourses = [];
var globalAds = [];
var currentAdIndex = 0;
var totalViews = 1482;
var totalClicks = 342;

// محاولة استرجاع البيانات من التخزين المحلي
try {
    if (localStorage.getItem('site_views')) totalViews = parseInt(localStorage.getItem('site_views'), 10);
    if (localStorage.getItem('wa_clicks')) totalClicks = parseInt(localStorage.getItem('wa_clicks'), 10);
} catch(e) {}

// ==========================================
// دوال التهيئة والتنقل
// ==========================================

function initializeWebsiteLayout() {
    try { 
        totalViews += 1;
        localStorage.setItem('site_views', totalViews); 
    } catch(e) {}
    
    loadCoursesFromServer();
    loadNewsFromServer();
    loadTestimonialsFromServer();
    loadRealAdsFromServer();
    loadPaymentMethods();
    
    setTimeout(function() { 
        var welcomePopup = document.getElementById('welcome-popup');
        if(welcomePopup) welcomePopup.classList.remove('hidden'); 
    }, 6000);
}

function toggleMobileMenu() {
    var menu = document.getElementById('mobile-menu');
    var icon = document.getElementById('menu-toggle-icon');
    if (menu.classList.contains('hidden')) { 
        menu.classList.remove('hidden'); 
        icon.innerHTML = "&#10006;"; 
    } else { 
        menu.classList.add('hidden'); 
        icon.innerHTML = "&#9776;"; 
    }
}

function closePopup() { 
    document.getElementById('welcome-popup').classList.add('hidden'); 
}

function popupActionRegister() { 
    closePopup(); 
    navigateTo('register'); 
}

function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('header nav a').forEach(b => b.classList.remove('nav-active'));
    if(document.getElementById('page-' + pageId)) document.getElementById('page-' + pageId).classList.add('active');
    if(document.getElementById('btn-' + pageId)) document.getElementById('btn-' + pageId).classList.add('nav-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function trackButtonClick(buttonName) {
    if(buttonName === 'WhatsApp_Float') { 
        try { 
            totalClicks += 1; 
            localStorage.setItem('wa_clicks', totalClicks); 
        } catch(e) {}
    }
}

// ==========================================
// دوال عرض الإعلانات
// ==========================================

function renderAdsGrid(ads) {
    var container = document.getElementById('b2b-offers-container');
    if(!container) return;
    
    if (ads.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-6 text-xs">لا توجد عروض شراكة منشورة حالياً.</div>';
        return;
    }
    
    container.innerHTML = '';
    ads.forEach(function(ad) {
        var badgeColor = ad.type === 'مبادرات مجتمعية' ? 'bg-emerald-600' : 
                        (ad.type === 'منظمات دولية ومحلية' ? 'bg-[#0B1F4D]' : 'bg-[#D4A017]');
        
        // 1. تنظيف النصوص من أي رموز قد تكسر الرابط
        var safeTitle = ad.title ? ad.title.replace(/'/g, "").replace(/"/g, "") : '';
        var safeType = ad.type ? ad.type.replace(/'/g, "").replace(/"/g, "") : 'غير محدد';
        
        // 2. تجهيز رسالة الواتساب والرابط مباشرة هنا
        var message = encodeURIComponent("مرحباً إدارة أكاديمية اقرأ،\nنحن جهة/منظمة ونرغب بالاستفسار بخصوص:\nالقسم: (" + safeType + ")\nالعرض: [" + safeTitle + "]\nنرجو التواصل معنا للتفاصيل.");
        var waLink = "https://wa.me/967772914419?text=" + message;

        var cardMarkup = `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full text-right">
            <div class="relative h-48 overflow-hidden">
                <img src="${getValidImageUrl(ad.img)}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800'">
                <span class="absolute top-3 right-3 ${badgeColor} text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">${ad.type}</span>
            </div>
            <div class="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <h3 class="font-black text-md text-[#0B1F4D] leading-snug mb-2">${ad.title}</h3>
                    <p class="text-xs text-slate-400 font-bold mb-4"><i class="fas fa-info-circle text-[#D4A017] ml-1"></i> ${ad.date}</p>
                </div>
                <button onclick="window.open('${waLink}', '_blank')" class="w-full bg-slate-50 hover:bg-[#0B1F4D] text-[#0B1F4D] hover:text-white border border-slate-200 hover:border-transparent py-2.5 rounded-xl text-xs font-bold transition">طلب تفاصيل أو تقديم عرض</button>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', cardMarkup);
    });
}
function moveAdSlide(dir) {
    if (!globalAds || globalAds.length === 0) return;
    currentAdIndex = (currentAdIndex + dir + globalAds.length) % globalAds.length;
    setAdSlide(currentAdIndex);
}

function setAdSlide(idx) {
    if (!globalAds || globalAds.length === 0) return;
    currentAdIndex = idx;
    var slider = document.getElementById('ads-slider-container');
    if(slider) {
        var slides = slider.querySelectorAll('.slide');
        if (slides.length > 0) {
            slider.style.transform = "translateX(-" + (idx * 100) + "%)";
        }
    }
    var dots = document.querySelectorAll('.dot');
    dots.forEach(function(d, i) {
        if (i === idx) d.classList.add('active');
        else d.classList.remove('active');
    });
}

// ==========================================
// دوال معالجة الصور
// ==========================================

function getValidImageUrl(url) {
    if (!url || url.trim() === "") {
        return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600";
    }
    
    if (url.includes("drive.google.com/file/d/")) {
        var match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return "https://drive.google.com/thumbnail?id=" + match[1] + "&sz=w800";
        }
    }
    else if (url.includes("drive.google.com") && url.includes("id=")) {
        var matchUc = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (matchUc && matchUc[1]) {
            return "https://drive.google.com/thumbnail?id=" + matchUc[1] + "&sz=w800";
        }
    }
    
    return url;
}

// ==========================================
// دوال جلب وعرض الدورات
// ==========================================

async function loadCoursesFromServer() {
    try {
        const courses = await fetchCoursesFromSheet();
        globalCourses = courses;
        renderCourses(courses);
        updateRegistrationDropdown(courses);
    } catch(e) {
        console.error('خطأ في جلب الدورات:', e);
    }
}

function renderCourses(courses) {
    var fullContainer = document.getElementById('courses-list-container');
    var homeFeaturedContainer = document.getElementById('home-featured-courses');
    var adminCoursesList = document.getElementById('admin-courses-list'); 
    
    if(fullContainer) fullContainer.innerHTML = ''; 
    if(homeFeaturedContainer) homeFeaturedContainer.innerHTML = ''; 
    if(adminCoursesList) adminCoursesList.innerHTML = ''; 
    
    courses.forEach(function(c, index) {
        var cardMarkup = `
        <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col justify-between text-right transition hover:shadow-xl" data-category="${c.category}">
           <img class="h-44 w-full object-cover" src="${getValidImageUrl(c.image)}" loading="lazy">
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div class="mb-4">
                    <span class="bg-slate-100 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">${c.category}</span>
                    <h3 class="font-bold text-md text-[#0B1F4D] mt-3">${c.title}</h3>
                    <p class="text-xs text-slate-500 mt-1.5"><i class="fas fa-chalkboard-teacher ml-1.5 text-[#D4A017]"></i> المدرب: ${c.trainer}</p>
                    <p class="text-xs text-slate-400 mt-0.5"><i class="fas fa-clock ml-1.5 text-slate-400"></i> المدة: ${c.duration || '36 ساعة تدريبية'}</p>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-slate-50">
                    <span class="text-amber-600 font-extrabold text-sm">${c.fee}</span>
                    <div class="flex gap-2">
                        <button onclick="openLandingPage('${c.title}')" class="bg-slate-100 hover:bg-slate-200 text-[#0B1F4D] text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition cursor-pointer">التفاصيل</button>
                        <button onclick="selectCourseDirectly('${c.title}')" class="bg-[#0B1F4D] hover:bg-[#132F6B] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-md transition cursor-pointer">سجل الآن</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        if(fullContainer) fullContainer.insertAdjacentHTML('beforeend', cardMarkup);
        if(homeFeaturedContainer && index < 3) homeFeaturedContainer.insertAdjacentHTML('beforeend', cardMarkup);

        if(adminCoursesList) {
            adminCoursesList.insertAdjacentHTML('beforeend', `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <span class="font-bold text-[#0B1F4D] truncate w-1/3">${c.title}</span>
                <div class="flex gap-1">
                    <button onclick="openDetailsModal('${c.title}', event)" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow-sm transition">التفاصيل</button>
                    <button onclick="openEditCourseModal('${c.id}', '${c.title}', '${c.trainer}', '${c.duration}', '${c.fee}', '${c.category}')" class="bg-emerald-600 text-white px-2 py-1 rounded shadow-sm">تعديل</button>
                    <button onclick="deleteCourse('${c.id}')" class="bg-rose-500 text-white px-2 py-1 rounded shadow-sm">حذف</button>
                </div>
            </div>`);
        }
    });
}

function filterCourses(category) {
    document.querySelectorAll('#courses-list-container > div').forEach(function(card) {
        card.style.display = (category === 'all' || card.getAttribute('data-category') === category) ? 'flex' : 'none';
    });
}

function updateRegistrationDropdown(courses) {
    var selectBox = document.getElementById('reg-course'); 
    if(!selectBox) return;
    selectBox.innerHTML = '<option value="">-- انقر هنا لتحديد المسار التدريبي --</option>';
    courses.forEach(function(c) { 
        selectBox.insertAdjacentHTML('beforeend', `<option value="${c.title}">${c.title}</option>`); 
    });
}

function selectCourseDirectly(courseTitle) { 
    document.getElementById('reg-course').value = courseTitle; 
    showSelectedCourseDetails();
    navigateTo('register'); 
}

function showSelectedCourseDetails() {
    var selectedTitle = document.getElementById('reg-course').value;
    var course = null;
    for(var i=0; i<globalCourses.length; i++) {
        if(globalCourses[i].title === selectedTitle) { course = globalCourses[i]; break; }
    }
    var display = document.getElementById('course-dynamic-info');
    if(!display) return;
     
    if (course) {
        display.innerHTML = `
            <div class="flex items-center gap-2"><i class="fas fa-info-circle text-blue-500"></i> تفاصيل المسار المختار:</div>
            <ul class="list-disc list-inside font-bold mr-2 text-blue-900 mt-1 space-y-1">
                <li>المدة: ${course.duration || 'مفتوحة'}</li>
                <li>الرسوم: ${course.fee || 'مجاناً'}</li>
                <li>موعد البدء: قريباً (سيتم الإبلاغ عبر الواتساب)</li>
            </ul>`;
        display.classList.remove('hidden');
    } else {
        display.classList.add('hidden');
    }
}

// ==========================================
// دوال التسجيل
// ==========================================

async function handleNewRegistration(e) {
    e.preventDefault();
    var submitBtn = document.getElementById('submit-btn');
    if(!submitBtn) return;
    
    var originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = 'جاري التسجيل والربط...';
    submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

    var studentData = {
        nameAr: document.getElementById('reg-name-ar') ? document.getElementById('reg-name-ar').value : '',
        nameEn: document.getElementById('reg-name-en') ? document.getElementById('reg-name-en').value : '',
        whatsapp: document.getElementById('reg-whatsapp') ? document.getElementById('reg-whatsapp').value : '',
        nationality: document.getElementById('reg-nationality') ? document.getElementById('reg-nationality').value : '',
        residence: document.getElementById('reg-residence') ? document.getElementById('reg-residence').value : 'أصلي',
        governorate: document.getElementById('reg-governorate') ? document.getElementById('reg-governorate').value : '',
        course: document.getElementById('reg-course') ? document.getElementById('reg-course').value : '',
        gender: document.getElementById('reg-gender') ? document.getElementById('reg-gender').value : '',
        degree: document.getElementById('reg-degree') ? document.getElementById('reg-degree').value : '',
        platform: document.getElementById('reg-platform') ? document.getElementById('reg-platform').value : '',
        marketerCode: localStorage.getItem('marketerRef') || ''
    };

    try {
        const res = await registerTraineeFinal(studentData);
        
        if(res && res.success) {
            var formChildren = document.getElementById('registration-form').children;
            for (var i = 0; i < formChildren.length; i++) {
                 if (formChildren[i].id !== 'successMessage') { formChildren[i].style.display = 'none'; }
            }
            
            var successDiv = document.getElementById('successMessage');
            if(successDiv) {
                successDiv.classList.remove('hidden');
                successDiv.style.display = 'block';
                if(document.getElementById('displayOrderID')) {
                    document.getElementById('displayOrderID').innerText = res.orderID;
                }
            }
            
            alert("اتممت عملية التسجيل بنجاح في الأكاديمية!");
            setTimeout(function() { 
                window.open("https://whatsapp.com/channel/0029VbCDK6M4IBhBR3jvVY0Y", "_blank"); 
            }, 3000);
        } else {
            alert("❌ خطأ أثناء التسجيل: " + (res ? res.error : "غير معروف"));
            submitBtn.disabled = false; 
            submitBtn.innerText = originalText; 
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    } catch(err) {
        alert("❌ خطأ اتصال بالسيرفر: " + err); 
        submitBtn.disabled = false; 
        submitBtn.innerText = originalText; 
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

function searchNews() {
    var term = document.getElementById('news-search').value.toLowerCase();
    var cards = document.querySelectorAll('#news-list-container > div');
    cards.forEach(function(card) {
        var txt = card.innerText.toLowerCase();
        card.style.display = txt.includes(term) ? 'flex' : 'none';
    });
}

// ==========================================
// دوال التواصل
// ==========================================

function handleContactSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('contact-submit-btn');
    var msgObj = {
        name: document.getElementById('contact-name').value,
        type: document.getElementById('contact-type').value,
        method: document.getElementById('contact-method').value,
        text: document.getElementById('contact-msg').value
    };
     
    if(msgObj.method === 'whatsapp') {
        var waText = encodeURIComponent("مرحباً إدارة أكاديمية اقرأ،\nالاسم: " + msgObj.name + "\nالنوع: " + msgObj.type + "\nالرسالة: " + msgObj.text);
        window.open('https://wa.me/967777644293?text=' + waText, '_blank');
    } else if (msgObj.method === 'email') {
        var mailText = encodeURIComponent("الاسم: " + msgObj.name + "\nالرسالة: " + msgObj.text);
        window.open('mailto:aqraakadymyt51@gmail.com?subject=' + encodeURIComponent(msgObj.type) + '&body=' + mailText, '_blank');
    }     
    btn.innerText = "تم التوجيه بنجاح!";
    setTimeout(function() { btn.innerText = "إرسال الرسالة الحين"; e.target.reset(); }, 3000);
}

function requestB2BQuote(offerName, offerType) {
    try {
        var message = "";
        
        // التحقق مما إذا كان الضغط من الزر الداخلي (يحتوي على نوع العرض)
        if (offerType && offerType !== 'undefined') {
            message = encodeURIComponent("مرحباً إدارة أكاديمية اقرأ،\nنحن جهة/منظمة ونرغب بالاستفسار بخصوص:\nالقسم: (" + offerType + ")\nالعرض: [" + offerName + "]\nنرجو التواصل معنا للتفاصيل.");
        } 
        // أو إذا كان الضغط من الزر العام أسفل الصفحة
        else {
            var offerText = offerName ? offerName : "شراكات المنظمات والخدمات العامة";
            message = encodeURIComponent("مرحباً إدارة أكاديمية اقرأ،\nنحن جهة/منظمة ونرغب بالاستفسار عن: [" + offerText + "].\nنرجو التواصل معنا للتفاصيل.");
        }
        
        window.open('https://wa.me/967777644293?text=' + message, '_blank');
    } catch(e) {
        console.error("خطأ في فتح الواتساب:", e);
    }
}
// ==========================================
// دوال التحقق من الشهادات
// ==========================================

async function runCertificateVerification() {
    var certId = document.getElementById('cert-search-input').value.trim();
    var resBox = document.getElementById('cert-result-box');
    if(!certId) { alert("لطفاً، أدخل رقم الشهادة الموحد."); return; }
    resBox.classList.remove('hidden');
    resBox.className = "mt-8 p-5 text-center text-xs font-bold border rounded-2xl bg-slate-50";
    resBox.innerHTML = "جاري فحص القيود والملفات الفورية بمخازن الأكاديمية...";
     
    try {
        const result = await verifyCertificate(certId);
        renderVerificationResult(result);
    } catch(e) {
        resBox.className = "mt-8 p-5 text-center text-xs font-bold border rounded-2xl bg-rose-50";
        resBox.innerHTML = "❌ خطأ في الاتصال: " + e;
    }
}

function renderVerificationResult(result) {
    var resBox = document.getElementById('cert-result-box');
    resBox.classList.remove('hidden');
    if(result.found) {
        var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent(window.location.href + "?cert=" + result.id);
        resBox.className = "mt-8 p-6 rounded-2xl border bg-emerald-50/70 border-emerald-200 text-right space-y-3 text-xs text-slate-700 shadow-sm";
        resBox.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="space-y-2 flex-1">
                <div class="text-emerald-700 font-black text-sm mb-2 flex items-center gap-1">الشهادة معتمدة وصحيحة ✅</div>
                <p><strong class="text-[#0B1F4D]">اسم المتدرب:</strong> ${result.studentAr}</p>
                <p><strong class="text-[#0B1F4D]">البرنامج:</strong> ${result.course}</p>
                <p><strong class="text-[#0B1F4D]">تاريخ الإصدار:</strong> ${result.date}</p>
                <div class="pt-2"><a href="${result.pdfUrl}" target="_blank" class="inline-block bg-[#0B1F4D] hover:bg-[#132F6B] text-white px-5 py-2 rounded-xl font-bold shadow">تحميل الشهادة pdf</a></div>
            </div>
            <div class="bg-white p-2 rounded-xl shadow border border-emerald-100"><img src="${qrUrl}" alt="QR" class="w-24 h-24 mx-auto"></div>
        </div>`;
    } else {
        resBox.className = "mt-8 p-6 rounded-2xl border bg-rose-50 border-rose-200 text-right text-xs shadow-sm text-slate-700 leading-relaxed";
        resBox.innerHTML = `<div class="text-rose-700 font-extrabold text-sm mb-2">✕ حظر التحقق الإلكتروني</div><p class="font-semibold text-slate-600">عذراً، لم نجد قيد رسمي يطابق هذا الرقم.</p>`;
    }
}
// ==========================================
// دوال نظام الدخول والصلاحيات
// ==========================================

function openLoginModal() { 
    document.getElementById('loginModal').classList.remove('hidden'); 
}

function closeLoginModal() { 
    document.getElementById('loginModal').classList.add('hidden'); 
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('loginSubmitBtn');
    var user = document.getElementById('loginUser').value;
    var pass = document.getElementById('loginPass').value;
    
    btn.innerText = "جاري التحقق..."; 
    btn.disabled = true;

    try {
        const res = await authenticateUser(user, pass);
        
        if(res.success) {
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('role', res.role);
            sessionStorage.setItem('code', res.marketerCode);
            sessionStorage.setItem('name', res.name);
            
            document.getElementById('main-content').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            
            document.getElementById('userNameDisplay').innerText = res.name;
            var roleAr = res.role === 'admin' ? "مدير النظام" : (res.role === 'marketer' ? "مسوق معتمد" : "مدرب معتمد");
            document.getElementById('userRoleDisplay').innerText = roleAr;
            
            if(res.role === 'marketer' && res.marketerCode) {
                document.getElementById('marketer-link-box').classList.remove('hidden');
                var siteUrl = typeof SCRIPT_URL !== 'undefined' ? SCRIPT_URL : window.location.href.split('?')[0];
                document.getElementById('marketer-link-input').value = siteUrl + "?ref=" + res.marketerCode;
            } else {
                document.getElementById('marketer-link-box').classList.add('hidden');
            }

            if(res.role !== 'admin') {
                document.getElementById('tab-btn-content').style.display = 'none';
                document.getElementById('tab-btn-settings').style.display = 'none';
                if(document.getElementById('tab-btn-ads-news')) {
                    document.getElementById('tab-btn-ads-news').style.display = 'none';
                }
                if(document.getElementById('tab-btn-payments')) {
                    document.getElementById('tab-btn-payments').style.display = 'none';
                }
                document.getElementById('tab-title-users').innerText = "طلابي المسجلين";
                switchAdminTab('tab-stats', document.getElementById('tab-btn-stats'));
            } else {
                document.getElementById('tab-btn-content').style.display = 'block';
                document.getElementById('tab-btn-settings').style.display = 'block';
                if(document.getElementById('tab-btn-ads-news')) {
                    document.getElementById('tab-btn-ads-news').style.display = 'block';
                }
                if(document.getElementById('tab-btn-payments')) {
                    document.getElementById('tab-btn-payments').style.display = 'block';
                }
                document.getElementById('tab-title-users').innerText = "إدارة المتدربين";
            }
            
            loadDashboardData(res.role, res.marketerCode, res.name);
            loadStatsData(res.role, res.marketerCode, res.name);
            closeLoginModal();
        } else {
            alert(res.message);
        }
        btn.innerText = "دخول"; 
        btn.disabled = false;
    } catch(err) {
        alert("خطأ في الاتصال بالخادم: " + err); 
        btn.innerText = "دخول"; 
        btn.disabled = false;
    }
}

function logout() {
    sessionStorage.clear();
    document.getElementById('admin-content').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    navigateTo('home');
}

// ==========================================
// دوال جلب بيانات الجدول
// ==========================================

async function loadDashboardData(role, code, name) {
    try {
        const data = await fetchDashboardDataFinal(role, code, name);
        var tbody = document.getElementById('dataTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if(data.length > 0 && data[0].error) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">خطأ: ${data[0].error}</td></tr>`;
            return;
        }
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500 font-bold">لا يوجد متدربين حالياً لعرضهم.</td></tr>`;
            return;
        }

        var countElement = document.getElementById('totalRecordsCount');
        if(countElement) countElement.innerText = data.length;
        
        let safeRole = role ? role.toString().toLowerCase().trim() : '';
        let isAdmin = (safeRole === 'admin' || safeRole === 'مدير');

        data.forEach(function(row) {
            let currentStatus = row.status ? row.status.toString().trim() : 'جديد';
            let statusBadge = '';
            let actionButtons = '';

            if (currentStatus === 'جديد' || currentStatus === '') {
                statusBadge = `<span class="text-blue-600 bg-blue-50 px-2 py-1 rounded">جديد</span>`;
                actionButtons = `
                    <button onclick="updateStudentState('${row.orderID}', 'مقبول')" class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 m-1">قبول</button>
                    <button onclick="updateStudentState('${row.orderID}', 'مرفوض')" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 m-1">رفض</button>
                `;
            } 
            else if (currentStatus === 'مقبول') {
                statusBadge = `<span class="text-green-600 bg-green-50 px-2 py-1 rounded">مقبول</span>`;
                actionButtons = `
                    <button onclick="updateStudentState('${row.orderID}', 'تم تسديد الشهادة')" class="bg-[#D4A017] text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 m-1 shadow-sm">سدد الشهادة</button>
                    <button onclick="updateStudentState('${row.orderID}', 'لم يتم تسديد الشهادة')" class="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 m-1 shadow-sm">لم يسدد</button>
                `;
            } 
            else if (currentStatus === 'تم تسديد الشهادة') {
                statusBadge = `<span class="text-[#D4A017] font-bold bg-yellow-50 px-2 py-1 rounded">تم تسديد الشهادة</span>`;
                actionButtons = `<span class="text-xs text-gray-400 font-bold">مكتمل ✔️</span>`;
            } 
            else if (currentStatus === 'لم يتم تسديد الشهادة') {
                statusBadge = `<span class="text-gray-600 bg-gray-100 px-2 py-1 rounded">لم يسدد</span>`;
                actionButtons = `
                    <button onclick="updateStudentState('${row.orderID}', 'تم تسديد الشهادة')" class="bg-[#D4A017] text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 m-1 shadow-sm">تأكيد التسديد</button>
                `;
            }
            else if (currentStatus === 'مرفوض') {
                statusBadge = `<span class="text-red-600 bg-red-50 px-2 py-1 rounded">مرفوض</span>`;
                actionButtons = `<span class="text-xs text-gray-400">-</span>`;
            } 
            else {
                statusBadge = `<span class="text-gray-600">${currentStatus}</span>`;
                actionButtons = `<span class="text-xs text-gray-400">-</span>`;
            }

            let adminCell = isAdmin ? `<td class="p-3 border border-slate-100 text-center">${actionButtons}</td>` : `<td class="hidden"></td>`;

            tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition text-center">
                <td class="p-3 border border-slate-100 font-bold">${row.orderID}</td>
                <td class="p-3 border border-slate-100">${row.name}</td>
                <td class="p-3 border border-slate-100 text-blue-900 font-semibold">${row.course}</td>
                <td class="p-3 border border-slate-100 font-black">${statusBadge}</td>
                ${adminCell}
            </tr>`;
        });
        
        var actionCol = document.getElementById('actionColumn');
        if(actionCol) {
            if(isAdmin) {
                actionCol.classList.remove('hidden');
            } else {
                actionCol.classList.add('hidden');
            }
        }
        
    } catch(e) {
        console.error('خطأ في جلب بيانات الجدول:', e);
    }
}

// ==========================================
// دوال الإحصائيات
// ==========================================

async function loadStatsData(role, code, name) {
    try {
        const res = await getAdminStats(role, code, name);
        
        if(res && res.success) {
            var statsEls = document.querySelectorAll('#tab-stats .grid .text-2xl');
            
            for(var i=0; i<statsEls.length; i++) {
                var el = statsEls[i];
                var parentContent = el.parentNode.parentNode.innerHTML + el.parentNode.innerHTML;
                
                if (parentContent.includes('إجمالي المتدربين')) {
                    el.innerText = res.studentsCount;
                } else if (parentContent.includes('الشهادات الصادرة')) {
                    el.innerText = res.certsCount;
                } else if (parentContent.includes('المسوقين النشطين')) {
                    if (res.userType === 'admin') {
                        el.innerHTML = '<select class="w-full text-center bg-transparent border-0 focus:ring-0 cursor-pointer" style="font-size:16px; outline:none; appearance:none;">' +
                                       '<option value="">العدد: ' + res.marketersCount + ' 🔽</option>' + 
                                       res.marketersOptions + 
                                       '</select>';
                    } else {
                        el.innerText = "-";
                    }
                } else if (parentContent.includes('الإيرادات')) {
                    if (res.userType === 'admin') {
                        el.innerHTML = '<select class="w-full text-center bg-transparent border-0 focus:ring-0 cursor-pointer text-green-700 font-bold" style="font-size:16px; outline:none; appearance:none;">' +
                                       '<option value="">الإجمالي: ' + res.totalRevenueStr + ' 🔽</option>' + 
                                       res.revenueOptions + 
                                       '</select>';
                    } else {
                        el.innerText = res.personalRevenue;
                    }
                }
            }

            if (res.userType === 'marketer' && res.nextTierInfo) {
                var statsContainer = document.querySelector('#tab-stats .grid');
                if (statsContainer) {
                    var existingProgress = document.getElementById('marketer-progress-bar');
                    var progressPercent = Math.min(100, (res.studentsCount / 200) * 100);
                    var barColor = '#facc15';
                    if (progressPercent >= 30) {
                        barColor = '#16a34a';
                    } else if (progressPercent >= 25) {
                        barColor = '#4ade80';
                    }
                    
                    if (!existingProgress) {
                        var progressHTML = `
                            <div id="marketer-progress-bar" class="col-span-full bg-white p-5 rounded-2xl shadow-md border border-emerald-100 mt-4">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-sm font-bold text-slate-700">
                                        <i class="fas fa-chart-line text-emerald-500 ml-2"></i>تقدمك في نظام العمولات
                                    </span>
                                    <span class="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                        ${res.nextTierInfo}
                                    </span>
                                </div>
                                <div class="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div id="progress-fill" class="h-4 rounded-full transition-all duration-700 ease-out" 
                                         style="width: ${progressPercent}%; background: linear-gradient(90deg, #86efac, ${barColor});">
                                    </div>
                                </div>
                                <div class="flex justify-between text-[11px] font-bold mt-2">
                                    <span class="text-emerald-600">✅ ${res.studentsCount} طالب مسجل</span>
                                    <span class="text-slate-400">🎯 200 طالب (أقصى فئة 30%)</span>
                                </div>
                                <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                                    <span>🟢 20% (1-50 طالب)</span>
                                    <span>🟡 25% (51-200 طالب)</span>
                                    <span>🔴 30% (200+ طالب)</span>
                                </div>
                            </div>
                        `;
                        statsContainer.insertAdjacentHTML('beforeend', progressHTML);
                    } else {
                        var fill = document.getElementById('progress-fill');
                        if (fill) {
                            fill.style.width = progressPercent + '%';
                            fill.style.background = 'linear-gradient(90deg, #86efac, ' + barColor + ')';
                        }
                        var infoSpan = existingProgress.querySelector('.text-emerald-600');
                        if (infoSpan && infoSpan.innerText.includes('المتبقي')) {
                            var newInfoSpan = existingProgress.querySelector('.text-emerald-600');
                            if (newInfoSpan) newInfoSpan.innerText = res.nextTierInfo;
                        }
                        var countSpan = existingProgress.querySelector('.text-emerald-600');
                        if (countSpan && countSpan.innerText.includes('طالب مسجل')) {
                            countSpan.innerText = '✅ ' + res.studentsCount + ' طالب مسجل';
                        }
                    }
                }
            } else {
                var existingProgress = document.getElementById('marketer-progress-bar');
                if (existingProgress) {
                    existingProgress.remove();
                }
            }
        }
    } catch(e) {
        console.error('خطأ في جلب الإحصائيات:', e);
    }
}

function switchAdminTab(tabId, btnElement) {
    var contents = document.getElementsByClassName('admin-tab-content');
    for (var i = 0; i < contents.length; i++) {
        contents[i].classList.add('hidden');
        contents[i].classList.remove('block');
    }
    var btns = document.getElementsByClassName('admin-tab-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.remove('bg-[#0B1F4D]', 'text-white', 'shadow');
        btns[j].classList.add('bg-transparent', 'text-slate-600');
    }
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    btnElement.classList.remove('bg-transparent', 'text-slate-600');
    btnElement.classList.add('bg-[#0B1F4D]', 'text-white', 'shadow');
}

// ==========================================
// دوال نسخ الرابط
// ==========================================

function copyMarketerLink() {
    var copyText = document.getElementById("marketer-link-input");
    copyText.select();
    copyText.setSelectionRange(0, 99999); 
    document.execCommand("copy");
    
    var btn = document.getElementById("btn-copy-link");
    btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    btn.classList.replace('bg-emerald-600', 'bg-emerald-800');
    setTimeout(function() { 
        btn.innerHTML = '<i class="fas fa-copy ml-1"></i> نسخ الرابط'; 
        btn.classList.replace('bg-emerald-800', 'bg-emerald-600');
    }, 3000);
}

// ==========================================
// دوال الإعدادات
// ==========================================

async function handleSaveSettings() {
    var btn = document.getElementById('btn-save-settings');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    var settingsData = {
        name: document.getElementById('set-name').value,
        whatsapp: document.getElementById('set-whatsapp').value,
        email: document.getElementById('set-email').value,
        channel: document.getElementById('set-channel').value,
        trainer_pct: document.getElementById('set-trainer-pct').value,
        marketer_pct: document.getElementById('set-marketer-pct').value
    };

    try {
        const res = await saveSettingsFromAdmin(settingsData);
        if(res.success) { 
            alert("تم حفظ الإعدادات بنجاح!"); 
        } else { 
            alert("خطأ في الحفظ: " + res.error); 
        }
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch(err) {
        alert("خطأ سيرفر: " + err); 
        btn.innerHTML = originalText; 
        btn.disabled = false;
    }
}

// ==========================================
// دوال إدارة الدورات (الإضافة والحذف)
// ==========================================

async function handleAddCourse(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-submit-course');
    var originalText = btn.innerText;
    btn.innerText = "جاري الرفع..."; 
    btn.disabled = true;

    var fileInput = document.getElementById('adm-course-img');
    
    var sendData = async function(base64Img) {
        var data = {
            title: document.getElementById('adm-course-title').value,
            trainer: document.getElementById('adm-course-trainer').value,
            fee: document.getElementById('adm-course-fee').value,
            category: document.getElementById('adm-course-cat').value,
            duration: document.getElementById('adm-course-duration').value,
            image: base64Img
        };
        
        try {
            const res = await addCourseFromAdmin(data);
            if(res.success) {
                alert("تم نشر الدورة بنجاح!"); 
                document.getElementById('form-add-course').reset(); 
                loadCoursesFromServer();
            } else {
                alert("خطأ: " + res.error);
            }
        } catch(err) {
            alert("خطأ سيرفر: " + err);
        }
        btn.innerText = originalText; 
        btn.disabled = false; 
    };

    if (fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { sendData(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { 
        sendData(""); 
    }
}

async function deleteCourse(title) {
    if (!title || title === 'undefined') { 
        alert("خطأ: المعرف فارغ!"); 
        return; 
    }
    if (!confirm("هل أنت متأكد من حذف الدورة: " + title + "؟")) return;

    try {
        const res = await removeCourseFinal(title);
        if (res && res.success) {
            alert("✅ تم حذف الدورة بنجاح: " + res.msg);
            loadCoursesFromServer(); 
        } else {
            alert("❌ فشل الحذف: " + (res ? res.error : "خطأ غير معروف"));
        }
    } catch(err) {
        alert("خطأ سيرفر: " + err);
    }
}

async function deleteNews(title) {
    if (!title || title === 'undefined') { 
        alert("خطأ: المعرف فارغ!"); 
        return; 
    }
    if (!confirm("هل أنت متأكد من حذف الخبر: " + title + "؟")) return;

    try {
        const res = await removeNewsFinal(title);
        if (res && res.success) {
            alert("✅ تم حذف الخبر بنجاح: " + res.msg);
            loadNewsFromServer(); 
        } else {
            alert("❌ فشل الحذف: " + (res ? res.error : "خطأ غير معروف"));
        }
    } catch(err) {
        alert("خطأ سيرفر: " + err);
    }
}

// ==========================================
// دوال تعديل الدورات
// ==========================================

function openEditCourseModal(id, title, trainer, dur, fee, cat) {
    document.getElementById('edit-course-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-trainer').value = trainer;
    document.getElementById('edit-dur').value = dur;
    document.getElementById('edit-fee').value = fee;
    document.getElementById('edit-cat').value = cat;
    document.getElementById('edit-course-modal').classList.remove('hidden');
}

async function submitCourseEdit() {
    var id = document.getElementById('edit-course-id').value;
    var data = {
        title: document.getElementById('edit-title').value,
        trainer: document.getElementById('edit-trainer').value,
        duration: document.getElementById('edit-dur').value,
        fee: document.getElementById('edit-fee').value,
        category: document.getElementById('edit-cat').value
    };
    
    var btn = document.querySelector('#edit-course-modal button'); 
    var originalText = btn.innerText;
    btn.innerText = "جاري التحديث..."; 
    btn.disabled = true;

    try {
        const res = await updateCourseFromAdmin(id, data);
        btn.innerText = originalText; 
        btn.disabled = false;
        if(res.success) {
            alert("✅ " + res.message);
            document.getElementById('edit-course-modal').classList.add('hidden');
            loadCoursesFromServer(); 
        } else { 
            alert("❌ خطأ: " + res.error); 
        }
    } catch(err) {
        alert("خطأ سيرفر: " + err);
        btn.innerText = originalText; 
        btn.disabled = false;
    }
}

// ==========================================
// دوال آراء العملاء
// ==========================================

async function loadTestimonialsFromServer() {
    try {
        const data = await fetchTestimonialsFromSheet();
        renderTestimonialsHome(data);
        renderTestimonialsAdmin(data);
    } catch(e) {
        console.error('خطأ في جلب الآراء:', e);
    }
}

async function addTestimonial() {
    var data = {
        name: document.getElementById('adm-test-name').value,
        rating: document.getElementById('adm-test-rating').value,
        text: document.getElementById('adm-test-text').value
    };
    
    try {
        await addTestimonialFromAdmin(data);
        alert("تم الإضافة!"); 
        document.getElementById('adm-test-name').value = ''; 
        document.getElementById('adm-test-text').value = ''; 
        loadTestimonialsFromServer();
    } catch(err) {
        alert("خطأ: " + err);
    }
}

async function deleteTestimonial(id) {
    if(!confirm("حذف الرأي؟")) return;
    try {
        await deleteTestimonialFromAdmin(id);
        loadTestimonialsFromServer();
    } catch(err) {
        alert("خطأ: " + err);
    }
}

function renderTestimonialsHome(data) {
    var container = document.getElementById('testimonials-dynamic-container');
    if(!container) return;
    
    container.className = 'grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8';
    container.innerHTML = '';
    
    data.forEach(function(t) {
        var stars = '⭐'.repeat(t.rating || 5);
        container.insertAdjacentHTML('beforeend', `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative text-right flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-300">
                <div>
                    <div class="text-[#D4A017] opacity-10 text-4xl absolute top-4 left-4">
                        <i class="fas fa-quote-left"></i>
                    </div>
                    <div class="text-xs mb-3 text-amber-400">${stars}</div>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4">"${t.text}"</p>
                </div>
                <div class="font-bold text-[#0B1F4D] text-sm mt-auto">- ${t.name}</div>
            </div>
        `);
    });
}

function renderTestimonialsAdmin(data) {
    var tbody = document.getElementById('admin-testimonials-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد آراء حالياً</td></tr>';
        return;
    }

    data.forEach(function(t) {
        var stars = '⭐'.repeat(t.rating || 5);
        tbody.insertAdjacentHTML('beforeend', `
        <tr class="hover:bg-slate-50 transition">
            <td class="p-3 font-bold text-[#0B1F4D]">${t.name}</td>
            <td class="p-3 text-amber-500">${stars}</td>
            <td class="p-3 text-slate-600 truncate max-w-[200px]">${t.text}</td>
            <td class="p-3 text-center">
                <button onclick="deleteTestimonial('${t.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg shadow-sm transition">حذف</button>
            </td>
        </tr>`);
    });
}

// ==========================================
// دوال صفحات الهبوط (Landing Pages)
// ==========================================

function openLandingPage(courseTitle) {
    var landingContainer = document.getElementById('landing-page-container');
    var mainContent = document.getElementById('main-content');
    var loader = document.getElementById('lp-loader');
    
    if(!landingContainer || !mainContent) {
        alert("تنبيه: واجهة صفحة الهبوط غير موجودة. تأكد من استدعاء CourseLanding في Index.html");
        return;
    }

    mainContent.style.display = 'none';
    landingContainer.classList.remove('hidden');
    if(loader) loader.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchCourseLandingData(courseTitle)
        .then(function(data) {
            if(loader) loader.classList.add('hidden');
            
            if(data && data.success) {
                try {
                    if(document.getElementById('lp-title')) document.getElementById('lp-title').innerText = data.title || '';
                    if(document.getElementById('lp-image')) document.getElementById('lp-image').src = getValidImageUrl(data.image);
                    if(document.getElementById('lp-desc')) document.getElementById('lp-desc').innerText = data.description || '';
                    if(document.getElementById('lp-duration')) document.getElementById('lp-duration').innerText = data.duration || '';
                    if(document.getElementById('lp-trainer')) document.getElementById('lp-trainer').innerText = data.trainer || '';
                    if(document.getElementById('lp-target')) document.getElementById('lp-target').innerText = data.targetAudience || '';
                    if(document.getElementById('lp-fee')) document.getElementById('lp-fee').innerText = data.fee || '';
                    
                    var waText = encodeURIComponent("مرحباً أكاديمية اقرأ، أرغب بالاستفسار عن برنامج: " + data.title);
                    if(document.getElementById('lp-whatsapp')) document.getElementById('lp-whatsapp').href = "https://wa.me/967777644293?text=" + waText;

                    var formatList = function(text, iconClass) {
                        if(!text) return "<li>لا توجد بيانات تفصيلية</li>";
                        return text.toString().split('-').filter(function(i) { return i.trim() !== ''; }).map(function(i) { 
                            return '<li><i class="' + iconClass + ' ml-2"></i>' + i.trim() + '</li>'; 
                        }).join('');
                    };
                    
                    if(document.getElementById('lp-objectives')) document.getElementById('lp-objectives').innerHTML = formatList(data.objectives, "fas fa-check text-emerald-500");
                    if(document.getElementById('lp-syllabus')) document.getElementById('lp-syllabus').innerHTML = formatList(data.syllabus, "fas fa-angle-left text-[#D4A017]");
                    
                    landingContainer.setAttribute('data-current-course', data.title);
                } catch(e) {
                    alert("حدث خطأ فني أثناء ترتيب البيانات: " + e.message);
                    closeLandingPage();
                }
            } else {
                alert(data ? data.error : "عذراً، لم يتم إدراج تفاصيل هذه الدورة بعد.");
                closeLandingPage();
            }
        })
        .catch(function(err) {
            if(loader) loader.classList.add('hidden'); 
            alert("فشل الاتصال بالخادم. التفاصيل: " + err); 
            closeLandingPage();
        });
}

function closeLandingPage() {
    var landingContainer = document.getElementById('landing-page-container');
    var mainContent = document.getElementById('main-content');
    var loader = document.getElementById('lp-loader');
    
    if(loader) loader.classList.add('hidden');
    if(landingContainer) landingContainer.classList.add('hidden');
    if(mainContent) mainContent.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function registerFromLanding() {
    var landingContainer = document.getElementById('landing-page-container');
    if(!landingContainer) return;
    var courseTitle = landingContainer.getAttribute('data-current-course');
    closeLandingPage();
    selectCourseDirectly(courseTitle);
}

// ==========================================
// دوال تفاصيل الدورات (نافذة التعديل)
// ==========================================

function closeDetailsModal() { 
    document.getElementById('details-modal').classList.add('hidden'); 
}

function openDetailsModal(title, event) {
    document.getElementById('det-course-title').value = title;
    document.getElementById('det-course-name').innerText = title;
    document.getElementById('det-img').value = ''; 
    
    var btn = event ? event.currentTarget : null;
    var originalText = btn ? btn.innerText : 'التفاصيل';
    if(btn) { btn.innerText = "..."; btn.disabled = true; } 

    fetchCourseLandingData(title)
        .then(function(data) {
            if(btn) { btn.innerText = originalText; btn.disabled = false; }
            if(data && data.success) { 
                document.getElementById('det-desc').value = data.description || '';
                document.getElementById('det-obj').value = data.objectives || '';
                document.getElementById('det-syl').value = data.syllabus || '';
                document.getElementById('det-target').value = data.targetAudience || '';
                document.getElementById('det-trainer').value = data.trainer || '';
                document.getElementById('det-duration').value = data.duration || '';
                document.getElementById('det-fee').value = data.fee || '';
            } else { 
                document.getElementById('det-desc').value = '';
                document.getElementById('det-obj').value = '';
                document.getElementById('det-syl').value = '';
                document.getElementById('det-target').value = '';
                document.getElementById('det-trainer').value = '';
                document.getElementById('det-duration').value = '';
                document.getElementById('det-fee').value = '';
            }
            document.getElementById('details-modal').classList.remove('hidden');
        })
        .catch(function(err){
            if(btn) { btn.innerText = originalText; btn.disabled = false; }
            alert('خطأ في الاتصال: ' + err);
        });
}

async function saveCourseDetails(event) {
    var btn = event.currentTarget;
    var originalText = btn.innerText;
    btn.innerText = "جاري الرفع والحفظ...";
    btn.disabled = true;
    
    var fileInput = document.getElementById('det-img');
    
    var sendData = async function(base64Img) {
        var detailsData = {
            title: document.getElementById('det-course-title').value,
            description: document.getElementById('det-desc').value,
            objectives: document.getElementById('det-obj').value,
            syllabus: document.getElementById('det-syl').value,
            targetAudience: document.getElementById('det-target').value,
            trainer: document.getElementById('det-trainer').value,
            duration: document.getElementById('det-duration').value,
            fee: document.getElementById('det-fee').value,
            image: base64Img 
        };
        
        try {
            const res = await saveDetailsToSheet(detailsData);
            alert(res.message);
            closeDetailsModal();
            btn.innerText = originalText; 
            btn.disabled = false;
        } catch(err) {
            alert("خطأ: " + err);
            btn.innerText = originalText; 
            btn.disabled = false;
        }
    };
    
    if (fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { sendData(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { 
        sendData("");
    }
}

// ==========================================
// دوال تحديث حالة المتدرب
// ==========================================

async function updateStudentState(orderId, newStatus) {
    if(!confirm("هل تريد تغيير حالة الطلب إلى: " + newStatus + "؟")) return;
    
    document.body.style.cursor = 'wait';
    
    try {
        const res = await updateStudentState(orderId, newStatus);
        document.body.style.cursor = 'default';
        if(res && res.success) {
            alert("✅ تم تغيير الحالة بنجاح إلى: " + res.newStatus);
            
            var currentRole = sessionStorage.getItem('role');
            var currentCode = sessionStorage.getItem('code');
            var currentName = sessionStorage.getItem('name');
            loadDashboardData(currentRole, currentCode, currentName);
        } else {
            alert("❌ خطأ: " + res.error);
        }
    } catch(err) {
        document.body.style.cursor = 'default';
        alert("❌ فشل الاتصال بالخادم: " + err);
    }
}

// ==========================================
// دوال نظام المدفوعات
// ==========================================

var globalPaymentMethods = [];

async function loadPaymentMethods() {
    try {
        const res = await fetchActivePaymentMethods();
        if(res.success) {
            globalPaymentMethods = res.methods;
            renderPaymentCards();
        }
    } catch(e) {
        console.error('خطأ في جلب وسائل الدفع:', e);
    }
}

function renderPaymentCards() {
    var container = document.getElementById('payment-methods-container');
    if(!container) return;
    container.innerHTML = '';
    
    globalPaymentMethods.forEach(function(method, index) {
        var card = `
        <div onclick="openPaymentForm(${index})" class="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-[#D4A017] hover:shadow-lg transition cursor-pointer text-center group flex flex-col items-center justify-center h-48">
            <div class="w-20 h-20 mb-3 bg-slate-50 rounded-full flex items-center justify-center p-2 shadow-inner group-hover:scale-110 transition">
                <img src="${getValidImageUrl(method.logo)}" class="w-full h-full object-contain">
            </div>
            <h3 class="font-black text-[#0B1F4D] text-lg">${method.bankName}</h3>
            <p class="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition"><i class="fas fa-mouse-pointer ml-1"></i> اضغط للدفع</p>
        </div>`;
        container.insertAdjacentHTML('beforeend', card);
    });
}

function copyToClipboard(text, btnElement) {
    var originalHTML = btnElement.innerHTML;
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        btnElement.innerHTML = '<i class="fas fa-check text-emerald-500"></i> تم';
        btnElement.classList.add('bg-emerald-50', 'text-emerald-700');
        setTimeout(function() {
            btnElement.innerHTML = originalHTML;
            btnElement.classList.remove('bg-emerald-50', 'text-emerald-700');
        }, 2000);
    } catch (err) {
        console.error('فشل النسخ', err);
    }
    document.body.removeChild(textArea);
}

function openPaymentForm(index) {
    var method = globalPaymentMethods[index];
    document.getElementById('payment-methods-container').classList.add('hidden');
    document.getElementById('payment-form-section').classList.remove('hidden');
    
    document.getElementById('selected-method-title').innerText = "عبر " + method.bankName;
    document.getElementById('selected-method-name').value = method.bankName;
    
    var instructions = `
        <p class="mb-2 font-black text-[#0B1F4D]">يرجى تحويل المبلغ إلى الحساب التالي:</p>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div class="flex justify-between items-center border-b pb-2">
                <div><span class="text-[10px] text-slate-400 block">اسم المستفيد</span><strong class="text-sm">${method.beneficiary}</strong></div>
                <button type="button" onclick="copyToClipboard('${method.beneficiary}', this)" class="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded transition border"><i class="fas fa-copy"></i> نسخ</button>
            </div>
            <div class="flex justify-between items-center border-b pb-2">
                <div><span class="text-[10px] text-slate-400 block">رقم الحساب</span><strong class="text-sm font-mono tracking-widest text-blue-700">${method.accountNum}</strong></div>
                <button type="button" onclick="copyToClipboard('${method.accountNum}', this)" class="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded transition border"><i class="fas fa-copy"></i> نسخ</button>
            </div>
            ${method.iban ? `
            <div class="flex justify-between items-center">
                <div><span class="text-[10px] text-slate-400 block">الآيبان (IBAN)</span><strong class="text-sm font-mono text-emerald-700">${method.iban}</strong></div>
                <button type="button" onclick="copyToClipboard('${method.iban}', this)" class="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded transition border"><i class="fas fa-copy"></i> نسخ</button>
            </div>` : ''}
        </div>
        <p class="mt-3 text-[11px] text-amber-700 font-bold"><i class="fas fa-info-circle"></i> ${method.instructions || 'الرجاء التأكد من صحة رقم الحساب.'}</p>
    `;
    document.getElementById('payment-instructions-box').innerHTML = instructions;
    window.scrollTo({ top: document.getElementById('payment-form-section').offsetTop - 50, behavior: 'smooth' });
}

function closePaymentForm() {
    document.getElementById('payment-form-section').classList.add('hidden');
    document.getElementById('payment-methods-container').classList.remove('hidden');
}

function goToPaymentDirectly() {
    var orderId = document.getElementById('displayOrderID').innerText;
    var course = document.getElementById('reg-course').value;
    
    document.getElementById('pay-order-id').value = orderId;
    document.getElementById('pay-course').value = course;
    
    navigateTo('payment');
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-submit-payment');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري رفع السند والإرسال...';
    btn.disabled = true;

    var fileInput = document.getElementById('pay-receipt-file');
    
    var sendData = async function(base64Data) {
        var data = {
            orderId: document.getElementById('pay-order-id').value,
            course: document.getElementById('pay-course').value,
            studentName: document.getElementById('pay-sender-name').value,
            senderName: document.getElementById('pay-sender-name').value,
            phone: document.getElementById('pay-phone').value,
            transferNum: document.getElementById('pay-transfer-num').value,
            amount: document.getElementById('pay-amount').value,
            transferDate: document.getElementById('pay-date').value,
            transferTime: document.getElementById('pay-time').value,
            method: document.getElementById('selected-method-name').value,
            fee: "", 
            fileBase64: base64Data
        };

        try {
            const res = await submitPaymentForm(data);
            btn.innerHTML = originalText;
            btn.disabled = false;
            if(res.success) {
                alert("✅ تم استلام إشعار الدفع بنجاح.\nسيتم مراجعة الحوالة وإشعاركم فور اعتمادها.");
                document.getElementById('submit-payment-form').reset();
                closePaymentForm();
                navigateTo('home');
            } else {
                alert("❌ خطأ: " + res.error);
            }
        } catch(err) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            alert("❌ خطأ في الاتصال: " + err);
        }
    };

    if (fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { sendData(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert("يرجى إرفاق صورة السند.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// دوال لوحة الإدارة للمدفوعات
// ==========================================

async function loadAdminPayments() {
    var tbody = document.getElementById('admin-payments-tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-blue-500 font-bold"><i class="fas fa-spinner fa-spin"></i> جاري جلب البيانات...</td></tr>';
    
    try {
        const payments = await fetchAdminPayments();
        tbody.innerHTML = '';
        if(payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500 font-bold">لا توجد مدفوعات مسجلة</td></tr>';
            return;
        }
        
        payments.forEach(function(p) {
            var badge = p.status === 'تم الدفع' ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">تم الدفع</span>' :
                        p.status === 'مرفوض' ? '<span class="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">مرفوض</span>' :
                        '<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">قيد المراجعة</span>';
                        
            var buttons = p.status === 'قيد المراجعة' ? `
                <button onclick="actionPayment(${p.rowId}, '${p.orderId}', 'تم الدفع')" class="bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded shadow-sm transition mb-1 w-full text-[10px]">اعتماد الدفع</button>
                <button onclick="actionPayment(${p.rowId}, '${p.orderId}', 'مرفوض')" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded shadow-sm transition w-full text-[10px]">رفض</button>
            ` : `<div class="text-xs text-slate-400 mt-2">${p.reason || ''}</div>`;

            tbody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="p-3 text-[#0B1F4D]"><div class="font-black text-sm">${p.orderId}</div><div class="text-[10px]">${p.studentName}</div></td>
                <td class="p-3 text-blue-800"><div class="font-bold text-xs max-w-[150px] truncate">${p.course}</div><div class="text-[10px] text-slate-500">${p.method}</div></td>
                <td class="p-3 text-emerald-600 font-bold"><div class="text-sm">${p.amount}</div><div class="text-[10px] text-slate-500">حوالة: ${p.transferNum}</div></td>
                <td class="p-3 text-slate-500 text-[10px]"><a href="${p.receiptUrl}" target="_blank" class="text-blue-500 underline font-bold inline-block mb-1"><i class="fas fa-external-link-alt"></i> عرض السند</a><br>${p.date}</td>
                <td class="p-3 text-center align-middle w-24">
                    <div class="mb-2">${badge}</div>
                    ${buttons}
                </td>
            </tr>`);
        });
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500 font-bold">خطأ في جلب البيانات</td></tr>';
        console.error(e);
    }
}

async function actionPayment(rowNum, orderId, newStatus) {
    var reason = "";
    if (newStatus === 'مرفوض') {
        reason = prompt("يرجى كتابة سبب الرفض ليظهر للمتدرب:");
        if (reason === null) return;
    } else {
        if(!confirm("هل أنت متأكد من اعتماد الدفع؟ (سيتم تغيير حالة المتدرب تلقائياً إلى 'تم تسديد الشهادة')")) return;
    }
    
    document.body.style.cursor = 'wait';
    try {
        const res = await processPaymentAction(rowNum, orderId, newStatus, reason);
        document.body.style.cursor = 'default';
        if(res.success) {
            alert("✅ تم التحديث بنجاح");
            loadAdminPayments();
            if(document.getElementById('tab-users').classList.contains('block')) {
                loadDashboardData(sessionStorage.getItem('role'), sessionStorage.getItem('code'), sessionStorage.getItem('name'));
            }
        } else {
            alert("❌ خطأ: " + res.error);
        }
    } catch(e) {
        document.body.style.cursor = 'default';
        alert("❌ خطأ: " + e);
    }
}

// ==========================================
// دوال الأخبار والإعلانات
// ==========================================

async function loadRealAdsFromServer() {
    try {
        const res = await fetchActiveAdsFromSheet();
        if(res && res.success) {
            globalAds = res.data; 
            renderAdsGrid(globalAds);
            renderAdminAdsList(globalAds);
        }
    } catch(e) {
        console.error('خطأ في جلب الإعلانات:', e);
    }
}

async function loadNewsFromServer() {
    try {
        const news = await fetchNewsFromSheet();
        renderNewsCards(news);
        renderAdminNewsList(news);
    } catch(e) {
        console.error('خطأ في جلب الأخبار:', e);
    }
}

function renderNewsCards(news) {
    var container = document.getElementById('news-list-container');
    if(!container) return;
    
    if (news.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-6 text-xs">لا توجد أخبار منشورة حالياً.</div>';
        return;
    }
    
    container.innerHTML = '';
    news.forEach(function(n) {
        let shareTxt = encodeURIComponent(n.title + " - تابعونا عبر أكاديمية اقرأ");
        let imgHtml = n.image ? `<img src="${getValidImageUrl(n.image)}" class="w-full h-40 object-cover rounded-xl mb-3" loading="lazy">` : '';
        
        container.insertAdjacentHTML('beforeend', `
        <div class="bg-white p-5 rounded-2xl shadow border border-slate-100 text-right hover:shadow-lg transition cursor-pointer flex flex-col justify-between" onclick="window.open('https://whatsapp.com/channel/0029VbCDK6M4IBhBR3jvVY0Y', '_blank')">
            <div>
                ${imgHtml}
                <div class="flex justify-between items-center mb-2">
                    <span class="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full"><i class="fas fa-calendar-alt"></i> ${n.date}</span>
                    <a href="https://wa.me/?text=${shareTxt}" target="_blank" onclick="event.stopPropagation()" class="text-emerald-500 hover:text-emerald-700 text-lg transition"><i class="fab fa-whatsapp"></i></a>
                </div>
                <h3 class="text-sm font-bold text-[#0B1F4D] mb-2 leading-snug">${n.title}</h3>
                <p class="text-slate-500 text-xs leading-relaxed line-clamp-2">${n.details}</p>
            </div>
         </div>`);
    });
}

function renderAdminNewsList(news) {
    var adminList = document.getElementById('admin-news-list');
    if (!adminList) return;
    adminList.innerHTML = '';
    
    if (news.length === 0) { 
        adminList.innerHTML = '<div class="text-center text-slate-400 text-xs py-2">لا توجد أخبار حالياً.</div>'; 
        return; 
    }
    
    news.forEach(function(item) {
        adminList.insertAdjacentHTML('beforeend', `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border rounded-xl text-xs mb-2">
                <span class="truncate w-2/3 font-bold text-[#0B1F4D]">${item.title}</span>
                <button onclick="deleteNewsFinalAction('${item.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded shadow-sm transition">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </div>`);
    });
}

function renderAdminAdsList(ads) {
    var list = document.getElementById('admin-ads-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (ads.length === 0) { 
        list.innerHTML = '<div class="text-center text-slate-400 text-xs py-2">لا توجد عروض منشورة حالياً.</div>'; 
        return; 
    }
    
    ads.forEach(function(item) {
        list.insertAdjacentHTML('beforeend', `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border rounded-xl text-xs mb-2">
                <span class="truncate w-2/3 font-bold text-[#0B1F4D]">${item.title}</span>
                <button onclick="deleteAdFinalAction('${item.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded shadow-sm transition">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </div>`);
    });
}

// ==========================================
// دوال إضافة وحذف الأخبار والإعلانات
// ==========================================

async function handleAddNews(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-submit-news');
    var originalText = btn.innerText;
    btn.innerText = "جاري النشر المعزز..."; 
    btn.disabled = true;
    
    var fileInput = document.getElementById('adm-news-img');
    var processNews = async function(base64Img) {
        var newsData = {
            title: document.getElementById('adm-news-title').value,
            content: document.getElementById('adm-news-content').value,
            img: base64Img
        };
        
        try {
            const res = await addNewsFromAdmin(newsData);
            btn.innerText = originalText; 
            btn.disabled = false;
            if(res.success) {
                alert('✅ تم نشر الخبر بنجاح وعكسه على قاعدة البيانات والواجهة الموحدة.');
                document.getElementById('form-add-news').reset();
                loadNewsFromServer(); 
            } else {
                alert('❌ فشل النشر: ' + res.error);
            }
        } catch(err) {
            btn.innerText = originalText; 
            btn.disabled = false;
            alert('❌ خطأ في الاتصال بالخادم: ' + err);
        }
    };

    if (fileInput && fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { processNews(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { 
        processNews('');
    }
}

async function handleAddAd(e) {
    e.preventDefault();
    var btn = document.getElementById('btn-submit-ad');
    var originalText = btn.innerText;
    btn.innerText = "جاري رفع وحفظ العرض..."; 
    btn.disabled = true;
    
    var fileInput = document.getElementById('adm-ad-img');
    var processAd = async function(base64Img) {
        var adData = {
            title: document.getElementById('adm-ad-title').value,
            type: document.getElementById('adm-ad-type').value,
            date: document.getElementById('adm-ad-date').value,
            img: base64Img
        };
        
        try {
            const res = await addAdFromAdmin(adData);
            btn.innerText = originalText; 
            btn.disabled = false;
            if(res.success) {
                alert('✅ تم إضافة العرض بنجاح وبثه في الواجهة الرئيسية للأكاديمية.');
                document.getElementById('form-add-ad').reset();
                loadRealAdsFromServer(); 
            } else { 
                alert('❌ خطأ في الحفظ بالسيرفر: ' + res.error); 
            }
        } catch(err) {
            btn.innerText = originalText; 
            btn.disabled = false;
            alert('❌ فشل الاتصال بالسيرفر أثناء معالجة العروض.');
        }
    };

    if (fileInput && fileInput.files.length > 0) {
        var reader = new FileReader();
        reader.onload = function(ev) { processAd(ev.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert("تنبيه: يرجى إرفاق صورة العرض الرسمية غلافاً للإعلان.");
        btn.innerText = originalText; 
        btn.disabled = false;
    }
}

async function deleteNewsFinalAction(newsId) {
    if (!newsId) return;
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً من أرشيف الأكاديمية؟")) return;
    
    try {
        const res = await removeNewsFinal(newsId);
        if (res && res.success) {
            alert("✅ تم حذف الخبر وتحديث الواجهة بنجاح.");
            loadNewsFromServer();
        } else {
            alert("❌ فشل إجراء الحذف: " + (res ? res.error : "خطأ غير معروف"));
        }
    } catch(err) {
        alert("❌ خطأ في الاتصال: " + err);
    }
}

async function deleteAdFinalAction(adId) {
    if (!adId) return;
    if (!confirm("هل تريد إزالة هذا العرض الاستراتيجي من شاشات الموقع نهائياً؟")) return;
    
    try {
        const res = await deleteAdFromAdmin(adId);
        if (res && res.success) {
            alert("✅ تم سحب وإلغاء تفعيل العرض بنجاح.");
            loadRealAdsFromServer();
        } else {
            alert("❌ فشل الإجراء: " + res.error);
        }
    } catch(err) {
        alert("❌ خطأ في الاتصال: " + err);
    }
}

// ==========================================
// دوال البحث والفلترة
// ==========================================

function filterAdminTable() {
    var input = document.getElementById("admin-search-box");
    var filter = input.value.toLowerCase().trim();
    var tbody = document.getElementById("dataTableBody");
    var tr = tbody.getElementsByTagName("tr");

    for (var i = 0; i < tr.length; i++) {
        var tdId = tr[i].getElementsByTagName("td")[0];
        var tdName = tr[i].getElementsByTagName("td")[1];
        
        if (tdId && tdName) {
            var textId = tdId.textContent || tdId.innerText;
            var textName = tdName.textContent || tdName.innerText;
            
            if (textId.toLowerCase().indexOf(filter) > -1 || textName.toLowerCase().indexOf(filter) > -1) {
                tr[i].style.display = ""; 
            } else {
                tr[i].style.display = "none"; 
            }
        }       
    }
}

// ==========================================
// دوال الإعلان العاجل
// ==========================================

function toggleUrgentBanner() {
    var banner = document.getElementById('urgent-alert-banner');
    var text = document.getElementById('adm-urgent-text') ? document.getElementById('adm-urgent-text').value : "";
    if(text.trim() === '') { 
        banner.classList.add('hidden'); 
    } else { 
        document.getElementById('urgent-alert-text').innerText = text; 
        banner.classList.remove('hidden'); 
        alert('تم بث التنبيه!'); 
    }
}

// ==========================================
// دوال الإحصائيات السريعة (لوحة المدير)
// ==========================================

async function updateLiveAdminStats() {
    try {
        const res = await getAdminDashboardStats();
        if(res.success) {
            if(document.getElementById('stat-admin-students')) document.getElementById('stat-admin-students').innerText = res.students;
            if(document.getElementById('stat-admin-courses')) document.getElementById('stat-admin-courses').innerText = res.courses;
            if(document.getElementById('stat-admin-certs')) document.getElementById('stat-admin-certs').innerText = res.certs;
        }
    } catch(e) {
        console.error('خطأ في تحديث الإحصائيات:', e);
    }
}

// ==========================================
// تشغيل التهيئة عند تحميل الصفحة
// ==========================================

window.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeWebsiteLayout === 'function') {
        setTimeout(initializeWebsiteLayout, 300);
    }
});

// ==========================================
// دوال الأمان - حماية التخزين المحلي
// ==========================================

function safeSetStorage(key, value) {
    try { localStorage.setItem(key, value); } 
    catch(e) { console.warn("Mobile tracking protection active - Storage ignored"); }
}

function safeGetStorage(key) {
    try { return localStorage.getItem(key); } 
    catch(e) { return null; }
}
