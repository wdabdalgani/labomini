// نظام إدارة المعمل الطبي - الأدوات المساعدة

class Utils {
    // عرض شاشة التحميل
    static showLoading(message = 'جاري المعالجة...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    // إخفاء شاشة التحميل
    static hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    // عرض رسالة تأكيد
    static showConfirm(title, message, onConfirm, onCancel = null) {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('active');

        // إزالة مستمعي الأحداث السابقين
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        // إضافة مستمعي أحداث جدد
        newConfirmBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (onConfirm) onConfirm();
        });

        newCancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            if (onCancel) onCancel();
        });

        // إغلاق عند النقر خارج المودال
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                if (onCancel) onCancel();
            }
        });
    }

    // عرض رسالة إشعار
    static showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toastContainer');
        
        if (!toastContainer) {
            console.warn('حاوي الإشعارات غير موجود');
            // إنشاء حاوي الإشعارات إذا لم يكن موجوداً
            this.createToastContainer();
            return this.showToast(message, type, duration);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        try {
            toastContainer.appendChild(toast);

            // إزالة الإشعار بعد المدة المحددة
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);

            // إضافة إمكانية الإغلاق بالنقر
            toast.addEventListener('click', () => {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            });
        } catch (error) {
            console.error('خطأ في عرض الإشعار:', error);
        }
    }

    // إنشاء حاوي الإشعارات إذا لم يكن موجوداً
    static createToastContainer() {
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    // الحصول على أيقونة الإشعار
    static getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // تنسيق التاريخ
    static formatDate(date, includeTime = true) {
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return d.toLocaleDateString('ar-SA', options);
    }

    // تنسيق العملة
    static formatCurrency(amount, currency = 'ريال') {
        const num = parseFloat(amount);
        return isNaN(num) ? '0 ' + currency : num.toFixed(2) + ' ' + currency;
    }

    // التحقق من صحة البيانات
    static validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        const errors = [];

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                errors.push(`${this.getFieldLabel(input)} مطلوب`);
                
                // إزالة حالة الخطأ عند الكتابة
                input.addEventListener('input', function() {
                    this.classList.remove('error');
                }, { once: true });
            } else {
                input.classList.remove('error');
            }

            // التحقق من صحة البريد الإلكتروني
            if (input.type === 'email' && input.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    isValid = false;
                    input.classList.add('error');
                    errors.push('البريد الإلكتروني غير صحيح');
                }
            }

            // التحقق من صحة رقم الهاتف
            if (input.type === 'tel' && input.value) {
                const phoneRegex = /^[0-9+\-\s\(\)]+$/;
                if (!phoneRegex.test(input.value)) {
                    isValid = false;
                    input.classList.add('error');
                    errors.push('رقم الهاتف غير صحيح');
                }
            }

            // التحقق من القيم الرقمية
            if (input.type === 'number' && input.value) {
                const num = parseFloat(input.value);
                if (isNaN(num) || num < 0) {
                    isValid = false;
                    input.classList.add('error');
                    errors.push(`${this.getFieldLabel(input)} يجب أن يكون رقماً صحيحاً`);
                }
            }
        });

        return { isValid, errors };
    }

    // الحصول على تسمية الحقل
    static getFieldLabel(input) {
        const label = input.parentNode.querySelector('label');
        return label ? label.textContent.replace('*', '').trim() : 'الحقل';
    }

    // تنظيف النموذج
    static clearForm(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
            input.classList.remove('error');
        });
    }

    // تحويل البيانات إلى JSON للتصدير
    static downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // قراءة ملف JSON
    static readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('الملف غير صحيح'));
                }
            };
            reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
            reader.readAsText(file);
        });
    }

    // البحث في المصفوفة
    static searchArray(array, searchTerm, fields) {
        if (!searchTerm) return array;
        
        const term = searchTerm.toLowerCase();
        return array.filter(item => {
            return fields.some(field => {
                const value = this.getNestedProperty(item, field);
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    }

    // الحصول على قيمة خاصية متداخلة
    static getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    // ترقيم الصفحات
    static paginate(array, page, limit) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return {
            data: array.slice(startIndex, endIndex),
            totalPages: Math.ceil(array.length / limit),
            currentPage: page,
            totalItems: array.length
        };
    }

    // تحديث عداد العناصر
    static updateCounter(elementId, count, label = 'عنصر') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${count} ${label}`;
        }
    }

    // إنشاء جدول HTML
    static createTable(data, columns, tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${columns.length}" class="text-center">
                        لا توجد بيانات للعرض
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const row = document.createElement('tr');
            columns.forEach(column => {
                const cell = document.createElement('td');
                
                if (column.render) {
                    cell.innerHTML = column.render(item);
                } else {
                    const value = this.getNestedProperty(item, column.field);
                    cell.textContent = value || '';
                }
                
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
    }

    // طباعة التقرير
    static printReport(reportElement) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>تقرير المعمل الطبي</title>
                <meta charset="UTF-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        direction: rtl; 
                        text-align: right;
                        margin: 20px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                    }
                    th, td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: right;
                    }
                    th { 
                        background-color: #f0f0f0; 
                        font-weight: bold;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                    }
                    .report-date {
                        text-align: left;
                        margin-bottom: 20px;
                        font-size: 14px;
                    }
                    @page { margin: 2cm; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h1>نظام إدارة المعمل الطبي</h1>
                    <h2>التقرير المطلوب</h2>
                </div>
                <div class="report-date">
                    تاريخ الطباعة: ${this.formatDate(new Date())}
                </div>
                ${reportElement.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // تصدير إلى PDF (يتطلب مكتبة jsPDF)
    static async exportToPDF(reportElement, filename = 'lab-report.pdf') {
        // هذه وظيفة مبسطة، في التطبيق الفعلي يمكن استخدام مكتبة jsPDF
        this.showToast('ميزة تصدير PDF ستكون متاحة قريباً', 'info');
        
        // يمكن تطبيق تصدير PDF باستخدام:
        // 1. مكتبة jsPDF
        // 2. خدمة ويب للتحويل
        // 3. Puppeteer في حالة Node.js
    }

    // تحديث الإحصائيات
    static updateStatistics(stats) {
        // تحديث إحصائيات الفحوصات
        this.updateCounter('totalTests', stats.tests.total, 'فحص');
        
        const avgPriceElement = document.getElementById('avgPrice');
        if (avgPriceElement) {
            avgPriceElement.textContent = this.formatCurrency(stats.tests.avgPrice);
        }

        // تحديث إحصائيات المرضى إذا كانت موجودة
        if (stats.patients) {
            this.updateCounter('totalPatients', stats.patients.total, 'مريض');
            this.updateCounter('todayPatients', stats.patients.today, 'مريض اليوم');
            this.updateCounter('monthPatients', stats.patients.thisMonth, 'مريض هذا الشهر');
        }

        // تحديث الإيرادات إذا كانت موجودة
        if (stats.revenue) {
            const totalRevenueElement = document.getElementById('totalRevenue');
            if (totalRevenueElement) {
                totalRevenueElement.textContent = this.formatCurrency(stats.revenue.total);
            }

            const todayRevenueElement = document.getElementById('todayRevenue');
            if (todayRevenueElement) {
                todayRevenueElement.textContent = this.formatCurrency(stats.revenue.today);
            }

            const monthRevenueElement = document.getElementById('monthRevenue');
            if (monthRevenueElement) {
                monthRevenueElement.textContent = this.formatCurrency(stats.revenue.thisMonth);
            }
        }
    }

    // تحديث عنوان الصفحة
    static updatePageTitle(section) {
        const titles = {
            hospital: 'بيانات المستشفى - نظام إدارة المعمل الطبي',
            tests: 'الفحوصات الطبية - نظام إدارة المعمل الطبي',
            patients: 'نتائج المرضى - نظام إدارة المعمل الطبي',
            reports: 'التقارير - نظام إدارة المعمل الطبي',
            settings: 'الإعدادات - نظام إدارة المعمل الطبي'
        };

        document.title = titles[section] || 'نظام إدارة المعمل الطبي';
    }

    // إنشاء معرف فريد
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // تحديث الوقت الحالي
    static updateCurrentTime() {
        const timeElements = document.querySelectorAll('.current-time');
        const now = this.formatDate(new Date());
        timeElements.forEach(element => {
            element.textContent = now;
        });
    }
}

// بدء تحديث الوقت كل دقيقة
setInterval(() => {
    Utils.updateCurrentTime();
}, 60000);

// تحديث الوقت عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    Utils.updateCurrentTime();
});