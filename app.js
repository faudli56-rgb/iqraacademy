/**
 * app.js - جافاسكربت الموقع الرئيسي
 * أكاديمية اقرأ للاستشارات والتدريب
 * * تم تعديل جميع استدعاءات google.script.run لاستخدام دوال api.js
 */

// ==========================================
// المتغيرات العالمية
// ==========================================
var globalCourses = [];
var globalAds = [];
var currentAdIndex = 0;
var totalViews = 1482;
var totalClicks = 342;
function trackButtonClick(buttonName) {
    console.log("تم الضغط على الزر: " + buttonName);
}
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    // استخدام ألوان Tailwind المدعومة في مشروعك
    toast.className = `fixed bottom-6 right-6 text-white px-6 py-3 rounded-xl shadow-2xl z-[100] transition-opacity duration-300 font-bold text-sm ${isError ? 'bg-rose-600' : 'bg-emerald-600'}`;
    toast.innerHTML = isError ? `<i class="fas fa-exclamation-circle ml-2"></i> ${message}` : `<i class="fas fa-check-circle ml-2"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    // إخفاء الإشعار بسلاسة بعد 3.5 ثوانٍ
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3500);
}

// محاولة استرجاع البيانات من التخزين المحلي
try {
    if (localStorage.getItem('site_views')) totalViews = parseInt(localStorage.getItem('site_views'), 10);
    if (localStorage.getItem('wa_clicks')) totalClicks = parseInt(localStorage.getItem('wa_clicks'), 10);
} catch(e) {}

// دالة لتعقيم النصوص وحماية الموقع من ثغرات XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, function(tag) {
        var charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

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
    
    // 💡 الإصلاح: تسجيل الزيارة فور فتح الموقع
    var sessionId = sessionStorage.getItem('visitor_session');
    if (!sessionId) {
        sessionId = 'زائر-' + Math.floor(Math.random() * 9999);
        sessionStorage.setItem('visitor_session', sessionId);
    }
    if (typeof logVisitorActivity === 'function') {
        logVisitorActivity('الرئيسية (دخول مبدئي)', sessionId);
    }
    
    if (!localStorage.getItem('welcome_popup_shown')) {
        setTimeout(function() { 
            var welcomePopup = document.getElementById('welcome-popup');
            if(welcomePopup) {
                welcomePopup.classList.remove('hidden');
                localStorage.setItem('welcome_popup_shown', 'true');
            }
        }, 6000);
    }
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
    
    // استدعاء بدء جولة التعليمات للزوار الجدد بعد إغلاق الترحيب تلقائياً
    if (typeof checkAndStartOnboarding === 'function') {
        checkAndStartOnboarding();
    }
}

function popupActionRegister() { 
    closePopup(); 
    navigateTo('register'); 
}

function navigateTo(pageId) {
    // أ. التحقق من صفحة تفاصيل الدورة (صفحة الهبوط)
    var landingContainer = document.getElementById('landing-page-container');
    if (landingContainer && !landingContainer.classList.contains('hidden')) {
        showToast('الرجاء الضغط على زر "العودة للرئيسية" أولاً للخروج من تفاصيل الدورة.', true);
        return; // إيقاف التنقل
    }

    // ب. التحقق من لوحة تحكم الإدارة
    var adminContent = document.getElementById('admin-content');
    if (adminContent && adminContent.style.display === 'block') {
        showToast('أنت حالياً في لوحة الإدارة. يرجى الضغط على زر "خروج" أولاً.', true);
        return; // إيقاف التنقل
    }

    // ج. التحقق من نموذج تسديد الرسوم المفتوح
    var paymentForm = document.getElementById('payment-form-section');
    if (paymentForm && !paymentForm.classList.contains('hidden')) {
        showToast('الرجاء الضغط على "رجوع" أعلى نموذج الدفع لإلغاء العملية أولاً.', true);
        return; // إيقاف التنقل
    }

    // --- 2. التنفيذ الطبيعي للتنقل إذا لم تكن هناك عوائق ---
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('header nav a').forEach(b => b.classList.remove('nav-active'));
    if(document.getElementById('page-' + pageId)) document.getElementById('page-' + pageId).classList.add('active');
    if(document.getElementById('btn-' + pageId)) document.getElementById('btn-' + pageId).classList.add('nav-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 💡 3. كود تتبع تحركات الزائر (تمت إضافته هنا بنجاح)
    var sessionId = sessionStorage.getItem('visitor_session');
    if (!sessionId) {
        sessionId = 'زائر-' + Math.floor(Math.random() * 9999);
        sessionStorage.setItem('visitor_session', sessionId);
    }
    
    var pageTitles = {
        'home': 'الرئيسية', 'courses': 'الدورات التدريبية', 'b2b': 'خدمات الشركات',
        'news': 'الأخبار', 'verification': 'فحص الشهادات', 'contact': 'تواصل معنا',
        'register': 'استمارة التسجيل', 'payment': 'بوابة الدفع'
    };
    var pageName = pageTitles[pageId] || pageId;
    
    // إرسال البيانات للسيرفر في الخلفية
    if(typeof logVisitorActivity === 'function') {
        logVisitorActivity(pageName, sessionId);
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
        // حماية الكود: التوقف إذا لم تكن البيانات الراجعة مصفوفة فعلية
        if (!Array.isArray(courses)) {
            console.error("فشل جلب الدورات: السيرفر لم يرجع بيانات صالحة.", courses);
            return; 
        }
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

    // 1️⃣ فلترة وترتيب الدورات المخصصة للرئيسية
    var featuredCourses = courses.filter(function(c) {
        return c.featuredOrder === 1 || c.featuredOrder === 2 || c.featuredOrder === 3;
    }).sort(function(a, b) {
        return a.featuredOrder - b.featuredOrder;
    });

    if (featuredCourses.length === 0) {
        featuredCourses = courses.slice(0, 3);
    }

    // 2️⃣ طباعة الدورات المميزة في الصفحة الرئيسية
    featuredCourses.forEach(function(c) {
        var cardMarkup = `
        <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col justify-between text-right transition hover:shadow-xl h-full" data-category="${c.category}">
           <img class="h-44 w-full object-cover" src="${getValidImageUrl(c.image)}" loading="lazy">
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div class="mb-4">
                    <span class="bg-slate-100 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">${c.category}</span>
                    <h3 class="font-bold text-md text-[#0B1F4D] mt-3">${escapeHTML(c.title)}</h3>
                    <p class="text-xs text-slate-500 mt-1.5"><i class="fas fa-chalkboard-teacher ml-1.5 text-[#D4A017]"></i> المدرب: ${escapeHTML(c.trainer)}</p>
                    <p class="text-xs text-slate-400 mt-0.5"><i class="fas fa-clock ml-1.5 text-slate-400"></i> المدة: ${c.duration || '36 ساعة تدريبية'}</p>
                </div>
                <div class="flex justify-between items-end pt-4 border-t border-slate-50 mt-auto">
                    <div class="flex flex-col gap-2 max-w-[60%] w-full">
                        ${c.discount && c.discount.trim() !== '' ? `
                        <div>
                            <span class="block text-[9px] text-rose-500 font-black mb-0.5">السعر قبل الخصم:</span>
                            <del class="block text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 leading-snug break-words">${c.discount}</del>
                        </div>
                        ` : ''}
                        <div>
                            <span class="block text-[9px] text-emerald-600 font-black mb-0.5">${c.discount && c.discount.trim() !== '' ? 'السعر بعد الخصم:' : 'رسوم الدورة:'}</span>
                            <span class="block text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 leading-snug break-words">${c.fee}</span>
                        </div>
                    </div>
                    <div class="flex gap-1.5">
                        <button onclick="openLandingPage('${escapeHTML(c.title)}')" class="bg-slate-100 hover:bg-slate-200 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-2 rounded-lg border border-slate-200 transition cursor-pointer">التفاصيل</button>
                        <button onclick="selectCourseDirectly('${escapeHTML(c.title)}')" class="bg-[#0B1F4D] hover:bg-[#132F6B] text-white text-[10px] font-bold px-2.5 py-2 rounded-lg shadow-md transition cursor-pointer">سجل الآن</button>
                    </div>
                </div>
            </div>
        </div>`;
        if(homeFeaturedContainer) homeFeaturedContainer.insertAdjacentHTML('beforeend', cardMarkup);
    });

    // 3️⃣ طباعة كل الدورات في صفحة (الدورات التدريبية المكتملة)
    courses.forEach(function(c, index) {
        var cardMarkup = `
        <div class="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden flex flex-col justify-between text-right transition hover:shadow-xl h-full" data-category="${c.category}">
           <img class="h-44 w-full object-cover" src="${getValidImageUrl(c.image)}" loading="lazy">
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div class="mb-4">
                    <span class="bg-slate-100 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">${c.category}</span>
                    <h3 class="font-bold text-md text-[#0B1F4D] mt-3">${escapeHTML(c.title)}</h3>
                    <p class="text-xs text-slate-500 mt-1.5"><i class="fas fa-chalkboard-teacher ml-1.5 text-[#D4A017]"></i> المدرب: ${escapeHTML(c.trainer)}</p>
                    <p class="text-xs text-slate-400 mt-0.5"><i class="fas fa-clock ml-1.5 text-slate-400"></i> المدة: ${c.duration || '36 ساعة تدريبية'}</p>
                </div>
                <div class="flex justify-between items-end pt-4 border-t border-slate-50 mt-auto">
                    <div class="flex flex-col gap-2 max-w-[60%] w-full">
                        ${c.discount && c.discount.trim() !== '' ? `
                        <div>
                            <span class="block text-[9px] text-rose-500 font-black mb-0.5">السعر قبل الخصم:</span>
                            <del class="block text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 leading-snug break-words">${c.discount}</del>
                        </div>
                        ` : ''}
                        <div>
                            <span class="block text-[9px] text-emerald-600 font-black mb-0.5">${c.discount && c.discount.trim() !== '' ? 'السعر بعد الخصم:' : 'رسوم الدورة:'}</span>
                            <span class="block text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100 leading-snug break-words">${c.fee}</span>
                        </div>
                    </div>
                    <div class="flex gap-1.5">
                        <button onclick="openLandingPage('${escapeHTML(c.title)}')" class="bg-slate-100 hover:bg-slate-200 text-[#0B1F4D] text-[10px] font-bold px-2.5 py-2 rounded-lg border border-slate-200 transition cursor-pointer">التفاصيل</button>
                        <button onclick="selectCourseDirectly('${escapeHTML(c.title)}')" class="bg-[#0B1F4D] hover:bg-[#132F6B] text-white text-[10px] font-bold px-2.5 py-2 rounded-lg shadow-md transition cursor-pointer">سجل الآن</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        if(fullContainer) fullContainer.insertAdjacentHTML('beforeend', cardMarkup);

        if(adminCoursesList) {
            adminCoursesList.insertAdjacentHTML('beforeend', `
            <div class="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <span class="font-bold text-[#0B1F4D] truncate w-1/3">${escapeHTML(c.title)}</span>
                <div class="flex gap-1">
                    <button onclick="openDetailsModal('${escapeHTML(c.title)}', event)" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded shadow-sm transition">التفاصيل</button>
                    <button onclick="openEditCourseModal('${c.id}', '${c.title.replace(/'/g, "\\'")}', '${c.trainer}', '${c.duration}', '${c.fee}', '${c.category}', '${c.discount || ''}')" class="bg-emerald-600 text-white px-2 py-1 rounded shadow-sm">تعديل</button>
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

    // 💡 توليد رقم عشوائي من 4 خانات (بين 1000 و 9999)
    var randomNum = Math.floor(1000 + Math.random() * 9000); 
    // 💡 التنسيق الجديد المطلق: IQR متبوعة بمسافة ثم الرقم (مثال: IQR 1001)
    var generatedOrderID = "IQR " + randomNum; 

    // تضمين الرقم المولد ضمن البيانات المرسلة للسيرفر
    var studentData = {
        orderID: generatedOrderID, 
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
                    // عرض الرقم بالتنسيق الجديد IQR 1001
                    document.getElementById('displayOrderID').innerText = generatedOrderID;
                }
            }
            
           showToast("اتممت عملية التسجيل بنجاح في الأكاديمية!");
            setTimeout(function() { 
                window.open("https://whatsapp.com/channel/0029VbCDK6M4IBhBR3jvVY0Y", "_blank"); 
            }, 3000);
        } else {
           showToast("❌ خطأ أثناء التسجيل: " + (res ? res.error : "غير معروف"), true);
            submitBtn.disabled = false; 
            submitBtn.innerText = originalText; 
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    } catch(err) {
        showToast("❌ خطأ اتصال بالسيرفر: " + err, true); 
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

// ==========================================
// دوال التواصل وطلب عروض الشركات (B2B)
// ==========================================
function requestB2BQuote(offerName, offerType) {
    // 💡 إضافة كود التتبع: لتسجيل ضغطة الزائر في رادار وإحصائيات المدير
    var sessionId = sessionStorage.getItem('visitor_session');
    if (!sessionId) {
        sessionId = 'زائر-' + Math.floor(Math.random() * 9999);
        sessionStorage.setItem('visitor_session', sessionId);
    }
    if (typeof logVisitorActivity === 'function') {
        logVisitorActivity('خدمات الشركات (طلب تواصل)', sessionId);
    }
    // --------------------------------------------------------

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
    let loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('hidden'); // إزالة الإخفاء
        loginModal.classList.add('flex');      // إضافة الظهور ليتم عرضها بشكل صحيح
    }
}
function closeLoginModal() { 
    let loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.add('hidden');    // إعادة الإخفاء
        loginModal.classList.remove('flex');   // إزالة الظهور حتى لا تبقى عالقة كشاشة شفافة
    }
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
         // --- التحكم بالصلاحيات وإظهار/إخفاء سجل الزوار ---
            if(res.role !== 'admin') {
                document.getElementById('tab-btn-content').style.display = 'none';
                document.getElementById('tab-btn-settings').style.display = 'none';
            // --- التحكم بالصلاحيات الجديدة والتوجيه الصحيح للوحات ---
            var adminTabsWrapper = document.querySelector('.flex.flex-wrap.gap-2.mb-6.bg-white.p-2.rounded-2xl');
            
            if (res.role === 'marketer') {
                // إخفاء تبويبات المدير بالكامل
                if(adminTabsWrapper) adminTabsWrapper.style.display = 'none';
                document.querySelectorAll('.admin-tab-content').forEach(el => el.style.display = 'none');
                
                // إظهار اللوحة المستقلة للمسوق
                document.getElementById('marketer-dedicated-dashboard').style.display = 'block';
                document.getElementById('marketer-dedicated-dashboard').classList.remove('hidden');
                
                // تعيين رابط التسويق الجديد
                var siteUrl = typeof SCRIPT_URL !== 'undefined' ? SCRIPT_URL : window.location.href.split('?')[0];
                document.getElementById('marketer-link-input-new').value = siteUrl + "?ref=" + res.marketerCode;
                
                // تشغيل جلب البيانات
                loadMarketerDashboard();

            } else if (res.role === 'trainer') {
                if(adminTabsWrapper) adminTabsWrapper.style.display = 'flex';
                document.getElementById('tab-btn-content').style.display = 'none';
                document.getElementById('tab-btn-settings').style.display = 'none';
                if(document.getElementById('tab-btn-ads-news')) document.getElementById('tab-btn-ads-news').style.display = 'none';
                if(document.getElementById('tab-btn-payments')) document.getElementById('tab-btn-payments').style.display = 'none';
                document.getElementById('tab-title-users').innerText = "طلابي المسجلين";
                switchAdminTab('tab-stats', document.getElementById('tab-btn-stats'));
                var visitorLogsDiv = document.getElementById('admin-only-visitor-logs');
                if(visitorLogsDiv) visitorLogsDiv.classList.add('hidden');
                
                loadDashboardData(res.role, res.marketerCode, res.name);
                loadStatsData(res.role, res.marketerCode, res.name);
                
            } else if (res.role === 'admin') {
                if(adminTabsWrapper) adminTabsWrapper.style.display = 'flex';
                document.getElementById('tab-btn-content').style.display = 'block';
                document.getElementById('tab-btn-settings').style.display = 'block';
                if(document.getElementById('tab-btn-ads-news')) document.getElementById('tab-btn-ads-news').style.display = 'block';
                if(document.getElementById('tab-btn-payments')) document.getElementById('tab-btn-payments').style.display = 'block';
                document.getElementById('tab-title-users').innerText = "إدارة المتدربين";
                
                var visitorLogsDiv = document.getElementById('admin-only-visitor-logs');
                if(visitorLogsDiv) visitorLogsDiv.classList.remove('hidden');
                
                loadDashboardData(res.role, res.marketerCode, res.name);
                loadStatsData(res.role, res.marketerCode, res.name);
                loadVisitorLogs(); 
            }
                
                // إخفاء سجل الزوار كلياً عن غير المدير
                var visitorLogsDiv = document.getElementById('admin-only-visitor-logs');
                if(visitorLogsDiv) visitorLogsDiv.classList.add('hidden');

            } else {
                document.getElementById('tab-btn-content').style.display = 'block';
                document.getElementById('tab-btn-settings').style.display = 'block';
                if(document.getElementById('tab-btn-ads-news')) document.getElementById('tab-btn-ads-news').style.display = 'block';
                if(document.getElementById('tab-btn-payments')) document.getElementById('tab-btn-payments').style.display = 'block';
                document.getElementById('tab-title-users').innerText = "إدارة المتدربين";
                
                // إظهار وتشغيل سجل الزوار لمدير الأكاديمية فقط
                var visitorLogsDiv = document.getElementById('admin-only-visitor-logs');
                if(visitorLogsDiv) visitorLogsDiv.classList.remove('hidden');
                loadVisitorLogs(); 
            }
            
            loadDashboardData(res.role, res.marketerCode, res.name);
            loadStatsData(res.role, res.marketerCode, res.name);
            closeLoginModal();
        } else {
            alert(res.message || res.error || "خطأ في بيانات الدخول");
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
                    <button onclick="changeStudentStateUI('${row.orderID}', 'مقبول')" class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 m-1">قبول</button>
                    <button onclick="changeStudentStateUI('${row.orderID}', 'مرفوض')" class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 m-1">رفض</button>
                `;
            } 
            else if (currentStatus === 'مقبول') {
                statusBadge = `<span class="text-green-600 bg-green-50 px-2 py-1 rounded">مقبول</span>`;
                actionButtons = `
                    <button onclick="changeStudentStateUI('${row.orderID}', 'تم تسديد الشهادة')" class="bg-[#D4A017] text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 m-1 shadow-sm">سدد الشهادة</button>
                    <button onclick="changeStudentStateUI('${row.orderID}', 'لم يتم تسديد الشهادة')" class="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 m-1 shadow-sm">لم يسدد</button>
                `;
            } 
            else if (currentStatus === 'تم تسديد الشهادة') {
                statusBadge = `<span class="text-[#D4A017] font-bold bg-yellow-50 px-2 py-1 rounded">تم تسديد الشهادة</span>`;
                actionButtons = `<span class="text-xs text-gray-400 font-bold">مكتمل ✔️</span>`;
            } 
            else if (currentStatus === 'لم يتم تسديد الشهادة') {
                statusBadge = `<span class="text-gray-600 bg-gray-100 px-2 py-1 rounded">لم يسدد</span>`;
                actionButtons = `
                    <button onclick="changeStudentStateUI('${row.orderID}', 'تم تسديد الشهادة')" class="bg-[#D4A017] text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 m-1 shadow-sm">تأكيد التسديد</button>
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
async function loadStatsData(role, code, name) {
    try {
        const res = await getAdminStats(role, code, name);
        
        if(res && res.success) {
            // 💡 التعديل هنا: تمت إضافة .font-black لاستهداف مكان الرقم فقط وترك الأيقونات
            var statsEls = document.querySelectorAll('#tab-stats .grid .text-2xl.font-black');
            
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
            discount: document.getElementById('adm-course-discount').value, // الحقل الجديد
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

function openEditCourseModal(id, title, trainer, dur, fee, cat, discount) {
    document.getElementById('edit-course-id').value = id;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-trainer').value = trainer;
    document.getElementById('edit-dur').value = dur;
    document.getElementById('edit-fee').value = fee;
    document.getElementById('edit-cat').value = cat;
    document.getElementById('edit-discount').value = discount || ''; // الحقل الجديد
    document.getElementById('edit-course-modal').classList.remove('hidden');
}

async function submitCourseEdit() {
    var id = document.getElementById('edit-course-id').value;
    var data = {
        title: document.getElementById('edit-title').value,
        trainer: document.getElementById('edit-trainer').value,
        duration: document.getElementById('edit-dur').value,
        fee: document.getElementById('edit-fee').value,
        discount: document.getElementById('edit-discount').value, // الحقل الجديد
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
                  <p class="text-xs text-slate-600 leading-relaxed mb-4">"${escapeHTML(t.text)}"</p>
                </div>
               <div class="font-bold text-[#0B1F4D] text-sm mt-auto">- ${escapeHTML(t.name)}</div>
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

async function changeStudentStateUI(orderId, newStatus) {
    if(!confirm("هل تريد تغيير حالة الطلب إلى: " + newStatus + "؟")) return;
    
    document.body.style.cursor = 'wait';
    
    try {
        // استدعاء دالة API الأصلية لفك التعارض البرمجي
        const res = await callAPI('updateStudentState', { orderId, newStatus });
        document.body.style.cursor = 'default';
        if(res && res.success) {
            alert("✅ تم تغيير الحالة بنجاح إلى: " + res.newStatus);
            
            var currentRole = sessionStorage.getItem('role');
            var currentCode = sessionStorage.getItem('code');
            var currentName = sessionStorage.getItem('name');
            loadDashboardData(currentRole, currentCode, currentName);
        } else {
            alert("❌ خطأ: " + (res.error || res.message));
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
               <h3 class="text-sm font-bold text-[#0B1F4D] mb-2 leading-snug">${escapeHTML(n.title)}</h3>
               <p class="text-slate-500 text-xs leading-relaxed line-clamp-2">${escapeHTML(n.details)}</p>
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
                <span class="truncate w-1/2 font-bold text-[#0B1F4D]">${item.title}</span>
                <div class="flex gap-1">
                    <button onclick="openEditNewsModal('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${item.details.replace(/'/g, "\\'")}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded shadow-sm transition"><i class="fas fa-edit"></i> تعديل</button>
                    <button onclick="deleteNewsFinalAction('${item.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded shadow-sm transition"><i class="fas fa-trash-alt"></i> حذف</button>
                </div>
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
                <span class="truncate w-1/2 font-bold text-[#0B1F4D]">${item.title}</span>
                <div class="flex gap-1">
                    <button onclick="openEditAdModal('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${item.type}', '${item.date}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded shadow-sm transition"><i class="fas fa-edit"></i> تعديل</button>
                    <button onclick="deleteAdFinalAction('${item.id}')" class="bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded shadow-sm transition"><i class="fas fa-trash-alt"></i> حذف</button>
                </div>
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

// ====== دوال تعديل الأخبار ======
function openEditNewsModal(id, title, content) {
    document.getElementById('edit-news-id').value = id;
    document.getElementById('edit-news-title').value = title;
    document.getElementById('edit-news-content').value = content;
    document.getElementById('edit-news-modal').classList.remove('hidden');
}

async function submitNewsEdit() {
    var id = document.getElementById('edit-news-id').value;
    var data = {
        title: document.getElementById('edit-news-title').value,
        content: document.getElementById('edit-news-content').value
    };
    var btn = document.querySelector('#edit-news-modal button');
    var originalText = btn.innerText;
    btn.innerText = "جاري التحديث..."; btn.disabled = true;
    try {
        const res = await callAPI('updateNews', { id: id, data: data }); 
        btn.innerText = originalText; btn.disabled = false;
        if(res.success) {
            alert("✅ تم التعديل بنجاح");
            document.getElementById('edit-news-modal').classList.add('hidden');
            loadNewsFromServer();
        } else alert("❌ خطأ: " + res.error);
    } catch(err) { alert("خطأ سيرفر: " + err); btn.innerText = originalText; btn.disabled = false; }
}

// ====== دوال تعديل العروض (الشركات) ======
function openEditAdModal(id, title, type, date) {
    document.getElementById('edit-ad-id').value = id;
    document.getElementById('edit-ad-title').value = title;
    document.getElementById('edit-ad-type').value = type;
    document.getElementById('edit-ad-date').value = date;
    document.getElementById('edit-ad-modal').classList.remove('hidden');
}

async function submitAdEdit() {
    var id = document.getElementById('edit-ad-id').value;
    var data = {
        title: document.getElementById('edit-ad-title').value,
        type: document.getElementById('edit-ad-type').value,
        date: document.getElementById('edit-ad-date').value
    };
    var btn = document.querySelector('#edit-ad-modal button');
    var originalText = btn.innerText;
    btn.innerText = "جاري التحديث..."; btn.disabled = true;
    try {
        const res = await callAPI('updateAd', { id: id, data: data });
        btn.innerText = originalText; btn.disabled = false;
        if(res.success) {
            alert("✅ تم التعديل بنجاح");
            document.getElementById('edit-ad-modal').classList.add('hidden');
            loadRealAdsFromServer();
        } else alert("❌ خطأ: " + res.error);
    } catch(err) { alert("خطأ سيرفر: " + err); btn.innerText = originalText; btn.disabled = false; }
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


// ==========================================
// نظام الجولة التفاعلية للمستخدمين الجدد (محدث ومحسن بالكامل للهواتف الذكية)
// ==========================================

var onboardingSteps = [
    {
        elementId: 'btn-courses',
        title: 'دليل البرامج التدريبية',
        content: 'من هنا يمكنك تصفح واستكشاف جميع المسارات والدورات التدريبية المتاحة في الأكاديمية، وفلترتها حسب التخصص.'
    },
    {
        elementId: 'btn-b2b',
        title: 'خدمات الشركات والمنظمات',
        content: 'إذا كنت تمثل جهة، منظمة دولية، أو مبادرة مجتمعية، يمكنك من هنا تقديم طلب شراكة أو الاطلاع على عروضنا الاستراتيجية.'
    },
    {
        elementId: 'btn-verification',
        title: 'بوابة فحص الشهادات',
        content: 'هذا القسم مخصص للتحقق الفوري من صحة واعتماد الشهادات الموحدة الصادرة رسمياً من الأكاديمية عن طريق رقم القيد.'
    },
    {
        elementId: 'btn-payment',
        title: 'تسديد الرسوم',
        content: 'بوابة الدفع المعتمدة لإرسال إشعارات الحوالات ورفع صور السندات لاعتمادها تلقائياً في لوحة الإدارة.'
    }
];

var currentTourStep = 0;

function checkAndStartOnboarding() {
    if (localStorage.getItem('onboarding_completed') === 'true') {
        return;
    }
    setTimeout(startOnboardingTour, 1500);
}

function startOnboardingTour() {
    currentTourStep = 0;
    
    // 1. طبقة شفافة لمنع الضغط العشوائي على محتويات الموقع أثناء الجولة
    var clickBlocker = document.createElement('div');
    clickBlocker.id = 'tour-click-blocker';
    clickBlocker.className = 'fixed inset-0 z-[60]';
    document.body.appendChild(clickBlocker);
    
    // 2. الفتحة المضيئة (Focus Hole) للتسليط المباشر مع التعتيم المحيط
    var backdrop = document.createElement('div');
    backdrop.id = 'tour-backdrop';
    backdrop.className = 'fixed z-[65] rounded-xl transition-all duration-500 pointer-events-none opacity-0';
    backdrop.style.boxShadow = '0 0 0 9999px rgba(15, 23, 42, 0.80)';
    backdrop.style.border = '2px solid #D4A017';
    document.body.appendChild(backdrop);
    
    // 3. صندوق التعليمات والشروحات العائم
    var guideBox = document.createElement('div');
    guideBox.id = 'tour-guide-box';
    guideBox.className = 'fixed z-[75] bg-white rounded-2xl shadow-2xl p-6 w-[320px] max-w-[90vw] text-right text-xs border border-slate-100 transition-all duration-500 opacity-0';
    document.body.appendChild(guideBox);
    
    showTourStep();
}

function showTourStep() {
    if (currentTourStep >= onboardingSteps.length) {
        endOnboardingTour();
        return;
    }
    
    var step = onboardingSteps[currentTourStep];
    var isMobile = window.innerWidth <= 768; // فحص نوع الجهاز الحالي
    
    // تحويل التوجيه تلقائياً لمعرف الجوال إذا كان التصفح من هاتف محمول
    var targetId = isMobile ? step.elementId + '-mob' : step.elementId;
    var element = document.getElementById(targetId);
    var guideBox = document.getElementById('tour-guide-box');
    var backdrop = document.getElementById('tour-backdrop');
    
    // في الجوال: فتح القائمة المنسدلة تلقائياً لكي يرى المستخدم العناصر بوضوح
    if (isMobile) {
        var menu = document.getElementById('mobile-menu');
        if (menu && menu.classList.contains('hidden')) {
            toggleMobileMenu(); 
        }
    }

    // تحديث المحتوى النصي والأزرار داخل بطاقة الشرح
    guideBox.innerHTML = `
        <div class="flex justify-between items-center border-b pb-2 mb-3">
            <h4 class="font-black text-[#0B1F4D] text-sm"><i class="fas fa-magic text-[#D4A017] ml-1"></i> ${step.title}</h4>
            <span class="text-[10px] text-slate-400 font-bold">${currentTourStep + 1} / ${onboardingSteps.length}</span>
        </div>
        <p class="text-slate-600 leading-relaxed font-bold mb-4">${step.content}</p>
        <div class="flex gap-2 border-t pt-3">
            <button onclick="nextTourStep()" class="flex-1 bg-[#0B1F4D] text-white py-2 rounded-xl font-bold hover:bg-[#132F6B] transition shadow-sm cursor-pointer">
                ${currentTourStep === onboardingSteps.length - 1 ? 'إنهاء الجولة' : 'التالي ➔'}
            </button>
            <button onclick="endOnboardingTour()" class="bg-slate-100 hover:bg-slate-200 text-slate-500 px-3 py-2 rounded-xl font-bold border cursor-pointer">
                تخطي
            </button>
        </div>
    `;

    // حسابات المواقع الجغرافية للعناصر المضيئة على الشاشات المختلفة
    if (element && element.offsetHeight > 0) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(function() {
            var rect = element.getBoundingClientRect();
            
            // مطابقة مقاس المربع المضيء الذهبي فوق زر القائمة المختار
            backdrop.style.top = (rect.top - 4) + 'px';
            backdrop.style.left = (rect.left - 6) + 'px';
            backdrop.style.width = (rect.width + 12) + 'px';
            backdrop.style.height = (rect.height + 8) + 'px';
            backdrop.classList.remove('opacity-0');
            
            // في الجوال: تثبيت صندوق الشرح أسفل الشاشة لمنع الازدحام وضيق المساحة
            if (isMobile) {
                guideBox.style.bottom = '20px';
                guideBox.style.top = 'auto';
                guideBox.style.left = '50%';
                guideBox.style.transform = 'translateX(-50%)';
            } else {
                // في الكمبيوتر: حساب التموضع الدقيق أسفل الزر مباشرة
                guideBox.style.bottom = 'auto';
                guideBox.style.top = (rect.bottom + 16) + 'px';
                guideBox.style.transform = 'translateY(0)';
                var leftPos = rect.left + (rect.width / 2) - 160;
                if (leftPos < 10) leftPos = 10;
                if (leftPos + 320 > window.innerWidth) leftPos = window.innerWidth - 330;
                guideBox.style.left = leftPos + 'px';
            }
            
            guideBox.classList.remove('opacity-0');
        }, 300);
    } else {
        // حماية احتياطية في حال تعذر العثور على العنصر
        backdrop.classList.add('opacity-0');
        guideBox.style.top = '50%';
        guideBox.style.left = '50%';
        guideBox.style.transform = 'translate(-50%, -50%)';
        guideBox.classList.remove('opacity-0');
    }
}

function nextTourStep() {
    currentTourStep++;
    showTourStep();
}

function endOnboardingTour() {
    var blocker = document.getElementById('tour-click-blocker');
    var backdrop = document.getElementById('tour-backdrop');
    var guideBox = document.getElementById('tour-guide-box');
    
    if (blocker) blocker.remove();
    if (backdrop) backdrop.remove();
    if (guideBox) guideBox.remove();
    
    // عند انتهاء الجولة أو تخطيها، إغلاق قائمة الجوال ليعود الموقع طبيعياً
    var menu = document.getElementById('mobile-menu');
    if (menu && !menu.classList.contains('hidden')) {
        toggleMobileMenu();
    }
    
    localStorage.setItem('onboarding_completed', 'true');
    showToast('تمت الجولة بنجاح! شكراً لك.');
}
// ==========================================
// دالة نسخ رقم الطلب
// ==========================================
function copyOrderID(btnElement) {
    var orderIDText = document.getElementById('displayOrderID').innerText;
    if (!orderIDText) return;
    
    // إنشاء حقل نصي وهمي لنسخ النص منه
    var tempInput = document.createElement("input");
    tempInput.value = orderIDText;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    
    // تغيير شكل الزر لإظهار نجاح النسخ
    var originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fas fa-check text-emerald-600"></i> تم';
    btnElement.classList.add('bg-emerald-50', 'border-emerald-200');
    
    // إعادته لشكله الأصلي بعد ثانيتين
    setTimeout(function() {
        btnElement.innerHTML = originalHTML;
        btnElement.classList.remove('bg-emerald-50', 'border-emerald-200');
    }, 2000);
}
// ==========================================
// دالة التسجيل في دورة أخرى
// ==========================================
function registerAnotherCourse() {
    // 1. إخفاء رسالة النجاح
    var successDiv = document.getElementById('successMessage');
    if(successDiv) {
        successDiv.style.display = 'none';
        successDiv.classList.add('hidden');
    }
    
    // 2. إعادة إظهار عناصر نموذج التسجيل لحالتها الطبيعية
    var formChildren = document.getElementById('registration-form').children;
    for (var i = 0; i < formChildren.length; i++) {
         if (formChildren[i].id !== 'successMessage') { 
             formChildren[i].style.display = ''; // إزالة الإخفاء
         }
    }
    
    // 💡 3. إعادة تنشيط زر التسجيل ليعمل من جديد (حل مشكلة التعليق)
    var submitBtn = document.getElementById('submit-btn');
    if(submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'تأكيد التسجيل وإصدار رقم الطلب';
        submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
    
    // 4. تصفير جميع الحقول وإخفاء تفاصيل الدورة السابقة
    document.getElementById('registration-form').reset();
    var dynamicInfo = document.getElementById('course-dynamic-info');
    if(dynamicInfo) {
        dynamicInfo.classList.add('hidden');
        dynamicInfo.innerHTML = '';
    }
    
    // 5. توجيه الطالب فوراً إلى قسم الدورات التدريبية
    navigateTo('courses');
}
// ==========================================
// رسالة التنبيه عند محاولة إغلاق الموقع أو التراجع
// ==========================================
window.addEventListener('beforeunload', function (e) {
    // 💡 تأمين أخير: إذا أغلق الطالب المتصفح فجأة وهو داخل القاعة، يتم تسجيل حضوره فوراً
    if (currentLiveSession) {
        recordStudentAttendance();
    }
    
    e.preventDefault();
    e.returnValue = ''; 
    return '';
});
// ==========================================
// جلب سجل الزوار للمدير (نظام المصفوفة ✅ ❌)
// ==========================================
async function loadVisitorLogs() {
    var tbody = document.getElementById('visitor-logs-tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-slate-400">جاري مسح الرادار وجلب البيانات...</td></tr>';
    
    try {
        // 1. جلب بيانات الزوار للجدول (الأساسية)
        const res = await fetchVisitorLogs();
        
        // 2. جلب الإحصائيات الجديدة للمربعات العلوية
        const statsRes = await callAPI('getAdvancedStats');
        
        // تحديث أرقام المربعات الجديدة إذا نجح الاتصال
        if (statsRes && statsRes.success) {
            if(document.getElementById('stat-month')) document.getElementById('stat-month').innerText = statsRes.data.thisMonthVisits;
            if(document.getElementById('stat-year')) document.getElementById('stat-year').innerText = statsRes.data.thisYearVisits;
        }

        if (res && res.error) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-rose-600 font-black text-sm">خطأ: ' + res.error + '</td></tr>';
            return;
        }
        
        if(res && res.success) {
            // تحديث الإحصائيات العددية المستمرة القديمة
            if(document.getElementById('stat-total-visitors')) document.getElementById('stat-total-visitors').innerText = res.stats.totalVisitors || 0;
            if(document.getElementById('stat-total-b2b')) document.getElementById('stat-total-b2b').innerText = res.stats.b2bRequests || 0;
            
            var totalStudentsCard = document.querySelector('#tab-stats .grid .text-2xl');
            if(document.getElementById('stat-total-regs') && totalStudentsCard) {
                 document.getElementById('stat-total-regs').innerText = totalStudentsCard.innerText;
            }

            // رسم جدول الزوار (نظام المصفوفة)
            let logsArray = res.logs || [];
            if(logsArray.length > 0) {
                tbody.innerHTML = '';
                logsArray.forEach(function(log) {
                   const checkPage = (pageName) => {
    let visited = Object.keys(log.pages).some(p => p.includes(pageName));
    return visited 
        ? '<span class="text-emerald-500 text-lg drop-shadow-sm">✅</span>' 
        : '<span class="text-slate-300 drop-shadow-sm">➖</span>';
};

                    tbody.insertAdjacentHTML('beforeend', `
                        <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                            <td class="p-3 text-[#D4A017] font-black">${log.session || '-'}</td>
                            <td class="p-3 text-slate-500 font-bold dir-ltr text-right text-[10px]">${log.lastDate || '-'}</td>
                            <td class="p-3 text-center bg-slate-50/50">${checkPage('الرئيسية')}</td>
                            <td class="p-3 text-center">${checkPage('الدورات')}</td>
                            <td class="p-3 text-center bg-slate-50/50">${checkPage('الشركات')}</td>
                            <td class="p-3 text-center">${checkPage('الأخبار')}</td>
                            <td class="p-3 text-center bg-slate-50/50">${checkPage('فحص')}</td>
                        </tr>
                    `);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-slate-400 font-bold">الرادار فارغ حالياً</td></tr>';
            }
        }
    } catch(e) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-3 text-center text-rose-600 font-black">خطأ في الاتصال</td></tr>';
    }
}
// متغير لحفظ بيانات جلسة الطالب الحالية
var currentLiveSession = null;
window.addEventListener('DOMContentLoaded', initializeWebsiteLayout);
// ==========================================
// دوال لوحة المسوق الديناميكية (الجديدة)
// ==========================================

let allMarketerData = null;

function copyMarketerLinkNew() {
    var copyText = document.getElementById("marketer-link-input-new");
    copyText.select();
    document.execCommand("copy");
    var btn = document.getElementById("btn-copy-link-new");
    btn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
    btn.classList.replace('bg-emerald-600', 'bg-emerald-800');
    setTimeout(function() { 
        btn.innerHTML = '<i class="fas fa-copy ml-1"></i> نسخ الرابط'; 
        btn.classList.replace('bg-emerald-800', 'bg-emerald-600');
    }, 3000);
}

function switchMarketerTab(tabId) {
    document.querySelectorAll('.mk-content-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('block');
    });
    document.querySelectorAll('.mk-tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#0B1F4D]', 'text-white', 'shadow');
        btn.classList.add('bg-transparent', 'text-slate-600');
    });
    
    document.getElementById('mk-' + tabId + '-tab').classList.remove('hidden');
    document.getElementById('mk-' + tabId + '-tab').classList.add('block');
    
    let activeBtn = document.getElementById('mk-tab-btn-' + tabId);
    if(activeBtn) {
        activeBtn.classList.remove('bg-transparent', 'text-slate-600');
        activeBtn.classList.add('bg-[#0B1F4D]', 'text-white', 'shadow');
    }
    
    if(tabId === 'withdrawals') {
        loadWithdrawalsHistory();
    }
}

async function loadMarketerDashboard() {
    var marketerCode = sessionStorage.getItem('code');
    const res = await getMarketerFullData(marketerCode);
    
    if (res.success) {
        allMarketerData = res.data;
        
        // تعبئة بيانات الرئيسية (بالريال اليمني)
        document.getElementById('mk-total-students').innerText = allMarketerData.totalStudents;
        document.getElementById('mk-current-tier').innerText = '%' + Math.round(allMarketerData.currentTierPct * 100);
        document.getElementById('mk-total-earnings').innerText = allMarketerData.totalEarnings + ' ر.ي';
        document.getElementById('mk-available-balance').innerText = allMarketerData.availableBalance + ' ر.ي';
        
        // تعبئة قائمة الدورات
        let select = document.getElementById('marketer-course-selector');
        select.innerHTML = '<option value="" disabled selected>تصفح الدورات 🔽</option>';
        Object.keys(allMarketerData.courses).forEach(courseName => {
            select.innerHTML += `<option value="${courseName}">${courseName}</option>`;
        });
    } else {
        alert("فشل جلب بيانات المسوق.");
    }
}

function loadSpecificCourseData(courseName) {
    if(!courseName || !allMarketerData || !allMarketerData.courses[courseName]) return;
    
    let courseData = allMarketerData.courses[courseName];
    
    switchMarketerTab('course');
    document.getElementById('mk-course-title').innerText = courseName;
    document.getElementById('mk-c-enrolled').innerText = courseData.enrolled;
    document.getElementById('mk-c-paid').innerText = courseData.paid;
    document.getElementById('mk-c-earnings').innerText = courseData.totalEarnings + ' ر.ي';
    document.getElementById('mk-c-pending').innerText = courseData.pendingBalance + ' ر.ي';
    
    // ======================================================
    // حساب شريط التقدم الخاص بطلاب هذه الدورة فقط
    // ======================================================
    let currentCourseStudents = courseData.enrolled;
    let nextTarget = 0;
    let nextPctText = "";
    let remaining = 0;

    if (currentCourseStudents < 51) {
        nextTarget = 51;
        nextPctText = "25%";
        remaining = nextTarget - currentCourseStudents;
    } else if (currentCourseStudents < 200) {
        nextTarget = 200;
        nextPctText = "30%";
        remaining = nextTarget - currentCourseStudents;
    } else {
        nextTarget = currentCourseStudents; // وصل للحد الأقصى
        remaining = 0;
    }

    let progressPct = currentCourseStudents >= 200 ? 100 : (currentCourseStudents / nextTarget) * 100;
    
    document.getElementById('mk-progress-current').innerText = "إجمالي طلابك: " + currentCourseStudents;
    document.getElementById('mk-progress-bar').style.width = progressPct + '%';
    
    // كتابة النص بالشكل المطلوب (متبقي X للوصول إلى Y%)
    let targetText = remaining > 0 
        ? `متبقي ${remaining} طالب للوصول إلى نسبة ${nextPctText}` 
        : "وصلت للحد الأقصى للعمولة 30%";
    
    document.getElementById('mk-progress-next-text').innerText = targetText;
    // ======================================================

    let tbody = document.getElementById('mk-course-students-body');
    tbody.innerHTML = '';
    
    if(courseData.students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">لا يوجد طلاب مسجلين</td></tr>';
        return;
    }
    
    courseData.students.forEach(st => {
        let commStatus = st.commissionPaid ? '<span class="text-emerald-500 font-bold"><i class="fas fa-check"></i> صُرفت</span>' : '<span class="text-rose-500 font-bold">معلقة</span>';
        let paidBadge = st.isPaid ? '<span class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded">مسدد</span>' : '<span class="bg-slate-100 text-slate-500 px-2 py-1 rounded">لم يسدد</span>';
        let certBadge = st.certIssued ? '<i class="fas fa-certificate text-emerald-500"></i>' : '-';
        
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="p-4 font-bold text-[#0B1F4D] text-[11px]">${st.name}</td>
                <td class="p-4 text-slate-500 dir-ltr text-left text-[11px]">${st.phone}</td>
                <td class="p-4 text-slate-400 text-[10px]">${st.date}</td>
                <td class="p-4">${paidBadge}</td>
                <td class="p-4 text-center text-lg">${certBadge}</td>
                <td class="p-4 text-center font-black text-[#D4A017] text-sm">${st.commissionValue} ر.ي<div class="text-[9px] mt-1">${commStatus}</div></td>
            </tr>
        `;
    });
}
async function requestWithdrawal() {
    // تنظيف النص من رمز العملة لاستخراج الرقم الصافي
    let availableText = document.getElementById('mk-available-balance').innerText.replace('ر.ي', '').trim();
    let available = parseFloat(availableText);
    
    if (isNaN(available) || available <= 0) {
        alert("عفواً، لا يوجد رصيد متاح للسحب حالياً.");
        return;
    }

    let amountStr = prompt(`رصيدك المتاح للسحب هو ${available} ر.ي\nأدخل المبلغ الذي ترغب بسحبه الآن:`);
    if (!amountStr) return; 

    let amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > available) {
        alert("المبلغ المدخل غير صحيح أو يتجاوز الرصيد المتاح.");
        return;
    }

    document.body.style.cursor = 'wait';
    let res = await requestWithdrawalAction(sessionStorage.getItem('code'), amount);
    document.body.style.cursor = 'default';

    if (res.success) {
        alert("✅ تم إرسال طلب السحب بنجاح! سيتم مراجعته قريباً.");
        loadMarketerDashboard(); 
        switchMarketerTab('withdrawals');
    } else {
        alert("❌ حدث خطأ: " + res.error);
    }
}
async function loadWithdrawalsHistory() {
    let tbody = document.getElementById('mk-withdrawals-body');
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">جاري التحميل...</td></tr>';
    
    let res = await fetchWithdrawalsHistory(sessionStorage.getItem('code'));
    
    if (res.success) {
        tbody.innerHTML = '';
        let totalWithdrawn = 0;

        if (res.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 font-bold">لا توجد عمليات سحب مسجلة حتى الآن.</td></tr>';
            document.getElementById('mk-total-withdrawn').innerText = '0 ر.ي';
            return;
        }

        res.data.forEach(w => {
            if (w.status === 'مكتمل') totalWithdrawn += parseFloat(w.amount);
            
            let statusBadge = '';
            if (w.status === 'قيد المراجعة') statusBadge = '<span class="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded font-bold">قيد المراجعة</span>';
            else if (w.status === 'مكتمل') statusBadge = '<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded font-bold">مكتمل</span>';
            else statusBadge = '<span class="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded font-bold">مرفوض</span>';

            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-50">
                    <td class="p-4 font-bold text-[#0B1F4D] text-[11px]">${w.id}</td>
                    <td class="p-4 text-slate-500 font-medium text-[10px]">${w.date}</td>
                    <td class="p-4 font-black text-emerald-600 text-sm">${w.amount} ر.ي</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-slate-400 text-[10px] truncate max-w-[150px]">${w.notes || '-'}</td>
                </tr>
            `;
        });

        document.getElementById('mk-total-withdrawn').innerText = totalWithdrawn + ' ر.ي';
    }
}
