// نظام إدارة المعمل الطبي - إدارة التقارير

class ReportsManager {
    constructor() {
        this.reportTypeSelect = null;
        this.dateRangeSelect = null;
        this.customDateRange = null;
        this.reportContent = null;
        this.currentReport = null;
        this.init();
    }

    // تهيئة مدير التقارير
    init() {
        // التحقق من وجود العناصر قبل التهيئة
        this.reportTypeSelect = document.getElementById('reportType');
        this.dateRangeSelect = document.getElementById('dateRange');
        this.customDateRange = document.getElementById('customDateRange');
        this.reportContent = document.getElementById('reportContent');
        
        // التحقق من وجود العناصر الأساسية
        if (!this.reportTypeSelect || !this.dateRangeSelect || !this.reportContent) {
            console.error('عناصر التقارير الأساسية غير موجودة');
            return;
        }
        
        this.setupEventListeners();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تغيير نوع التقرير
        if (this.reportTypeSelect) {
            this.reportTypeSelect.addEventListener('change', () => {
                this.onReportTypeChange();
            });
        }

        // تغيير الفترة الزمنية
        if (this.dateRangeSelect) {
            this.dateRangeSelect.addEventListener('change', () => {
                this.onDateRangeChange();
            });
        }

        // إنشاء التقرير
        const generateBtn = document.getElementById('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // طباعة التقرير
        const printBtn = document.getElementById('printReport');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printReport();
            });
        }

        // تصدير PDF
        const exportPDFBtn = document.getElementById('exportPDF');
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }
    }

    // تغيير نوع التقرير
    onReportTypeChange() {
        // إمكانية إضافة منطق خاص لكل نوع تقرير
        this.clearReport();
    }

    // تغيير الفترة الزمنية
    onDateRangeChange() {
        if (this.dateRangeSelect.value === 'custom') {
            this.customDateRange.classList.remove('hidden');
        } else {
            this.customDateRange.classList.add('hidden');
        }
        
        this.clearReport();
    }

    // مسح التقرير الحالي
    clearReport() {
        if (this.reportContent) {
            this.reportContent.innerHTML = `
                <div class="report-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <p>اختر نوع التقرير والفترة الزمنية ثم اضغط على "إنشاء التقرير"</p>
                </div>
            `;
        }
        this.currentReport = null;
    }

    // إنشاء التقرير
    async generateReport() {
        try {
            const reportType = this.reportTypeSelect.value;
            const dateRange = this.getDateRange();

            if (!dateRange) {
                Utils.showToast('يرجى تحديد فترة زمنية صحيحة', 'error');
                return;
            }

            Utils.showLoading('جاري إنشاء التقرير...');

            let reportData;
            switch (reportType) {
                case 'patient':
                    reportData = await this.generatePatientReport(dateRange);
                    break;
                case 'financial':
                    reportData = await this.generateFinancialReport(dateRange);
                    break;
                case 'tests':
                    reportData = await this.generateTestsReport();
                    break;
                case 'summary':
                    reportData = await this.generateSummaryReport(dateRange);
                    break;
                default:
                    throw new Error('نوع التقرير غير مدعوم');
            }

            this.displayReport(reportData);
            this.currentReport = reportData;

        } catch (error) {
            console.error('خطأ في إنشاء التقرير:', error);
            Utils.showToast('خطأ في إنشاء التقرير', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // الحصول على الفترة الزمنية
    getDateRange() {
        const rangeType = this.dateRangeSelect.value;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        let startDate, endDate;

        switch (rangeType) {
            case 'today':
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                break;
                
            case 'week':
                endDate = new Date(today);
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
                
            case 'month':
                endDate = new Date(today);
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
                
            case 'year':
                endDate = new Date(today);
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
                
            case 'custom':
                const startInput = document.getElementById('startDate').value;
                const endInput = document.getElementById('endDate').value;
                
                if (!startInput || !endInput) {
                    return null;
                }
                
                startDate = new Date(startInput);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(endInput);
                endDate.setHours(23, 59, 59, 999);
                
                if (startDate > endDate) {
                    Utils.showToast('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
                    return null;
                }
                break;
                
            default:
                return null;
        }

        return { startDate, endDate, type: rangeType };
    }

    // تقرير نتائج المرضى
    async generatePatientReport(dateRange) {
        try {
            const patients = await labDB.getResultsByDateRange(
                dateRange.startDate.toISOString(),
                dateRange.endDate.toISOString()
            );

            // التأكد من أن المرضى يحتوون على testsResults
            const validPatients = patients.filter(p => p.testsResults && Array.isArray(p.testsResults));

            const reportData = {
                title: 'تقرير نتائج المرضى',
                type: 'patient',
                dateRange: dateRange,
                data: validPatients,
                summary: {
                    totalPatients: validPatients.length,
                    totalTests: validPatients.reduce((sum, p) => sum + (p.testsResults?.length || 0), 0),
                    totalRevenue: validPatients.reduce((sum, p) => 
                        sum + (p.testsResults?.reduce((testSum, test) => 
                            testSum + (test.price || 0), 0) || 0), 0)
                }
            };

            return reportData;
        } catch (error) {
            console.error('خطأ في إنشاء تقرير المرضى:', error);
            throw error;
        }
    }

    // تقرير مالي
    async generateFinancialReport(dateRange) {
        try {
            const patients = await labDB.getResultsByDateRange(
                dateRange.startDate.toISOString(),
                dateRange.endDate.toISOString()
            );

            // التأكد من وجود testsResults
            const validPatients = patients.filter(p => p.testsResults && Array.isArray(p.testsResults));

            // تجميع البيانات المالية
            const financialData = {};
            let totalRevenue = 0;

            validPatients.forEach(patient => {
                if (patient.testsResults) {
                    patient.testsResults.forEach(test => {
                        const testName = test.testName || 'فحص غير محدد';
                        const price = parseFloat(test.price) || 0;
                        
                        if (!financialData[testName]) {
                            financialData[testName] = {
                                name: testName,
                                count: 0,
                                totalRevenue: 0,
                                averagePrice: 0
                            };
                        }
                        
                        financialData[testName].count++;
                        financialData[testName].totalRevenue += price;
                        totalRevenue += price;
                    });
                }
            });

            // حساب المتوسط لكل فحص
            Object.values(financialData).forEach(test => {
                test.averagePrice = test.count > 0 ? test.totalRevenue / test.count : 0;
            });

            const reportData = {
                title: 'التقرير المالي',
                type: 'financial',
                dateRange: dateRange,
                data: Object.values(financialData),
                summary: {
                    totalRevenue: totalRevenue,
                    totalPatients: validPatients.length,
                    averagePerPatient: validPatients.length > 0 ? totalRevenue / validPatients.length : 0
                }
            };

            return reportData;
        } catch (error) {
            console.error('خطأ في إنشاء التقرير المالي:', error);
            throw error;
        }
    }

    // تقرير الفحوصات
    async generateTestsReport() {
        try {
            const [tests, patients] = await Promise.all([
                labDB.getAllTests(),
                labDB.getAllPatientResults()
            ]);

            // التأكد من وجود البيانات
            const validTests = tests || [];
            const validPatients = patients.filter(p => p.testsResults && Array.isArray(p.testsResults));

            // إحصائيات كل فحص
            const testStats = validTests.map(test => {
                const usageCount = validPatients.reduce((count, patient) => {
                    return count + (patient.testsResults?.filter(result => 
                        result.testName === test.name).length || 0);
                }, 0);

                const price = parseFloat(test.price) || 0;

                return {
                    id: test.id,
                    name: test.name || 'فحص غير محدد',
                    price: price,
                    description: test.desc || test.description || 'لا يوجد وصف',
                    usageCount: usageCount,
                    totalRevenue: usageCount * price
                };
            });

            const reportData = {
                title: 'تقرير الفحوصات',
                type: 'tests',
                data: testStats,
                summary: {
                    totalTests: validTests.length,
                    totalUsage: testStats.reduce((sum, test) => sum + test.usageCount, 0),
                    totalPotentialRevenue: testStats.reduce((sum, test) => sum + test.totalRevenue, 0),
                    averagePrice: validTests.length > 0 ? 
                        validTests.reduce((sum, test) => sum + (parseFloat(test.price) || 0), 0) / validTests.length : 0
                }
            };

            return reportData;
        } catch (error) {
            console.error('خطأ في إنشاء تقرير الفحوصات:', error);
            throw error;
        }
    }

    // تقرير إجمالي
    async generateSummaryReport(dateRange) {
        try {
            const [hospitalData, tests, patients] = await Promise.all([
                labDB.getHospitalData(),
                labDB.getAllTests(),
                labDB.getResultsByDateRange(
                    dateRange.startDate.toISOString(),
                    dateRange.endDate.toISOString()
                )
            ]);

            // التأكد من وجود البيانات
            const validTests = tests || [];
            const validPatients = patients.filter(p => p.testsResults && Array.isArray(p.testsResults));

            const totalRevenue = validPatients.reduce((sum, p) => 
                sum + (p.testsResults?.reduce((testSum, test) => 
                    testSum + (parseFloat(test.price) || 0), 0) || 0), 0);

            const reportData = {
                title: 'التقرير الإجمالي',
                type: 'summary',
                dateRange: dateRange,
                hospital: hospitalData || { name: 'مستشفى غير محدد', address: '', contact: '' },
                summary: {
                    totalTests: validTests.length,
                    totalPatients: validPatients.length,
                    totalRevenue: totalRevenue,
                    averagePerPatient: validPatients.length > 0 ? totalRevenue / validPatients.length : 0,
                    mostUsedTests: this.getMostUsedTests(validPatients),
                    dailyAverage: this.getDailyAverage(validPatients, dateRange)
                }
            };

            return reportData;
        } catch (error) {
            console.error('خطأ في إنشاء التقرير الإجمالي:', error);
            throw error;
        }
    }

    // الحصول على أكثر الفحوصات استخداماً
    getMostUsedTests(patients) {
        if (!patients || patients.length === 0) {
            return [];
        }

        const testUsage = {};
        let totalTests = 0;
        
        patients.forEach(patient => {
            if (patient.testsResults && Array.isArray(patient.testsResults)) {
                patient.testsResults.forEach(test => {
                    if (test.testName) {
                        const testName = test.testName;
                        testUsage[testName] = (testUsage[testName] || 0) + 1;
                        totalTests++;
                    }
                });
            }
        });

        if (totalTests === 0) {
            return [];
        }

        return Object.entries(testUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ 
                name, 
                count,
                percentage: ((count / totalTests) * 100).toFixed(1)
            }));
    }

    // الحصول على المتوسط اليومي
    getDailyAverage(patients, dateRange) {
        if (!patients || patients.length === 0 || !dateRange.startDate || !dateRange.endDate) {
            return {
                patients: 0,
                revenue: 0,
                tests: 0
            };
        }

        const days = Math.max(1, Math.ceil(
            (dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)
        ));
        
        const totalRevenue = patients.reduce((sum, p) => {
            if (p.testsResults && Array.isArray(p.testsResults)) {
                return sum + p.testsResults.reduce((testSum, test) => 
                    testSum + (parseFloat(test.price) || 0), 0);
            }
            return sum;
        }, 0);

        const totalTests = patients.reduce((sum, p) => {
            return sum + (p.testsResults && Array.isArray(p.testsResults) ? p.testsResults.length : 0);
        }, 0);
        
        return {
            patients: (patients.length / days).toFixed(1),
            revenue: (totalRevenue / days).toFixed(2),
            tests: (totalTests / days).toFixed(1)
        };
    }

    // عرض التقرير
    displayReport(reportData) {
        if (!this.reportContent) return;

        let htmlContent = '';

        // رأس التقرير
        htmlContent += this.generateReportHeader(reportData);

        // محتوى التقرير حسب النوع
        switch (reportData.type) {
            case 'patient':
                htmlContent += this.generatePatientReportHTML(reportData);
                break;
            case 'financial':
                htmlContent += this.generateFinancialReportHTML(reportData);
                break;
            case 'tests':
                htmlContent += this.generateTestsReportHTML(reportData);
                break;
            case 'summary':
                htmlContent += this.generateSummaryReportHTML(reportData);
                break;
        }

        this.reportContent.innerHTML = htmlContent;
    }

    // إنشاء رأس التقرير
    generateReportHeader(reportData) {
        const dateText = this.formatDateRange(reportData.dateRange);
        
        return `
            <div class="report-header">
                <h2>${reportData.title}</h2>
                <div class="report-info">
                    <div class="report-date">تاريخ الإنشاء: ${Utils.formatDate(new Date())}</div>
                    ${reportData.dateRange ? `<div class="report-period">الفترة: ${dateText}</div>` : ''}
                </div>
            </div>
        `;
    }

    // تنسيق الفترة الزمنية
    formatDateRange(dateRange) {
        if (!dateRange) return '';
        
        const startDate = Utils.formatDate(dateRange.startDate, false);
        const endDate = Utils.formatDate(dateRange.endDate, false);
        
        if (startDate === endDate) {
            return startDate;
        }
        
        return `من ${startDate} إلى ${endDate}`;
    }

    // تقرير نتائج المرضى HTML
    generatePatientReportHTML(reportData) {
        let html = `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalPatients}</div>
                        <div class="summary-label">إجمالي المرضى</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalTests}</div>
                        <div class="summary-label">إجمالي الفحوصات</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${Utils.formatCurrency(reportData.summary.totalRevenue)}</div>
                        <div class="summary-label">إجمالي الإيرادات</div>
                    </div>
                </div>
            </div>
        `;

        if (reportData.data.length > 0) {
            html += `
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>اسم المريض</th>
                                <th>العمر</th>
                                <th>الجنس</th>
                                <th>رقم التعريف</th>
                                <th>عدد الفحوصات</th>
                                <th>إجمالي التكلفة</th>
                                <th>تاريخ الفحص</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            reportData.data.forEach(patient => {
                const genderText = patient.patientGender === 'male' ? 'ذكر' : 'أنثى';
                const testsResults = patient.testsResults || [];
                const totalCost = testsResults.reduce((sum, test) => sum + (parseFloat(test.price) || 0), 0);
                
                html += `
                    <tr>
                        <td>${patient.patientName || 'غير محدد'}</td>
                        <td>${patient.patientAge || 'غير محدد'}</td>
                        <td>${genderText}</td>
                        <td>${patient.patientID || 'غير محدد'}</td>
                        <td>${testsResults.length}</td>
                        <td>${Utils.formatCurrency(totalCost)}</td>
                        <td>${patient.date ? Utils.formatDate(patient.date) : 'غير محدد'}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += '<div class="no-data">لا توجد بيانات في هذه الفترة</div>';
        }

        return html;
    }

    // التقرير المالي HTML
    generateFinancialReportHTML(reportData) {
        let html = `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-number">${Utils.formatCurrency(reportData.summary.totalRevenue)}</div>
                        <div class="summary-label">إجمالي الإيرادات</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalPatients}</div>
                        <div class="summary-label">عدد المرضى</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${Utils.formatCurrency(reportData.summary.averagePerPatient)}</div>
                        <div class="summary-label">متوسط الإيراد لكل مريض</div>
                    </div>
                </div>
            </div>
        `;

        if (reportData.data.length > 0) {
            html += `
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>اسم الفحص</th>
                                <th>عدد المرات</th>
                                <th>إجمالي الإيرادات</th>
                                <th>متوسط السعر</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            reportData.data.forEach(test => {
                html += `
                    <tr>
                        <td>${test.name}</td>
                        <td>${test.count}</td>
                        <td>${Utils.formatCurrency(test.totalRevenue)}</td>
                        <td>${Utils.formatCurrency(test.averagePrice)}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += '<div class="no-data">لا توجد بيانات مالية</div>';
        }

        return html;
    }

    // تقرير الفحوصات HTML
    generateTestsReportHTML(reportData) {
        let html = `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalTests}</div>
                        <div class="summary-label">إجمالي الفحوصات</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalUsage}</div>
                        <div class="summary-label">إجمالي الاستخدام</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${Utils.formatCurrency(reportData.summary.averagePrice)}</div>
                        <div class="summary-label">متوسط سعر الفحص</div>
                    </div>
                </div>
            </div>
        `;

        if (reportData.data.length > 0) {
            html += `
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>اسم الفحص</th>
                                <th>السعر</th>
                                <th>الوصف</th>
                                <th>عدد مرات الاستخدام</th>
                                <th>إجمالي الإيرادات</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            reportData.data.forEach(test => {
                html += `
                    <tr>
                        <td>${test.name}</td>
                        <td>${Utils.formatCurrency(test.price)}</td>
                        <td>${test.description}</td>
                        <td>${test.usageCount}</td>
                        <td>${Utils.formatCurrency(test.totalRevenue)}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += '<div class="no-data">لا توجد فحوصات مسجلة</div>';
        }

        return html;
    }

    // التقرير الإجمالي HTML
    generateSummaryReportHTML(reportData) {
        let html = `
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalPatients}</div>
                        <div class="summary-label">إجمالي المرضى</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${reportData.summary.totalTests}</div>
                        <div class="summary-label">إجمالي الفحوصات</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${Utils.formatCurrency(reportData.summary.totalRevenue)}</div>
                        <div class="summary-label">إجمالي الإيرادات</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${Utils.formatCurrency(reportData.summary.averagePerPatient)}</div>
                        <div class="summary-label">متوسط الإيراد لكل مريض</div>
                    </div>
                </div>
            </div>
        `;

        // أكثر الفحوصات استخداماً
        if (reportData.summary.mostUsedTests.length > 0) {
            html += `
                <div class="report-section">
                    <h3>أكثر الفحوصات استخداماً</h3>
                    <div class="most-used-tests">
            `;
            
            reportData.summary.mostUsedTests.forEach((test, index) => {
                html += `
                    <div class="most-used-item">
                        <span class="rank">${index + 1}</span>
                        <span class="test-name">${test.name}</span>
                        <span class="count">${test.count} مرة</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }

        // المعدل اليومي
        html += `
            <div class="report-section">
                <h3>المعدل اليومي</h3>
                <div class="daily-averages">
                    <div class="avg-item">
                        <span class="label">متوسط المرضى يومياً:</span>
                        <span class="value">${reportData.summary.dailyAverage.patients.toFixed(1)} مريض</span>
                    </div>
                    <div class="avg-item">
                        <span class="label">متوسط الإيرادات يومياً:</span>
                        <span class="value">${Utils.formatCurrency(reportData.summary.dailyAverage.revenue)}</span>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    // طباعة التقرير
    printReport() {
        if (!this.currentReport) {
            Utils.showToast('لا يوجد تقرير للطباعة', 'warning');
            return;
        }

        Utils.printReport(this.reportContent);
    }

    // تصدير إلى PDF
    exportToPDF() {
        if (!this.currentReport) {
            Utils.showToast('لا يوجد تقرير للتصدير', 'warning');
            return;
        }

        Utils.exportToPDF(this.reportContent, `${this.currentReport.title}-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // تحديث الإعدادات حسب اللغة
    updateLanguageSettings() {
        // تحديث خيارات نوع التقرير
        const reportOptions = this.reportTypeSelect.querySelectorAll('option');
        const optionKeys = ['patient_report', 'financial_report', 'tests_report', 'summary_report'];
        
        reportOptions.forEach((option, index) => {
            if (optionKeys[index]) {
                option.textContent = languageManager.getTranslation(optionKeys[index]);
            }
        });

        // تحديث خيارات الفترة الزمنية
        const dateOptions = this.dateRangeSelect.querySelectorAll('option');
        const dateKeys = ['today', 'this_week', 'this_month', 'this_year', 'custom_period'];
        
        dateOptions.forEach((option, index) => {
            if (dateKeys[index]) {
                option.textContent = languageManager.getTranslation(dateKeys[index]);
            }
        });

        // مسح التقرير الحالي لإعادة عرضه باللغة الجديدة
        if (this.currentReport) {
            this.displayReport(this.currentReport);
        }
    }
}

// إنشاء مثيل وحيد من مدير التقارير
const reportsManager = new ReportsManager();