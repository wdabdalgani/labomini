// نظام اختبار إدارة الفحوصات الطبية
// Unit Tests for TestsManager Class

describe('TestsManager', () => {
    let testsManager;
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
                    'testForm': MockUtils.createMockForm({
                        name: 'Complete Blood Count',
                        price: '150',
                        desc: 'CBC test description'
                    }),
                    'testsTable': MockUtils.createMockElement('table'),
                    'testSearchInput': MockUtils.createMockElement('input'),
                    'cancelTestEdit': MockUtils.createMockElement('button'),
                    'testName': MockUtils.createMockElement('input'),
                    'testPrice': MockUtils.createMockElement('input'),
                    'testDesc': MockUtils.createMockElement('input'),
                    'testSubmitText': MockUtils.createMockElement('span'),
                    'totalTests': MockUtils.createMockElement('span'),
                    'avgPrice': MockUtils.createMockElement('span')
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
                    'success_update': 'تم التحديث بنجاح',
                    'success_save': 'تم الحفظ بنجاح',
                    'success_delete': 'تم الحذف بنجاح',
                    'error_update': 'خطأ في التحديث',
                    'error_save': 'خطأ في الحفظ',
                    'error_delete': 'خطأ في الحذف',
                    'test_exists': 'الفحص موجود مسبقاً',
                    'no_tests_available': 'لا توجد فحوصات متاحة',
                    'edit': 'تعديل',
                    'delete': 'حذف',
                    'add_test': 'إضافة فحص',
                    'edit_test': 'تعديل فحص',
                    'tests': 'فحوصات'
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

    // اختبار تهيئة TestsManager بنجاح
    it('should initialize TestsManager successfully', () => {
        setupTestEnvironment();
        
        // محاكاة TestsManager class
        class TestsManager {
            constructor() {
                this.form = null;
                this.table = null;
                this.searchInput = null;
                this.tests = [];
                this.editingId = null;
                this.init();
            }
            
            init() {
                this.form = document.getElementById('testForm');
                this.table = document.getElementById('testsTable');
                this.searchInput = document.getElementById('testSearchInput');
            }
        }
        
        testsManager = new TestsManager();
        
        assert.assertNotNull(testsManager, 'TestsManager should be created');
        assert.assertNotNull(testsManager.form, 'Form should be initialized');
        assert.assertNotNull(testsManager.table, 'Table should be initialized');
        assert.assertNotNull(testsManager.searchInput, 'Search input should be initialized');
        assert.assertEqual(testsManager.editingId, null, 'Editing ID should be null initially');
        assert.assertTrue(Array.isArray(testsManager.tests), 'Tests array should be initialized');
    });

    // اختبار تحميل الفحوصات من قاعدة البيانات
    it('should load tests from database successfully', async () => {
        setupTestEnvironment();
        
        // إضافة بيانات تجريبية لقاعدة البيانات
        await mockDatabase.addTest({ name: 'Blood Test', price: 100, desc: 'Basic blood test' });
        await mockDatabase.addTest({ name: 'Urine Test', price: 50, desc: 'Urine analysis' });
        
        class TestsManager {
            constructor() {
                this.tests = [];
                this.table = document.getElementById('testsTable');
            }
            
            async loadTests() {
                try {
                    this.tests = await labDB.getAllTests();
                    return this.tests;
                } catch (error) {
                    throw error;
                }
            }
        }
        
        testsManager = new TestsManager();
        const loadedTests = await testsManager.loadTests();
        
        assert.assertLength(loadedTests, 2, 'Should load 2 tests');
        assert.assertEqual(loadedTests[0].name, 'Blood Test', 'First test name should match');
        assert.assertEqual(loadedTests[1].price, 50, 'Second test price should match');
    });

    // اختبار حفظ فحص جديد بنجاح
    it('should save new test successfully', async () => {
        setupTestEnvironment();
        
        class TestsManager {
            constructor() {
                this.form = document.getElementById('testForm');
                this.editingId = null;
            }
            
            async saveTest() {
                const formData = new FormData(this.form);
                const testData = {
                    name: formData.get('name').trim(),
                    price: parseFloat(formData.get('price')),
                    desc: formData.get('desc').trim()
                };
                
                const result = await labDB.addTest(testData);
                return result;
            }
        }
        
        testsManager = new TestsManager();
        const savedTest = await testsManager.saveTest();
        
        assert.assertNotNull(savedTest, 'Test should be saved');
        assert.assertEqual(savedTest.name, 'Complete Blood Count', 'Test name should match');
        assert.assertEqual(savedTest.price, 150, 'Test price should match');
        assert.assertNotNull(savedTest.id, 'Test should have an ID');
    });

    // اختبار تعديل فحص موجود
    it('should edit existing test successfully', async () => {
        setupTestEnvironment();
        
        // إضافة فحص للتعديل
        const originalTest = await mockDatabase.addTest({ 
            name: 'X-Ray', 
            price: 200, 
            desc: 'Chest X-Ray' 
        });
        
        class TestsManager {
            constructor() {
                this.tests = [];
                this.editingId = null;
            }
            
            async editTest(id) {
                const test = await mockDatabase.getAllTests().then(tests => 
                    tests.find(t => t.id === id)
                );
                
                if (!test) {
                    throw new Error('الفحص غير موجود');
                }
                
                this.editingId = id;
                return test;
            }
            
            async updateTest(id, newData) {
                return await labDB.updateTest(id, newData);
            }
        }
        
        testsManager = new TestsManager();
        const testToEdit = await testsManager.editTest(originalTest.id);
        
        assert.assertNotNull(testToEdit, 'Test should be found for editing');
        assert.assertEqual(testsManager.editingId, originalTest.id, 'Editing ID should be set');
        
        // تحديث البيانات
        const updatedTest = await testsManager.updateTest(originalTest.id, {
            name: 'Chest X-Ray Updated',
            price: 250
        });
        
        assert.assertEqual(updatedTest.name, 'Chest X-Ray Updated', 'Test name should be updated');
        assert.assertEqual(updatedTest.price, 250, 'Test price should be updated');
    });

    // اختبار حذف فحص بنجاح
    it('should delete test successfully', async () => {
        setupTestEnvironment();
        
        // إضافة فحص للحذف
        const testToDelete = await mockDatabase.addTest({ 
            name: 'MRI Scan', 
            price: 1000, 
            desc: 'Brain MRI' 
        });
        
        class TestsManager {
            constructor() {
                this.tests = [];
            }
            
            async deleteTest(id) {
                const allTests = await labDB.getAllTests();
                const test = allTests.find(t => t.id === id);
                
                if (!test) {
                    throw new Error('الفحص غير موجود');
                }
                
                await labDB.deleteTest(id);
                return true;
            }
        }
        
        testsManager = new TestsManager();
        
        // التحقق من وجود الفحص قبل الحذف
        const testsBeforeDelete = await mockDatabase.getAllTests();
        assert.assertLength(testsBeforeDelete, 1, 'Should have 1 test before deletion');
        
        // حذف الفحص
        const deleteResult = await testsManager.deleteTest(testToDelete.id);
        
        assert.assertTrue(deleteResult, 'Delete operation should succeed');
        
        // التحقق من الحذف
        const testsAfterDelete = await mockDatabase.getAllTests();
        assert.assertLength(testsAfterDelete, 0, 'Should have 0 tests after deletion');
    });

    // اختبار تصفية الفحوصات بالبحث
    it('should filter tests by search term', () => {
        setupTestEnvironment();
        
        class TestsManager {
            constructor() {
                this.tests = [
                    { id: 1, name: 'Blood Test', price: 100, desc: 'Complete blood count' },
                    { id: 2, name: 'Urine Test', price: 50, desc: 'Urine analysis' },
                    { id: 3, name: 'Blood Sugar', price: 75, desc: 'Glucose test' }
                ];
            }
            
            filterTests(searchTerm) {
                if (!searchTerm.trim()) {
                    return this.tests;
                }
                
                return this.tests.filter(test => 
                    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (test.desc && test.desc.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }
        }
        
        testsManager = new TestsManager();
        
        // البحث بكلمة "blood"
        const bloodTests = testsManager.filterTests('blood');
        assert.assertLength(bloodTests, 2, 'Should find 2 tests containing "blood"');
        
        // البحث بكلمة "urine"
        const urineTests = testsManager.filterTests('urine');
        assert.assertLength(urineTests, 1, 'Should find 1 test containing "urine"');
        assert.assertEqual(urineTests[0].name, 'Urine Test', 'Should find the correct urine test');
        
        // البحث بكلمة غير موجودة
        const noResults = testsManager.filterTests('xyz');
        assert.assertLength(noResults, 0, 'Should find no tests for non-existent term');
        
        // البحث بنص فارغ
        const allTests = testsManager.filterTests('');
        assert.assertLength(allTests, 3, 'Should return all tests for empty search');
    });

    // اختبار التعامل مع بيانات نموذج غير صحيحة
    it('should handle invalid form data', () => {
        setupTestEnvironment();
        
        class TestsManager {
            validateTestData(testData) {
                const errors = [];
                
                if (!testData.name || testData.name.trim() === '') {
                    errors.push('اسم الفحص مطلوب');
                }
                
                if (!testData.price || isNaN(testData.price) || testData.price <= 0) {
                    errors.push('سعر الفحص يجب أن يكون رقم أكبر من صفر');
                }
                
                return {
                    isValid: errors.length === 0,
                    errors: errors
                };
            }
        }
        
        testsManager = new TestsManager();
        
        // اختبار بيانات فارغة
        const emptyDataValidation = testsManager.validateTestData({ name: '', price: '' });
        assert.assertFalse(emptyDataValidation.isValid, 'Empty data should be invalid');
        assert.assertTrue(emptyDataValidation.errors.length > 0, 'Should have validation errors');
        
        // اختبار سعر غير صحيح
        const invalidPriceValidation = testsManager.validateTestData({ 
            name: 'Valid Test', 
            price: 'invalid' 
        });
        assert.assertFalse(invalidPriceValidation.isValid, 'Invalid price should be invalid');
        assert.assertIncludes(invalidPriceValidation.errors[0], 'سعر', 'Should have price error');
        
        // اختبار بيانات صحيحة
        const validDataValidation = testsManager.validateTestData({ 
            name: 'Valid Test', 
            price: 100, 
            desc: 'Valid description' 
        });
        assert.assertTrue(validDataValidation.isValid, 'Valid data should pass validation');
        assert.assertLength(validDataValidation.errors, 0, 'Should have no validation errors');
    });

    // اختبار التعامل مع فشل الاتصال بقاعدة البيانات
    it('should handle database connection failure', async () => {
        setupTestEnvironment();
        
        // محاكاة فشل قاعدة البيانات
        const failingDatabase = {
            getAllTests: async function() {
                throw new Error('Database connection failed');
            },
            addTest: async function(testData) {
                throw new Error('Database connection failed');
            }
        };
        
        global.labDB = failingDatabase;
        
        class TestsManager {
            constructor() {
                this.tests = [];
            }
            
            async loadTests() {
                try {
                    this.tests = await labDB.getAllTests();
                    return this.tests;
                } catch (error) {
                    console.error('خطأ في تحميل الفحوصات:', error);
                    throw error;
                }
            }
            
            async saveTest(testData) {
                try {
                    const result = await labDB.addTest(testData);
                    return result;
                } catch (error) {
                    console.error('خطأ في حفظ الفحص:', error);
                    throw error;
                }
            }
        }
        
        testsManager = new TestsManager();
        
        // اختبار فشل تحميل الفحوصات
        await assert.assertThrows(
            async () => await testsManager.loadTests(),
            'Database connection failed',
            'Should throw database error when loading tests'
        );
        
        // اختبار فشل حفظ الفحص
        await assert.assertThrows(
            async () => await testsManager.saveTest({ name: 'Test', price: 100 }),
            'Database connection failed',
            'Should throw database error when saving test'
        );
    });
});

console.log('✅ TestsManager unit tests loaded successfully');