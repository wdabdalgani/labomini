// نظام إدارة المعمل الطبي - إدارة بيانات المستشفى

class HospitalManager {
    constructor() {
        this.form = null;
        this.displayArea = null;
        this.isEditing = false;
        this.init();
    }

    // تهيئة مدير المستشفى
    init() {
        this.form = document.getElementById('hospitalForm');
        this.displayArea = document.getElementById('hospitalDataDisplay');
        
        if (this.form) {
            this.setupEventListeners();
            this.loadHospitalData();
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // حفظ بيانات المستشفى
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveHospitalData();
        });

        // تعديل بيانات المستشفى
        const editBtn = document.getElementById('editHospitalBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.enableEditing();
            });
        }
    }

    // تحميل بيانات المستشفى الموجودة
    async loadHospitalData() {
        try {
            Utils.showLoading('جاري تحميل بيانات المستشفى...');
            
            const hospitalData = await labDB.getHospitalData();
            
            if (hospitalData) {
                this.displayHospitalData(hospitalData);
                this.hideForm();
            } else {
                this.showForm();
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستشفى:', error);
            Utils.showToast('خطأ في تحميل بيانات المستشفى', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // حفظ بيانات المستشفى
    async saveHospitalData() {
        try {
            // التحقق من صحة البيانات
            const validation = Utils.validateForm(this.form);
            if (!validation.isValid) {
                Utils.showToast(validation.errors[0], 'error');
                return;
            }

            Utils.showLoading('جاري حفظ بيانات المستشفى...');

            // جمع البيانات من النموذج
            const formData = new FormData(this.form);
            const hospitalData = {
                name: formData.get('name').trim(),
                phone: formData.get('phone').trim(),
                email: formData.get('email').trim(),
                address: formData.get('address').trim(),
                department: formData.get('department').trim(),
                location: formData.get('location').trim(),
                license: formData.get('license').trim()
            };

            // حفظ البيانات في قاعدة البيانات
            await labDB.saveHospitalData(hospitalData);

            // عرض البيانات المحفوظة
            const savedData = await labDB.getHospitalData();
            this.displayHospitalData(savedData);
            this.hideForm();

            // إظهار رسالة النجاح
            const message = this.isEditing ? 
                languageManager.getTranslation('success_update') : 
                languageManager.getTranslation('success_save');
            Utils.showToast(message, 'success');

            this.isEditing = false;
        } catch (error) {
            console.error('خطأ في حفظ بيانات المستشفى:', error);
            Utils.showToast(languageManager.getTranslation('error_save'), 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // عرض بيانات المستشفى
    displayHospitalData(data) {
        if (!this.displayArea) return;

        const infoCard = document.getElementById('hospitalInfo');
        if (!infoCard) return;

        infoCard.innerHTML = `
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_name')}</div>
                <div class="info-value">${data.name || 'غير محدد'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_phone')}</div>
                <div class="info-value">${data.phone || 'غير محدد'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_email')}</div>
                <div class="info-value">${data.email || 'غير محدد'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_address')}</div>
                <div class="info-value">${data.address || 'غير محدد'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_department')}</div>
                <div class="info-value">${data.department || 'غير محدد'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_location')}</div>
                <div class="info-value">
                    ${data.location ? 
                        `<a href="${data.location}" target="_blank">${data.location}</a>` : 
                        'غير محدد'
                    }
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">${languageManager.getTranslation('hospital_license')}</div>
                <div class="info-value">${data.license || 'غير محدد'}</div>
            </div>
            ${data.updatedAt ? `
                <div class="info-item">
                    <div class="info-label">${languageManager.getTranslation('last_update')}</div>
                    <div class="info-value">${Utils.formatDate(data.updatedAt)}</div>
                </div>
            ` : ''}
        `;

        this.displayArea.classList.remove('hidden');
    }

    // تمكين التعديل
    enableEditing() {
        this.isEditing = true;
        
        // تعبئة النموذج بالبيانات الحالية
        this.populateFormWithCurrentData();
        
        // إظهار النموذج وإخفاء العرض
        this.showForm();
        this.hideDisplay();

        // تحديث نص الزر
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = `<span>💾</span> ${languageManager.getTranslation('hospital_edit')}`;
        }

        // التمرير إلى النموذج
        this.form.scrollIntoView({ behavior: 'smooth' });
    }

    // تعبئة النموذج بالبيانات الحالية
    async populateFormWithCurrentData() {
        try {
            const data = await labDB.getHospitalData();
            if (!data) return;

            // تعبئة الحقول
            const fields = ['name', 'phone', 'email', 'address', 'department', 'location', 'license'];
            fields.forEach(field => {
                const input = this.form.querySelector(`[name="${field}"]`);
                if (input && data[field]) {
                    input.value = data[field];
                }
            });
        } catch (error) {
            console.error('خطأ في تعبئة النموذج:', error);
        }
    }

    // إظهار النموذج
    showForm() {
        if (this.form) {
            this.form.style.display = 'block';
        }
    }

    // إخفاء النموذج
    hideForm() {
        if (this.form) {
            this.form.style.display = 'none';
        }
    }

    // إظهار منطقة العرض
    showDisplay() {
        if (this.displayArea) {
            this.displayArea.classList.remove('hidden');
        }
    }

    // إخفاء منطقة العرض
    hideDisplay() {
        if (this.displayArea) {
            this.displayArea.classList.add('hidden');
        }
    }

    // إعادة تعيين النموذج
    resetForm() {
        if (this.form) {
            Utils.clearForm(this.form);
            
            // إعادة تعيين نص الزر
            const submitBtn = this.form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = `<span>💾</span> ${languageManager.getTranslation('hospital_save')}`;
            }
            
            this.isEditing = false;
        }
    }

    // التحقق من وجود بيانات المستشفى
    async hasHospitalData() {
        try {
            const data = await labDB.getHospitalData();
            return !!data;
        } catch (error) {
            console.error('خطأ في التحقق من بيانات المستشفى:', error);
            return false;
        }
    }

    // الحصول على بيانات المستشفى للتقارير
    async getHospitalDataForReports() {
        try {
            const data = await labDB.getHospitalData();
            return data || {
                name: 'غير محدد',
                phone: 'غير محدد',
                address: 'غير محدد',
                license: 'غير محدد'
            };
        } catch (error) {
            console.error('خطأ في جلب بيانات المستشفى:', error);
            return {
                name: 'غير محدد',
                phone: 'غير محدد',
                address: 'غير محدد',
                license: 'غير محدد'
            };
        }
    }

    // تحديث الإعدادات حسب اللغة
    updateLanguageSettings() {
        // تحديث النصوص في النموذج
        const elements = this.form.querySelectorAll('[data-lang]');
        elements.forEach(element => {
            const key = element.getAttribute('data-lang');
            const translation = languageManager.getTranslation(key);
            
            if (element.tagName === 'LABEL') {
                // الاحتفاظ بعلامة * للحقول المطلوبة
                const required = element.querySelector('.required');
                const requiredText = required ? ' <span class="required">*</span>' : '';
                element.innerHTML = translation + requiredText;
            } else if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // تحديث عنوان القسم
        const sectionTitle = document.querySelector('#hospital-section .section-header h2');
        if (sectionTitle) {
            sectionTitle.textContent = languageManager.getTranslation('hospital_management');
        }

        const sectionDesc = document.querySelector('#hospital-section .section-header p');
        if (sectionDesc) {
            sectionDesc.textContent = languageManager.getTranslation('hospital_description');
        }
    }

    // تصدير بيانات المستشفى
    async exportHospitalData() {
        try {
            const data = await labDB.getHospitalData();
            if (data) {
                return {
                    hospital: data,
                    exportDate: new Date().toISOString()
                };
            }
            return null;
        } catch (error) {
            console.error('خطأ في تصدير بيانات المستشفى:', error);
            return null;
        }
    }

    // استيراد بيانات المستشفى
    async importHospitalData(data) {
        try {
            if (data && data.hospital) {
                await labDB.saveHospitalData(data.hospital);
                await this.loadHospitalData();
                Utils.showToast(languageManager.getTranslation('success_import'), 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('خطأ في استيراد بيانات المستشفى:', error);
            Utils.showToast(languageManager.getTranslation('error_import'), 'error');
            return false;
        }
    }

    // حذف بيانات المستشفى
    async clearHospitalData() {
        try {
            const hasData = await this.hasHospitalData();
            if (!hasData) {
                Utils.showToast('لا توجد بيانات لحذفها', 'info');
                return;
            }

            Utils.showConfirm(
                'تأكيد الحذف',
                'هل أنت متأكد من حذف بيانات المستشفى؟ هذا الإجراء لا يمكن التراجع عنه.',
                async () => {
                    try {
                        Utils.showLoading('جاري حذف بيانات المستشفى...');
                        
                        // حذف البيانات من قاعدة البيانات (سيتم تنفيذه في clearAllData)
                        
                        // إعادة تعيين واجهة المستخدم
                        this.hideDisplay();
                        this.showForm();
                        this.resetForm();
                        
                        Utils.showToast(languageManager.getTranslation('success_delete'), 'success');
                    } catch (error) {
                        console.error('خطأ في حذف بيانات المستشفى:', error);
                        Utils.showToast(languageManager.getTranslation('error_delete'), 'error');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            );
        } catch (error) {
            console.error('خطأ في حذف بيانات المستشفى:', error);
            Utils.showToast(languageManager.getTranslation('error_delete'), 'error');
        }
    }
}

// إنشاء مثيل وحيد من مدير المستشفى
const hospitalManager = new HospitalManager();