// نظام إدارة المعمل الطبي - قاعدة البيانات IndexedDB

class LabDatabase {
    constructor() {
        this.dbName = 'LabManagementDB';
        this.dbVersion = 1;
        this.db = null;
    }

    // فتح قاعدة البيانات وإنشاء الجداول
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('خطأ في فتح قاعدة البيانات:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // إنشاء جدول المستشفى
                if (!db.objectStoreNames.contains('hospital')) {
                    const hospitalStore = db.createObjectStore('hospital', { keyPath: 'id', autoIncrement: true });
                    console.log('تم إنشاء جدول المستشفى');
                }

                // إنشاء جدول الفحوصات
                if (!db.objectStoreNames.contains('tests')) {
                    const testsStore = db.createObjectStore('tests', { keyPath: 'id', autoIncrement: true });
                    testsStore.createIndex('name', 'name', { unique: true });
                    console.log('تم إنشاء جدول الفحوصات');
                }

                // إنشاء جدول نتائج المرضى
                if (!db.objectStoreNames.contains('results')) {
                    const resultsStore = db.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
                    resultsStore.createIndex('patientName', 'patientName', { unique: false });
                    resultsStore.createIndex('patientID', 'patientID', { unique: false });
                    resultsStore.createIndex('date', 'date', { unique: false });
                    console.log('تم إنشاء جدول نتائج المرضى');
                }
            };
        });
    }

    // إضافة أو تعديل بيانات المستشفى
    async saveHospitalData(data) {
        if (!this.db) {
            throw new Error('قاعدة البيانات غير مهيئة');
        }

        try {
            const transaction = this.db.transaction(['hospital'], 'readwrite');
            const store = transaction.objectStore('hospital');

            // التحقق من وجود بيانات مسبقة
            const existingData = await this.getHospitalData();
            
            if (existingData) {
                // تعديل البيانات الموجودة
                data.id = existingData.id;
                data.updatedAt = new Date().toISOString();
            } else {
                // إضافة بيانات جديدة
                data.createdAt = new Date().toISOString();
            }

            return new Promise((resolve, reject) => {
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('خطأ في حفظ بيانات المستشفى:', error);
            throw error;
        }
    }

    // جلب بيانات المستشفى
    async getHospitalData() {
        if (!this.db) {
            console.warn('قاعدة البيانات غير مهيئة');
            return null;
        }

        try {
            const transaction = this.db.transaction(['hospital'], 'readonly');
            const store = transaction.objectStore('hospital');

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const results = request.result;
                    resolve(results.length > 0 ? results[0] : null);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('خطأ في جلب بيانات المستشفى:', error);
            return null;
        }
    }

    // إضافة فحص جديد
    async addTest(testData) {
        const transaction = this.db.transaction(['tests'], 'readwrite');
        const store = transaction.objectStore('tests');

        testData.createdAt = new Date().toISOString();
        testData.updatedAt = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const request = store.add(testData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                if (request.error.name === 'ConstraintError') {
                    reject(new Error('اسم الفحص موجود مسبقاً'));
                } else {
                    reject(request.error);
                }
            };
        });
    }

    // تعديل فحص موجود
    async updateTest(id, testData) {
        const transaction = this.db.transaction(['tests'], 'readwrite');
        const store = transaction.objectStore('tests');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const existingTest = getRequest.result;
                if (existingTest) {
                    const updatedTest = { ...existingTest, ...testData };
                    updatedTest.updatedAt = new Date().toISOString();
                    
                    const putRequest = store.put(updatedTest);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('الفحص غير موجود'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // حذف فحص
    async deleteTest(id) {
        const transaction = this.db.transaction(['tests'], 'readwrite');
        const store = transaction.objectStore('tests');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب جميع الفحوصات
    async getAllTests() {
        const transaction = this.db.transaction(['tests'], 'readonly');
        const store = transaction.objectStore('tests');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // البحث في الفحوصات
    async searchTests(searchTerm) {
        const allTests = await this.getAllTests();
        const searchLower = searchTerm.toLowerCase();
        
        return allTests.filter(test => 
            test.name.toLowerCase().includes(searchLower) ||
            (test.desc && test.desc.toLowerCase().includes(searchLower))
        );
    }

    // إضافة نتيجة مريض
    async addPatientResult(patientData) {
        const transaction = this.db.transaction(['results'], 'readwrite');
        const store = transaction.objectStore('results');

        patientData.date = new Date().toISOString();
        patientData.createdAt = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const request = store.add(patientData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // تعديل نتيجة مريض
    async updatePatientResult(id, patientData) {
        const transaction = this.db.transaction(['results'], 'readwrite');
        const store = transaction.objectStore('results');

        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const existingResult = getRequest.result;
                if (existingResult) {
                    const updatedResult = { ...existingResult, ...patientData };
                    updatedResult.updatedAt = new Date().toISOString();
                    
                    const putRequest = store.put(updatedResult);
                    putRequest.onsuccess = () => resolve(putRequest.result);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('نتيجة المريض غير موجودة'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // حذف نتيجة مريض
    async deletePatientResult(id) {
        const transaction = this.db.transaction(['results'], 'readwrite');
        const store = transaction.objectStore('results');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب جميع نتائج المرضى
    async getAllPatientResults() {
        const transaction = this.db.transaction(['results'], 'readonly');
        const store = transaction.objectStore('results');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // البحث في نتائج المرضى
    async searchPatientResults(searchTerm) {
        const allResults = await this.getAllPatientResults();
        const searchLower = searchTerm.toLowerCase();
        
        return allResults.filter(result => 
            result.patientName.toLowerCase().includes(searchLower) ||
            result.patientID.toLowerCase().includes(searchLower)
        );
    }

    // جلب نتائج مريض محدد
    async getPatientResultsByID(patientID) {
        const transaction = this.db.transaction(['results'], 'readonly');
        const store = transaction.objectStore('results');
        const index = store.index('patientID');

        return new Promise((resolve, reject) => {
            const request = index.getAll(patientID);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // جلب النتائج حسب الفترة الزمنية
    async getResultsByDateRange(startDate, endDate) {
        const allResults = await this.getAllPatientResults();
        
        return allResults.filter(result => {
            const resultDate = new Date(result.date);
            return resultDate >= new Date(startDate) && resultDate <= new Date(endDate);
        });
    }

    // حساب الإحصائيات
    async getStatistics() {
        const [hospitalData, tests, results] = await Promise.all([
            this.getHospitalData(),
            this.getAllTests(),
            this.getAllPatientResults()
        ]);

        // إحصائيات الفحوصات
        const totalTests = tests.length;
        const avgPrice = tests.length > 0 ? 
            tests.reduce((sum, test) => sum + parseFloat(test.price), 0) / tests.length : 0;

        // إحصائيات المرضى
        const totalPatients = results.length;
        const totalRevenue = results.reduce((sum, result) => {
            return sum + result.testsResults.reduce((testSum, test) => 
                testSum + parseFloat(test.price || 0), 0);
        }, 0);

        // إحصائيات اليوم
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayResults = results.filter(result => 
            new Date(result.date) >= today
        );

        // إحصائيات الشهر
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthResults = results.filter(result => 
            new Date(result.date) >= monthStart
        );

        return {
            hospital: hospitalData,
            tests: {
                total: totalTests,
                avgPrice: avgPrice.toFixed(2)
            },
            patients: {
                total: totalPatients,
                today: todayResults.length,
                thisMonth: monthResults.length
            },
            revenue: {
                total: totalRevenue.toFixed(2),
                today: todayResults.reduce((sum, result) => 
                    sum + result.testsResults.reduce((testSum, test) => 
                        testSum + parseFloat(test.price || 0), 0), 0).toFixed(2),
                thisMonth: monthResults.reduce((sum, result) => 
                    sum + result.testsResults.reduce((testSum, test) => 
                        testSum + parseFloat(test.price || 0), 0), 0).toFixed(2)
            }
        };
    }

    // تصدير جميع البيانات
    async exportAllData() {
        const [hospital, tests, results] = await Promise.all([
            this.getHospitalData(),
            this.getAllTests(),
            this.getAllPatientResults()
        ]);

        return {
            version: this.dbVersion,
            exportDate: new Date().toISOString(),
            data: {
                hospital,
                tests,
                results
            }
        };
    }

    // استيراد البيانات
    async importAllData(data) {
        const transaction = this.db.transaction(['hospital', 'tests', 'results'], 'readwrite');

        try {
            // حذف البيانات الموجودة
            await this.clearAllData();

            // استيراد بيانات المستشفى
            if (data.data.hospital) {
                const hospitalStore = transaction.objectStore('hospital');
                const hospitalData = { ...data.data.hospital };
                delete hospitalData.id; // إزالة ID للسماح بإنشاء جديد
                await new Promise((resolve, reject) => {
                    const request = hospitalStore.add(hospitalData);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            // استيراد الفحوصات
            if (data.data.tests && data.data.tests.length > 0) {
                const testsStore = transaction.objectStore('tests');
                for (const test of data.data.tests) {
                    const testData = { ...test };
                    delete testData.id;
                    await new Promise((resolve, reject) => {
                        const request = testsStore.add(testData);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            }

            // استيراد نتائج المرضى
            if (data.data.results && data.data.results.length > 0) {
                const resultsStore = transaction.objectStore('results');
                for (const result of data.data.results) {
                    const resultData = { ...result };
                    delete resultData.id;
                    await new Promise((resolve, reject) => {
                        const request = resultsStore.add(resultData);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            throw error;
        }
    }

    // حذف جميع البيانات
    async clearAllData() {
        const transaction = this.db.transaction(['hospital', 'tests', 'results'], 'readwrite');

        const clearStore = (storeName) => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        };

        await Promise.all([
            clearStore('hospital'),
            clearStore('tests'),
            clearStore('results')
        ]);
    }
}

// إنشاء مثيل وحيد من قاعدة البيانات
const labDB = new LabDatabase();