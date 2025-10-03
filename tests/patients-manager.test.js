// نظام اختبار إدارة المرضى
// Unit Tests for PatientsManager Class

describe('PatientsManager', () => {
    let patientsManager;
    let mockDatabase;
    let mockUtils;
    let mockDocument;
    let mockLanguageManager;

    // إعداد البيئة قبل كل اختبار
    function setupTestEnvironment() {
        // إنشاء mock objects
        mockDatabase = MockUtils.createMockDatabase();
        mockUtils = MockUtils.createMockUtils();
        
        // محاكاة document
        mockDocument = {
            getElementById: function(id) {
                const elements = {
                    'patientForm': MockUtils.createMockForm({
                        patientName: 'محمد أحمد',
                        patientID: 'P12345',
                        phone: '0501234567',
                        age: '35',
                        gender: 'male'
                    }),
                    'patientsTable': MockUtils.createMockElement('table'),
                    'patientSearchInput': MockUtils.createMockElement('input'),
                    'testsSelection': MockUtils.createMockElement('div'),
                    'testsResults': MockUtils.createMockElement('div'),
                    'resetPatientForm': MockUtils.createMockElement('button'),
                    'totalPatients': MockUtils.createMockElement('span'),
                    'totalResults': MockUtils.createMockElement('span')
                };
                return elements[id] || MockUtils.createMockElement();
            },
            createElement: function(tagName) {
                return MockUtils.createMockElement(tagName);
            }
        };

        // محاكاة language manager
        mockLanguageManager = {
            getTranslation: function(key) {
                const translations = {
                    'success_save': 'تم حفظ النتيجة بنجاح',
                    'success_update': 'تم تحديث النتيجة بنجاح',
                    'success_delete': 'تم حذف النتيجة بنجاح',
                    'error_save': 'خطأ في حفظ النتيجة',
                    'error_delete': 'خطأ في حذف النتيجة',
                    'no_results_available': 'لا توجد نتائج متاحة',
                    'patient_not_found': 'المريض غير موجود',
                    'edit': 'تعديل',
                    'delete': 'حذف',
                    'view_result': 'عرض النتيجة',
                    'patients': 'مرضى',
                    'results': 'نتائج'
                };
                return translations[key] || key;
            }
        };

        // إعداد البيئة العامة
        global.labDB = mockDatabase;
        global.Utils = mockUtils;
        global.document = mockDocument;
        global.languageManager = mockLanguageManager;
        global.FormData = class FormData {
            constructor(form) {
                this.data = {};
                if (form && form.elements) {
                    Object.keys(form.elements).forEach(key => {
                        this.data[key] = form.elements[key].value;
                    });
                }
            }
            get(key) {
                return this.data[key];
            }
        };
    }

    // اختبار تهيئة PatientsManager بنجاح
    it('should initialize PatientsManager successfully', () => {
        setupTestEnvironment();
        
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
            
            init() {
                this.form = document.getElementById('patientForm');
                this.table = document.getElementById('patientsTable');
                this.searchInput = document.getElementById('patientSearchInput');
                this.testsSelection = document.getElementById('testsSelection');
                this.testsResults = document.getElementById('testsResults');
            }
        }
        
        patientsManager = new PatientsManager();
        
        assert.assertNotNull(patientsManager, 'PatientsManager should be created');
        assert.assertNotNull(patientsManager.form, 'Form should be initialized');
        assert.assertNotNull(patientsManager.table, 'Table should be initialized');
        assert.assertNotNull(patientsManager.searchInput, 'Search input should be initialized');
        assert.assertTrue(Array.isArray(patientsManager.patients), 'Patients array should be initialized');
        assert.assertTrue(Array.isArray(patientsManager.availableTests), 'Available tests array should be initialized');
        assert.assertEqual(patientsManager.editingId, null, 'Editing ID should be null initially');
    });

    // اختبار تحميل بيانات المرضى
    it('should load patients data successfully', async () => {
        setupTestEnvironment();
        
        // إضافة بيانات تجريبية لقاعدة البيانات
        await mockDatabase.addResult({
            patientName: 'أحمد محمد',
            patientID: 'P001',
            testName: 'Complete Blood Count',
            result: 'Normal',
            date: '2024-01-15'
        });
        
        await mockDatabase.addResult({
            patientName: 'فاطمة علي',
            patientID: 'P002',
            testName: 'Urine Test',
            result: 'Normal',
            date: '2024-01-16'
        });
        
        class PatientsManager {
            constructor() {
                this.patients = [];
                this.availableTests = [];
            }
            
            async loadPatientsData() {
                try {
                    // تحميل نتائج المرضى
                    this.patients = await labDB.getAllResults();
                    
                    // تحميل الفحوصات المتاحة
                    this.availableTests = await labDB.getAllTests();
                    
                    return {
                        patients: this.patients,
                        tests: this.availableTests
                    };
                } catch (error) {
                    throw error;
                }
            }
        }
        
        patientsManager = new PatientsManager();
        const loadedData = await patientsManager.loadPatientsData();
        
        assert.assertLength(loadedData.patients, 2, 'Should load 2 patient results');
        assert.assertEqual(loadedData.patients[0].patientName, 'أحمد محمد', 'First patient name should match');
        assert.assertEqual(loadedData.patients[1].patientID, 'P002', 'Second patient ID should match');
    });

    // اختبار حفظ نتيجة مريض جديد
    it('should save new patient result successfully', async () => {
        setupTestEnvironment();
        
        class PatientsManager {
            constructor() {
                this.form = document.getElementById('patientForm');
                this.selectedTests = [
                    { id: 1, name: 'Complete Blood Count', result: 'Normal' },
                    { id: 2, name: 'Blood Sugar', result: 'High' }
                ];
                this.editingId = null;
            }
            
            async savePatientResult() {
                const formData = new FormData(this.form);
                const patientData = {
                    patientName: formData.get('patientName').trim(),
                    patientID: formData.get('patientID').trim(),
                    phone: formData.get('phone').trim(),
                    age: parseInt(formData.get('age')),
                    gender: formData.get('gender'),
                    tests: this.selectedTests,
                    date: new Date().toISOString(),
                    notes: formData.get('notes') || ''
                };
                
                const result = await labDB.addResult(patientData);
                return result;
            }
        }
        
        patientsManager = new PatientsManager();
        const savedResult = await patientsManager.savePatientResult();
        
        assert.assertNotNull(savedResult, 'Patient result should be saved');
        assert.assertEqual(savedResult.patientName, 'محمد أحمد', 'Patient name should match');
        assert.assertEqual(savedResult.patientID, 'P12345', 'Patient ID should match');
        assert.assertEqual(savedResult.age, 35, 'Patient age should match');
        assert.assertTrue(Array.isArray(savedResult.tests), 'Tests should be an array');
        assert.assertLength(savedResult.tests, 2, 'Should have 2 test results');
        assert.assertNotNull(savedResult.id, 'Result should have an ID');
    });

    // اختبار البحث في نتائج المرضى
    it('should filter patients by search term', () => {
        setupTestEnvironment();
        
        class PatientsManager {
            constructor() {
                this.patients = [
                    {
                        id: 1,
                        patientName: 'أحمد محمد',
                        patientID: 'P001',
                        testName: 'Complete Blood Count',
                        date: '2024-01-15'
                    },
                    {
                        id: 2,
                        patientName: 'فاطمة علي',
                        patientID: 'P002',
                        testName: 'Urine Test',
                        date: '2024-01-16'
                    },
                    {
                        id: 3,
                        patientName: 'محمد سالم',
                        patientID: 'P003',
                        testName: 'X-Ray',
                        date: '2024-01-17'
                    }
                ];
            }
            
            filterPatients(searchTerm) {
                if (!searchTerm.trim()) {
                    return this.patients;
                }
                
                return this.patients.filter(patient => 
                    patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    patient.patientID.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    patient.testName.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
        }
        
        patientsManager = new PatientsManager();
        
        // البحث باسم المريض
        const nameResults = patientsManager.filterPatients('أحمد');
        assert.assertLength(nameResults, 1, 'Should find 1 patient with name containing "أحمد"');
        assert.assertEqual(nameResults[0].patientName, 'أحمد محمد', 'Should find the correct patient');
        
        // البحث برقم المريض
        const idResults = patientsManager.filterPatients('P002');
        assert.assertLength(idResults, 1, 'Should find 1 patient with ID "P002"');
        assert.assertEqual(idResults[0].patientID, 'P002', 'Should find the correct patient ID');
        
        // البحث باسم الفحص
        const testResults = patientsManager.filterPatients('urine');
        assert.assertLength(testResults, 1, 'Should find 1 patient with test containing "urine"');
        
        // البحث بمصطلح عام
        const generalResults = patientsManager.filterPatients('محمد');
        assert.assertLength(generalResults, 2, 'Should find 2 patients with name containing "محمد"');
        
        // البحث بنص فارغ
        const allResults = patientsManager.filterPatients('');
        assert.assertLength(allResults, 3, 'Should return all patients for empty search');
    });

    // اختبار تحديد الفحوصات للمريض
    it('should manage selected tests for patient', () => {
        setupTestEnvironment();
        
        class PatientsManager {
            constructor() {
                this.availableTests = [
                    { id: 1, name: 'Complete Blood Count', price: 150 },
                    { id: 2, name: 'Blood Sugar', price: 100 },
                    { id: 3, name: 'Urine Test', price: 75 }
                ];
                this.selectedTests = [];
            }
            
            addTestToSelection(testId, result = '') {
                const test = this.availableTests.find(t => t.id === testId);
                if (!test) {
                    throw new Error('Test not found');
                }
                
                // التحقق من عدم وجود الفحص مسبقاً
                const existingIndex = this.selectedTests.findIndex(t => t.id === testId);
                if (existingIndex !== -1) {
                    // تحديث النتيجة إذا كان الفحص موجود
                    this.selectedTests[existingIndex].result = result;
                } else {
                    // إضافة فحص جديد
                    this.selectedTests.push({
                        id: test.id,
                        name: test.name,
                        price: test.price,
                        result: result
                    });
                }
                
                return this.selectedTests;
            }
            
            removeTestFromSelection(testId) {
                const index = this.selectedTests.findIndex(t => t.id === testId);
                if (index !== -1) {
                    this.selectedTests.splice(index, 1);
                }
                return this.selectedTests;
            }
            
            calculateTotalCost() {
                return this.selectedTests.reduce((total, test) => total + test.price, 0);
            }
        }
        
        patientsManager = new PatientsManager();
        
        // إضافة فحص للتحديد
        const addResult = patientsManager.addTestToSelection(1, 'Normal');
        assert.assertLength(addResult, 1, 'Should have 1 selected test');
        assert.assertEqual(addResult[0].name, 'Complete Blood Count', 'Test name should match');
        assert.assertEqual(addResult[0].result, 'Normal', 'Test result should be set');
        
        // إضافة فحص آخر
        patientsManager.addTestToSelection(2, 'High');
        assert.assertLength(patientsManager.selectedTests, 2, 'Should have 2 selected tests');
        
        // تحديث نتيجة فحص موجود
        patientsManager.addTestToSelection(1, 'Abnormal');
        assert.assertLength(patientsManager.selectedTests, 2, 'Should still have 2 tests');
        assert.assertEqual(patientsManager.selectedTests[0].result, 'Abnormal', 'Test result should be updated');
        
        // حساب التكلفة الإجمالية
        const totalCost = patientsManager.calculateTotalCost();
        assert.assertEqual(totalCost, 250, 'Total cost should be 250 (150 + 100)');
        
        // إزالة فحص من التحديد
        const removeResult = patientsManager.removeTestFromSelection(2);
        assert.assertLength(removeResult, 1, 'Should have 1 test after removal');
        assert.assertEqual(removeResult[0].id, 1, 'Remaining test should be the first one');
    });

    // اختبار عرض تفاصيل نتيجة المريض
    it('should display patient result details', () => {
        setupTestEnvironment();
        
        class PatientsManager {
            constructor() {
                this.patients = [
                    {
                        id: 1,
                        patientName: 'أحمد محمد',
                        patientID: 'P001',
                        phone: '0501234567',
                        age: 35,
                        gender: 'male',
                        tests: [
                            { name: 'Complete Blood Count', result: 'Normal' },
                            { name: 'Blood Sugar', result: 'High' }
                        ],
                        date: '2024-01-15',
                        notes: 'Patient has diabetes history'
                    }
                ];
            }
            
            getPatientResult(id) {
                return this.patients.find(p => p.id === id);
            }
            
            formatPatientDetails(patientResult) {
                if (!patientResult) {
                    return null;
                }
                
                return {
                    basicInfo: {
                        name: patientResult.patientName,
                        id: patientResult.patientID,
                        phone: patientResult.phone,
                        age: patientResult.age,
                        gender: patientResult.gender
                    },
                    testResults: patientResult.tests.map(test => ({
                        testName: test.name,
                        result: test.result,
                        status: this.getResultStatus(test.result)
                    })),
                    visitInfo: {
                        date: patientResult.date,
                        notes: patientResult.notes
                    },
                    summary: {
                        totalTests: patientResult.tests.length,
                        abnormalResults: patientResult.tests.filter(t => t.result !== 'Normal').length
                    }
                };
            }
            
            getResultStatus(result) {
                const normalResults = ['Normal', 'طبيعي', 'سليم'];
                return normalResults.includes(result) ? 'normal' : 'abnormal';
            }
        }
        
        patientsManager = new PatientsManager();
        
        // الحصول على تفاصيل المريض
        const patientResult = patientsManager.getPatientResult(1);
        assert.assertNotNull(patientResult, 'Patient result should be found');
        
        // تنسيق التفاصيل
        const formattedDetails = patientsManager.formatPatientDetails(patientResult);
        
        assert.assertNotNull(formattedDetails, 'Formatted details should not be null');
        assert.assertEqual(formattedDetails.basicInfo.name, 'أحمد محمد', 'Patient name should match');
        assert.assertEqual(formattedDetails.basicInfo.age, 35, 'Patient age should match');
        assert.assertLength(formattedDetails.testResults, 2, 'Should have 2 test results');
        assert.assertEqual(formattedDetails.testResults[0].status, 'normal', 'First test should be normal');
        assert.assertEqual(formattedDetails.testResults[1].status, 'abnormal', 'Second test should be abnormal');
        assert.assertEqual(formattedDetails.summary.totalTests, 2, 'Summary should show 2 total tests');
        assert.assertEqual(formattedDetails.summary.abnormalResults, 1, 'Summary should show 1 abnormal result');
    });

    // اختبار حذف نتيجة مريض
    it('should delete patient result successfully', async () => {
        setupTestEnvironment();
        
        // إضافة نتيجة للحذف
        const resultToDelete = await mockDatabase.addResult({
            patientName: 'سالم أحمد',
            patientID: 'P999',
            testName: 'X-Ray',
            result: 'Normal',
            date: '2024-01-20'
        });
        
        class PatientsManager {
            constructor() {
                this.patients = [];
            }
            
            async deletePatientResult(id) {
                // التحقق من وجود النتيجة
                const allResults = await labDB.getAllResults();
                const result = allResults.find(r => r.id === id);
                
                if (!result) {
                    throw new Error('نتيجة المريض غير موجودة');
                }
                
                // حذف النتيجة
                await labDB.deleteResult(id);
                return true;
            }
        }
        
        // إضافة دالة deleteResult لـ mockDatabase
        mockDatabase.deleteResult = async function(id) {
            const index = this.results.findIndex(r => r.id === id);
            if (index === -1) {
                throw new Error('Result not found');
            }
            this.results.splice(index, 1);
            return Promise.resolve(true);
        };
        
        patientsManager = new PatientsManager();
        
        // التحقق من وجود النتيجة قبل الحذف
        const resultsBeforeDelete = await mockDatabase.getAllResults();
        assert.assertLength(resultsBeforeDelete, 1, 'Should have 1 result before deletion');
        
        // حذف النتيجة
        const deleteResult = await patientsManager.deletePatientResult(resultToDelete.id);
        
        assert.assertTrue(deleteResult, 'Delete operation should succeed');
        
        // التحقق من الحذف
        const resultsAfterDelete = await mockDatabase.getAllResults();
        assert.assertLength(resultsAfterDelete, 0, 'Should have 0 results after deletion');
    });

    // اختبار التحقق من صحة بيانات المريض
    it('should validate patient data correctly', () => {
        setupTestEnvironment();
        
        class PatientsManager {
            validatePatientData(patientData) {
                const errors = [];
                
                // التحقق من الاسم
                if (!patientData.patientName || patientData.patientName.trim() === '') {
                    errors.push('اسم المريض مطلوب');
                }
                
                // التحقق من رقم المريض
                if (!patientData.patientID || patientData.patientID.trim() === '') {
                    errors.push('رقم المريض مطلوب');
                }
                
                // التحقق من العمر
                if (!patientData.age || isNaN(patientData.age) || patientData.age < 0 || patientData.age > 150) {
                    errors.push('العمر يجب أن يكون رقم صحيح بين 0 و 150');
                }
                
                // التحقق من رقم الهاتف
                if (patientData.phone && !/^05\d{8}$/.test(patientData.phone)) {
                    errors.push('رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
                }
                
                // التحقق من الجنس
                if (!patientData.gender || !['male', 'female'].includes(patientData.gender)) {
                    errors.push('الجنس مطلوب ويجب أن يكون ذكر أو أنثى');
                }
                
                // التحقق من وجود فحوصات
                if (!patientData.tests || !Array.isArray(patientData.tests) || patientData.tests.length === 0) {
                    errors.push('يجب تحديد فحص واحد على الأقل');
                }
                
                return {
                    isValid: errors.length === 0,
                    errors: errors
                };
            }
        }
        
        patientsManager = new PatientsManager();
        
        // اختبار بيانات صحيحة
        const validData = {
            patientName: 'محمد أحمد',
            patientID: 'P12345',
            age: 35,
            phone: '0501234567',
            gender: 'male',
            tests: [{ name: 'Blood Test', result: 'Normal' }]
        };
        
        const validResult = patientsManager.validatePatientData(validData);
        assert.assertTrue(validResult.isValid, 'Valid data should pass validation');
        assert.assertLength(validResult.errors, 0, 'Valid data should have no errors');
        
        // اختبار بيانات غير صحيحة
        const invalidData = {
            patientName: '',
            patientID: '',
            age: 'invalid',
            phone: '123', // رقم هاتف غير صحيح
            gender: 'invalid',
            tests: []
        };
        
        const invalidResult = patientsManager.validatePatientData(invalidData);
        assert.assertFalse(invalidResult.isValid, 'Invalid data should fail validation');
        assert.assertTrue(invalidResult.errors.length >= 5, 'Should have multiple validation errors');
        
        // التحقق من وجود أخطاء محددة
        const errorsText = invalidResult.errors.join(' ');
        assert.assertIncludes(errorsText, 'اسم المريض', 'Should have patient name error');
        assert.assertIncludes(errorsText, 'العمر', 'Should have age error');
        assert.assertIncludes(errorsText, 'الهاتف', 'Should have phone error');
    });
});

console.log('✅ PatientsManager unit tests loaded successfully');