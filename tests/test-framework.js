// Simple JavaScript Testing Framework for Lab Management System
// نظام اختبار بسيط لنظام إدارة المعمل الطبي

class TestFramework {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentSuite = '';
    }

    // تسجيل مجموعة اختبارات جديدة
    describe(suiteName, callback) {
        this.currentSuite = suiteName;
        console.log(`\n📋 Running test suite: ${suiteName}`);
        callback();
    }

    // تسجيل اختبار فردي
    it(testName, callback) {
        const fullTestName = `${this.currentSuite} - ${testName}`;
        this.tests.push({
            name: fullTestName,
            callback: callback
        });
    }

    // تشغيل جميع الاختبارات
    async run() {
        console.log('🚀 Starting Test Execution...\n');
        
        let passed = 0;
        let failed = 0;

        for (const test of this.tests) {
            try {
                await test.callback();
                console.log(`✅ PASS: ${test.name}`);
                this.results.push({ name: test.name, status: 'PASS' });
                passed++;
            } catch (error) {
                console.log(`❌ FAIL: ${test.name}`);
                console.log(`   Error: ${error.message}`);
                this.results.push({ 
                    name: test.name, 
                    status: 'FAIL', 
                    error: error.message 
                });
                failed++;
            }
        }

        this.printSummary(passed, failed);
        return { passed, failed, total: this.tests.length };
    }

    // طباعة ملخص النتائج
    printSummary(passed, failed) {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Total: ${passed + failed}`);
        console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));
    }
}

// مساعدات الاختبار
class TestAssertions {
    // التحقق من المساواة
    static assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`);
        }
    }

    // التحقق من المساواة العميقة للكائنات
    static assertDeepEqual(actual, expected, message = '') {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Deep assertion failed: ${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    }

    // التحقق من الصحة
    static assertTrue(condition, message = '') {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}\nExpected: true\nActual: ${condition}`);
        }
    }

    // التحقق من الخطأ
    static assertFalse(condition, message = '') {
        if (condition) {
            throw new Error(`Assertion failed: ${message}\nExpected: false\nActual: ${condition}`);
        }
    }

    // التحقق من وجود القيمة
    static assertNotNull(value, message = '') {
        if (value === null || value === undefined) {
            throw new Error(`Assertion failed: ${message}\nValue should not be null or undefined`);
        }
    }

    // التحقق من عدم وجود القيمة
    static assertNull(value, message = '') {
        if (value !== null && value !== undefined) {
            throw new Error(`Assertion failed: ${message}\nExpected: null or undefined\nActual: ${value}`);
        }
    }

    // التحقق من وجود خاصية في كائن
    static assertHasProperty(object, property, message = '') {
        if (!object || !object.hasOwnProperty(property)) {
            throw new Error(`Assertion failed: ${message}\nObject does not have property: ${property}`);
        }
    }

    // التحقق من النوع
    static assertType(value, expectedType, message = '') {
        const actualType = typeof value;
        if (actualType !== expectedType) {
            throw new Error(`Type assertion failed: ${message}\nExpected type: ${expectedType}\nActual type: ${actualType}`);
        }
    }

    // التحقق من أن الدالة تُلقي خطأ
    static async assertThrows(asyncFunction, expectedErrorMessage = null, message = '') {
        try {
            await asyncFunction();
            throw new Error(`Assertion failed: ${message}\nExpected function to throw an error`);
        } catch (error) {
            if (expectedErrorMessage && !error.message.includes(expectedErrorMessage)) {
                throw new Error(`Assertion failed: ${message}\nExpected error message to contain: ${expectedErrorMessage}\nActual error: ${error.message}`);
            }
        }
    }

    // التحقق من أن المصفوفة تحتوي على عنصر
    static assertIncludes(array, item, message = '') {
        if (!Array.isArray(array) || !array.includes(item)) {
            throw new Error(`Assertion failed: ${message}\nArray does not include: ${item}\nArray: ${JSON.stringify(array)}`);
        }
    }

    // التحقق من طول المصفوفة
    static assertLength(array, expectedLength, message = '') {
        if (!Array.isArray(array) || array.length !== expectedLength) {
            throw new Error(`Length assertion failed: ${message}\nExpected length: ${expectedLength}\nActual length: ${array ? array.length : 'undefined'}`);
        }
    }
}

// إنشاء مثيل عام من إطار الاختبار
const testFramework = new TestFramework();

// تصدير الدوال للاستخدام العام
window.describe = testFramework.describe.bind(testFramework);
window.it = testFramework.it.bind(testFramework);
window.assert = TestAssertions;
window.runTests = testFramework.run.bind(testFramework);

// Mock و Stub للاختبارات
class MockUtils {
    // إنشاء mock لقاعدة البيانات
    static createMockDatabase() {
        return {
            tests: [],
            results: [],
            hospital: {},
            
            // محاكاة عمليات قاعدة البيانات
            getAllTests: async function() {
                return Promise.resolve([...this.tests]);
            },
            
            addTest: async function(testData) {
                const newTest = { 
                    id: Date.now(), 
                    ...testData 
                };
                this.tests.push(newTest);
                return Promise.resolve(newTest);
            },
            
            updateTest: async function(id, testData) {
                const index = this.tests.findIndex(t => t.id === id);
                if (index === -1) {
                    throw new Error('Test not found');
                }
                this.tests[index] = { ...this.tests[index], ...testData };
                return Promise.resolve(this.tests[index]);
            },
            
            deleteTest: async function(id) {
                const index = this.tests.findIndex(t => t.id === id);
                if (index === -1) {
                    throw new Error('Test not found');
                }
                this.tests.splice(index, 1);
                return Promise.resolve(true);
            },
            
            // محاكاة عمليات نتائج المرضى
            getAllResults: async function() {
                return Promise.resolve([...this.results]);
            },
            
            addResult: async function(resultData) {
                const newResult = { 
                    id: Date.now(), 
                    ...resultData 
                };
                this.results.push(newResult);
                return Promise.resolve(newResult);
            },
            
            // محاكاة معلومات المستشفى
            getHospitalInfo: async function() {
                return Promise.resolve({...this.hospital});
            },
            
            updateHospitalInfo: async function(hospitalData) {
                this.hospital = { ...this.hospital, ...hospitalData };
                return Promise.resolve(this.hospital);
            }
        };
    }

    // إنشاء mock للـ DOM elements
    static createMockElement(tagName = 'div', properties = {}) {
        const element = {
            tagName: tagName.toUpperCase(),
            innerHTML: '',
            textContent: '',
            value: '',
            classList: {
                add: function(className) { this.classes = this.classes || []; this.classes.push(className); },
                remove: function(className) { this.classes = this.classes || []; const index = this.classes.indexOf(className); if (index > -1) this.classes.splice(index, 1); },
                contains: function(className) { this.classes = this.classes || []; return this.classes.includes(className); },
                classes: []
            },
            addEventListener: function(event, callback) {
                this.events = this.events || {};
                this.events[event] = this.events[event] || [];
                this.events[event].push(callback);
            },
            removeEventListener: function(event, callback) {
                this.events = this.events || {};
                if (this.events[event]) {
                    const index = this.events[event].indexOf(callback);
                    if (index > -1) this.events[event].splice(index, 1);
                }
            },
            dispatchEvent: function(event) {
                this.events = this.events || {};
                if (this.events[event.type]) {
                    this.events[event.type].forEach(callback => callback(event));
                }
            },
            querySelector: function(selector) {
                return MockUtils.createMockElement();
            },
            querySelectorAll: function(selector) {
                return [MockUtils.createMockElement()];
            },
            appendChild: function(child) {
                this.children = this.children || [];
                this.children.push(child);
            },
            scrollIntoView: function() {},
            ...properties
        };
        
        return element;
    }

    // إنشاء mock للنموذج
    static createMockForm(fields = {}) {
        const form = MockUtils.createMockElement('form');
        form.elements = {};
        
        Object.keys(fields).forEach(fieldName => {
            const field = MockUtils.createMockElement('input', { value: fields[fieldName] });
            form.elements[fieldName] = field;
        });
        
        form.querySelector = function(selector) {
            const fieldName = selector.replace('#', '');
            return this.elements[fieldName] || MockUtils.createMockElement();
        };
        
        return form;
    }

    // محاكاة Utils
    static createMockUtils() {
        return {
            showLoading: function(message) { console.log(`Loading: ${message}`); },
            hideLoading: function() { console.log('Loading hidden'); },
            showToast: function(message, type) { console.log(`Toast [${type}]: ${message}`); },
            showConfirm: function(title, message, onConfirm) { onConfirm(); },
            validateForm: function(form) { return { isValid: true, errors: [] }; },
            clearForm: function(form) { console.log('Form cleared'); },
            formatCurrency: function(amount) { return `${amount} ريال`; },
            updateCounter: function(elementId, count, label) { console.log(`Counter ${elementId}: ${count} ${label}`); }
        };
    }
}

window.MockUtils = MockUtils;

console.log('🔧 Test Framework initialized successfully');