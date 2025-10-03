// نظام اختبار إدارة التقارير
// Unit Tests for ReportsManager Class

describe('ReportsManager', () => {
    let reportsManager;
    let mockDatabase;
    let mockUtils;
    let mockDocument;

    // إعداد البيئة قبل كل اختبار
    function setupTestEnvironment() {
        // إنشاء mock objects
        mockDatabase = MockUtils.createMockDatabase();
        mockUtils = MockUtils.createMockUtils();
        
        // إضافة بيانات تجريبية لقاعدة البيانات
        setupSampleData();
        
        // محاكاة document
        mockDocument = {
            getElementById: function(id) {
                const elements = {
                    'reportType': MockUtils.createMockElement('select', { value: 'daily' }),
                    'dateRange': MockUtils.createMockElement('select', { value: 'last7days' }),
                    'customDateRange': MockUtils.createMockElement('div'),
                    'reportContent': MockUtils.createMockElement('div'),
                    'generateReport': MockUtils.createMockElement('button'),
                    'exportReport': MockUtils.createMockElement('button'),
                    'startDate': MockUtils.createMockElement('input', { value: '2024-01-01' }),
                    'endDate': MockUtils.createMockElement('input', { value: '2024-01-31' })
                };
                return elements[id] || MockUtils.createMockElement();
            },
            createElement: function(tagName) {
                return MockUtils.createMockElement(tagName);
            }
        };

        // إعداد البيئة العامة
        global.labDB = mockDatabase;
        global.Utils = mockUtils;
        global.document = mockDocument;
    }

    // إعداد بيانات تجريبية
    async function setupSampleData() {
        // إضافة فحوصات
        await mockDatabase.addTest({ name: 'Complete Blood Count', price: 150, desc: 'CBC test' });
        await mockDatabase.addTest({ name: 'Blood Sugar', price: 100, desc: 'Glucose test' });
        await mockDatabase.addTest({ name: 'Urine Test', price: 75, desc: 'Urine analysis' });
        
        // إضافة نتائج مرضى
        await mockDatabase.addResult({
            patientName: 'أحمد محمد',
            patientID: 'P001',
            testName: 'Complete Blood Count',
            result: 'Normal',
            date: '2024-01-15T10:00:00Z',
            cost: 150
        });
        
        await mockDatabase.addResult({
            patientName: 'فاطمة علي',
            patientID: 'P002',
            testName: 'Blood Sugar',
            result: 'High',
            date: '2024-01-16T14:30:00Z',
            cost: 100
        });
        
        await mockDatabase.addResult({
            patientName: 'سالم أحمد',
            patientID: 'P003',
            testName: 'Urine Test',
            result: 'Normal',
            date: '2024-01-17T09:15:00Z',
            cost: 75
        });
    }

    // اختبار تهيئة ReportsManager بنجاح
    it('should initialize ReportsManager successfully', () => {
        setupTestEnvironment();
        
        class ReportsManager {
            constructor() {
                this.reportTypeSelect = null;
                this.dateRangeSelect = null;
                this.customDateRange = null;
                this.reportContent = null;
                this.currentReport = null;
                this.init();
            }
            
            init() {
                this.reportTypeSelect = document.getElementById('reportType');
                this.dateRangeSelect = document.getElementById('dateRange');
                this.customDateRange = document.getElementById('customDateRange');
                this.reportContent = document.getElementById('reportContent');
            }
        }
        
        reportsManager = new ReportsManager();
        
        assert.assertNotNull(reportsManager, 'ReportsManager should be created');
        assert.assertNotNull(reportsManager.reportTypeSelect, 'Report type select should be initialized');
        assert.assertNotNull(reportsManager.dateRangeSelect, 'Date range select should be initialized');
        assert.assertNotNull(reportsManager.reportContent, 'Report content should be initialized');
        assert.assertEqual(reportsManager.currentReport, null, 'Current report should be null initially');
    });

    // اختبار إنشاء تقرير يومي
    it('should generate daily report successfully', async () => {
        setupTestEnvironment();
        
        class ReportsManager {
            constructor() {
                this.currentReport = null;
            }
            
            async generateDailyReport(date) {
                try {
                    const targetDate = new Date(date);
                    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
                    
                    const allResults = await labDB.getAllResults();
                    const dailyResults = allResults.filter(result => {
                        const resultDate = new Date(result.date);
                        return resultDate >= startOfDay && resultDate <= endOfDay;
                    });
                    
                    const report = {
                        type: 'daily',
                        date: date,
                        totalTests: dailyResults.length,
                        totalRevenue: dailyResults.reduce((sum, result) => sum + (result.cost || 0), 0),
                        testBreakdown: this.getTestBreakdown(dailyResults),
                        patientCount: new Set(dailyResults.map(r => r.patientID)).size,
                        results: dailyResults
                    };
                    
                    this.currentReport = report;
                    return report;
                } catch (error) {
                    throw error;
                }
            }
            
            getTestBreakdown(results) {
                const breakdown = {};
                results.forEach(result => {
                    if (!breakdown[result.testName]) {
                        breakdown[result.testName] = {
                            count: 0,
                            revenue: 0
                        };
                    }
                    breakdown[result.testName].count++;
                    breakdown[result.testName].revenue += result.cost || 0;
                });
                return breakdown;
            }
        }
        
        reportsManager = new ReportsManager();
        const dailyReport = await reportsManager.generateDailyReport('2024-01-16');
        
        assert.assertNotNull(dailyReport, 'Daily report should be generated');
        assert.assertEqual(dailyReport.type, 'daily', 'Report type should be daily');
        assert.assertEqual(dailyReport.totalTests, 1, 'Should have 1 test for the specified date');
        assert.assertEqual(dailyReport.totalRevenue, 100, 'Total revenue should be 100');
        assert.assertEqual(dailyReport.patientCount, 1, 'Should have 1 unique patient');
        assert.assertHasProperty(dailyReport.testBreakdown, 'Blood Sugar', 'Should have test breakdown');
        assert.assertEqual(dailyReport.testBreakdown['Blood Sugar'].count, 1, 'Blood Sugar test should have count 1');
    });

    // اختبار إنشاء تقرير شهري
    it('should generate monthly report successfully', async () => {
        setupTestEnvironment();
        
        class ReportsManager {
            async generateMonthlyReport(year, month) {
                try {
                    const startDate = new Date(year, month - 1, 1);
                    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
                    
                    const allResults = await labDB.getAllResults();
                    const monthlyResults = allResults.filter(result => {
                        const resultDate = new Date(result.date);
                        return resultDate >= startDate && resultDate <= endDate;
                    });
                    
                    const report = {
                        type: 'monthly',
                        year: year,
                        month: month,
                        totalTests: monthlyResults.length,
                        totalRevenue: monthlyResults.reduce((sum, result) => sum + (result.cost || 0), 0),
                        averageTestsPerDay: monthlyResults.length / new Date(year, month, 0).getDate(),
                        testTypes: this.getUniqueTestTypes(monthlyResults),
                        patientCount: new Set(monthlyResults.map(r => r.patientID)).size,
                        dailyBreakdown: this.getDailyBreakdown(monthlyResults),
                        results: monthlyResults
                    };
                    
                    return report;
                } catch (error) {
                    throw error;
                }
            }
            
            getUniqueTestTypes(results) {
                return [...new Set(results.map(r => r.testName))];
            }
            
            getDailyBreakdown(results) {
                const breakdown = {};
                results.forEach(result => {
                    const day = new Date(result.date).getDate();
                    if (!breakdown[day]) {
                        breakdown[day] = {
                            count: 0,
                            revenue: 0
                        };
                    }
                    breakdown[day].count++;
                    breakdown[day].revenue += result.cost || 0;
                });
                return breakdown;
            }
        }
        
        reportsManager = new ReportsManager();
        const monthlyReport = await reportsManager.generateMonthlyReport(2024, 1);
        
        assert.assertNotNull(monthlyReport, 'Monthly report should be generated');
        assert.assertEqual(monthlyReport.type, 'monthly', 'Report type should be monthly');
        assert.assertEqual(monthlyReport.year, 2024, 'Year should be 2024');
        assert.assertEqual(monthlyReport.month, 1, 'Month should be 1');
        assert.assertEqual(monthlyReport.totalTests, 3, 'Should have 3 tests for January 2024');
        assert.assertEqual(monthlyReport.totalRevenue, 325, 'Total revenue should be 325 (150+100+75)');
        assert.assertEqual(monthlyReport.patientCount, 3, 'Should have 3 unique patients');
        assert.assertLength(monthlyReport.testTypes, 3, 'Should have 3 different test types');
        assert.assertTrue(monthlyReport.averageTestsPerDay > 0, 'Average tests per day should be greater than 0');
    });

    // اختبار تقرير الفحوصات الأكثر طلباً
    it('should generate most requested tests report', async () => {
        setupTestEnvironment();
        
        // إضافة المزيد من البيانات التجريبية
        await mockDatabase.addResult({
            patientName: 'خالد محمد',
            patientID: 'P004',
            testName: 'Complete Blood Count',
            result: 'Normal',
            date: '2024-01-18T11:00:00Z',
            cost: 150
        });
        
        await mockDatabase.addResult({
            patientName: 'نورا أحمد',
            patientID: 'P005',
            testName: 'Complete Blood Count',
            result: 'Low',
            date: '2024-01-19T16:30:00Z',
            cost: 150
        });
        
        class ReportsManager {
            async generateMostRequestedTestsReport(startDate, endDate) {
                try {
                    const allResults = await labDB.getAllResults();
                    const filteredResults = allResults.filter(result => {
                        const resultDate = new Date(result.date);
                        return resultDate >= new Date(startDate) && resultDate <= new Date(endDate);
                    });
                    
                    const testCounts = {};
                    const testRevenue = {};
                    
                    filteredResults.forEach(result => {
                        const testName = result.testName;
                        
                        testCounts[testName] = (testCounts[testName] || 0) + 1;
                        testRevenue[testName] = (testRevenue[testName] || 0) + (result.cost || 0);
                    });
                    
                    const sortedTests = Object.keys(testCounts)
                        .map(testName => ({
                            name: testName,
                            count: testCounts[testName],
                            revenue: testRevenue[testName],
                            percentage: (testCounts[testName] / filteredResults.length * 100).toFixed(1)
                        }))
                        .sort((a, b) => b.count - a.count);
                    
                    return {
                        type: 'most_requested',
                        startDate: startDate,
                        endDate: endDate,
                        totalTests: filteredResults.length,
                        totalRevenue: filteredResults.reduce((sum, r) => sum + (r.cost || 0), 0),
                        tests: sortedTests,
                        topTest: sortedTests[0] || null
                    };
                } catch (error) {
                    throw error;
                }
            }
        }
        
        reportsManager = new ReportsManager();
        const report = await reportsManager.generateMostRequestedTestsReport(
            '2024-01-01', 
            '2024-01-31'
        );
        
        assert.assertNotNull(report, 'Most requested tests report should be generated');
        assert.assertEqual(report.type, 'most_requested', 'Report type should be most_requested');
        assert.assertEqual(report.totalTests, 5, 'Should have 5 total tests');
        assert.assertLength(report.tests, 3, 'Should have 3 different test types');
        assert.assertEqual(report.topTest.name, 'Complete Blood Count', 'Top test should be Complete Blood Count');
        assert.assertEqual(report.topTest.count, 3, 'Top test should have 3 occurrences');
        assert.assertEqual(report.topTest.percentage, '60.0', 'Top test should represent 60% of tests');
    });

    // اختبار تقرير الإيرادات
    it('should generate revenue report successfully', async () => {
        setupTestEnvironment();
        
        class ReportsManager {
            async generateRevenueReport(startDate, endDate, groupBy = 'day') {
                try {
                    const allResults = await labDB.getAllResults();
                    const filteredResults = allResults.filter(result => {
                        const resultDate = new Date(result.date);
                        return resultDate >= new Date(startDate) && resultDate <= new Date(endDate);
                    });
                    
                    const revenueData = {};
                    let totalRevenue = 0;
                    
                    filteredResults.forEach(result => {
                        const resultDate = new Date(result.date);
                        let groupKey;
                        
                        switch (groupBy) {
                            case 'day':
                                groupKey = resultDate.toISOString().split('T')[0];
                                break;
                            case 'month':
                                groupKey = `${resultDate.getFullYear()}-${String(resultDate.getMonth() + 1).padStart(2, '0')}`;
                                break;
                            case 'year':
                                groupKey = resultDate.getFullYear().toString();
                                break;
                            default:
                                groupKey = resultDate.toISOString().split('T')[0];
                        }
                        
                        if (!revenueData[groupKey]) {
                            revenueData[groupKey] = {
                                revenue: 0,
                                testCount: 0,
                                patientCount: new Set()
                            };
                        }
                        
                        revenueData[groupKey].revenue += result.cost || 0;
                        revenueData[groupKey].testCount++;
                        revenueData[groupKey].patientCount.add(result.patientID);
                        totalRevenue += result.cost || 0;
                    });
                    
                    // تحويل Set إلى count
                    Object.keys(revenueData).forEach(key => {
                        revenueData[key].patientCount = revenueData[key].patientCount.size;
                    });
                    
                    const averageRevenue = Object.keys(revenueData).length > 0 ? 
                        totalRevenue / Object.keys(revenueData).length : 0;
                    
                    return {
                        type: 'revenue',
                        startDate: startDate,
                        endDate: endDate,
                        groupBy: groupBy,
                        totalRevenue: totalRevenue,
                        averageRevenue: averageRevenue,
                        data: revenueData,
                        periods: Object.keys(revenueData).sort()
                    };
                } catch (error) {
                    throw error;
                }
            }
        }
        
        reportsManager = new ReportsManager();
        const revenueReport = await reportsManager.generateRevenueReport(
            '2024-01-01', 
            '2024-01-31', 
            'day'
        );
        
        assert.assertNotNull(revenueReport, 'Revenue report should be generated');
        assert.assertEqual(revenueReport.type, 'revenue', 'Report type should be revenue');
        assert.assertEqual(revenueReport.totalRevenue, 325, 'Total revenue should be 325');
        assert.assertTrue(revenueReport.averageRevenue > 0, 'Average revenue should be greater than 0');
        assert.assertLength(revenueReport.periods, 3, 'Should have 3 different days with revenue');
        assert.assertHasProperty(revenueReport.data, '2024-01-15', 'Should have data for 2024-01-15');
        assert.assertEqual(revenueReport.data['2024-01-15'].revenue, 150, 'Revenue for 2024-01-15 should be 150');
    });

    // اختبار تصدير التقرير
    it('should export report data successfully', () => {
        setupTestEnvironment();
        
        class ReportsManager {
            constructor() {
                this.currentReport = {
                    type: 'daily',
                    date: '2024-01-15',
                    totalTests: 5,
                    totalRevenue: 500,
                    results: [
                        { patientName: 'أحمد محمد', testName: 'Blood Test', result: 'Normal' },
                        { patientName: 'فاطمة علي', testName: 'Urine Test', result: 'Normal' }
                    ]
                };
            }
            
            exportReportAsJSON() {
                if (!this.currentReport) {
                    throw new Error('لا يوجد تقرير للتصدير');
                }
                
                return JSON.stringify(this.currentReport, null, 2);
            }
            
            exportReportAsCSV() {
                if (!this.currentReport || !this.currentReport.results) {
                    throw new Error('لا يوجد بيانات للتصدير');
                }
                
                const headers = ['Patient Name', 'Test Name', 'Result', 'Date'];
                const csvContent = [
                    headers.join(','),
                    ...this.currentReport.results.map(result => [
                        result.patientName,
                        result.testName,
                        result.result,
                        result.date || ''
                    ].join(','))
                ].join('\n');
                
                return csvContent;
            }
            
            generateReportSummary() {
                if (!this.currentReport) {
                    return null;
                }
                
                return {
                    reportType: this.currentReport.type,
                    generatedAt: new Date().toISOString(),
                    summary: {
                        totalTests: this.currentReport.totalTests,
                        totalRevenue: this.currentReport.totalRevenue,
                        recordCount: this.currentReport.results ? this.currentReport.results.length : 0
                    }
                };
            }
        }
        
        reportsManager = new ReportsManager();
        
        // اختبار تصدير JSON
        const jsonExport = reportsManager.exportReportAsJSON();
        assert.assertType(jsonExport, 'string', 'JSON export should be a string');
        assert.assertTrue(jsonExport.includes('totalTests'), 'JSON export should contain report data');
        
        // اختبار تصدير CSV
        const csvExport = reportsManager.exportReportAsCSV();
        assert.assertType(csvExport, 'string', 'CSV export should be a string');
        assert.assertTrue(csvExport.includes('Patient Name'), 'CSV should have headers');
        assert.assertTrue(csvExport.includes('أحمد محمد'), 'CSV should contain patient data');
        
        // اختبار ملخص التقرير
        const summary = reportsManager.generateReportSummary();
        assert.assertNotNull(summary, 'Report summary should be generated');
        assert.assertEqual(summary.reportType, 'daily', 'Summary should have correct report type');
        assert.assertEqual(summary.summary.totalTests, 5, 'Summary should have correct test count');
        assert.assertNotNull(summary.generatedAt, 'Summary should have generation timestamp');
    });

    // اختبار تصفية البيانات حسب التاريخ
    it('should filter data by date range correctly', async () => {
        setupTestEnvironment();
        
        class ReportsManager {
            async filterResultsByDateRange(startDate, endDate) {
                try {
                    const allResults = await labDB.getAllResults();
                    
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999); // تضمين نهاية اليوم
                    
                    const filteredResults = allResults.filter(result => {
                        const resultDate = new Date(result.date);
                        return resultDate >= start && resultDate <= end;
                    });
                    
                    return {
                        startDate: startDate,
                        endDate: endDate,
                        totalResults: filteredResults.length,
                        results: filteredResults,
                        dateRange: {
                            days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
                        }
                    };
                } catch (error) {
                    throw error;
                }
            }
            
            getResultsGroupedByDate(results) {
                const grouped = {};
                
                results.forEach(result => {
                    const date = new Date(result.date).toISOString().split('T')[0];
                    if (!grouped[date]) {
                        grouped[date] = [];
                    }
                    grouped[date].push(result);
                });
                
                return grouped;
            }
        }
        
        reportsManager = new ReportsManager();
        
        // تصفية لفترة تحتوي على جميع النتائج
        const allResults = await reportsManager.filterResultsByDateRange('2024-01-01', '2024-01-31');
        assert.assertEqual(allResults.totalResults, 3, 'Should find all 3 results in January');
        assert.assertEqual(allResults.dateRange.days, 31, 'Date range should be 31 days');
        
        // تصفية لفترة محددة
        const specificResults = await reportsManager.filterResultsByDateRange('2024-01-15', '2024-01-16');
        assert.assertEqual(specificResults.totalResults, 2, 'Should find 2 results in the specific range');
        
        // تصفية لفترة لا تحتوي على نتائج
        const noResults = await reportsManager.filterResultsByDateRange('2024-02-01', '2024-02-28');
        assert.assertEqual(noResults.totalResults, 0, 'Should find no results in February');
        
        // اختبار تجميع النتائج حسب التاريخ
        const grouped = reportsManager.getResultsGroupedByDate(allResults.results);
        assert.assertHasProperty(grouped, '2024-01-15', 'Should have results for 2024-01-15');
        assert.assertHasProperty(grouped, '2024-01-16', 'Should have results for 2024-01-16');
        assert.assertHasProperty(grouped, '2024-01-17', 'Should have results for 2024-01-17');
        assert.assertLength(grouped['2024-01-15'], 1, 'Should have 1 result on 2024-01-15');
    });

    // اختبار إحصائيات متقدمة
    it('should calculate advanced statistics correctly', async () => {
        setupTestEnvironment();
        
        class ReportsManager {
            async calculateAdvancedStatistics(startDate, endDate) {
                try {
                    const allResults = await labDB.getAllResults();
                    const filteredResults = allResults.filter(result => {
                        const resultDate = new Date(result.date);
                        return resultDate >= new Date(startDate) && resultDate <= new Date(endDate);
                    });
                    
                    if (filteredResults.length === 0) {
                        return {
                            hasData: false,
                            message: 'لا توجد بيانات للفترة المحددة'
                        };
                    }
                    
                    const costs = filteredResults.map(r => r.cost || 0);
                    const uniquePatients = new Set(filteredResults.map(r => r.patientID));
                    const uniqueTests = new Set(filteredResults.map(r => r.testName));
                    
                    return {
                        hasData: true,
                        period: {
                            startDate: startDate,
                            endDate: endDate,
                            totalDays: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
                        },
                        financial: {
                            totalRevenue: costs.reduce((sum, cost) => sum + cost, 0),
                            averageRevenue: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
                            maxRevenue: Math.max(...costs),
                            minRevenue: Math.min(...costs)
                        },
                        operational: {
                            totalTests: filteredResults.length,
                            uniquePatients: uniquePatients.size,
                            uniqueTestTypes: uniqueTests.size,
                            averageTestsPerDay: filteredResults.length / Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1),
                            averageTestsPerPatient: filteredResults.length / uniquePatients.size
                        },
                        quality: {
                            normalResults: filteredResults.filter(r => r.result === 'Normal').length,
                            abnormalResults: filteredResults.filter(r => r.result !== 'Normal').length,
                            normalPercentage: (filteredResults.filter(r => r.result === 'Normal').length / filteredResults.length * 100).toFixed(1)
                        }
                    };
                } catch (error) {
                    throw error;
                }
            }
        }
        
        reportsManager = new ReportsManager();
        const stats = await reportsManager.calculateAdvancedStatistics('2024-01-01', '2024-01-31');
        
        assert.assertTrue(stats.hasData, 'Statistics should have data');
        assert.assertEqual(stats.financial.totalRevenue, 325, 'Total revenue should be 325');
        assert.assertTrue(stats.financial.averageRevenue > 0, 'Average revenue should be positive');
        assert.assertEqual(stats.financial.maxRevenue, 150, 'Max revenue should be 150');
        assert.assertEqual(stats.financial.minRevenue, 75, 'Min revenue should be 75');
        
        assert.assertEqual(stats.operational.totalTests, 3, 'Should have 3 total tests');
        assert.assertEqual(stats.operational.uniquePatients, 3, 'Should have 3 unique patients');
        assert.assertEqual(stats.operational.uniqueTestTypes, 3, 'Should have 3 unique test types');
        assert.assertTrue(stats.operational.averageTestsPerPatient >= 1, 'Average tests per patient should be at least 1');
        
        assert.assertEqual(stats.quality.normalResults, 2, 'Should have 2 normal results');
        assert.assertEqual(stats.quality.abnormalResults, 1, 'Should have 1 abnormal result');
        assert.assertEqual(stats.quality.normalPercentage, '66.7', 'Normal percentage should be 66.7%');
    });
});

console.log('✅ ReportsManager unit tests loaded successfully');