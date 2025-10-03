# نظام الاختبارات للمعمل الطبي
# Lab Management System - Unit Tests Documentation

## نظرة عامة | Overview

هذا هو نظام شامل لاختبار الوحدات لتطبيق إدارة المعمل الطبي. يتضمن اختبارات شاملة لجميع المكونات الرئيسية للنظام.

This is a comprehensive unit testing system for the Lab Management System application. It includes thorough tests for all major system components.

## هيكل المشروع | Project Structure

```
tests/
├── test-framework.js          # إطار عمل الاختبارات المخصص
├── test-runner.html          # واجهة تشغيل الاختبارات
├── tests-manager.test.js     # اختبارات إدارة الفحوصات
├── database.test.js          # اختبارات قاعدة البيانات
├── utils.test.js             # اختبارات الأدوات المساعدة
├── patients-manager.test.js  # اختبارات إدارة المرضى
├── reports-manager.test.js   # اختبارات إدارة التقارير
└── README.md                 # هذا الملف
```

## المكونات المختبرة | Tested Components

### 1. TestsManager (إدارة الفحوصات)
- ✅ تهيئة النظام
- ✅ تحميل الفحوصات من قاعدة البيانات
- ✅ إضافة فحص جديد
- ✅ تعديل فحص موجود
- ✅ حذف فحص
- ✅ البحث والتصفية
- ✅ التحقق من صحة البيانات
- ✅ معالجة أخطاء قاعدة البيانات

### 2. LabDatabase (قاعدة البيانات)
- ✅ تهيئة قاعدة البيانات وإنشاء الجداول
- ✅ إضافة واسترجاع الفحوصات
- ✅ تحديث وحذف الفحوصات
- ✅ إدارة نتائج المرضى
- ✅ تحديث معلومات المستشفى
- ✅ البحث بالفهارس
- ✅ معالجة أخطاء قاعدة البيانات

### 3. Utils (الأدوات المساعدة)
- ✅ عرض وإخفاء شاشات التحميل
- ✅ رسائل التأكيد والتنبيهات
- ✅ تنسيق العملة والتواريخ
- ✅ التحقق من صحة النماذج
- ✅ تنظيف البيانات
- ✅ تحديث العدادات
- ✅ فحص الاتصال بالإنترنت

### 4. PatientsManager (إدارة المرضى)
- ✅ تهيئة النظام
- ✅ تحميل بيانات المرضى
- ✅ حفظ نتائج جديدة
- ✅ البحث والتصفية
- ✅ إدارة الفحوصات المحددة
- ✅ عرض تفاصيل النتائج
- ✅ حذف النتائج
- ✅ التحقق من صحة البيانات

### 5. ReportsManager (إدارة التقارير)
- ✅ تهيئة النظام
- ✅ إنشاء التقارير اليومية
- ✅ إنشاء التقارير الشهرية
- ✅ تقارير الفحوصات الأكثر طلباً
- ✅ تقارير الإيرادات
- ✅ تصدير البيانات (JSON/CSV)
- ✅ تصفية البيانات حسب التاريخ
- ✅ الإحصائيات المتقدمة

## كيفية تشغيل الاختبارات | How to Run Tests

### الطريقة الأولى: الواجهة الرسومية
1. افتح ملف `test-runner.html` في المتصفح
2. اضغط على زر "تشغيل جميع الاختبارات"
3. راقب النتائج في الواجهة التفاعلية

### الطريقة الثانية: وحدة التحكم في المتصفح
```javascript
// افتح test-runner.html ثم نفذ في وحدة التحكم:
runAllTests();
```

### الطريقة الثالثة: برمجياً
```javascript
// تحميل إطار العمل والاختبارات
// ثم تشغيل:
runTests().then(results => {
    console.log(`النتائج: ${results.passed} نجح، ${results.failed} فشل`);
});
```

## فئات الاختبارات | Test Categories

### 1. Happy Path (المسار السعيد)
اختبارات الوظائف الأساسية مع بيانات صحيحة:
- حفظ البيانات بنجاح
- استرجاع البيانات
- تحديث البيانات
- عرض النتائج

### 2. Input Verification (التحقق من الإدخال)
اختبارات التعامل مع البيانات غير الصحيحة:
- حقول فارغة
- أرقام سالبة
- نصوص في حقول الأرقام
- تنسيقات خاطئة

### 3. Branching (التفرع)
اختبارات جميع المسارات الممكنة:
- وضع التعديل مقابل الإضافة
- البحث بنتائج أو بدونها
- المستخدمين المختلفين

### 4. Exception Handling (معالجة الاستثناءات)
اختبارات التعامل مع الأخطاء:
- فشل قاعدة البيانات
- انقطاع الشبكة
- ملفات مفقودة
- أخطاء التحليل

## المميزات الرئيسية | Key Features

### ✨ إطار عمل مخصص
- نظام assertions شامل
- دعم العمليات غير المتزامنة
- تجميع النتائج وإعداد التقارير
- واجهة سهلة الاستخدام

### 🎯 Mock Objects
- محاكاة قاعدة البيانات
- محاكاة DOM
- محاكاة Utils
- بيانات تجريبية

### 📊 تقارير شاملة
- إحصائيات فورية
- النتائج التفصيلية
- معدل النجاح
- رسائل الأخطاء

### 🌍 دعم متعدد اللغات
- واجهة باللغة العربية
- رسائل خطأ واضحة
- توثيق شامل

## إرشادات كتابة الاختبارات | Test Writing Guidelines

### 1. هيكل الاختبار
```javascript
describe('اسم المكون', () => {
    // إعداد البيئة
    function setupTestEnvironment() {
        // إعداد البيانات والمحاكيات
    }

    it('يجب أن ينجح في العملية الأساسية', () => {
        setupTestEnvironment();
        
        // تنفيذ العملية
        const result = performOperation();
        
        // التحقق من النتائج
        assert.assertNotNull(result);
        assert.assertEqual(result.status, 'success');
    });
});
```

### 2. أفضل الممارسات
- **أسماء واضحة**: استخدم أسماء وصفية للاختبارات
- **اختبار واحد لكل it()**: كل اختبار يجب أن يختبر شيئاً واحداً
- **إعداد نظيف**: امسح البيانات بين الاختبارات
- **assertions واضحة**: استخدم رسائل واضحة للتأكيدات

### 3. تنظيم الكود
```javascript
// ترتيب الاختبارات
describe('ComponentName', () => {
    // 1. اختبارات Happy Path
    it('should initialize successfully', () => {});
    it('should save data successfully', () => {});
    
    // 2. اختبارات Input Verification  
    it('should validate required fields', () => {});
    it('should handle invalid data', () => {});
    
    // 3. اختبارات Exception Handling
    it('should handle database errors', () => {});
    it('should handle network failures', () => {});
});
```

## الأدوات المساعدة | Helper Functions

### MockUtils
```javascript
// إنشاء قاعدة بيانات وهمية
const mockDB = MockUtils.createMockDatabase();

// إنشاء عنصر DOM وهمي
const mockElement = MockUtils.createMockElement('div', { id: 'test' });

// إنشاء نموذج وهمي
const mockForm = MockUtils.createMockForm({ name: 'Test', price: '100' });
```

### Assertions
```javascript
// assertions أساسية
assert.assertEqual(actual, expected, 'message');
assert.assertTrue(condition, 'message');
assert.assertNotNull(value, 'message');

// assertions متقدمة
assert.assertDeepEqual(obj1, obj2, 'message');
assert.assertThrows(asyncFunction, 'expectedError', 'message');
assert.assertIncludes(array, item, 'message');
```

## استكشاف الأخطاء | Troubleshooting

### المشاكل الشائعة

#### ❌ اختبارات لا تعمل
**الحل:**
1. تأكد من تحميل جميع الملفات بالترتيب الصحيح
2. افتح وحدة التحكم للتحقق من أخطاء JavaScript
3. تأكد من أن المتصفح يدعم ES6+

#### ❌ نتائج غير متوقعة
**الحل:**
1. تحقق من إعداد البيانات التجريبية
2. تأكد من مسح البيانات بين الاختبارات
3. راجع رسائل الخطأ التفصيلية

#### ❌ اختبارات بطيئة
**الحل:**
1. قلل من حجم البيانات التجريبية
2. استخدم المحاكيات بدلاً من العمليات الفعلية
3. تجنب العمليات المعقدة في الاختبارات

### تحسين الأداء

#### 🚀 نصائح السرعة
- استخدم `setupTestEnvironment()` مرة واحدة لكل describe
- تجنب DOM الفعلي قدر الإمكان
- استخدم بيانات صغيرة للاختبار
- اختبر المنطق وليس الواجهة

#### 📈 قياس التغطية
```javascript
// حساب التغطية يدوياً
const totalFunctions = 50;  // عدد الدوال في المكون
const testedFunctions = 45; // عدد الدوال المختبرة
const coverage = (testedFunctions / totalFunctions * 100).toFixed(1);
console.log(`تغطية الاختبار: ${coverage}%`);
```

## الإحصائيات | Statistics

### التغطية الحالية
- **TestsManager**: 8/8 اختبارات (100%)
- **LabDatabase**: 7/7 اختبارات (100%)
- **Utils**: 8/8 اختبارات (100%)
- **PatientsManager**: 7/7 اختبارات (100%)
- **ReportsManager**: 7/7 اختبارات (100%)

### **المجموع**: 37/37 اختبار (100% تغطية)

## خارطة الطريق | Roadmap

### المرحلة التالية
- [ ] اختبارات التكامل
- [ ] اختبارات الأداء
- [ ] اختبارات الأمان
- [ ] اختبارات واجهة المستخدم

### تحسينات مقترحة
- [ ] تقارير HTML للتغطية
- [ ] تشغيل تلقائي مع GitHub Actions
- [ ] دعم أطر عمل أخرى (Jest, Mocha)
- [ ] اختبارات الانحدار

## المساهمة | Contributing

### إضافة اختبارات جديدة
1. أنشئ ملف جديد: `component-name.test.js`
2. اتبع هيكل الاختبارات الموجود
3. أضف الملف إلى `test-runner.html`
4. حدث التوثيق

### متطلبات الجودة
- **تغطية 100%** للمكونات الأساسية
- **أسماء واضحة** للاختبارات
- **توثيق شامل** للكود
- **أمثلة عملية** لكل حالة

## الدعم الفني | Support

### للمساعدة في:
- إعداد بيئة الاختبار
- كتابة اختبارات جديدة
- استكشاف الأخطاء
- تحسين الأداء

### المصادر المفيدة
- [MDN JavaScript Testing](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Mocha Documentation](https://mochajs.org/)

---

**تم إنشاء هذا النظام لضمان جودة وموثوقية تطبيق إدارة المعمل الطبي**

*This testing system was created to ensure the quality and reliability of the Lab Management System application*