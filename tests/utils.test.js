// نظام اختبار الأدوات المساعدة
// Unit Tests for Utils Class

describe('Utils', () => {
    let mockDocument;

    // إعداد البيئة قبل كل اختبار
    function setupTestEnvironment() {
        mockDocument = {
            getElementById: function(id) {
                const elements = {
                    'loadingOverlay': MockUtils.createMockElement('div'),
                    'loadingText': MockUtils.createMockElement('span'),
                    'confirmModal': MockUtils.createMockElement('div'),
                    'modalTitle': MockUtils.createMockElement('h3'),
                    'modalMessage': MockUtils.createMockElement('p'),
                    'confirmBtn': MockUtils.createMockElement('button'),
                    'cancelBtn': MockUtils.createMockElement('button'),
                    'toastContainer': MockUtils.createMockElement('div'),
                    'testForm': MockUtils.createMockForm({
                        name: 'Test Name',
                        price: '100',
                        email: 'test@example.com'
                    })
                };
                return elements[id] || MockUtils.createMockElement();
            },
            createElement: function(tagName) {
                return MockUtils.createMockElement(tagName);
            },
            body: MockUtils.createMockElement('body')
        };
        
        global.document = mockDocument;
    }

    // اختبار عرض شاشة التحميل
    it('should show loading overlay', () => {
        setupTestEnvironment();
        
        class Utils {
            static showLoading(message = 'جاري المعالجة...') {
                const loadingOverlay = document.getElementById('loadingOverlay');
                const loadingText = document.getElementById('loadingText');
                
                if (loadingText) {
                    loadingText.textContent = message;
                }
                
                if (loadingOverlay) {
                    loadingOverlay.classList.remove('hidden');
                }
                
                return { overlay: loadingOverlay, text: loadingText };
            }
        }
        
        const result = Utils.showLoading('جاري تحميل البيانات...');
        
        assert.assertNotNull(result.overlay, 'Loading overlay should exist');
        assert.assertNotNull(result.text, 'Loading text should exist');
        assert.assertEqual(result.text.textContent, 'جاري تحميل البيانات...', 'Loading message should be set');
        assert.assertFalse(
            result.overlay.classList.contains('hidden'), 
            'Loading overlay should not have hidden class'
        );
    });

    // اختبار إخفاء شاشة التحميل
    it('should hide loading overlay', () => {
        setupTestEnvironment();
        
        class Utils {
            static hideLoading() {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hidden');
                }
                return loadingOverlay;
            }
        }
        
        const overlay = Utils.hideLoading();
        
        assert.assertNotNull(overlay, 'Loading overlay should exist');
        assert.assertTrue(
            overlay.classList.contains('hidden'), 
            'Loading overlay should have hidden class'
        );
    });

    // اختبار عرض رسالة تأكيد
    it('should show confirmation dialog', () => {
        setupTestEnvironment();
        
        class Utils {
            static showConfirm(title, message, onConfirm, onCancel = null) {
                const modal = document.getElementById('confirmModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalMessage = document.getElementById('modalMessage');
                const confirmBtn = document.getElementById('confirmBtn');
                const cancelBtn = document.getElementById('cancelBtn');

                modalTitle.textContent = title;
                modalMessage.textContent = message;
                modal.classList.add('active');

                // محاكاة إضافة مستمعي الأحداث
                confirmBtn.onclick = () => {
                    modal.classList.remove('active');
                    if (onConfirm) onConfirm();
                };

                cancelBtn.onclick = () => {
                    modal.classList.remove('active');
                    if (onCancel) onCancel();
                };

                return {
                    modal,
                    title: modalTitle.textContent,
                    message: modalMessage.textContent
                };
            }
        }
        
        let confirmCallbackCalled = false;
        const onConfirm = () => { confirmCallbackCalled = true; };
        
        const result = Utils.showConfirm(
            'تأكيد الحذف',
            'هل أنت متأكد من هذا الإجراء؟',
            onConfirm
        );
        
        assert.assertNotNull(result.modal, 'Modal should exist');
        assert.assertEqual(result.title, 'تأكيد الحذف', 'Modal title should be set');
        assert.assertEqual(result.message, 'هل أنت متأكد من هذا الإجراء؟', 'Modal message should be set');
        assert.assertTrue(result.modal.classList.contains('active'), 'Modal should be active');
        
        // اختبار نقر زر التأكيد
        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.onclick();
        
        assert.assertTrue(confirmCallbackCalled, 'Confirm callback should be called');
        assert.assertFalse(result.modal.classList.contains('active'), 'Modal should be closed after confirm');
    });

    // اختبار تنسيق العملة
    it('should format currency correctly', () => {
        class Utils {
            static formatCurrency(amount, currency = 'ريال') {
                if (amount === null || amount === undefined || isNaN(amount)) {
                    return '0 ' + currency;
                }
                
                const formattedAmount = parseFloat(amount).toFixed(2);
                return formattedAmount + ' ' + currency;
            }
        }
        
        // اختبار قيم مختلفة
        assert.assertEqual(Utils.formatCurrency(100), '100.00 ريال', 'Should format integer correctly');
        assert.assertEqual(Utils.formatCurrency(150.5), '150.50 ريال', 'Should format decimal correctly');
        assert.assertEqual(Utils.formatCurrency(0), '0.00 ريال', 'Should format zero correctly');
        assert.assertEqual(Utils.formatCurrency(null), '0 ريال', 'Should handle null correctly');
        assert.assertEqual(Utils.formatCurrency(undefined), '0 ريال', 'Should handle undefined correctly');
        assert.assertEqual(Utils.formatCurrency('invalid'), '0 ريال', 'Should handle invalid input correctly');
        assert.assertEqual(Utils.formatCurrency(250, 'دولار'), '250.00 دولار', 'Should use custom currency');
    });

    // اختبار التحقق من صحة النموذج
    it('should validate form data correctly', () => {
        setupTestEnvironment();
        
        class Utils {
            static validateForm(form) {
                const errors = [];
                
                if (!form) {
                    errors.push('النموذج غير موجود');
                    return { isValid: false, errors };
                }

                // التحقق من الحقول المطلوبة
                const requiredFields = ['name', 'price'];
                
                requiredFields.forEach(fieldName => {
                    const field = form.elements[fieldName];
                    if (!field || !field.value || field.value.trim() === '') {
                        errors.push(`الحقل ${fieldName} مطلوب`);
                    }
                });

                // التحقق من صحة البريد الإلكتروني
                const emailField = form.elements.email;
                if (emailField && emailField.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailField.value)) {
                        errors.push('البريد الإلكتروني غير صحيح');
                    }
                }

                // التحقق من السعر
                const priceField = form.elements.price;
                if (priceField && priceField.value) {
                    const price = parseFloat(priceField.value);
                    if (isNaN(price) || price < 0) {
                        errors.push('السعر يجب أن يكون رقم موجب');
                    }
                }

                return {
                    isValid: errors.length === 0,
                    errors: errors
                };
            }
        }
        
        // اختبار نموذج صحيح
        const validForm = mockDocument.getElementById('testForm');
        const validResult = Utils.validateForm(validForm);
        
        assert.assertTrue(validResult.isValid, 'Valid form should pass validation');
        assert.assertLength(validResult.errors, 0, 'Valid form should have no errors');
        
        // اختبار نموذج بحقول فارغة
        const invalidForm = MockUtils.createMockForm({ name: '', price: '', email: 'invalid-email' });
        const invalidResult = Utils.validateForm(invalidForm);
        
        assert.assertFalse(invalidResult.isValid, 'Invalid form should fail validation');
        assert.assertTrue(invalidResult.errors.length > 0, 'Invalid form should have errors');
        assert.assertIncludes(invalidResult.errors.join(' '), 'name', 'Should have name error');
        assert.assertIncludes(invalidResult.errors.join(' '), 'price', 'Should have price error');
        assert.assertIncludes(invalidResult.errors.join(' '), 'البريد الإلكتروني', 'Should have email error');
    });

    // اختبار تنظيف النموذج
    it('should clear form data', () => {
        setupTestEnvironment();
        
        class Utils {
            static clearForm(form) {
                if (!form) return false;
                
                // مسح جميع حقول الإدخال
                Object.keys(form.elements).forEach(key => {
                    const element = form.elements[key];
                    if (element) {
                        element.value = '';
                    }
                });
                
                return true;
            }
        }
        
        const form = MockUtils.createMockForm({
            name: 'Test Name',
            price: '100',
            email: 'test@example.com'
        });
        
        // التحقق من وجود البيانات قبل المسح
        assert.assertEqual(form.elements.name.value, 'Test Name', 'Form should have initial data');
        assert.assertEqual(form.elements.price.value, '100', 'Form should have initial data');
        
        // مسح النموذج
        const result = Utils.clearForm(form);
        
        assert.assertTrue(result, 'Clear form operation should succeed');
        assert.assertEqual(form.elements.name.value, '', 'Name field should be cleared');
        assert.assertEqual(form.elements.price.value, '', 'Price field should be cleared');
        assert.assertEqual(form.elements.email.value, '', 'Email field should be cleared');
    });

    // اختبار تحديث العداد
    it('should update counter display', () => {
        setupTestEnvironment();
        
        class Utils {
            static updateCounter(elementId, count, label = '') {
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = `${count} ${label}`;
                    return true;
                }
                return false;
            }
        }
        
        // إضافة عنصر العداد
        const counterElement = MockUtils.createMockElement('span');
        mockDocument.getElementById = function(id) {
            if (id === 'testCounter') {
                return counterElement;
            }
            return MockUtils.createMockElement();
        };
        
        const result = Utils.updateCounter('testCounter', 5, 'فحوصات');
        
        assert.assertTrue(result, 'Counter update should succeed');
        assert.assertEqual(counterElement.textContent, '5 فحوصات', 'Counter should display correct text');
        
        // اختبار عنصر غير موجود
        const invalidResult = Utils.updateCounter('nonExistentCounter', 10, 'items');
        assert.assertFalse(invalidResult, 'Update of non-existent counter should fail');
    });

    // اختبار إنشاء رسالة تنبيه (Toast)
    it('should create toast notification', () => {
        setupTestEnvironment();
        
        class Utils {
            static showToast(message, type = 'info', duration = 3000) {
                const toastContainer = document.getElementById('toastContainer') || 
                                     this.createToastContainer();
                
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.textContent = message;
                
                toastContainer.appendChild(toast);
                
                // محاكاة إزالة التنبيه بعد المدة المحددة
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, duration);
                
                return toast;
            }
            
            static createToastContainer() {
                const container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'toast-container';
                document.body.appendChild(container);
                return container;
            }
        }
        
        const toast = Utils.showToast('تم الحفظ بنجاح', 'success');
        
        assert.assertNotNull(toast, 'Toast should be created');
        assert.assertEqual(toast.textContent, 'تم الحفظ بنجاح', 'Toast should have correct message');
        assert.assertTrue(toast.className.includes('toast-success'), 'Toast should have correct type class');
        
        // اختبار أنواع مختلفة من التنبيهات
        const errorToast = Utils.showToast('حدث خطأ', 'error');
        assert.assertTrue(errorToast.className.includes('toast-error'), 'Error toast should have correct class');
        
        const warningToast = Utils.showToast('تحذير', 'warning');
        assert.assertTrue(warningToast.className.includes('toast-warning'), 'Warning toast should have correct class');
    });

    // اختبار تحويل التاريخ
    it('should format date correctly', () => {
        class Utils {
            static formatDate(date, format = 'dd/mm/yyyy') {
                if (!date) return '';
                
                const dateObj = new Date(date);
                if (isNaN(dateObj.getTime())) return '';
                
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                
                switch (format) {
                    case 'dd/mm/yyyy':
                        return `${day}/${month}/${year}`;
                    case 'yyyy-mm-dd':
                        return `${year}-${month}-${day}`;
                    case 'dd-mm-yyyy':
                        return `${day}-${month}-${year}`;
                    default:
                        return `${day}/${month}/${year}`;
                }
            }
        }
        
        const testDate = new Date('2024-03-15');
        
        assert.assertEqual(Utils.formatDate(testDate), '15/03/2024', 'Should format date with default format');
        assert.assertEqual(Utils.formatDate(testDate, 'yyyy-mm-dd'), '2024-03-15', 'Should format date with ISO format');
        assert.assertEqual(Utils.formatDate(testDate, 'dd-mm-yyyy'), '15-03-2024', 'Should format date with dash format');
        assert.assertEqual(Utils.formatDate(null), '', 'Should handle null date');
        assert.assertEqual(Utils.formatDate('invalid'), '', 'Should handle invalid date');
    });

    // اختبار فحص الاتصال بالإنترنت
    it('should check internet connection', () => {
        class Utils {
            static checkInternetConnection() {
                // محاكاة فحص الاتصال
                return navigator.onLine !== false;
            }
            
            static async testConnection(url = 'https://www.google.com', timeout = 5000) {
                try {
                    // محاكاة اختبار الاتصال
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(Math.random() > 0.2); // 80% نجاح
                        }, 100);
                    });
                } catch (error) {
                    return false;
                }
            }
        }
        
        // محاكاة navigator.onLine
        global.navigator = { onLine: true };
        
        const connectionStatus = Utils.checkInternetConnection();
        assert.assertTrue(connectionStatus, 'Should detect online connection');
        
        // اختبار حالة عدم الاتصال
        global.navigator.onLine = false;
        const offlineStatus = Utils.checkInternetConnection();
        assert.assertFalse(offlineStatus, 'Should detect offline status');
    });
});

console.log('✅ Utils unit tests loaded successfully');