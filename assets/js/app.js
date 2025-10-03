// نظام إدارة المعمل الطبي - الملف الرئيسي للتطبيق

class LabApp {
    constructor() {
        this.currentSection = 'hospital';
        this.isInitialized = false;
        this.init();
    }

    // تهيئة التطبيق
    async init() {
        try {
            // إظهار شاشة التحميل
            Utils.showLoading('جاري تحميل النظام...');

            // تهيئة قاعدة البيانات
            await labDB.init();

            // تهيئة نظام اللغات
            await this.initializeLanguageSystem();

            // إعداد التنقل
            this.setupNavigation();

            // إعداد الإعدادات والنسخ الاحتياطي
            this.setupSettings();

            // تحميل البيانات الأولية
            await this.loadInitialData();

            // عرض القسم الافتراضي
            this.showSection('hospital');

            this.isInitialized = true;
            console.log('تم تحميل نظام إدارة المعمل الطبي بنجاح');

        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            Utils.showToast('خطأ في تحميل النظام، يرجى إعادة تحميل الصفحة', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // تهيئة نظام اللغات
    async initializeLanguageSystem() {
        // انتظار تحميل نظام اللغات
        await languageManager.loadLanguageData();

        // إعداد مستمعي أحداث تغيير اللغة
        languageManager.initializeLanguageSwitcher();

        // تحديث واجهة المستخدم حسب اللغة الافتراضية
        this.updateLanguageInterface();
    }

    // إعداد التنقل بين الأقسام
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });
    }

    // عرض قسم محدد
    showSection(sectionName) {
        // إخفاء جميع الأقسام
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // إزالة حالة النشاط من جميع روابط التنقل
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // إظهار القسم المطلوب
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // تفعيل رابط التنقل
        const activeNavLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }

        // تحديث حالة التطبيق
        this.currentSection = sectionName;

        // تحديث عنوان الصفحة
        Utils.updatePageTitle(sectionName);

        // تنفيذ إجراءات خاصة لكل قسم
        this.handleSectionSpecificActions(sectionName);
    }

    // التعامل مع الإجراءات الخاصة لكل قسم
    handleSectionSpecificActions(sectionName) {
        switch (sectionName) {
            case 'hospital':
                // لا حاجة لإجراء خاص، البيانات محملة مسبقاً
                break;
                
            case 'tests':
                // تحديث الإحصائيات
                if (testsManager && testsManager.tests) {
                    testsManager.updateStatistics();
                }
                break;
                
            case 'patients':
                // إعادة تحميل قائمة الفحوصات المتاحة
                if (patientsManager) {
                    patientsManager.displayTestsSelection();
                }
                break;
                
            case 'reports':
                // لا حاجة لإجراء خاص
                break;
                
            case 'settings':
                // تحديث معلومات النظام
                this.updateSystemInfo();
                break;
        }
    }

    // إعداد الإعدادات والنسخ الاحتياطي
    setupSettings() {
        // تصدير البيانات
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }

        // استيراد البيانات
        const importBtn = document.getElementById('importData');
        const importFile = document.getElementById('importFile');
        
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
            
            importFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.importAllData(e.target.files[0]);
                }
            });
        }

        // حذف جميع البيانات
        const clearBtn = document.getElementById('clearAllData');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    // تحميل البيانات الأولية
    async loadInitialData() {
        try {
            // تحميل الإحصائيات العامة
            const stats = await labDB.getStatistics();
            Utils.updateStatistics(stats);

        } catch (error) {
            console.error('خطأ في تحميل البيانات الأولية:', error);
        }
    }

    // تصدير جميع البيانات
    async exportAllData() {
        try {
            Utils.showLoading('جاري تصدير البيانات...');
            
            const data = await labDB.exportAllData();
            
            const fileName = `lab-data-backup-${new Date().toISOString().split('T')[0]}.json`;
            Utils.downloadJSON(data, fileName);
            
            Utils.showToast(languageManager.getTranslation('success_export'), 'success');
            
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            Utils.showToast(languageManager.getTranslation('error_export'), 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // استيراد جميع البيانات
    async importAllData(file) {
        try {
            Utils.showLoading('جاري استيراد البيانات...');
            
            const data = await Utils.readJSONFile(file);
            
            // التحقق من صحة البيانات
            if (!data.data || !data.version) {
                throw new Error('ملف البيانات غير صحيح');
            }

            // تأكيد الاستيراد
            Utils.showConfirm(
                'تأكيد الاستيراد',
                'هل أنت متأكد من استيراد البيانات؟ سيتم استبدال جميع البيانات الحالية.',
                async () => {
                    try {
                        Utils.showLoading('جاري استيراد البيانات...');
                        
                        await labDB.importAllData(data);
                        
                        // إعادة تحميل جميع المديرين
                        await this.reloadAllManagers();
                        
                        Utils.showToast(languageManager.getTranslation('success_import'), 'success');
                        
                    } catch (error) {
                        console.error('خطأ في استيراد البيانات:', error);
                        Utils.showToast(languageManager.getTranslation('error_import'), 'error');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            );
            
        } catch (error) {
            console.error('خطأ في قراءة ملف الاستيراد:', error);
            Utils.showToast(languageManager.getTranslation('error_file_read'), 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // حذف جميع البيانات
    async clearAllData() {
        try {
            Utils.showConfirm(
                'تأكيد حذف جميع البيانات',
                'هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.',
                async () => {
                    try {
                        Utils.showLoading('جاري حذف جميع البيانات...');
                        
                        await labDB.clearAllData();
                        
                        // إعادة تحميل جميع المديرين
                        await this.reloadAllManagers();
                        
                        Utils.showToast('تم حذف جميع البيانات بنجاح', 'success');
                        
                    } catch (error) {
                        console.error('خطأ في حذف البيانات:', error);
                        Utils.showToast('خطأ في حذف البيانات', 'error');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            );
            
        } catch (error) {
            console.error('خطأ في حذف البيانات:', error);
            Utils.showToast('خطأ في حذف البيانات', 'error');
        }
    }

    // إعادة تحميل جميع المديرين
    async reloadAllManagers() {
        try {
            // إعادة تحميل بيانات المستشفى
            if (hospitalManager) {
                await hospitalManager.loadHospitalData();
            }

            // إعادة تحميل الفحوصات
            if (testsManager) {
                await testsManager.loadTests();
            }

            // إعادة تحميل المرضى
            if (patientsManager) {
                await patientsManager.loadPatientsData();
            }

            // تحديث الإحصائيات
            const stats = await labDB.getStatistics();
            Utils.updateStatistics(stats);

        } catch (error) {
            console.error('خطأ في إعادة تحميل البيانات:', error);
        }
    }

    // تحديث معلومات النظام
    updateSystemInfo() {
        // يمكن إضافة معلومات النظام هنا
        console.log('معلومات النظام:', {
            version: '1.0.0',
            database: 'IndexedDB',
            currentLanguage: languageManager.getCurrentLanguage(),
            currentSection: this.currentSection
        });
    }

    // تحديث واجهة المستخدم حسب اللغة
    updateLanguageInterface() {
        // تحديث جميع المديرين
        if (hospitalManager && hospitalManager.updateLanguageSettings) {
            hospitalManager.updateLanguageSettings();
        }

        if (testsManager && testsManager.updateLanguageSettings) {
            testsManager.updateLanguageSettings();
        }

        if (reportsManager && reportsManager.updateLanguageSettings) {
            reportsManager.updateLanguageSettings();
        }

        // تحديث النصوص الثابتة
        this.updateStaticTexts();
    }

    // تحديث النصوص الثابتة
    updateStaticTexts() {
        // تحديث عناوين الأقسام في التنقل
        const navTexts = document.querySelectorAll('.nav-text');
        const navKeys = ['hospital_section', 'tests_section', 'patients_section', 'reports_section', 'settings_section'];
        
        navTexts.forEach((element, index) => {
            if (navKeys[index]) {
                element.textContent = languageManager.getTranslation(navKeys[index]);
            }
        });

        // تحديث عنوان التطبيق
        const appTitle = document.querySelector('.logo-section h1');
        if (appTitle) {
            appTitle.textContent = languageManager.getTranslation('app_title');
        }

        // تحديث عناوين الأقسام
        const sectionTitles = document.querySelectorAll('.section-header h2');
        const titleKeys = ['hospital_management', 'tests_management', 'patients_management', 'reports_statistics', 'settings_backup'];
        
        sectionTitles.forEach((title, index) => {
            if (titleKeys[index]) {
                title.textContent = languageManager.getTranslation(titleKeys[index]);
            }
        });

        // تحديث الوصف
        const sectionDescs = document.querySelectorAll('.section-header p');
        const descKeys = ['hospital_description', 'tests_description', 'patients_description', 'reports_description', 'settings_description'];
        
        sectionDescs.forEach((desc, index) => {
            if (descKeys[index]) {
                desc.textContent = languageManager.getTranslation(descKeys[index]);
            }
        });
    }

    // الحصول على القسم الحالي
    getCurrentSection() {
        return this.currentSection;
    }

    // التحقق من حالة التهيئة
    isReady() {
        return this.isInitialized;
    }

    // إعادة تشغيل التطبيق
    async restart() {
        try {
            Utils.showLoading('جاري إعادة تشغيل النظام...');
            
            this.isInitialized = false;
            await this.init();
            
        } catch (error) {
            console.error('خطأ في إعادة تشغيل التطبيق:', error);
            Utils.showToast('خطأ في إعادة تشغيل النظام', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
}

// بدء التطبيق عند تحميل الصفحة
let labApp;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // إنشاء مثيل التطبيق وتشغيله
        labApp = new LabApp();
        
        // إضافة معالج تغيير اللغة
        document.addEventListener('languageChanged', () => {
            if (labApp.isReady()) {
                labApp.updateLanguageInterface();
            }
        });

        // إضافة معالج خطأ عام
        window.addEventListener('error', (event) => {
            console.error('خطأ غير معالج:', event.error);
            Utils.showToast('حدث خطأ غير متوقع', 'error');
        });

        // إضافة معالج الخطأ في Promise
        window.addEventListener('unhandledrejection', (event) => {
            console.error('خطأ Promise غير معالج:', event.reason);
            Utils.showToast('حدث خطأ غير متوقع', 'error');
            event.preventDefault();
        });

    } catch (error) {
        console.error('خطأ في بدء التطبيق:', error);
        
        // عرض رسالة خطأ أساسية
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
                <h1 style="color: #ef4444;">خطأ في تحميل النظام</h1>
                <p>يرجى إعادة تحميل الصفحة أو التواصل مع الدعم الفني</p>
                <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    إعادة تحميل
                </button>
            </div>
        `;
    }
});

// تصدير التطبيق للاستخدام في وحدة التحكم
if (typeof window !== 'undefined') {
    window.LabApp = LabApp;
}