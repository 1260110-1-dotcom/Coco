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
            recentErrors: