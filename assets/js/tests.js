// نظام إدارة المعمل الطبي - إدارة الفحوصات الطبية

class TestsManager {
    constructor() {
        this.form = null;
        this.table = null;
        this.searchInput = null;
        this.tests = [];
        this.editingId = null;
        this.init();
    }

    // تهيئة مدير الفحوصات
    init() {
        this.form = document.getElementById('testForm');
        this.table = document.getElementById('testsTable');
        this.searchInput = document.getElementById('testSearchInput');
        
        if (this.form) {
            this.setupEventListeners();
            this.loadTests();
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // حفظ الفحص
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTest();
        });

        // البحث في الفحوصات
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterTests(e.target.value);
            });
        }

        // إلغاء التعديل
        const cancelEditBtn = document.getElementById('cancelTestEdit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.cancelEdit();
            });
        }

        // إعادة تعيين النموذج
        const resetBtn = this.form.querySelector('button[type="button"]:not(#cancelTestEdit)');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
    }

    // تحميل جميع الفحوصات
    async loadTests() {
        try {
            Utils.showLoading('جاري تحميل الفحوصات...');
            
            this.tests = await labDB.getAllTests();
            this.displayTests(this.tests);
            this.updateStatistics();
        } catch (error) {
            console.error('خطأ في تحميل الفحوصات:', error);
            Utils.showToast('خطأ في تحميل الفحوصات', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // حفظ الفحص
    async saveTest() {
        try {
            // التحقق من صحة البيانات
            const validation = Utils.validateForm(this.form);
            if (!validation.isValid) {
                Utils.showToast(validation.errors[0], 'error');
                return;
            }

            Utils.showLoading('جاري حفظ الفحص...');

            // جمع البيانات من النموذج
            const formData = new FormData(this.form);
            const testData = {
                name: formData.get('name').trim(),
                price: parseFloat(formData.get('price')),
                desc: formData.get('desc').trim()
            };

            let result;
            if (this.editingId) {
                // تعديل فحص موجود
                result = await labDB.updateTest(this.editingId, testData);
                Utils.showToast(languageManager.getTranslation('success_update'), 'success');
                this.cancelEdit();
            } else {
                // إضافة فحص جديد
                result = await labDB.addTest(testData);
                Utils.showToast(languageManager.getTranslation('success_save'), 'success');
                this.resetForm();
            }

            // تحديث القائمة
            await this.loadTests();

        } catch (error) {
            console.error('خطأ في حفظ الفحص:', error);
            
            if (error.message.includes('موجود مسبقاً')) {
                Utils.showToast(languageManager.getTranslation('test_exists'), 'error');
            } else {
                const message = this.editingId ? 
                    languageManager.getTranslation('error_update') : 
                    languageManager.getTranslation('error_save');
                Utils.showToast(message, 'error');
            }
        } finally {
            Utils.hideLoading();
        }
    }

    // عرض الفحوصات في الجدول
    displayTests(tests) {
        if (!this.table) return;

        const tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';

        if (tests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        ${languageManager.getTranslation('no_tests_available')}
                    </td>
                </tr>
            `;
            return;
        }

        tests.forEach(test => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${test.name}</td>
                <td>${Utils.formatCurrency(test.price)}</td>
                <td>${test.desc || 'لا يوجد وصف'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="testsManager.editTest(${test.id})">
                            <span>✏️</span> ${languageManager.getTranslation('edit')}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="testsManager.deleteTest(${test.id})">
                            <span>🗑️</span> ${languageManager.getTranslation('delete')}
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // تصفية الفحوصات
    filterTests(searchTerm) {
        if (!searchTerm.trim()) {
            this.displayTests(this.tests);
            return;
        }

        const filteredTests = this.tests.filter(test => 
            test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (test.desc && test.desc.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.displayTests(filteredTests);
    }

    // تعديل فحص
    async editTest(id) {
        try {
            const test = this.tests.find(t => t.id === id);
            if (!test) {
                Utils.showToast('الفحص غير موجود', 'error');
                return;
            }

            // تعبئة النموذج بالبيانات
            document.getElementById('testName').value = test.name;
            document.getElementById('testPrice').value = test.price;
            document.getElementById('testDesc').value = test.desc || '';

            // تحديث حالة التعديل
            this.editingId = id;
            
            // تحديث واجهة المستخدم
            const submitBtn = document.getElementById('testSubmitText');
            if (submitBtn) {
                submitBtn.textContent = languageManager.getTranslation('edit_test');
            }

            const cancelBtn = document.getElementById('cancelTestEdit');
            if (cancelBtn) {
                cancelBtn.classList.remove('hidden');
            }

            // التمرير إلى النموذج
            this.form.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('خطأ في تعديل الفحص:', error);
            Utils.showToast('خطأ في تعديل الفحص', 'error');
        }
    }

    // حذف فحص
    async deleteTest(id) {
        try {
            const test = this.tests.find(t => t.id === id);
            if (!test) {
                Utils.showToast('الفحص غير موجود', 'error');
                return;
            }

            Utils.showConfirm(
                'تأكيد الحذف',
                `هل أنت متأكد من حذف الفحص "${test.name}"؟`,
                async () => {
                    try {
                        Utils.showLoading('جاري حذف الفحص...');
                        
                        await labDB.deleteTest(id);
                        Utils.showToast(languageManager.getTranslation('success_delete'), 'success');
                        
                        await this.loadTests();
                    } catch (error) {
                        console.error('خطأ في حذف الفحص:', error);
                        Utils.showToast(languageManager.getTranslation('error_delete'), 'error');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            );

        } catch (error) {
            console.error('خطأ في حذف الفحص:', error);
            Utils.showToast('خطأ في حذف الفحص', 'error');
        }
    }

    // إلغاء التعديل
    cancelEdit() {
        this.editingId = null;
        this.resetForm();
        
        const cancelBtn = document.getElementById('cancelTestEdit');
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
        }
    }

    // إعادة تعيين النموذج
    resetForm() {
        if (this.form) {
            Utils.clearForm(this.form);
            
            const submitBtn = document.getElementById('testSubmitText');
            if (submitBtn) {
                submitBtn.textContent = languageManager.getTranslation('add_test');
            }
            
            this.editingId = null;
        }
    }

    // تحديث الإحصائيات
    updateStatistics() {
        const totalTests = this.tests.length;
        const avgPrice = totalTests > 0 ? 
            this.tests.reduce((sum, test) => sum + test.price, 0) / totalTests : 0;

        Utils.updateCounter('totalTests', totalTests, languageManager.getTranslation('tests'));
        
        const avgPriceElement = document.getElementById('avgPrice');
        if (avgPriceElement) {
            avgPriceElement.textContent = Utils.formatCurrency(avgPrice);
        }
    }

    // الحصول على جميع الفحوصات للاستخدام في أقسام أخرى
    async getAllTests() {
        return this.tests.length > 0 ? this.tests : await labDB.getAllTests();
    }

    // البحث في الفحوصات
    async searchTests(searchTerm) {
        try {
            if (!searchTerm.trim()) {
                return this.tests;
            }

            return this.tests.filter(test => 
                test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (test.desc && test.desc.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        } catch (error) {
            console.error('خطأ في البحث:', error);
            return [];
        }
    }

    // الحصول على فحص بواسطة المعرف
    getTestById(id) {
        return this.tests.find(test => test.id === id);
    }

    // الحصول على فحص بواسطة الاسم
    getTestByName(name) {
        return this.tests.find(test => test.name === name);
    }

    // تحديث الإعدادات حسب اللغة
    updateLanguageSettings() {
        // تحديث رؤوس الجدول
        const headers = this.table.querySelectorAll('th');
        const headerKeys = ['test_name', 'test_price', 'test_description', 'actions'];
        
        headers.forEach((header, index) => {
            if (headerKeys[index]) {
                header.textContent = languageManager.getTranslation(headerKeys[index]);
            }
        });

        // تحديث placeholder للبحث
        if (this.searchInput) {
            this.searchInput.placeholder = languageManager.getTranslation('search_tests');
        }

        // تحديث النصوص في النموذج
        const formElements = this.form.querySelectorAll('[data-lang]');
        formElements.forEach(element => {
            const key = element.getAttribute('data-lang');
            const translation = languageManager.getTranslation(key);
            
            if (element.tagName === 'LABEL') {
                const required = element.querySelector('.required');
                const requiredText = required ? ' <span class="required">*</span>' : '';
                element.innerHTML = translation + requiredText;
            } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // إعادة عرض الفحوصات لتحديث النصوص
        this.displayTests(this.tests);
    }

    // تصدير الفحوصات
    async exportTests() {
        try {
            const tests = await this.getAllTests();
            return {
                tests: tests,
                exportDate: new Date().toISOString(),
                totalTests: tests.length,
                averagePrice: tests.length > 0 ? 
                    tests.reduce((sum, test) => sum + test.price, 0) / tests.length : 0
            };
        } catch (error) {
            console.error('خطأ في تصدير الفحوصات:', error);
            return null;
        }
    }

    // استيراد الفحوصات
    async importTests(data) {
        try {
            if (!data || !data.tests || !Array.isArray(data.tests)) {
                Utils.showToast('بيانات الفحوصات غير صحيحة', 'error');
                return false;
            }

            Utils.showLoading('جاري استيراد الفحوصات...');

            let importedCount = 0;
            let errorCount = 0;

            for (const test of data.tests) {
                try {
                    // التحقق من البيانات المطلوبة
                    if (!test.name || test.price === undefined) {
                        errorCount++;
                        continue;
                    }

                    const testData = {
                        name: test.name,
                        price: parseFloat(test.price),
                        desc: test.desc || ''
                    };

                    await labDB.addTest(testData);
                    importedCount++;
                } catch (error) {
                    errorCount++;
                    console.warn(`خطأ في استيراد الفحص ${test.name}:`, error);
                }
            }

            // تحديث القائمة
            await this.loadTests();

            // إظهار رسالة النتيجة
            if (importedCount > 0) {
                Utils.showToast(`تم استيراد ${importedCount} فحص بنجاح`, 'success');
            }
            
            if (errorCount > 0) {
                Utils.showToast(`فشل في استيراد ${errorCount} فحص`, 'warning');
            }

            return importedCount > 0;
        } catch (error) {
            console.error('خطأ في استيراد الفحوصات:', error);
            Utils.showToast(languageManager.getTranslation('error_import'), 'error');
            return false;
        } finally {
            Utils.hideLoading();
        }
    }

    // حذف جميع الفحوصات
    async clearAllTests() {
        try {
            if (this.tests.length === 0) {
                Utils.showToast('لا توجد فحوصات لحذفها', 'info');
                return;
            }

            Utils.showConfirm(
                'تأكيد الحذف',
                `هل أنت متأكد من حذف جميع الفحوصات (${this.tests.length} فحص)؟ هذا الإجراء لا يمكن التراجع عنه.`,
                async () => {
                    try {
                        Utils.showLoading('جاري حذف جميع الفحوصات...');
                        
                        // حذف كل فحص على حدة
                        for (const test of this.tests) {
                            await labDB.deleteTest(test.id);
                        }
                        
                        // تحديث القائمة
                        await this.loadTests();
                        
                        Utils.showToast('تم حذف جميع الفحوصات بنجاح', 'success');
                    } catch (error) {
                        console.error('خطأ في حذف الفحوصات:', error);
                        Utils.showToast('خطأ في حذف الفحوصات', 'error');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            );
        } catch (error) {
            console.error('خطأ في حذف الفحوصات:', error);
            Utils.showToast('خطأ في حذف الفحوصات', 'error');
        }
    }
}

// إنشاء مثيل وحيد من مدير الفحوصات
const testsManager = new TestsManager();