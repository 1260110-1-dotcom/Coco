/* 
 * 遊戲統計分析系統
 * 提供遊戲數據收集、分析和可視化功能
 * 版本: 1.0.0
 */

// ===== 統計配置 =====
const AnalyticsConfig = {
    // 數據收集
    ENABLE_DATA_COLLECTION: true,
    AUTO_SAVE_INTERVAL: 30000, // 30秒
    MAX_DATA_POINTS: 1000,
    
    // 隱私設置
    ANONYMIZE_DATA: true,
    COLLECT_USER_AGENT: true,
    COLLECT_SCREEN_INFO: true,
    
    // 性能監控
    TRACK_PERFORMANCE: true,
    TRACK_ERRORS: true,
    TRACK_USER_ACTIONS: true,
    
    // 報告設置
    GENERATE_REPORTS: true,
    REPORT_FORMAT: 'json', // 'json', 'csv', 'html'
    
    // 可視化設置
    ENABLE_VISUALIZATION: true,
    CHART_THEME: 'light' // 'light', 'dark'
};

// ===== 遊戲數據收集器 =====
const GameAnalytics = {
    // 數據存儲
    data: {
        sessions: [],
        gameplay: [],
        performance: [],
        errors: [],
        userActions: [],
        metadata: {}
    },
    
    // 當前會話
    currentSession: null,
    
    // 初始化分析系統
    init: function(gameName, options = {}) {
        this.gameName = gameName;
        
        // 合併配置
        Object.assign(AnalyticsConfig, options);
        
        // 載入保存的數據
        this.loadData();
        
        // 開始新會話
        this.startSession();
        
        // 設置自動保存
        if (AnalyticsConfig.AUTO_SAVE_INTERVAL > 0) {
            this.autoSaveInterval = setInterval(() => {
                this.saveData();
            }, AnalyticsConfig.AUTO_SAVE_INTERVAL);
        }
        
        // 設置性能監控
        if (AnalyticsConfig.TRACK_PERFORMANCE) {
            this.setupPerformanceTracking();
        }
        
        // 設置錯誤追蹤
        if (AnalyticsConfig.TRACK_ERRORS) {
            this.setupErrorTracking();
        }
        
        console.log(`🎮 遊戲分析系統已初始化: ${gameName}`);
    },
    
    // 開始新會話
    startSession: function() {
        this.currentSession = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            deviceInfo: this.collectDeviceInfo(),
            gameState: {},
            events: []
        };
        
        this.data.sessions.push(this.currentSession);
        
        // 記錄會話開始事件
        this.logEvent('session_start', {
            sessionId: this.currentSession.id
        });
        
        return this.currentSession.id;
    },
    
    // 結束當前會話
    endSession: function() {
        if (!this.currentSession) return;
        
        this.currentSession.endTime = Date.now();
        this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
        
        // 記錄會話結束事件
        this.logEvent('session_end', {
            sessionId: this.currentSession.id,
            duration: this.currentSession.duration
        });
        
        // 保存數據
        this.saveData();
        
        const endedSession = this.currentSession;
        this.currentSession = null;
        
        return endedSession;
    },
    
    // 記錄遊戲事件
    logEvent: function(eventType, data = {}) {
        if (!AnalyticsConfig.ENABLE_DATA_COLLECTION) return;
        
        const event = {
            timestamp: Date.now(),
            type: eventType,
            data: data,
            sessionId: this.currentSession ? this.currentSession.id : null
        };
        
        // 添加到當前會話
        if (this.currentSession) {
            this.currentSession.events.push(event);
        }
        
        // 添加到遊戲數據
        this.data.gameplay.push(event);
        
        // 限制數據點數量
        if (this.data.gameplay.length > AnalyticsConfig.MAX_DATA_POINTS) {
            this.data.gameplay.shift();
        }
        
        return event;
    },
    
    // 記錄遊戲開始
    logGameStart: function(gameMode, difficulty = 'normal') {
        return this.logEvent('game_start', {
            gameMode: gameMode,
            difficulty: difficulty,
            timestamp: Date.now()
        });
    },
    
    // 記錄遊戲結束
    logGameEnd: function(score, level, timePlayed, won = false) {
        return this.logEvent('game_end', {
            score: score,
            level: level,
            timePlayed: timePlayed,
            won: won,
            timestamp: Date.now()
        });
    },
    
    // 記錄用戶操作
    logUserAction: function(actionType, target = null, value = null) {
        if (!AnalyticsConfig.TRACK_USER_ACTIONS) return;
        
        const action = {
            timestamp: Date.now(),
            type: actionType,
            target: target,
            value: value,
            sessionId: this.currentSession ? this.currentSession.id : null
        };
        
        this.data.userActions.push(action);
        
        // 限制數據點數量
        if (this.data.userActions.length > AnalyticsConfig.MAX_DATA_POINTS) {
            this.data.userActions.shift();
        }
        
        return action;
    },
    
    // 記錄性能數據
    logPerformance: function(metric, value, context = {}) {
        if (!AnalyticsConfig.TRACK_PERFORMANCE) return;
        
        const performanceData = {
            timestamp: Date.now(),
            metric: metric,
            value: value,
            context: context,
            sessionId: this.currentSession ? this.currentSession.id : null
        };
        
        this.data.performance.push(performanceData);
        
        // 限制數據點數量
        if (this.data.performance.length > AnalyticsConfig.MAX_DATA_POINTS) {
            this.data.performance.shift();
        }
        
        return performanceData;
    },
    
    // 記錄錯誤
    logError: function(error, context = {}) {
        if (!AnalyticsConfig.TRACK_ERRORS) return;
        
        const errorData = {
            timestamp: Date.now(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: context,
            sessionId: this.currentSession ? this.currentSession.id : null
        };
        
        this.data.errors.push(errorData);
        
        return errorData;
    },
    
    // 設置性能監控
    setupPerformanceTracking: function() {
        // 監聽FPS
        let frameCount = 0;
        let lastTime = performance.now();
        
        const trackFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.logPerformance('fps', fps);
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(trackFPS);
        };
        
        trackFPS();
        
        // 監聽內存使用（如果可用）
        if (performance.memory) {
            setInterval(() => {
                const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
                const totalMB = performance.memory.totalJSHeapSize / (1024 * 1024);
                
                this.logPerformance('memory_used', usedMB, { total: totalMB });
            }, 10000);
        }
        
        // 監聽加載時間
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.logPerformance('page_load_time', loadTime);
        });
    },
    
    // 設置錯誤追蹤
    setupErrorTracking: function() {
        // 使用現有的錯誤處理系統（如果可用）
        if (window.GameErrorSystem) {
            // 監聽錯誤事件
            document.addEventListener('game:error', (event) => {
                this.logError(event.detail.error, event.detail.context);
            });
        } else {
            // 設置基本的錯誤監聽
            window.addEventListener('error', (event) => {
                this.logError(event.error, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                this.logError(event.reason, { type: 'unhandled_promise_rejection' });
            });
        }
    },
    
    // 收集設備信息
    collectDeviceInfo: function() {
        const info = {
            timestamp: Date.now(),
            userAgent: AnalyticsConfig.COLLECT_USER_AGENT ? navigator.userAgent : 'anonymized',
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        if (AnalyticsConfig.COLLECT_SCREEN_INFO) {
            info.screen = {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelRatio: window.devicePixelRatio || 1
            };
            
            info.viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
        
        // 匿名化數據
        if (AnalyticsConfig.ANONYMIZE_DATA) {
            info.userAgent = this.anonymizeUserAgent(info.userAgent);
        }
        
        return info;
    },
    
    // 匿名化用戶代理
    anonymizeUserAgent: function(userAgent) {
        // 簡單的匿名化：只保留瀏覽器和版本信息
        const matches = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
        if (matches) {
            return `${matches[1]}/${matches[2]}`;
        }
        return 'Unknown';
    },
    
    // 生成會話ID
    generateSessionId: function() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // 保存數據
    saveData: function() {
        if (!AnalyticsConfig.ENABLE_DATA_COLLECTION) return;
        
        try {
            const storageKey = `${this.gameName}_analytics_data`;
            const dataToSave = {
                metadata: {
                    gameName: this.gameName,
                    lastUpdated: Date.now(),
                    version: '1.0.0'
                },
                data: this.data
            };
            
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
            
            // 記錄保存事件
            this.logEvent('data_saved', {
                timestamp: Date.now(),
                dataPoints: this.getDataCount()
            });
            
            return true;
        } catch (error) {
            console.error('保存分析數據失敗:', error);
            return false;
        }
    },
    
    // 載入數據
    loadData: function() {
        if (!AnalyticsConfig.ENABLE_DATA_COLLECTION) return;
        
        try {
            const storageKey = `${this.gameName}_analytics_data`;
            const savedData = localStorage.getItem(storageKey);
            
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // 合併數據（保留現有數據）
                if (parsedData.data) {
                    // 只合併特定數組，避免重複
                    const mergeArrays = (target, source, maxLength) => {
                        const merged = [...target, ...source];
                        return merged.slice(-maxLength);
                    };
                    
                    this.data.sessions = mergeArrays(
                        this.data.sessions,
                        parsedData.data.sessions || [],
                        AnalyticsConfig.MAX_DATA_POINTS
                    );
                    
                    this.data.gameplay = mergeArrays(
                        this.data.gameplay,
                        parsedData.data.gameplay || [],
                        AnalyticsConfig.MAX_DATA_POINTS
                    );
                    
                    this.data.performance = mergeArrays(
                        this.data.performance,
                        parsedData.data.performance || [],
                        AnalyticsConfig.MAX_DATA_POINTS
                    );
                    
                    this.data.errors = mergeArrays(
                        this.data.errors,
                        parsedData.data.errors || [],
                        AnalyticsConfig.MAX_DATA_POINTS
                    );
                    
                    this.data.userActions = mergeArrays(
                        this.data.userActions,
                        parsedData.data.userActions || [],
                        AnalyticsConfig.MAX_DATA_POINTS
                    );
                    
                    this.data.metadata = {
                        ...this.data.metadata,
                        ...(parsedData.data.metadata || {})
                    };
                }
                
                // 記錄載入事件
                this.logEvent('data_loaded', {
                    timestamp: Date.now(),
                    dataPoints: this.getDataCount()
                });
                
                return true;
            }
        } catch (error) {
            console.error('載入分析數據失敗:', error);
        }
        
        return false;
    },
    
    // 獲取數據統計
    getStats: function() {
        const stats = {
            totalSessions: this.data.sessions.length,
            totalGameplayEvents: this.data.gameplay.length,
            totalPerformanceMetrics: this.data.performance.length,
            totalErrors: this.data.errors.length,
            totalUserActions: this.data.userActions.length,
            
            // 計算平均會話時長
            averageSessionDuration: 0,
            
            // 計算遊戲統計
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            averageScore: 0,
            
            // 性能統計
            averageFPS: 0,
            minFPS: Infinity,
            maxFPS: 0
        };
        
        // 計算會話統計
        let totalSessionDuration = 0;
        let completedSessions = 0;
        
        this.data.sessions.forEach(session => {
            if (session.duration && session.duration > 0) {
                totalSessionDuration += session.duration;
                completedSessions++;
            }
        });
        
        if (completedSessions > 0) {
            stats.averageSessionDuration = Math.round(totalSessionDuration / completedSessions);
        }
        
        // 計算遊戲統計
        let totalScore = 0;
        let gamesCount = 0;
        
        this.data.gameplay.forEach(event => {
            if (event.type === 'game_end') {
                gamesCount++;
                totalScore += event.data.score || 0;
                
                if (event.data.won) {
                    stats.gamesWon++;
                }
            }
        });
        
        stats.gamesPlayed = gamesCount;
        stats.totalScore = totalScore;
        stats.averageScore = gamesCount > 0 ? Math.round(totalScore / gamesCount) : 0;
        
        // 計算性能統計
        let totalFPS = 0;
        let fpsCount = 0;
        
        this.data.performance.forEach(metric => {
            if (metric.metric === 'fps') {
                totalFPS += metric.value;
                fpsCount++;
                
                if (metric.value < stats.minFPS) stats.minFPS = metric.value;
                if (metric.value > stats.maxFPS) stats.maxFPS = metric.value;
            }
        });
        
        if (fpsCount > 0) {
            stats.averageFPS = Math.round(totalFPS / fpsCount);
        }
        
        if (stats.minFPS === Infinity) stats.minFPS = 0;
        
        return stats;
    },
    
    // 獲取數據數量
    getDataCount: function() {
        return {
            sessions: this.data.sessions.length,
            gameplay: this.data.gameplay.length,
            performance: this.data.performance.length,
            errors: this.data.errors.length,
            userActions: this.data.userActions.length
        };
    },
    
    // 生成報告
    generateReport: function(format = AnalyticsConfig.REPORT_FORMAT) {
        if (!AnalyticsConfig.GENERATE_REPORTS) return null;
        
        const report = {
            metadata: {
                gameName: this.gameName,
                generatedAt: new Date().toISOString(),
                reportFormat: format,
                dataPoints: this.getDataCount()
            },
            stats: this.getStats(),
            recentSessions: this.data.sessions.slice(-10),
            recentGameplay: this.data.gameplay.slice(-20),
            performanceSummary: this.getPerformanceSummary(),
            errorSummary: this.getErrorSummary(),
            userBehavior: this.getUserBehaviorAnalysis()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
                
            case 'csv':
                return this.convertToCSV(report);
                
            case 'html':
                return this.convertToHTML(report);
                
            default:
                return report;
        }
    },
    
    // 獲取性能摘要
    getPerformanceSummary: function() {
        const fpsMetrics = this.data.performance.filter(m => m.metric === 'fps');
        const memoryMetrics = this.data.performance.filter(m => m.metric === 'memory_used');
        
        return {
            fps: {
                count: fpsMetrics.length,
                average: fpsMetrics.length > 0 ? 
                    Math.round(fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length) : 0,
                min: fpsMetrics.length > 0 ? Math.min(...fpsMetrics.map(m => m.value)) : 0,
                max: fpsMetrics.length > 0 ? Math.max(...fpsMetrics.map(m => m.value)) : 0
            },
            memory: {
                count: memoryMetrics.length,
                average: memoryMetrics.length > 0 ? 
                    Math.round(memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length) : 0,
                max: memoryMetrics.length > 0 ? Math.max(...memoryMetrics.map(m => m.value)) : 0
            }
        };
    },
    
    // 獲取錯誤摘要
    getErrorSummary: function() {
        const errorSummary = {
            totalErrors: this.data.errors.length,
            errorTypes: {},
            recentErrors: this.data.errors.slice(-10),
            errorRate: 0
        };
        
        // 統計錯誤類型
        this.data.errors.forEach(error => {
            const errorName = error.error.name || 'Unknown';
            errorSummary.errorTypes[errorName] = (errorSummary.errorTypes[errorName] || 0) + 1;
        });
        
        // 計算錯誤率（每小時錯誤數）
        if (this.data.sessions.length > 0) {
            const totalSessionTime = this.data.sessions.reduce((total, session) => {
                return total + (session.duration || 0);
            }, 0);
            
            if (totalSessionTime > 0) {
                const hours = totalSessionTime / (1000 * 60 * 60);
                errorSummary.errorRate = Math.round(this.data.errors.length / hours * 100) / 100;
            }
        }
        
        return errorSummary;
    },
    
    // 獲取用戶行為分析
    getUserBehaviorAnalysis: function() {
        const actions = this.data.userActions;
        const gameplay = this.data.gameplay;
        
        const analysis = {
            totalActions: actions.length,
            actionTypes: {},
            mostCommonAction: null,
            averageActionsPerSession: 0,
            gameplayPatterns: {
                averageGameDuration: 0,
                mostPlayedGameMode: null,
                winRate: 0
            }
        };
        
        // 統計操作類型
        actions.forEach(action => {
            const type = action.type;
            analysis.actionTypes[type] = (analysis.actionTypes[type] || 0) + 1;
        });
        
        // 找出最常見的操作
        let maxCount = 0;
        for (const [type, count] of Object.entries(analysis.actionTypes)) {
            if (count > maxCount) {
                maxCount = count;
                analysis.mostCommonAction = type;
            }
        }
        
        // 計算每會話平均操作數
        if (this.data.sessions.length > 0) {
            analysis.averageActionsPerSession = Math.round(actions.length / this.data.sessions.length);
        }
        
        // 分析遊戲模式
        const gameModes = {};
        let totalGameDuration = 0;
        let gamesCount = 0;
        let gamesWon = 0;
        
        gameplay.forEach(event => {
            if (event.type === 'game_start') {
                const mode = event.data.gameMode;
                gameModes[mode] = (gameModes[mode] || 0) + 1;
            }
            
            if (event.type === 'game_end') {
                gamesCount++;
                totalGameDuration += event.data.timePlayed || 0;
                if (event.data.won) gamesWon++;
            }
        });
        
        // 找出最常玩的遊戲模式
        let maxModeCount = 0;
        for (const [mode, count] of Object.entries(gameModes)) {
            if (count > maxModeCount) {
                maxModeCount = count;
                analysis.gameplayPatterns.mostPlayedGameMode = mode;
            }
        }
        
        // 計算平均遊戲時長和勝率
        if (gamesCount > 0) {
            analysis.gameplayPatterns.averageGameDuration = Math.round(totalGameDuration / gamesCount);
            analysis.gameplayPatterns.winRate = Math.round((gamesWon / gamesCount) * 100);
        }
        
        return analysis;
    },
    
    // 轉換為CSV格式
    convertToCSV: function(report) {
        const csvLines = [];
        
        // 添加元數據
        csvLines.push('Report Metadata');
        csvLines.push(`Game Name,${report.metadata.gameName}`);
        csvLines.push(`Generated At,${report.metadata.generatedAt}`);
        csvLines.push(`Report Format,${report.metadata.reportFormat}`);
        csvLines.push('');
        
        // 添加統計數據
        csvLines.push('Game Statistics');
        csvLines.push('Metric,Value');
        for (const [key, value] of Object.entries(report.stats)) {
            csvLines.push(`${key},${value}`);
        }
        csvLines.push('');
        
        // 添加性能摘要
        csvLines.push('Performance Summary');
        csvLines.push('Metric,Count,Average,Min,Max');
        csvLines.push(`FPS,${report.performanceSummary.fps.count},${report.performanceSummary.fps.average},${report.performanceSummary.fps.min},${report.performanceSummary.fps.max}`);
        csvLines.push(`Memory (MB),${report.performanceSummary.memory.count},${report.performanceSummary.memory.average},N/A,${report.performanceSummary.memory.max}`);
        csvLines.push('');
        
        // 添加錯誤摘要
        csvLines.push('Error Summary');
        csvLines.push(`Total Errors,${report.errorSummary.totalErrors}`);
        csvLines.push(`Error Rate (per hour),${report.errorSummary.errorRate}`);
        csvLines.push('');
        csvLines.push('Error Types,Count');
        for (const [errorType, count] of Object.entries(report.errorSummary.errorTypes)) {
            csvLines.push(`${errorType},${count}`);
        }
        
        return csvLines.join('\n');
    },
    
    // 轉換為HTML格式
    convertToHTML: function(report) {
        const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>遊戲分析報告 - ${report.metadata.gameName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .report-header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        
        .report-header .metadata {
            margin-top: 15px;
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 25px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-top: 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        
        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        
        .stat-card .label {
            font-size: 0.9em;
            color: #666;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .data-table th,
        .data-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .data-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        .data-table tr:hover {
            background-color: #f5f5f5;
        }
        
        .chart-container {
            height: 300px;
            margin: 20px 0;
            position: relative;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .report-header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1>🎮 遊戲分析報告</h1>
        <div class="metadata">
            <p><strong>遊戲名稱:</strong> ${report.metadata.gameName}</p>
            <p><strong>生成時間:</strong> ${new Date(report.metadata.generatedAt).toLocaleString('zh-TW')}</p>
            <p><strong>數據點總數:</strong> ${Object.values(report.metadata.dataPoints).reduce((a, b) => a + b, 0)}</p>
        </div>
    </div>
    
    <div class="section">
        <h2>📊 遊戲統計概覽</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${report.stats.totalSessions}</div>
                <div class="label">總會話數</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.stats.gamesPlayed}</div>
                <div class="label">遊戲次數</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.stats.gamesWon}</div>
                <div class="label">勝利次數</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.stats.averageScore}</div>
                <div class="label">平均分數</div>
            </div>
            <div class="stat-card">
                <div class="value">${Math.round(report.stats.averageSessionDuration / 1000 / 60)} 分鐘</div>
                <div class="label">平均會話時長</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.stats.averageFPS} FPS</div>
                <div class="label">平均幀率</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>⚡ 性能摘要</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>指標</th>
                    <th>數據點數</th>
                    <th>平均值</th>
                    <th>最小值</th>
                    <th>最大值</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>FPS (幀率)</td>
                    <td>${report.performanceSummary.fps.count}</td>
                    <td>${report.performanceSummary.fps.average}</td>
                    <td>${report.performanceSummary.fps.min}</td>
                    <td>${report.performanceSummary.fps.max}</td>
                </tr>
                <tr>
                    <td>記憶體使用 (MB)</td>
                    <td>${report.performanceSummary.memory.count}</td>
                    <td>${report.performanceSummary.memory.average.toFixed(2)}</td>
                    <td>N/A</td>
                    <td>${report.performanceSummary.memory.max.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>🐛 錯誤摘要</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${report.errorSummary.totalErrors}</div>
                <div class="label">總錯誤數</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.errorSummary.errorRate}</div>
                <div class="label">每小時錯誤率</div>
            </div>
        </div>
        
        <h3 style="margin-top: 25px;">錯誤類型分佈</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>錯誤類型</th>
                    <th>次數</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.errorSummary.errorTypes).map(([type, count]) => `
                <tr>
                    <td>${type}</td>
                    <td>${count}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>👤 用戶行為分析</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="value">${report.userBehavior.totalActions}</div>
                <div class="label">總操作數</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.userBehavior.averageActionsPerSession}</div>
                <div class="label">每會話平均操作</div>
            </div>
            <div class="stat-card">
                <div class="value">${report.userBehavior.gameplayPatterns.winRate}%</div>
                <div class="label">勝率</div>
            </div>
            <div class="stat-card">
                <div class="value">${Math.round(report.userBehavior.gameplayPatterns.averageGameDuration / 1000)} 秒</div>
                <div class="label">平均遊戲時長</div>
            </div>
        </div>
        
        <h3 style="margin-top: 25px;">最常玩的遊戲模式</h3>
        <p>${report.userBehavior.gameplayPatterns.mostPlayedGameMode || '無數據'}</p>
        
        <h3 style="margin-top: 25px;">最常見的操作類型</h3>
        <p>${report.userBehavior.mostCommonAction || '無數據'}</p>
    </div>
    
    <div class="section">
        <h2>📈 最近會話</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>會話ID</th>
                    <th>開始時間</th>
                    <th>時長</th>
                    <th>設備</th>
                </tr>
            </thead>
            <tbody>
                ${report.recentSessions.map(session => `
                <tr>
                    <td>${session.id.substring(0, 8)}...</td>
                    <td>${new Date(session.startTime).toLocaleString('zh-TW')}</td>
                    <td>${session.duration ? Math.round(session.duration / 1000) + ' 秒' : '進行中'}</td>
                    <td>${session.deviceInfo.platform}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <p>報告生成於 ${new Date().toLocaleString('zh-TW')}</p>
        <p>此報告僅供遊戲開發和優化使用，所有數據均已匿名化處理。</p>
    </div>
</body>
</html>
        `;
        
        return html;
    },
    
    // 清理舊數據
    cleanupOldData: function(maxAgeDays = 30) {
        const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
        
        const filterByTime = (array) => {
            return array.filter(item => item.timestamp >= cutoffTime);
        };
        
        this.data.sessions = filterByTime(this.data.sessions);
        this.data.gameplay = filterByTime(this.data.gameplay);
        this.data.performance = filterByTime(this.data.performance);
        this.data.errors = filterByTime(this.data.errors);
        this.data.userActions = filterByTime(this.data.userActions);
        
        // 保存清理後的數據
        this.saveData();
        
        return {
            removedSessions: this.data.sessions.length,
            removedGameplay: this.data.gameplay.length,
            removedPerformance: this.data.performance.length,
            removedErrors: this.data.errors.length,
            removedUserActions: this.data.userActions.length
        };
    },
    
    // 重置所有數據
    resetData: function() {
        this.data = {
            sessions: [],
            gameplay: [],
            performance: [],
            errors: [],
            userActions: [],
            metadata: {}
        };
        
        this.currentSession = null;
        
        // 清除本地存儲
        const storageKey = `${this.gameName}_analytics_data`;
        localStorage.removeItem(storageKey);
        
        return true;
    },
    
    // 導出數據
    exportData: function() {
        return {
            metadata: {
                gameName: this.gameName,
                exportedAt: new Date().toISOString(),
                version: '1.0.0',
                dataPoints: this.getDataCount()
            },
            data: this.data
        };
    },
    
    // 獲取可視化數據
    getVisualizationData: function() {
        return {
            sessions: {
                labels: this.data.sessions.slice(-20).map(s =>
                    new Date(s.startTime).toLocaleDateString('zh-TW')
                ),
                durations: this.data.sessions.slice(-20).map(s =>
                    s.duration ? Math.round(s.duration / 1000) : 0
                )
            },
            performance: {
                fps: this.data.performance
                    .filter(m => m.metric === 'fps')
                    .slice(-50)
                    .map(m => ({ x: new Date(m.timestamp), y: m.value })),
                memory: this.data.performance
                    .filter(m => m.metric === 'memory_used')
                    .slice(-50)
                    .map(m => ({ x: new Date(m.timestamp), y: m.value }))
            },
            errors: {
                types: Object.entries(this.getErrorSummary().errorTypes),
                timeline: this.data.errors.slice(-30).map(e => ({
                    time: new Date(e.timestamp),
                    type: e.error.name
                }))
            }
        };
    }
};

// ===== 導出到全局對象 =====
window.GameAnalytics = GameAnalytics;

// ===== 自動初始化（如果配置了自動啟動） =====
if (typeof window.GAME_ANALYTICS_AUTO_INIT !== 'undefined' && window.GAME_ANALYTICS_AUTO_INIT) {
    document.addEventListener('DOMContentLoaded', function() {
        const gameName = document.title || 'Unknown Game';
        GameAnalytics.init(gameName);
    });
}

console.log('📊 遊戲統計分析系統已載入');