/* 
 * 遊戲工具函數庫
 * 包含所有遊戲通用的JavaScript工具函數
 * 版本: 1.0.0
 */

// ===== 音效系統 =====
const GameAudio = {
    // 音效上下文
    audioContext: null,
    
    // 音效狀態
    soundEnabled: true,
    
    // 音效緩存
    sounds: {},
    
    // 初始化音效系統
    init: function() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('音效系統初始化成功');
            return true;
        } catch (error) {
            console.warn('音效系統初始化失敗，使用靜音模式:', error);
            this.soundEnabled = false;
            return false;
        }
    },
    
    // 創建音效
    createSound: function(frequency = 440, duration = 0.1, type = 'sine', volume = 0.2) {
        if (!this.soundEnabled || !this.audioContext) return null;
        
        return () => {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = type;
                
                gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + duration);
            } catch (error) {
                console.warn('播放音效失敗:', error);
            }
        };
    },
    
    // 創建和弦音效
    createChordSound: function(frequencies = [440, 550, 660], duration = 0.5, volume = 0.2) {
        if (!this.soundEnabled || !this.audioContext) return null;
        
        return () => {
            try {
                const gainNode = this.audioContext.createGain();
                gainNode.connect(this.audioContext.destination);
                gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                frequencies.forEach(freq => {
                    const oscillator = this.audioContext.createOscillator();
                    oscillator.connect(gainNode);
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + duration);
                });
            } catch (error) {
                console.warn('播放和弦音效失敗:', error);
            }
        };
    },
    
    // 播放預定義音效
    playSound: function(soundName) {
        if (!this.soundEnabled) return;
        
        const soundEffects = {
            click: this.createSound(800, 0.1, 'sine', 0.3),
            hover: this.createSound(600, 0.2, 'sine', 0.2),
            success: this.createChordSound([523.25, 659.25, 783.99], 0.5, 0.3),
            move: this.createSound(400, 0.1, 'sine', 0.2),
            merge: this.createSound(600, 0.2, 'square', 0.3),
            win: this.createChordSound([523.25, 659.25, 783.99], 0.5, 0.3),
            lose: this.createSound(200, 0.3, 'sawtooth', 0.3)
        };
        
        if (soundEffects[soundName]) {
            soundEffects[soundName]();
        }
    },
    
    // 切換音效狀態
    toggleSound: function() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    },
    
    // 保存音效設置
    saveSoundSetting: function(gameName = 'default') {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`${gameName}-soundEnabled`, this.soundEnabled);
        }
    },
    
    // 載入音效設置
    loadSoundSetting: function(gameName = 'default') {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(`${gameName}-soundEnabled`);
            if (saved !== null) {
                this.soundEnabled = saved === 'true';
            }
        }
        return this.soundEnabled;
    }
};

// ===== 本地存儲工具 =====
const StorageUtils = {
    // 保存遊戲數據
    saveGameData: function(gameName, data) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`${gameName}-data`, JSON.stringify(data));
                return true;
            }
        } catch (error) {
            console.warn('保存遊戲數據失敗:', error);
        }
        return false;
    },
    
    // 載入遊戲數據
    loadGameData: function(gameName, defaultValue = {}) {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem(`${gameName}-data`);
                if (saved) {
                    return JSON.parse(saved);
                }
            }
        } catch (error) {
            console.warn('載入遊戲數據失敗:', error);
        }
        return defaultValue;
    },
    
    // 保存最高分
    saveHighScore: function(gameName, score) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(`${gameName}-highScore`, score.toString());
                return true;
            }
        } catch (error) {
            console.warn('保存最高分失敗:', error);
        }
        return false;
    },
    
    // 載入最高分
    loadHighScore: function(gameName, defaultValue = 0) {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem(`${gameName}-highScore`);
                if (saved) {
                    return parseInt(saved, 10) || defaultValue;
                }
            }
        } catch (error) {
            console.warn('載入最高分失敗:', error);
        }
        return defaultValue;
    },
    
    // 清除遊戲數據
    clearGameData: function(gameName) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(`${gameName}-data`);
                localStorage.removeItem(`${gameName}-highScore`);
                localStorage.removeItem(`${gameName}-soundEnabled`);
                return true;
            }
        } catch (error) {
            console.warn('清除遊戲數據失敗:', error);
        }
        return false;
    }
};

// ===== 遊戲循環工具 =====
const GameLoop = {
    // 遊戲循環狀態
    isRunning: false,
    loopId: null,
    lastTime: 0,
    accumulatedTime: 0,
    
    // 初始化遊戲循環
    init: function(updateCallback, drawCallback, speed = 100) {
        this.updateCallback = updateCallback;
        this.drawCallback = drawCallback;
        this.speed = speed; // 毫秒
        this.lastTime = 0;
        this.accumulatedTime = 0;
    },
    
    // 開始遊戲循環
    start: function() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = 0;
        this.accumulatedTime = 0;
        
        const loop = (timestamp) => {
            if (!this.isRunning) {
                this.loopId = null;
                return;
            }
            
            // 初始化時間
            if (this.lastTime === 0) {
                this.lastTime = timestamp;
            }
            
            // 計算時間差
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            
            // 累積時間
            this.accumulatedTime += deltaTime;
            
            // 根據速度更新遊戲
            while (this.accumulatedTime >= this.speed) {
                if (this.updateCallback) {
                    this.updateCallback();
                }
                this.accumulatedTime -= this.speed;
            }
            
            // 繪製遊戲
            if (this.drawCallback) {
                this.drawCallback();
            }
            
            // 繼續循環
            this.loopId = requestAnimationFrame(loop);
        };
        
        this.loopId = requestAnimationFrame(loop);
        console.log('遊戲循環已啟動（使用 requestAnimationFrame）');
    },
    
    // 停止遊戲循環
    stop: function() {
        this.isRunning = false;
        if (this.loopId) {
            cancelAnimationFrame(this.loopId);
            this.loopId = null;
        }
        console.log('遊戲循環已停止');
    },
    
    // 暫停遊戲循環
    pause: function() {
        this.isRunning = false;
    },
    
    // 繼續遊戲循環
    resume: function() {
        if (!this.loopId) {
            this.start();
        } else {
            this.isRunning = true;
        }
    },
    
    // 設置遊戲速度
    setSpeed: function(newSpeed) {
        this.speed = newSpeed;
    }
};

// ===== 輸入處理工具 =====
const InputHandler = {
    // 鍵盤狀態
    keys: {},
    
    // 觸控狀態
    touchStart: { x: 0, y: 0 },
    touchEnd: { x: 0, y: 0 },
    
    // 初始化鍵盤監聽
    initKeyboard: function() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.key] = true;
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
            this.keys[event.code] = false;
        });
    },
    
    // 檢查按鍵是否按下
    isKeyPressed: function(key) {
        return this.keys[key] === true;
    },
    
    // 初始化觸控監聽
    initTouch: function(element, callback) {
        if (!element) return;
        
        element.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.touchStart.x = event.touches[0].clientX;
            this.touchStart.y = event.touches[0].clientY;
        });
        
        element.addEventListener('touchmove', (event) => {
            event.preventDefault();
        });
        
        element.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            this.touchEnd.x = event.changedTouches[0].clientX;
            this.touchEnd.y = event.changedTouches[0].clientY;
            
            if (callback) {
                const dx = this.touchEnd.x - this.touchStart.x;
                const dy = this.touchEnd.y - this.touchStart.y;
                
                // 判斷滑動方向
                if (Math.abs(dx) > Math.abs(dy)) {
                    // 水平滑動
                    if (dx > 0) {
                        callback('right');
                    } else {
                        callback('left');
                    }
                } else {
                    // 垂直滑動
                    if (dy > 0) {
                        callback('down');
                    } else {
                        callback('up');
                    }
                }
            }
        });
    },
    
    // 清除所有按鍵狀態
    clearKeys: function() {
        this.keys = {};
    }
};

// ===== 數學工具函數 =====
const MathUtils = {
    // 生成隨機整數
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 生成隨機浮點數
    randomFloat: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // 限制數值範圍
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 線性插值
    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },
    
    // 計算兩點之間的距離
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    // 角度轉弧度
    degToRad: function(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    // 弧度轉角度
    radToDeg: function(radians) {
        return radians * (180 / Math.PI);
    }
};

// ===== 數組工具函數 =====
const ArrayUtils = {
    // 隨機打亂數組
    shuffle: function(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },
    
    // 從數組中隨機選擇一個元素
    randomChoice: function(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // 創建二維數組
    create2DArray: function(rows, cols, defaultValue = 0) {
        return Array(rows).fill().map(() => Array(cols).fill(defaultValue));
    },
    
    // 深拷貝數組
    deepCopy: function(array) {
        return JSON.parse(JSON.stringify(array));
    },
    
    // 數組去重
    unique: function(array) {
        return [...new Set(array)];
    }
};

// ===== DOM工具函數 =====
const DOMUtils = {
    // 安全獲取元素
    getElement: function(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`元素 #${id} 不存在`);
        }
        return element;
    },
    
    // 創建元素
    createElement: function(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    },
    
    // 顯示元素
    showElement: function(id) {
        const element = this.getElement(id);
        if (element) {
            element.style.display = '';
        }
    },
    
    // 隱藏元素
    hideElement: function(id) {
        const element = this.getElement(id);
        if (element) {
            element.style.display = 'none';
        }
    },
    
    // 更新元素文本
    updateText: function(id, text) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = text;
        }
    },
    
    // 添加CSS類
    addClass: function(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.add(className);
        }
    },
    
    // 移除CSS類
    removeClass: function(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.remove(className);
        }
    },
    
    // 切換CSS類
    toggleClass: function(id, className) {
        const element = this.getElement(id);
        if (element) {
            element.classList.toggle(className);
        }
    }
};

// ===== 錯誤處理工具 =====
const ErrorHandler = {
    // 安全執行函數
    safeExecute: function(func, errorMessage = '執行錯誤') {
        try {
            return func();
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            return null;
        }
    },
    
    // 安全執行異步函數
    safeExecuteAsync: async function(func, errorMessage = '執行錯誤') {
        try {
            return await func();
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            return null;
        }
    },
    
    // 顯示錯誤訊息
    showError: function(message, elementId = 'errorMessage') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            
            // 3秒後自動隱藏
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        } else {
            console.error('錯誤訊息:', message);
        }
    },
    
    // 檢查瀏覽器兼容性
    checkCompatibility: function() {
        const issues = [];
        
        // 檢查Canvas支持
        if (!window.HTMLCanvasElement) {
            issues.push('瀏覽器不支持Canvas');
        }
        
        // 檢查本地存儲支持
        if (typeof localStorage === 'undefined') {
            issues.push('瀏覽器不支持本地存儲');
        }
        
        // 檢查音效API支持
        if (!window.AudioContext && !window.webkitAudioContext) {
            issues.push('瀏覽器不支持Web Audio API');
        }
        
        return issues;
    }
};

// ===== 性能監控工具 =====
const PerformanceMonitor = {
    frames: 0,
    lastTime: 0,
    fps: 0,
    isMonitoring: false,
    
    // 開始監控
    start: function() {
        this.frames = 0;
        this.lastTime = performance.now();
        this.isMonitoring = true;
        this.update();
    },
    
    // 更新FPS計算
    update: function() {
        if (!this.isMonitoring) return;
        
        const currentTime = performance.now();
        this.frames++;
        
        // 每秒計算一次FPS
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
            this.frames = 0;
            this.lastTime = currentTime;
            
            // 輸出FPS信息（可選）
            if (this.fps < 30) {
                console.warn(`低FPS警告: ${this.fps} fps`);
            }
        }
        
        requestAnimationFrame(() => this.update());
    },
    
    // 停止監控
    stop: function() {
        this.isMonitoring = false;
    },
    
    // 獲取當前FPS
    getFPS: function() {
        return this.fps;
    },
    
    // 檢查性能問題
    checkPerformance: function() {
        const issues = [];
        
        if (this.fps < 30) {
            issues.push(`低FPS: ${this.fps} fps (建議60fps)`);
        }
        
        if (typeof performance !== 'undefined' && performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            const totalMB = performance.memory.totalJSHeapSize / (1024 * 1024);
            
            if (usedMB > 100) {
                issues.push(`高內存使用: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`);
            }
        }
        
        return issues;
    }
};

// ===== 遊戲統計工具 =====
const GameStats = {
    // 遊戲統計數據
    stats: {
        gamesPlayed: 0,
        totalScore: 0,
        totalTime: 0,
        wins: 0,
        losses: 0
    },
    
    // 初始化統計
    init: function(gameName) {
        this.gameName = gameName;
        const saved = StorageUtils.loadGameData(`${gameName}-stats`, this.stats);
        this.stats = { ...this.stats, ...saved };
    },
    
    // 記錄遊戲開始
    recordGameStart: function() {
        this.stats.gamesPlayed++;
        this.saveStats();
    },
    
    // 記錄遊戲結束
    recordGameEnd: function(score, time, won = false) {
        this.stats.totalScore += score;
        this.stats.totalTime += time;
        
        if (won) {
            this.stats.wins++;
        } else {
            this.stats.losses++;
        }
        
        this.saveStats();
    },
    
    // 保存統計數據
    saveStats: function() {
        StorageUtils.saveGameData(`${this.gameName}-stats`, this.stats);
    },
    
    // 獲取統計數據
    getStats: function() {
        return {
            ...this.stats,
            averageScore: this.stats.gamesPlayed > 0 ? Math.round(this.stats.totalScore / this.stats.gamesPlayed) : 0,
            averageTime: this.stats.gamesPlayed > 0 ? Math.round(this.stats.totalTime / this.stats.gamesPlayed) : 0,
            winRate: this.stats.gamesPlayed > 0 ? Math.round((this.stats.wins / this.stats.gamesPlayed) * 100) : 0
        };
    },
    
    // 重置統計數據
    resetStats: function() {
        this.stats = {
            gamesPlayed: 0,
            totalScore: 0,
            totalTime: 0,
            wins: 0,
            losses: 0
        };
        this.saveStats();
    }
};

// ===== 遊戲初始化工具 =====
const GameInitializer = {
    // 初始化遊戲
    init: function(gameName, options = {}) {
        console.log(`🎮 初始化遊戲: ${gameName}`);
        
        // 檢查瀏覽器兼容性
        const compatibilityIssues = ErrorHandler.checkCompatibility();
        if (compatibilityIssues.length > 0) {
            console.warn('瀏覽器兼容性問題:', compatibilityIssues);
            ErrorHandler.showError(`兼容性問題: ${compatibilityIssues.join(', ')}`);
        }
        
        // 初始化音效系統
        GameAudio.init();
        GameAudio.loadSoundSetting(gameName);
        
        // 初始化輸入處理
        InputHandler.initKeyboard();
        
        // 初始化遊戲統計
        GameStats.init(gameName);
        
        // 初始化性能監控
        if (options.monitorPerformance) {
            PerformanceMonitor.start();
        }
        
        console.log(`🎮 ${gameName} 初始化完成`);
        
        return {
            audio: GameAudio,
            storage: StorageUtils,
            input: InputHandler,
            stats: GameStats,
            performance: PerformanceMonitor,
            dom: DOMUtils,
            math: MathUtils,
            array: ArrayUtils,
            error: ErrorHandler
        };
    },
    
    // 創建遊戲畫布
    createCanvas: function(width, height, containerId = 'gameContainer') {
        const container = DOMUtils.getElement(containerId) || document.body;
        
        // 創建畫布
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.border = '2px solid #333';
        canvas.style.borderRadius = '10px';
        canvas.style.backgroundColor = '#111';
        
        // 添加到容器
        container.appendChild(canvas);
        
        // 獲取上下文
        const ctx = canvas.getContext('2d');
        
        return { canvas, ctx };
    },
    
    // 創建遊戲UI
    createGameUI: function(gameName, options = {}) {
        const ui = {
            container: null,
            scoreElement: null,
            highScoreElement: null,
            statusElement: null,
            buttons: {}
        };
        
        // 創遊戲容器
        ui.container = DOMUtils.createElement('div', 'game-container');
        
        // 創建標題
        const title = DOMUtils.createElement('h1', 'game-title', options.title || gameName);
        ui.container.appendChild(title);
        
        // 創建遊戲信息區域
        const gameInfo = DOMUtils.createElement('div', 'game-info');
        
        // 分數顯示
        const scoreDiv = DOMUtils.createElement('div', 'info-item');
        scoreDiv.innerHTML = '<div class="info-label">分數</div><div class="info-value score" id="score">0</div>';
        gameInfo.appendChild(scoreDiv);
        ui.scoreElement = scoreDiv.querySelector('#score');
        
        // 最高分顯示
        const highScoreDiv = DOMUtils.createElement('div', 'info-item');
        highScoreDiv.innerHTML = '<div class="info-label">最高分</div><div class="info-value high-score" id="highScore">0</div>';
        gameInfo.appendChild(highScoreDiv);
        ui.highScoreElement = highScoreDiv.querySelector('#highScore');
        
        ui.container.appendChild(gameInfo);
        
        // 創建狀態訊息元素
        ui.statusElement = DOMUtils.createElement('div', 'game-status', '準備開始！');
        ui.container.appendChild(ui.statusElement);
        
        // 創建控制按鈕
        if (options.buttons) {
            const controls = DOMUtils.createElement('div', 'controls');
            
            options.buttons.forEach(button => {
                const btn = DOMUtils.createElement('button', button.className || '', button.text);
                if (button.id) {
                    btn.id = button.id;
                    ui.buttons[button.id] = btn;
                }
                if (button.onclick) {
                    btn.addEventListener('click', button.onclick);
                }
                controls.appendChild(btn);
            });
            
            ui.container.appendChild(controls);
        }
        
        // 添加到頁面
        document.body.appendChild(ui.container);
        
        return ui;
    }
};

// ===== 導出所有工具 =====
window.GameUtils = {
    Audio: GameAudio,
    Storage: StorageUtils,
    Loop: GameLoop,
    Input: InputHandler,
    Math: MathUtils,
    Array: ArrayUtils,
    DOM: DOMUtils,
    Error: ErrorHandler,
    Performance: PerformanceMonitor,
    Stats: GameStats,
    Initializer: GameInitializer
};

console.log('🎮 遊戲工具函數庫已載入 (v1.0.0)');