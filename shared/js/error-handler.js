/* 
 * 遊戲錯誤處理系統
 * 提供統一的錯誤處理和日誌記錄機制
 * 版本: 1.0.0
 */

// ===== 錯誤處理配置 =====
const ErrorConfig = {
    // 錯誤級別
    LEVELS: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        FATAL: 'FATAL'
    },
    
    // 當前錯誤級別
    currentLevel: 'WARN',
    
    // 是否啟用控制台輸出
    enableConsole: true,
    
    // 是否啟用UI錯誤顯示
    enableUIErrors: true,
    
    // 錯誤顯示持續時間（毫秒）
    errorDisplayDuration: 5000,
    
    // 最大錯誤緩存數量
    maxErrorCache: 100
};

// ===== 錯誤記錄器 =====
const ErrorLogger = {
    // 錯誤緩存
    errorCache: [],
    
    // 記錄錯誤
    log: function(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const errorEntry = {
            timestamp,
            level,
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null
        };
        
        // 添加到緩存
        this.errorCache.push(errorEntry);
        
        // 限制緩存大小
        if (this.errorCache.length > ErrorConfig.maxErrorCache) {
            this.errorCache.shift();
        }
        
        // 根據配置決定是否輸出到控制台
        if (ErrorConfig.enableConsole) {
            this.logToConsole(level, message, error);
        }
        
        // 根據錯誤級別決定是否顯示UI錯誤
        if (ErrorConfig.enableUIErrors && (level === ErrorConfig.LEVELS.ERROR || level === ErrorConfig.LEVELS.FATAL)) {
            this.showUIError(message);
        }
        
        return errorEntry;
    },
    
    // 輸出到控制台
    logToConsole: function(level, message, error) {
        const styles = {
            [ErrorConfig.LEVELS.DEBUG]: 'color: #666;',
            [ErrorConfig.LEVELS.INFO]: 'color: #2196F3;',
            [ErrorConfig.LEVELS.WARN]: 'color: #FF9800;',
            [ErrorConfig.LEVELS.ERROR]: 'color: #F44336; font-weight: bold;',
            [ErrorConfig.LEVELS.FATAL]: 'color: #D32F2F; font-weight: bold; background: #FFEBEE;'
        };
        
        console.log(`%c[${level}] ${message}`, styles[level] || '');
        if (error) {
            console.error(error);
        }
    },
    
    // 顯示UI錯誤
    showUIError: function(message) {
        // 創建或獲取錯誤容器
        let errorContainer = document.getElementById('game-error-container');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'game-error-container';
            errorContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
            `;
            document.body.appendChild(errorContainer);
        }
        
        // 創建錯誤訊息元素
        const errorElement = document.createElement('div');
        errorElement.className = 'game-error-message';
        errorElement.style.cssText = `
            background: #F44336;
            color: white;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        errorElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <strong style="font-size: 16px;">⚠️ 遊戲錯誤</strong>
                    <div style="margin-top: 5px;">${message}</div>
                </div>
                <button style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">
                    ×
                </button>
            </div>
        `;
        
        // 添加關閉按鈕事件
        const closeBtn = errorElement.querySelector('button');
        closeBtn.addEventListener('click', () => {
            errorElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        });
        
        // 添加到容器
        errorContainer.appendChild(errorElement);
        
        // 自動移除
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (errorElement.parentNode) {
                        errorElement.parentNode.removeChild(errorElement);
                    }
                }, 300);
            }
        }, ErrorConfig.errorDisplayDuration);
        
        // 添加CSS動畫
        this.addErrorStyles();
    },
    
    // 添加錯誤樣式
    addErrorStyles: function() {
        if (!document.getElementById('error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // 獲取錯誤記錄
    getErrors: function() {
        return [...this.errorCache];
    },
    
    // 清除錯誤記錄
    clearErrors: function() {
        this.errorCache = [];
    },
    
    // 導出錯誤記錄
    exportErrors: function() {
        return JSON.stringify(this.errorCache, null, 2);
    }
};

// ===== 遊戲錯誤處理器 =====
const GameErrorHandler = {
    // 初始化錯誤處理
    init: function(options = {}) {
        // 合併配置
        Object.assign(ErrorConfig, options);
        
        // 設置全局錯誤處理
        this.setupGlobalErrorHandling();
        
        // 設置未處理的Promise拒絕處理
        this.setupPromiseRejectionHandling();
        
        console.log('遊戲錯誤處理系統已初始化');
    },
    
    // 設置全局錯誤處理
    setupGlobalErrorHandling: function() {
        // 保存原始錯誤處理器
        const originalOnError = window.onerror;
        const originalOnUnhandledRejection = window.onunhandledrejection;
        
        // 設置新的錯誤處理器
        window.onerror = (message, source, lineno, colno, error) => {
            // 記錄錯誤
            ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `全局錯誤: ${message}`, error);
            
            // 調用原始錯誤處理器（如果存在）
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error);
            }
            
            // 阻止默認錯誤處理
            return true;
        };
        
        // 設置未處理的Promise拒絕處理
        window.onunhandledrejection = (event) => {
            const error = event.reason;
            ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `未處理的Promise拒絕: ${error.message || error}`, error);
            
            // 調用原始處理器（如果存在）
            if (originalOnUnhandledRejection) {
                return originalOnUnhandledRejection(event);
            }
            
            // 阻止默認錯誤處理
            event.preventDefault();
        };
    },
    
    // 設置Promise拒絕處理
    setupPromiseRejectionHandling: function() {
        // 監聽未處理的Promise拒絕
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason;
            ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `未處理的Promise拒絕: ${error.message || error}`, error);
        });
        
        // 監聽已處理的Promise拒絕
        window.addEventListener('rejectionhandled', (event) => {
            const error = event.reason;
            ErrorLogger.log(ErrorConfig.LEVELS.INFO, `已處理的Promise拒絕: ${error.message || error}`);
        });
    },
    
    // 安全執行函數（帶錯誤處理）
    safeExecute: function(func, context = null, errorMessage = '執行錯誤') {
        try {
            return func.call(context);
        } catch (error) {
            ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `${errorMessage}: ${error.message}`, error);
            return null;
        }
    },
    
    // 安全執行異步函數
    safeExecuteAsync: async function(func, context = null, errorMessage = '執行錯誤') {
        try {
            return await func.call(context);
        } catch (error) {
            ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `${errorMessage}: ${error.message}`, error);
            return null;
        }
    },
    
    // 檢查遊戲資源
    checkGameResources: function(resources) {
        const missingResources = [];
        
        resources.forEach(resource => {
            if (resource.type === 'image') {
                const img = new Image();
                img.onerror = () => {
                    missingResources.push(`圖片資源加載失敗: ${resource.url}`);
                    ErrorLogger.log(ErrorConfig.LEVELS.WARN, `圖片資源加載失敗: ${resource.url}`);
                };
                img.src = resource.url;
            } else if (resource.type === 'audio') {
                const audio = new Audio();
                audio.onerror = () => {
                    missingResources.push(`音頻資源加載失敗: ${resource.url}`);
                    ErrorLogger.log(ErrorConfig.LEVELS.WARN, `音頻資源加載失敗: ${resource.url}`);
                };
                audio.src = resource.url;
            }
        });
        
        return missingResources;
    },
    
    // 檢查遊戲狀態
    checkGameState: function(gameState) {
        const issues = [];
        
        if (!gameState) {
            issues.push('遊戲狀態未定義');
            ErrorLogger.log(ErrorConfig.LEVELS.ERROR, '遊戲狀態未定義');
            return issues;
        }
        
        // 檢查必要的遊戲狀態屬性
        const requiredProps = ['score', 'level', 'isRunning'];
        requiredProps.forEach(prop => {
            if (!(prop in gameState)) {
                issues.push(`遊戲狀態缺少屬性: ${prop}`);
                ErrorLogger.log(ErrorConfig.LEVELS.WARN, `遊戲狀態缺少屬性: ${prop}`);
            }
        });
        
        // 檢查分數是否有效
        if (gameState.score !== undefined && (typeof gameState.score !== 'number' || gameState.score < 0)) {
            issues.push(`無效的分數: ${gameState.score}`);
            ErrorLogger.log(ErrorConfig.LEVELS.WARN, `無效的分數: ${gameState.score}`);
        }
        
        return issues;
    },
    
    // 創建錯誤報告
    createErrorReport: function(gameName, gameState = null) {
        const report = {
            timestamp: new Date().toISOString(),
            gameName,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            gameState,
            errors: ErrorLogger.getErrors()
        };
        
        return report;
    },
    
    // 顯示錯誤報告
    showErrorReport: function(gameName) {
        const report = this.createErrorReport(gameName);
        const reportText = JSON.stringify(report, null, 2);
        
        // 創建報告顯示區域
        let reportContainer = document.getElementById('error-report-container');
        if (!reportContainer) {
            reportContainer = document.createElement('div');
            reportContainer.id = 'error-report-container';
            reportContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                font-family: monospace;
                font-size: 12px;
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '關閉';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #f44336;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
            `;
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(reportContainer);
            });
            
            reportContainer.appendChild(closeBtn);
            document.body.appendChild(reportContainer);
        }
        
        // 顯示報告內容
        const pre = document.createElement('pre');
        pre.textContent = reportText;
        reportContainer.appendChild(pre);
    }
};

// ===== 遊戲資源監控 =====
const ResourceMonitor = {
    // 資源狀態
    resources: {},
    
    // 監控資源加載
    monitorResource: function(url, type) {
        const resourceId = `${type}_${url}`;
        
        this.resources[resourceId] = {
            url,
            type,
            loaded: false,
            error: false,
            startTime: Date.now(),
            loadTime: null
        };
        
        return new Promise((resolve, reject) => {
            if (type === 'image') {
                const img = new Image();
                img.onload = () => {
                    this.resources[resourceId].loaded = true;
                    this.resources[resourceId].loadTime = Date.now() - this.resources[resourceId].startTime;
                    resolve(img);
                };
                img.onerror = () => {
                    this.resources[resourceId].error = true;
                    ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `圖片資源加載失敗: ${url}`);
                    reject(new Error(`圖片資源加載失敗: ${url}`));
                };
                img.src = url;
            } else if (type === 'audio') {
                const audio = new Audio();
                audio.oncanplaythrough = () => {
                    this.resources[resourceId].loaded = true;
                    this.resources[resourceId].loadTime = Date.now() - this.resources[resourceId].startTime;
                    resolve(audio);
                };
                audio.onerror = () => {
                    this.resources[resourceId].error = true;
                    ErrorLogger.log(ErrorConfig.LEVELS.ERROR, `音頻資源加載失敗: ${url}`);
                    reject(new Error(`音頻資源加載失敗: ${url}`));
                };
                audio.src = url;
            }
        });
    },
    
    // 獲取資源狀態
    getResourceStatus: function() {
        const status = {
            total: Object.keys(this.resources).length,
            loaded: 0,
            errors: 0,
            totalLoadTime: 0
        };
        
        Object.values(this.resources).forEach(resource => {
            if (resource.loaded) {
                status.loaded++;
                status.totalLoadTime += resource.loadTime;
            }
            if (resource.error) {
                status.errors++;
            }
        });
        
        status.averageLoadTime = status.loaded > 0 ? status.totalLoadTime / status.loaded : 0;
        
        return status;
    },
    
    // 檢查資源加載問題
    checkResourceIssues: function() {
        const issues = [];
        
        Object.values(this.resources).forEach(resource => {
            if (resource.error) {
                issues.push(`${resource.type}資源加載失敗: ${resource.url}`);
            } else if (!resource.loaded) {
                issues.push(`${resource.type}資源仍在加載中: ${resource.url}`);
            } else if (resource.loadTime > 5000) {
                issues.push(`${resource.type}資源加載時間過長(${resource.loadTime}ms): ${resource.url}`);
            }
        });
        
        return issues;
    }
};

// ===== 導出錯誤處理系統 =====
window.GameErrorSystem = {
    Config: ErrorConfig,
    Logger: ErrorLogger,
    Handler: GameErrorHandler,
    Monitor: ResourceMonitor,
    
    // 快捷方法
    debug: (msg, error) => ErrorLogger.log(ErrorConfig.LEVELS.DEBUG, msg, error),
    info: (msg, error) => ErrorLogger.log(ErrorConfig.LEVELS.INFO, msg, error),
    warn: (msg, error) => ErrorLogger.log(ErrorConfig.LEVELS.WARN, msg, error),
    error: (msg, error) => ErrorLogger.log(ErrorConfig.LEVELS.ERROR, msg, error),
    fatal: (msg, error) => ErrorLogger.log(ErrorConfig.LEVELS.FATAL, msg, error),
    
    // 初始化
    init: (options) => GameErrorHandler.init(options),
    
    // 安全執行
    safe: (func, context, msg) => GameErrorHandler.safeExecute(func, context, msg),
    safeAsync: (func, context, msg) => GameErrorHandler.safeExecuteAsync(func, context, msg),
    
    // 檢查資源
    checkResources: (resources) => GameErrorHandler.checkGameResources(resources),
    
    // 檢查遊戲狀態
    checkGameState: (gameState) => GameErrorHandler.checkGameState(gameState),
    
    // 創建錯誤報告
    createReport: (gameName, gameState) => GameErrorHandler.createErrorReport(gameName, gameState),
    
    // 顯示錯誤報告
    showReport: (gameName) => GameErrorHandler.showErrorReport(gameName)
};

console.log('🎮 遊戲錯誤處理系統已載入 (v1.0.0)');

// ===== 自動初始化（可選） =====
// 如果需要在頁面加載時自動初始化，取消註釋以下代碼：
/*
document.addEventListener('DOMContentLoaded', () => {
    GameErrorSystem.init({
        enableConsole: true,
        enableUIErrors: true,
        currentLevel: 'WARN'
    });
});
*/