// نظام إدارة المعمل الطبي - نظام اللغات المتعددة

class LanguageManager {
    constructor() {
        this.currentLanguage = 'ar';
        this.translations = {};
        this.loadLanguageData();
    }

    // تحميل بيانات اللغات
    async loadLanguageData() {
        try {
            // تحميل الترجمات من ملفات منفصلة
            const languages = ['ar', 'en', 'fr'];
            
            for (const lang of languages) {
                try {
                    const response = await fetch(`assets/lang/${lang}.json`);
                    if (response.ok) {
                        this.translations[lang] = await response.json();
                    }
                } catch (error) {
                    console.warn(`تعذر تحميل ملف اللغة: ${lang}`);
                    // استخدام الترجمات الافتراضية المضمنة
                    this.translations[lang] = this.getDefaultTranslations(lang);
                }
            }

            // تطبيق اللغة المحفوظة
            const savedLanguage = localStorage.getItem('labLanguage') || 'ar';
            this.setLanguage(savedLanguage);
        } catch (error) {
            console.error('خطأ في تحميل بيانات اللغات:', error);
            this.initializeDefaultTranslations();
        }
    }

    // الترجمات الافتراضية المضمنة
    getDefaultTranslations(lang) {
        const translations = {
            ar: {
                // العناوين الرئيسية
                "app_title": "نظام إدارة المعمل الطبي",
                "hospital_section": "بيانات المستشفى",
                "tests_section": "الفحوصات الطبية",
                "patients_section": "نتائج المرضى",
                "reports_section": "التقارير",
                "settings_section": "الإعدادات",

                // بيانات المستشفى
                "hospital_name": "اسم المستشفى",
                "hospital_phone": "رقم الهاتف",
                "hospital_email": "البريد الإلكتروني",
                "hospital_address": "العنوان",
                "hospital_department": "اسم الإدارة/القسم",
                "hospital_location": "رابط الموقع/الخريطة",
                "hospital_license": "رقم الترخيص",

                // الفحوصات
                "test_name": "اسم الفحص",
                "test_price": "السعر",
                "test_description": "الوصف",
                "add_test": "إضافة فحص",
                "edit_test": "تعديل فحص",
                "delete_test": "حذف فحص",
                "total_tests": "إجمالي الفحوصات",
                "average_price": "متوسط السعر",

                // المرضى
                "patient_name": "اسم المريض",
                "patient_age": "العمر",
                "patient_gender": "الجنس",
                "patient_id": "رقم التعريف",
                "male": "ذكر",
                "female": "أنثى",
                "test_result": "نتيجة الفحص",
                "normal_range": "المعدل الطبيعي",

                // التقارير
                "patient_report": "تقرير نتائج مريض",
                "financial_report": "تقرير مالي",
                "tests_report": "تقرير الفحوصات",
                "summary_report": "تقرير إجمالي",
                "today": "اليوم",
                "this_week": "هذا الأسبوع",
                "this_month": "هذا الشهر",
                "this_year": "هذا العام",
                "custom_period": "فترة مخصصة",

                // الأزرار والإجراءات
                "save": "حفظ",
                "edit": "تعديل",
                "delete": "حذف",
                "cancel": "إلغاء",
                "confirm": "تأكيد",
                "print": "طباعة",
                "export": "تصدير",
                "import": "استيراد",
                "search": "البحث",
                "reset": "إعادة تعيين",

                // الرسائل
                "success_save": "تم الحفظ بنجاح",
                "success_update": "تم التحديث بنجاح",
                "success_delete": "تم الحذف بنجاح",
                "error_save": "خطأ في الحفظ",
                "error_update": "خطأ في التحديث",
                "error_delete": "خطأ في الحذف",
                "confirm_delete": "هل أنت متأكد من الحذف؟",
                "no_data": "لا توجد بيانات",
                "loading": "جاري المعالجة...",
                "required_field": "هذا الحقل مطلوب",
                "duplicate_name": "الاسم موجود مسبقاً",

                // العملة والوحدات
                "currency": "ريال",
                "item": "عنصر",
                "items": "عناصر",
                "patient": "مريض",
                "patients": "مرضى",
                "test": "فحص",
                "tests": "فحوصات"
            },

            en: {
                // Main titles
                "app_title": "Lab Management System",
                "hospital_section": "Hospital Data",
                "tests_section": "Medical Tests",
                "patients_section": "Patient Results",
                "reports_section": "Reports",
                "settings_section": "Settings",

                // Hospital data
                "hospital_name": "Hospital Name",
                "hospital_phone": "Phone Number",
                "hospital_email": "Email",
                "hospital_address": "Address",
                "hospital_department": "Department Name",
                "hospital_location": "Location/Map Link",
                "hospital_license": "License Number",

                // Tests
                "test_name": "Test Name",
                "test_price": "Price",
                "test_description": "Description",
                "add_test": "Add Test",
                "edit_test": "Edit Test",
                "delete_test": "Delete Test",
                "total_tests": "Total Tests",
                "average_price": "Average Price",

                // Patients
                "patient_name": "Patient Name",
                "patient_age": "Age",
                "patient_gender": "Gender",
                "patient_id": "ID Number",
                "male": "Male",
                "female": "Female",
                "test_result": "Test Result",
                "normal_range": "Normal Range",

                // Reports
                "patient_report": "Patient Results Report",
                "financial_report": "Financial Report",
                "tests_report": "Tests Report",
                "summary_report": "Summary Report",
                "today": "Today",
                "this_week": "This Week",
                "this_month": "This Month",
                "this_year": "This Year",
                "custom_period": "Custom Period",

                // Buttons and actions
                "save": "Save",
                "edit": "Edit",
                "delete": "Delete",
                "cancel": "Cancel",
                "confirm": "Confirm",
                "print": "Print",
                "export": "Export",
                "import": "Import",
                "search": "Search",
                "reset": "Reset",

                // Messages
                "success_save": "Saved successfully",
                "success_update": "Updated successfully",
                "success_delete": "Deleted successfully",
                "error_save": "Save error",
                "error_update": "Update error",
                "error_delete": "Delete error",
                "confirm_delete": "Are you sure you want to delete?",
                "no_data": "No data available",
                "loading": "Loading...",
                "required_field": "This field is required",
                "duplicate_name": "Name already exists",

                // Currency and units
                "currency": "SAR",
                "item": "item",
                "items": "items",
                "patient": "patient",
                "patients": "patients",
                "test": "test",
                "tests": "tests"
            },

            fr: {
                // Titres principaux
                "app_title": "Système de Gestion de Laboratoire",
                "hospital_section": "Données Hospitalières",
                "tests_section": "Tests Médicaux",
                "patients_section": "Résultats des Patients",
                "reports_section": "Rapports",
                "settings_section": "Paramètres",

                // Données hospitalières
                "hospital_name": "Nom de l'Hôpital",
                "hospital_phone": "Numéro de Téléphone",
                "hospital_email": "Email",
                "hospital_address": "Adresse",
                "hospital_department": "Nom du Département",
                "hospital_location": "Lien Localisation/Carte",
                "hospital_license": "Numéro de Licence",

                // Tests
                "test_name": "Nom du Test",
                "test_price": "Prix",
                "test_description": "Description",
                "add_test": "Ajouter Test",
                "edit_test": "Modifier Test",
                "delete_test": "Supprimer Test",
                "total_tests": "Total des Tests",
                "average_price": "Prix Moyen",

                // Patients
                "patient_name": "Nom du Patient",
                "patient_age": "Âge",
                "patient_gender": "Sexe",
                "patient_id": "Numéro ID",
                "male": "Masculin",
                "female": "Féminin",
                "test_result": "Résultat du Test",
                "normal_range": "Plage Normale",

                // Rapports
                "patient_report": "Rapport Résultats Patient",
                "financial_report": "Rapport Financier",
                "tests_report": "Rapport des Tests",
                "summary_report": "Rapport Sommaire",
                "today": "Aujourd'hui",
                "this_week": "Cette Semaine",
                "this_month": "Ce Mois",
                "this_year": "Cette Année",
                "custom_period": "Période Personnalisée",

                // Boutons et actions
                "save": "Enregistrer",
                "edit": "Modifier",
                "delete": "Supprimer",
                "cancel": "Annuler",
                "confirm": "Confirmer",
                "print": "Imprimer",
                "export": "Exporter",
                "import": "Importer",
                "search": "Rechercher",
                "reset": "Réinitialiser",

                // Messages
                "success_save": "Enregistré avec succès",
                "success_update": "Mis à jour avec succès",
                "success_delete": "Supprimé avec succès",
                "error_save": "Erreur d'enregistrement",
                "error_update": "Erreur de mise à jour",
                "error_delete": "Erreur de suppression",
                "confirm_delete": "Êtes-vous sûr de vouloir supprimer?",
                "no_data": "Aucune donnée disponible",
                "loading": "Chargement...",
                "required_field": "Ce champ est obligatoire",
                "duplicate_name": "Le nom existe déjà",

                // Devise et unités
                "currency": "SAR",
                "item": "élément",
                "items": "éléments",
                "patient": "patient",
                "patients": "patients",
                "test": "test",
                "tests": "tests"
            }
        };

        return translations[lang] || translations.ar;
    }

    // تهيئة الترجمات الافتراضية
    initializeDefaultTranslations() {
        this.translations = {
            ar: this.getDefaultTranslations('ar'),
            en: this.getDefaultTranslations('en'),
            fr: this.getDefaultTranslations('fr')
        };
    }

    // تغيير اللغة
    setLanguage(language) {
        if (!this.translations[language]) {
            console.warn(`اللغة غير مدعومة: ${language}`);
            return;
        }

        this.currentLanguage = language;
        localStorage.setItem('labLanguage', language);
        
        // تحديث اتجاه الصفحة
        this.updateDocumentDirection(language);
        
        // تحديث النصوص في الصفحة
        this.updatePageTexts();
        
        // تحديث أزرار اللغة
        this.updateLanguageButtons();
    }

    // تحديث اتجاه الصفحة
    updateDocumentDirection(language) {
        const html = document.documentElement;
        const body = document.body;
        
        if (language === 'ar') {
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
            body.setAttribute('dir', 'rtl');
            body.style.textAlign = 'right';
        } else {
            html.setAttribute('lang', language);
            html.setAttribute('dir', 'ltr');
            body.setAttribute('dir', 'ltr');
            body.style.textAlign = 'left';
        }
    }

    // تحديث النصوص في الصفحة
    updatePageTexts() {
        // تحديث النصوص باستخدام البيانات المخصصة
        const elements = document.querySelectorAll('[data-lang]');
        elements.forEach(element => {
            const key = element.getAttribute('data-lang');
            const translation = this.getTranslation(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // تحديث عنوان الصفحة
        document.title = this.getTranslation('app_title');
    }

    // تحديث أزرار اللغة
    updateLanguageButtons() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            const lang = button.getAttribute('data-lang');
            button.classList.toggle('active', lang === this.currentLanguage);
        });
    }

    // الحصول على ترجمة
    getTranslation(key) {
        const translations = this.translations[this.currentLanguage];
        return translations ? translations[key] || key : key;
    }

    // ترجمة نص مع متغيرات
    translate(key, variables = {}) {
        let translation = this.getTranslation(key);
        
        // استبدال المتغيرات في النص
        Object.keys(variables).forEach(variable => {
            translation = translation.replace(`{{${variable}}}`, variables[variable]);
        });
        
        return translation;
    }

    // الحصول على اللغة الحالية
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // الحصول على جميع اللغات المتاحة
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // تحديث ترجمة عنصر محدد
    updateElementTranslation(elementId, key) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.getTranslation(key);
        }
    }

    // إضافة مستمع حدث لتغيير اللغة
    initializeLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const language = button.getAttribute('data-lang');
                this.setLanguage(language);
            });
        });
    }

    // تحميل ملف ترجمة إضافي
    async loadAdditionalTranslations(language, additionalTranslations) {
        if (this.translations[language]) {
            this.translations[language] = {
                ...this.translations[language],
                ...additionalTranslations
            };
        } else {
            this.translations[language] = additionalTranslations;
        }
    }

    // تصدير الترجمات الحالية
    exportTranslations(language = null) {
        const lang = language || this.currentLanguage;
        return this.translations[lang] || {};
    }

    // التحقق من وجود ترجمة
    hasTranslation(key) {
        const translations = this.translations[this.currentLanguage];
        return translations && translations.hasOwnProperty(key);
    }

    // تنسيق النص حسب اللغة
    formatText(text, type = 'default') {
        switch (type) {
            case 'currency':
                return `${text} ${this.getTranslation('currency')}`;
            case 'count':
                const count = parseInt(text);
                if (count === 1) {
                    return `${count} ${this.getTranslation('item')}`;
                } else {
                    return `${count} ${this.getTranslation('items')}`;
                }
            case 'patients':
                const patientCount = parseInt(text);
                if (patientCount === 1) {
                    return `${patientCount} ${this.getTranslation('patient')}`;
                } else {
                    return `${patientCount} ${this.getTranslation('patients')}`;
                }
            case 'tests':
                const testCount = parseInt(text);
                if (testCount === 1) {
                    return `${testCount} ${this.getTranslation('test')}`;
                } else {
                    return `${testCount} ${this.getTranslation('tests')}`;
                }
            default:
                return text;
        }
    }
}

// إنشاء مثيل وحيد من مدير اللغات
const languageManager = new LanguageManager();