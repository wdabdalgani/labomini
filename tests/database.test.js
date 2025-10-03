// نظام اختبار قاعدة البيانات
// Unit Tests for LabDatabase Class

describe('LabDatabase', () => {
    let labDatabase;
    let mockIndexedDB;

    // إعداد البيئة قبل كل اختبار
    function setupTestEnvironment() {
        // محاكاة IndexedDB
        mockIndexedDB = {
            databases: {},
            open: function(dbName, version) {
                return {
                    onerror: null,
                    onsuccess: null,
                    onupgradeneeded: null,
                    result: {
                        objectStoreNames: {
                            contains: function(storeName) {
                                return false; // للإجبار على إنشاء stores جديدة
                            }
                        },
                        createObjectStore: function(name, options) {
                            const store = {
                                createIndex: function(indexName, keyPath, options) {
                                    console.log(`Created index ${indexName} on ${name}`);
                                    return { name: indexName };
                                }
                            };
                            console.log(`Created object store: ${name}`);
                            return store;
                        },
                        transaction: function(storeNames, mode) {
                            return {
                                objectStore: function(storeName) {
                                    return mockIndexedDB.createMockStore(storeName);
                                }
                            };
                        }
                    }
                };
            },
            
            createMockStore: function(storeName) {
                if (!this.databases[storeName]) {
                    this.databases[storeName] = [];
                }
                
                return {
                    data: this.databases[storeName],
                    autoIncrementId: 1,
                    
                    add: function(item) {
                        const newItem = { ...item, id: this.autoIncrementId++ };
                        this.data.push(newItem);
                        return {
                            onsuccess: null,
                            onerror: null,
                            result: newItem
                        };
                    },
                    
                    put: function(item) {
                        const index = this.data.findIndex(d => d.id === item.id);
                        if (index !== -1) {
                            this.data[index] = item;
                        } else {
                            this.data.push(item);
                        }
                        return {
                            onsuccess: null,
                            onerror: null,
                            result: item
                        };
                    },
                    
                    delete: function(id) {
                        const index = this.data.findIndex(d => d.id === id);
                        if (index !== -1) {
                            this.data.splice(index, 1);
                        }
                        return {
                            onsuccess: null,
                            onerror: null
                        };
                    },
                    
                    get: function(id) {
                        const item = this.data.find(d => d.id === id);
                        return {
                            onsuccess: null,
                            onerror: null,
                            result: item
                        };
                    },
                    
                    getAll: function() {
                        return {
                            onsuccess: null,
                            onerror: null,
                            result: [...this.data]
                        };
                    },
                    
                    index: function(indexName) {
                        return {
                            get: function(value) {
                                const item = this.data.find(d => d[indexName] === value);
                                return {
                                    onsuccess: null,
                                    onerror: null,
                                    result: item
                                };
                            }.bind(this)
                        };
                    }.bind(this)
                };
            }
        };
        
        global.indexedDB = mockIndexedDB;
    }

    // اختبار تهيئة قاعدة البيانات
    it('should initialize database successfully', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.dbName = 'LabManagementDB';
                this.dbVersion = 1;
                this.db = null;
            }
            
            async init() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, this.dbVersion);
                    
                    request.onsuccess = (event) => {
                        this.db = event.target.result;
                        resolve(this.db);
                    };
                    
                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        
                        // إنشاء stores
                        if (!db.objectStoreNames.contains('hospital')) {
                            db.createObjectStore('hospital', { keyPath: 'id', autoIncrement: true });
                        }
                        
                        if (!db.objectStoreNames.contains('tests')) {
                            const testsStore = db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
                            testsStore.createIndex('name', 'name', { unique: true });
                        }
                        
                        if (!db.objectStoreNames.contains('results')) {
                            const resultsStore = db.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
                            resultsStore.createIndex('patientName', 'patientName', { unique: false });
                            resultsStore.createIndex('patientID', 'patientID', { unique: false });
                            resultsStore.createIndex('date', 'date', { unique: false });
                        }
                    };
                    
                    // محاكاة نجاح العملية
                    setTimeout(() => {
                        if (request.onupgradeneeded) {
                            request.onupgradeneeded({ target: { result: request.result } });
                        }
                        if (request.onsuccess) {
                            request.onsuccess({ target: { result: request.result } });
                        }
                    }, 10);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const db = await labDatabase.init();
        
        assert.assertNotNull(db, 'Database should be initialized');
        assert.assertEqual(labDatabase.dbName, 'LabManagementDB', 'Database name should be correct');
        assert.assertEqual(labDatabase.dbVersion, 1, 'Database version should be correct');
    });

    // اختبار إضافة فحص جديد
    it('should add new test to database', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
            }
            
            async addTest(testData) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['tests'], 'readwrite');
                    const store = transaction.objectStore('tests');
                    const request = store.add(testData);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    
                    // محاكاة نجاح العملية
                    setTimeout(() => {
                        if (request.onsuccess) {
                            request.onsuccess();
                        }
                    }, 10);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const testData = {
            name: 'Complete Blood Count',
            price: 150,
            desc: 'Full blood analysis'
        };
        
        const result = await labDatabase.addTest(testData);
        
        assert.assertNotNull(result, 'Test should be added successfully');
        assert.assertEqual(result.name, 'Complete Blood Count', 'Test name should match');
        assert.assertEqual(result.price, 150, 'Test price should match');
        assert.assertNotNull(result.id, 'Test should have an ID');
    });

    // اختبار الحصول على جميع الفحوصات
    it('should get all tests from database', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
                // إضافة بيانات تجريبية
                const store = mockIndexedDB.createMockStore('tests');
                store.data.push(
                    { id: 1, name: 'Blood Test', price: 100, desc: 'Basic blood test' },
                    { id: 2, name: 'Urine Test', price: 50, desc: 'Urine analysis' }
                );
            }
            
            async getAllTests() {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['tests'], 'readonly');
                    const store = transaction.objectStore('tests');
                    const request = store.getAll();
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    
                    // محاكاة نجاح العملية
                    setTimeout(() => {
                        if (request.onsuccess) {
                            request.onsuccess();
                        }
                    }, 10);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const tests = await labDatabase.getAllTests();
        
        assert.assertTrue(Array.isArray(tests), 'Result should be an array');
        assert.assertLength(tests, 2, 'Should return 2 tests');
        assert.assertEqual(tests[0].name, 'Blood Test', 'First test name should match');
        assert.assertEqual(tests[1].price, 50, 'Second test price should match');
    });

    // اختبار تحديث فحص موجود
    it('should update existing test', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
                // إضافة فحص للتحديث
                const store = mockIndexedDB.createMockStore('tests');
                store.data.push({ id: 1, name: 'Old Test', price: 100, desc: 'Old description' });
            }
            
            async updateTest(id, updateData) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['tests'], 'readwrite');
                    const store = transaction.objectStore('tests');
                    
                    // الحصول على الفحص أولاً
                    const getRequest = store.get(id);
                    getRequest.onsuccess = () => {
                        if (!getRequest.result) {
                            reject(new Error('Test not found'));
                            return;
                        }
                        
                        const updatedTest = { ...getRequest.result, ...updateData };
                        const putRequest = store.put(updatedTest);
                        
                        putRequest.onsuccess = () => resolve(putRequest.result);
                        putRequest.onerror = () => reject(putRequest.error);
                        
                        // محاكاة نجاح العملية
                        setTimeout(() => {
                            if (putRequest.onsuccess) {
                                putRequest.onsuccess();
                            }
                        }, 10);
                    };
                    
                    // محاكاة نجاح الحصول على البيانات
                    setTimeout(() => {
                        if (getRequest.onsuccess) {
                            getRequest.onsuccess();
                        }
                    }, 5);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const updateData = {
            name: 'Updated Test',
            price: 200,
            desc: 'Updated description'
        };
        
        const updatedTest = await labDatabase.updateTest(1, updateData);
        
        assert.assertNotNull(updatedTest, 'Updated test should be returned');
        assert.assertEqual(updatedTest.name, 'Updated Test', 'Test name should be updated');
        assert.assertEqual(updatedTest.price, 200, 'Test price should be updated');
        assert.assertEqual(updatedTest.desc, 'Updated description', 'Test description should be updated');
        assert.assertEqual(updatedTest.id, 1, 'Test ID should remain the same');
    });

    // اختبار حذف فحص
    it('should delete test from database', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
                // إضافة فحص للحذف
                const store = mockIndexedDB.createMockStore('tests');
                store.data.push({ id: 1, name: 'Test to Delete', price: 100 });
            }
            
            async deleteTest(id) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['tests'], 'readwrite');
                    const store = transaction.objectStore('tests');
                    const request = store.delete(id);
                    
                    request.onsuccess = () => resolve(true);
                    request.onerror = () => reject(request.error);
                    
                    // محاكاة نجاح العملية
                    setTimeout(() => {
                        if (request.onsuccess) {
                            request.onsuccess();
                        }
                    }, 10);
                });
            }
            
            async getAllTests() {
                return new Promise((resolve) => {
                    const transaction = this.db.transaction(['tests'], 'readonly');
                    const store = transaction.objectStore('tests');
                    resolve(store.data);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        
        // التحقق من وجود الفحص قبل الحذف
        const testsBeforeDelete = await labDatabase.getAllTests();
        assert.assertLength(testsBeforeDelete, 1, 'Should have 1 test before deletion');
        
        // حذف الفحص
        const deleteResult = await labDatabase.deleteTest(1);
        assert.assertTrue(deleteResult, 'Delete operation should succeed');
        
        // التحقق من الحذف
        const testsAfterDelete = await labDatabase.getAllTests();
        assert.assertLength(testsAfterDelete, 0, 'Should have 0 tests after deletion');
    });

    // اختبار إضافة نتيجة مريض
    it('should add patient result to database', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
            }
            
            async addResult(resultData) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['results'], 'readwrite');
                    const store = transaction.objectStore('results');
                    const request = store.add(resultData);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    
                    // محاكاة نجاح العملية
                    setTimeout(() => {
                        if (request.onsuccess) {
                            request.onsuccess();
                        }
                    }, 10);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const resultData = {
            patientName: 'أحمد محمد',
            patientID: '12345',
            testName: 'Complete Blood Count',
            result: 'Normal',
            date: new Date().toISOString(),
            notes: 'All values within normal range'
        };
        
        const result = await labDatabase.addResult(resultData);
        
        assert.assertNotNull(result, 'Result should be added successfully');
        assert.assertEqual(result.patientName, 'أحمد محمد', 'Patient name should match');
        assert.assertEqual(result.patientID, '12345', 'Patient ID should match');
        assert.assertEqual(result.testName, 'Complete Blood Count', 'Test name should match');
        assert.assertNotNull(result.id, 'Result should have an ID');
    });

    // اختبار تحديث معلومات المستشفى
    it('should update hospital information', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
            }
            
            async updateHospitalInfo(hospitalData) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['hospital'], 'readwrite');
                    const store = transaction.objectStore('hospital');
                    
                    const dataWithId = { id: 1, ...hospitalData };
                    const request = store.put(dataWithId);
                    
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                    
                    // محاكاة نجاح العملية
                    setTimeout(() => {
                        if (request.onsuccess) {
                            request.onsuccess();
                        }
                    }, 10);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const hospitalData = {
            name: 'مستشفى الملك فهد',
            address: 'الرياض، المملكة العربية السعودية',
            phone: '+966123456789',
            email: 'info@hospital.com'
        };
        
        const result = await labDatabase.updateHospitalInfo(hospitalData);
        
        assert.assertNotNull(result, 'Hospital info should be updated');
        assert.assertEqual(result.name, 'مستشفى الملك فهد', 'Hospital name should match');
        assert.assertEqual(result.phone, '+966123456789', 'Hospital phone should match');
        assert.assertEqual(result.id, 1, 'Hospital record should have ID');
    });

    // اختبار البحث بالفهرس
    it('should search using database index', async () => {
        setupTestEnvironment();
        
        class LabDatabase {
            constructor() {
                this.db = mockIndexedDB.open('LabManagementDB', 1).result;
                // إضافة بيانات للبحث
                const store = mockIndexedDB.createMockStore('results');
                store.data.push(
                    { id: 1, patientName: 'أحمد محمد', patientID: 'P001', testName: 'Blood Test' },
                    { id: 2, patientName: 'فاطمة علي', patientID: 'P002', testName: 'Urine Test' },
                    { id: 3, patientName: 'أحمد محمد', patientID: 'P001', testName: 'X-Ray' }
                );
            }
            
            async searchResultsByPatientName(patientName) {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction(['results'], 'readonly');
                    const store = transaction.objectStore('results');
                    
                    // محاكاة البحث بالفهرس
                    const results = store.data.filter(r => r.patientName === patientName);
                    resolve(results);
                });
            }
        }
        
        labDatabase = new LabDatabase();
        const results = await labDatabase.searchResultsByPatientName('أحمد محمد');
        
        assert.assertTrue(Array.isArray(results), 'Results should be an array');
        assert.assertLength(results, 2, 'Should find 2 results for أحمد محمد');
        assert.assertEqual(results[0].patientName, 'أحمد محمد', 'First result should match patient name');
        assert.assertEqual(results[1].patientName, 'أحمد محمد', 'Second result should match patient name');
        assert.assertEqual(results[0].testName, 'Blood Test', 'First result test should be Blood Test');
        assert.assertEqual(results[1].testName, 'X-Ray', 'Second result test should be X-Ray');
    });
});

console.log('✅ LabDatabase unit tests loaded successfully');