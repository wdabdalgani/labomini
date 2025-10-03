// نظام إدارة المعمل الطبي - إدارة نتائج المرضى

class PatientsManager {
    constructor() {
        this.form = null;
        this.table = null;
        this.searchInput = null;
        this.testsSelection = null;
        this.testsResults = null;
        this.patients = [];
        this.availableTests = [];
        this.selectedTests = [];
        this.editingId = null;
        this.init();
    }

    // تهيئة مدير المرضى
    init() {
        this.form = document.getElementById('patientForm');
        this.table = document.getElementById('patientsTable');
        this.searchInput = document.getElementById('patientSearchInput');
        this.testsSelection = document.getElementById('testsSelection');
        this.testsResults = document.getElementById('testsResults');
        
        if (this.form) {
            this.setupEventListeners();
            this.loadPatientsData();
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // حفظ نتائج المريض
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePatientResult();
        });

        // البحث في المرضى
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterPatients(e.target.value);
            });
        }

        // إعادة تعيين النموذج
        const resetBtn = document.getElementById('resetPatientForm');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetForm();
            });
        }
    }

    // تحميل بيانات المرضى والفحوصات
    async loadPatientsData() {
        try {
            Utils.showLoading('جاري تحميل البيانات...');
            
            // تحميل قائمة المرضى والفحوصات المتاحة
            const [patients, tests] = await Promise.all([
                labDB.getAllPatientResults(),
                labDB.getAllTests()
            ]);

            this.patients = patients;
            this.availableTests = tests;
            
            this.displayPatients(this.patients);
            this.displayTestsSelection();
            
        } catch (error) {
            console.error('خطأ في تحميل بيانات المرضى:', error);
            Utils.showToast('خطأ في تحميل البيانات', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // عرض اختيار الفحوصات
    displayTestsSelection() {
        if (!this.testsSelection || this.availableTests.length === 0) {
            this.testsSelection.innerHTML = `
                <div class="alert alert-warning">
                    <p>لا توجد فحوصات متاحة. يرجى إضافة الفحوصات أولاً من قسم "الفحوصات الطبية".</p>
                </div>
            `;
            return;
        }

        this.testsSelection.innerHTML = '';
        
        this.availableTests.forEach(test => {
            const testCheckbox = document.createElement('div');
            testCheckbox.className = 'test-checkbox';
            testCheckbox.innerHTML = `
                <input type="checkbox" id="test_${test.id}" value="${test.id}" 
                       onchange="patientsManager.onTestSelectionChange(${test.id}, this.checked)">
                <div class="test-info">
                    <div class="test-name">${test.name}</div>
                    <div class="test-price">${Utils.formatCurrency(test.price)}</div>
                </div>
            `;
            
            this.testsSelection.appendChild(testCheckbox);
        });
    }

    // تغيير اختيار الفحص
    onTestSelectionChange(testId, isSelected) {
        const test = this.availableTests.find(t => t.id === testId);
        if (!test) return;

        const checkbox = document.getElementById(`test_${testId}`);
        const testCheckbox = checkbox.parentElement;

        if (isSelected) {
            this.selectedTests.push(test);
            testCheckbox.classList.add('selected');
        } else {
            this.selectedTests = this.selectedTests.filter(t => t.id !== testId);
            testCheckbox.classList.remove('selected');
        }

        this.updateTestsResults();
    }

    // تحديث قسم نتائج الفحوصات
    updateTestsResults() {
        if (!this.testsResults) return;

        if (this.selectedTests.length === 0) {
            this.testsResults.classList.add('hidden');
            return;
        }

        this.testsResults.classList.remove('hidden');
        const resultsInputs = document.getElementById('resultsInputs');
        resultsInputs.innerHTML = '';

        this.selectedTests.forEach(test => {
            const resultGroup = document.createElement('div');
            resultGroup.className = 'result-input-group';
            resultGroup.innerHTML = `
                <div class="form-group">
                    <label><strong>${test.name}</strong></label>
                    <small class="text-muted">${Utils.formatCurrency(test.price)}</small>
                </div>
                <div class="form-group">
                    <label for="result_${test.id}">النتيجة <span class="required">*</span></label>
                    <input type="text" id="result_${test.id}" name="result_${test.id}" required>
                </div>
                <div class="form-group">
                    <label for="normal_${test.id}">المعدل الطبيعي <span class="required">*</span></label>
                    <input type="text" id="normal_${test.id}" name="normal_${test.id}" required>
                </div>
            `;
            
            resultsInputs.appendChild(resultGroup);
        });
    }

    // حفظ نتائج المريض
    async savePatientResult() {
        try {
            // التحقق من صحة البيانات الأساسية
            const validation = Utils.validateForm(this.form);
            if (!validation.isValid) {
                Utils.showToast(validation.errors[0], 'error');
                return;
            }

            // التحقق من اختيار فحوصات
            if (this.selectedTests.length === 0) {
                Utils.showToast('يرجى اختيار فحص واحد على الأقل', 'error');
                return;
            }

            // التحقق من إدخال نتائج الفحوصات
            const missingResults = this.selectedTests.some(test => {
                const result = document.getElementById(`result_${test.id}`).value.trim();
                const normal = document.getElementById(`normal_${test.id}`).value.trim();
                return !result || !normal;
            });

            if (missingResults) {
                Utils.showToast('يرجى إدخال جميع نتائج الفحوصات والمعدلات الطبيعية', 'error');
                return;
            }

            Utils.showLoading('جاري حفظ نتائج المريض...');

            // جمع البيانات
            const formData = new FormData(this.form);
            const testsResults = this.selectedTests.map(test => ({
                testId: test.id,
                testName: test.name,
                result: document.getElementById(`result_${test.id}`).value.trim(),
                normal: document.getElementById(`normal_${test.id}`).value.trim(),
                price: test.price
            }));

            const patientData = {
                patientName: formData.get('patientName').trim(),
                patientAge: parseInt(formData.get('patientAge')),
                patientGender: formData.get('patientGender'),
                patientID: formData.get('patientID').trim(),
                testsResults: testsResults
            };

            // حفظ البيانات
            if (this.editingId) {
                await labDB.updatePatientResult(this.editingId, patientData);
                Utils.showToast(languageManager.getTranslation('success_update'), 'success');
            } else {
                await labDB.addPatientResult(patientData);
                Utils.showToast(languageManager.getTranslation('success_save'), 'success');
            }

            // تحديث القائمة وإعادة تعيين النموذج
            await this.loadPatientsData();
            this.resetForm();

        } catch (error) {
            console.error('خطأ في حفظ نتائج المريض:', error);
            Utils.showToast(languageManager.getTranslation('error_save'), 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // عرض قائمة المرضى
    displayPatients(patients) {
        if (!this.table) return;

        const tbody = this.table.querySelector('tbody');
        tbody.innerHTML = '';

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        ${languageManager.getTranslation('no_patients')}
                    </td>
                </tr>
            `;
            return;
        }

        patients.forEach(patient => {
            const totalCost = patient.testsResults.reduce((sum, test) => sum + (test.price || 0), 0);
            const genderText = patient.patientGender === 'male' ? 'ذكر' : 'أنثى';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${patient.patientName}</td>
                <td>${patient.patientAge} سنة</td>
                <td>${genderText}</td>
                <td>${patient.patientID}</td>
                <td>${patient.testsResults.length}</td>
                <td>${Utils.formatCurrency(totalCost)}</td>
                <td>${Utils.formatDate(patient.date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="patientsManager.viewPatientDetails(${patient.id})">
                            <span>👁️</span> عرض
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="patientsManager.editPatient(${patient.id})">
                            <span>✏️</span> تعديل
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="patientsManager.deletePatient(${patient.id})">
                            <span>🗑️</span> حذف
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // تصفية المرضى
    filterPatients(searchTerm) {
        if (!searchTerm.trim()) {
            this.displayPatients(this.patients);
            return;
        }

        const filteredPatients = this.patients.filter(patient => 
            patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.patientID.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.displayPatients(filteredPatients);
    }

    // عرض تفاصيل المريض
    viewPatientDetails(id) {
        const patient = this.patients.find(p => p.id === id);
        if (!patient) return;

        const genderText = patient.patientGender === 'male' ? 'ذكر' : 'أنثى';
        const totalCost = patient.testsResults.reduce((sum, test) => sum + (test.price || 0), 0);

        let testsDetails = patient.testsResults.map(test => `
            <tr>
                <td>${test.testName}</td>
                <td>${test.result}</td>
                <td>${test.normal}</td>
                <td>${Utils.formatCurrency(test.price)}</td>
            </tr>
        `).join('');

        const detailsHTML = `
            <div class="patient-details">
                <h3>تفاصيل المريض</h3>
                <div class="patient-info">
                    <div class="info-grid">
                        <div><strong>الاسم:</strong> ${patient.patientName}</div>
                        <div><strong>العمر:</strong> ${patient.patientAge} سنة</div>
                        <div><strong>الجنس:</strong> ${genderText}</div>
                        <div><strong>رقم التعريف:</strong> ${patient.patientID}</div>
                        <div><strong>تاريخ الفحص:</strong> ${Utils.formatDate(patient.date)}</div>
                        <div><strong>إجمالي التكلفة:</strong> ${Utils.formatCurrency(totalCost)}</div>
                    </div>
                </div>
                <h4>نتائج الفحوصات</h4>
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>اسم الفحص</th>
                            <th>النتيجة</th>
                            <th>المعدل الطبيعي</th>
                            <th>السعر</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${testsDetails}
                    </tbody>
                </table>
            </div>
        `;

        // إنشاء مودال لعرض التفاصيل
        this.showDetailsModal(detailsHTML);
    }

    // عرض مودال التفاصيل
    showDetailsModal(content) {
        // إنشاء مودال ديناميكي
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 80%; width: 800px;">
                ${content}
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        إغلاق
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // إغلاق عند النقر خارج المودال
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // تعديل بيانات المريض
    async editPatient(id) {
        try {
            const patient = this.patients.find(p => p.id === id);
            if (!patient) {
                Utils.showToast('المريض غير موجود', 'error');
                return;
            }

            // تعبئة النموذج بالبيانات
            document.getElementById('patientName').value = patient.patientName;
            document.getElementById('patientAge').value = patient.patientAge;
            document.getElementById('patientGender').value = patient.patientGender;
            document.getElementById('patientID').value = patient.patientID;

            // إعادة تعيين اختيار الفحوصات
            this.selectedTests = [];
            const checkboxes = this.testsSelection.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove('selected');
            });

            // اختيار الفحوصات المحفوظة
            patient.testsResults.forEach(result => {
                const test = this.availableTests.find(t => t.name === result.testName);
                if (test) {
                    const checkbox = document.getElementById(`test_${test.id}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.parentElement.classList.add('selected');
                        this.selectedTests.push(test);
                    }
                }
            });

            // تحديث حقول النتائج
            this.updateTestsResults();

            // تعبئة النتائج المحفوظة
            setTimeout(() => {
                patient.testsResults.forEach(result => {
                    const test = this.availableTests.find(t => t.name === result.testName);
                    if (test) {
                        const resultInput = document.getElementById(`result_${test.id}`);
                        const normalInput = document.getElementById(`normal_${test.id}`);
                        if (resultInput) resultInput.value = result.result;
                        if (normalInput) normalInput.value = result.normal;
                    }
                });
            }, 100);

            this.editingId = id;
            
            // التمرير إلى النموذج
            this.form.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('خطأ في تعديل المريض:', error);
            Utils.showToast('خطأ في تعديل المريض', 'error');
        }
    }

    // حذف المريض
    async deletePatient(id) {
        try {
            const patient = this.patients.find(p => p.id === id);
            if (!patient) {
                Utils.showToast('المريض غير موجود', 'error');
                return;
            }

            Utils.showConfirm(
                'تأكيد الحذف',
                `هل أنت متأكد من حذف نتائج المريض "${patient.patientName}"؟`,
                async () => {
                    try {
                        Utils.showLoading('جاري حذف نتائج المريض...');
                        
                        await labDB.deletePatientResult(id);
                        Utils.showToast(languageManager.getTranslation('success_delete'), 'success');
                        
                        await this.loadPatientsData();
                    } catch (error) {
                        console.error('خطأ في حذف المريض:', error);
                        Utils.showToast(languageManager.getTranslation('error_delete'), 'error');
                    } finally {
                        Utils.hideLoading();
                    }
                }
            );

        } catch (error) {
            console.error('خطأ في حذف المريض:', error);
            Utils.showToast('خطأ في حذف المريض', 'error');
        }
    }

    // إعادة تعيين النموذج
    resetForm() {
        if (this.form) {
            Utils.clearForm(this.form);
            
            // إعادة تعيين اختيار الفحوصات
            this.selectedTests = [];
            const checkboxes = this.testsSelection.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                checkbox.parentElement.classList.remove('selected');
            });
            
            // إخفاء قسم النتائج
            this.testsResults.classList.add('hidden');
            
            this.editingId = null;
        }
    }

    // البحث في المرضى
    async searchPatients(searchTerm) {
        try {
            if (!searchTerm.trim()) {
                return this.patients;
            }

            return this.patients.filter(patient => 
                patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.patientID.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } catch (error) {
            console.error('خطأ في البحث:', error);
            return [];
        }
    }

    // تصدير بيانات المرضى
    async exportPatients() {
        try {
            const patients = this.patients;
            return {
                patients: patients,
                exportDate: new Date().toISOString(),
                totalPatients: patients.length,
                totalRevenue: patients.reduce((sum, patient) => 
                    sum + patient.testsResults.reduce((testSum, test) => 
                        testSum + (test.price || 0), 0), 0)
            };
        } catch (error) {
            console.error('خطأ في تصدير بيانات المرضى:', error);
            return null;
        }
    }

    // استيراد بيانات المرضى
    async importPatients(data) {
        try {
            if (!data || !data.patients || !Array.isArray(data.patients)) {
                Utils.showToast('بيانات المرضى غير صحيحة', 'error');
                return false;
            }

            Utils.showLoading('جاري استيراد بيانات المرضى...');

            let importedCount = 0;
            let errorCount = 0;

            for (const patient of data.patients) {
                try {
                    // التحقق من البيانات المطلوبة
                    if (!patient.patientName || !patient.patientID || !patient.testsResults) {
                        errorCount++;
                        continue;
                    }

                    const patientData = {
                        patientName: patient.patientName,
                        patientAge: patient.patientAge || 0,
                        patientGender: patient.patientGender || 'male',
                        patientID: patient.patientID,
                        testsResults: patient.testsResults || []
                    };

                    await labDB.addPatientResult(patientData);
                    importedCount++;
                } catch (error) {
                    errorCount++;
                    console.warn(`خطأ في استيراد المريض ${patient.patientName}:`, error);
                }
            }

            // تحديث القائمة
            await this.loadPatientsData();

            // إظهار رسالة النتيجة
            if (importedCount > 0) {
                Utils.showToast(`تم استيراد ${importedCount} مريض بنجاح`, 'success');
            }
            
            if (errorCount > 0) {
                Utils.showToast(`فشل في استيراد ${errorCount} مريض`, 'warning');
            }

            return importedCount > 0;
        } catch (error) {
            console.error('خطأ في استيراد بيانات المرضى:', error);
            Utils.showToast(languageManager.getTranslation('error_import'), 'error');
            return false;
        } finally {
            Utils.hideLoading();
        }
    }
}

// إنشاء مثيل وحيد من مدير المرضى
const patientsManager = new PatientsManager();