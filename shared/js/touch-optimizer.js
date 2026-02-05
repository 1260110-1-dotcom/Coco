/* 
 * 移動設備觸控優化工具
 * 提供統一的觸控事件處理和移動設備優化
 * 版本: 1.0.0
 */

// ===== 觸控配置 =====
const TouchConfig = {
    // 觸控閾值（像素）
    SWIPE_THRESHOLD: 30,
    TAP_THRESHOLD: 10,
    LONG_PRESS_DURATION: 500,
    
    // 觸控反饋
    ENABLE_HAPTIC_FEEDBACK: true,
    ENABLE_VISUAL_FEEDBACK: true,
    
    // 性能優化
    DEBOUNCE_DELAY: 100,
    THROTTLE_DELAY: 16, // ~60fps
    
    // 適配設定
    ADAPT_TO_SCREEN_SIZE: true,
    MIN_TOUCH_TARGET: 44, // 最小觸控目標大小（像素）
    
    // 手勢識別
    ENABLE_PINCH_ZOOM: true,
    ENABLE_ROTATE: true
};

// ===== 觸控事件處理器 =====
const TouchHandler = {
    // 觸控狀態
    touchState: {
        startX: 0,
        startY: 0,
        startTime: 0,
        currentX: 0,
        currentY: 0,
        isTouching: false,
        touchCount: 0,
        lastTapTime: 0,
        longPressTimer: null
    },
    
    // 手勢狀態
    gestureState: {
        scale: 1,
        rotation: 0,
        initialDistance: 0,
        initialAngle: 0
    },
    
    // 初始化觸控處理
    init: function(element, options = {}) {
        if (!element) {
            console.error('觸控處理器需要一個DOM元素');
            return;
        }
        
        // 合併配置
        Object.assign(TouchConfig, options);
        
        // 設置觸控事件監聽
        this.setupTouchEvents(element);
        
        // 優化觸控目標大小
        if (TouchConfig.ADAPT_TO_SCREEN_SIZE) {
            this.optimizeTouchTargets(element);
        }
        
        // 添加觸控樣式
        this.addTouchStyles();
        
        console.log('觸控處理器已初始化');
    },
    
    // 設置觸控事件監聽
    setupTouchEvents: function(element) {
        // 觸控開始
        element.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.handleTouchStart(event);
        }, { passive: false });
        
        // 觸控移動
        element.addEventListener('touchmove', (event) => {
            event.preventDefault();
            this.handleTouchMove(event);
        }, { passive: false });
        
        // 觸控結束
        element.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.handleTouchEnd(event);
        }, { passive: false });
        
        // 觸控取消
        element.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            this.handleTouchCancel(event);
        }, { passive: false });
        
        // 防止上下文菜單
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    },
    
    // 處理觸控開始
    handleTouchStart: function(event) {
        const touch = event.touches[0];
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.startTime = Date.now();
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
        this.touchState.isTouching = true;
        this.touchState.touchCount = event.touches.length;
        
        // 長按計時器
        this.touchState.longPressTimer = setTimeout(() => {
            this.triggerLongPress(event);
        }, TouchConfig.LONG_PRESS_DURATION);
        
        // 多點觸控手勢識別
        if (event.touches.length === 2 && TouchConfig.ENABLE_PINCH_ZOOM) {
            this.handleMultiTouchStart(event);
        }
        
        // 觸覺反饋
        if (TouchConfig.ENABLE_HAPTIC_FEEDBACK) {
            this.vibrate(10);
        }
        
        // 視覺反饋
        if (TouchConfig.ENABLE_VISUAL_FEEDBACK) {
            this.showTouchFeedback(touch.clientX, touch.clientY);
        }
        
        // 觸發自定義事件
        this.dispatchTouchEvent('touchstart', event);
    },
    
    // 處理觸控移動
    handleTouchMove: function(event) {
        if (!this.touchState.isTouching) return;
        
        const touch = event.touches[0];
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
        
        // 清除長按計時器（如果用戶移動了手指）
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }
        
        // 多點觸控手勢識別
        if (event.touches.length === 2 && TouchConfig.ENABLE_PINCH_ZOOM) {
            this.handleMultiTouchMove(event);
        }
        
        // 觸發自定義事件
        this.dispatchTouchEvent('touchmove', event);
    },
    
    // 處理觸控結束
    handleTouchEnd: function(event) {
        if (!this.touchState.isTouching) return;
        
        const endTime = Date.now();
        const duration = endTime - this.touchState.startTime;
        const deltaX = this.touchState.currentX - this.touchState.startX;
        const deltaY = this.touchState.currentY - this.touchState.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 清除長按計時器
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }
        
        // 識別手勢
        if (distance < TouchConfig.TAP_THRESHOLD && duration < 300) {
            // 點擊/輕觸
            this.handleTap(event, duration);
        } else if (distance >= TouchConfig.SWIPE_THRESHOLD && duration < 500) {
            // 滑動手勢
            this.handleSwipe(event, deltaX, deltaY, distance);
        }
        
        // 重置觸控狀態
        this.touchState.isTouching = false;
        this.touchState.touchCount = 0;
        
        // 觸發自定義事件
        this.dispatchTouchEvent('touchend', event);
    },
    
    // 處理觸控取消
    handleTouchCancel: function(event) {
        // 清除長按計時器
        if (this.touchState.longPressTimer) {
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.longPressTimer = null;
        }
        
        // 重置觸控狀態
        this.touchState.isTouching = false;
        this.touchState.touchCount = 0;
        
        // 觸發自定義事件
        this.dispatchTouchEvent('touchcancel', event);
    },
    
    // 處理多點觸控開始
    handleMultiTouchStart: function(event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // 計算初始距離和角度
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        
        this.gestureState.initialDistance = Math.sqrt(dx * dx + dy * dy);
        this.gestureState.initialAngle = Math.atan2(dy, dx);
        this.gestureState.scale = 1;
        this.gestureState.rotation = 0;
    },
    
    // 處理多點觸控移動
    handleMultiTouchMove: function(event) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // 計算當前距離和角度
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const currentAngle = Math.atan2(dy, dx);
        
        // 計算縮放比例
        if (this.gestureState.initialDistance > 0) {
            this.gestureState.scale = currentDistance / this.gestureState.initialDistance;
        }
        
        // 計算旋轉角度
        if (TouchConfig.ENABLE_ROTATE) {
            this.gestureState.rotation = currentAngle - this.gestureState.initialAngle;
        }
        
        // 觸發縮放手勢事件
        this.dispatchGestureEvent('pinch', {
            scale: this.gestureState.scale,
            centerX: (touch1.clientX + touch2.clientX) / 2,
            centerY: (touch1.clientY + touch2.clientY) / 2
        });
        
        // 觸發旋轉手勢事件
        if (TouchConfig.ENABLE_ROTATE) {
            this.dispatchGestureEvent('rotate', {
                rotation: this.gestureState.rotation,
                centerX: (touch1.clientX + touch2.clientX) / 2,
                centerY: (touch1.clientY + touch2.clientY) / 2
            });
        }
    },
    
    // 處理點擊
    handleTap: function(event, duration) {
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - this.touchState.lastTapTime;
        
        // 雙擊識別（300毫秒內）
        if (timeSinceLastTap < 300) {
            this.dispatchGestureEvent('doubletap', {
                x: this.touchState.currentX,
                y: this.touchState.currentY,
                duration: duration
            });
            this.touchState.lastTapTime = 0;
        } else {
            this.dispatchGestureEvent('tap', {
                x: this.touchState.currentX,
                y: this.touchState.currentY,
                duration: duration
            });
            this.touchState.lastTapTime = currentTime;
        }
        
        // 觸覺反饋
        if (TouchConfig.ENABLE_HAPTIC_FEEDBACK) {
            this.vibrate(20);
        }
    },
    
    // 處理滑動手勢
    handleSwipe: function(event, deltaX, deltaY, distance) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        const duration = Date.now() - this.touchState.startTime;
        const velocity = distance / duration;
        
        let direction = '';
        
        // 判斷主要方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑動
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            // 垂直滑動
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        this.dispatchGestureEvent('swipe', {
            direction: direction,
            deltaX: deltaX,
            deltaY: deltaY,
            distance: distance,
            angle: angle,
            velocity: velocity,
            duration: duration
        });
        
        // 觸覺反饋
        if (TouchConfig.ENABLE_HAPTIC_FEEDBACK) {
            this.vibrate(30);
        }
    },
    
    // 觸發長按
    triggerLongPress: function(event) {
        this.dispatchGestureEvent('longpress', {
            x: this.touchState.currentX,
            y: this.touchState.currentY,
            duration: TouchConfig.LONG_PRESS_DURATION
        });
        
        // 觸覺反饋
        if (TouchConfig.ENABLE_HAPTIC_FEEDBACK) {
            this.vibrate(50);
        }
        
        // 視覺反饋
        if (TouchConfig.ENABLE_VISUAL_FEEDBACK) {
            this.showLongPressFeedback(this.touchState.currentX, this.touchState.currentY);
        }
    },
    
    // 優化觸控目標大小
    optimizeTouchTargets: function(element) {
        // 查找所有可點擊元素
        const clickableElements = element.querySelectorAll('button, a, [role="button"], [onclick]');
        
        clickableElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const minSize = TouchConfig.MIN_TOUCH_TARGET;
            
            // 如果元素太小，增加觸控區域
            if (rect.width < minSize || rect.height < minSize) {
                const paddingX = Math.max(0, (minSize - rect.width) / 2);
                const paddingY = Math.max(0, (minSize - rect.height) / 2);
                
                el.style.paddingLeft = `calc(${el.style.paddingLeft || '0px'} + ${paddingX}px)`;
                el.style.paddingRight = `calc(${el.style.paddingRight || '0px'} + ${paddingX}px)`;
                el.style.paddingTop = `calc(${el.style.paddingTop || '0px'} + ${paddingY}px)`;
                el.style.paddingBottom = `calc(${el.style.paddingBottom || '0px'} + ${paddingY}px)`;
                
                // 添加觸控提示
                el.setAttribute('data-touch-optimized', 'true');
            }
        });
    },
    
    // 添加觸控樣式
    addTouchStyles: function() {
        if (!document.getElementById('touch-styles')) {
            const style = document.createElement('style');
            style.id = 'touch-styles';
            style.textContent = `
                /* 觸控反饋效果 */
                .touch-feedback {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(0, 150, 255, 0.3);
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 9999;
                    animation: touchRipple 0.6s ease-out;
                }
                
                .longpress-feedback {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 100, 100, 0.3);
                    border: 3px solid rgba(255, 100, 100, 0.6);
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 9999;
                    animation: longpressPulse 0.5s ease-in-out infinite;
                }
                
                @keyframes touchRipple {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 0.8;
                    }
                    100% {
                        width: 100px;
                        height: 100px;
                        opacity: 0;
                    }
                }
                
                @keyframes longpressPulse {
                    0%, 100% {
                        width: 60px;
                        height: 60px;
                        opacity: 0.6;
                    }
                    50% {
                        width: 80px;
                        height: 80px;
                        opacity: 0.3;
                    }
                }
                
                /* 觸控優化元素 */
                [data-touch-optimized="true"] {
                    transition: transform 0.1s, opacity 0.1s;
                }
                
                [data-touch-optimized="true"]:active {
                    transform: scale(0.95);
                    opacity: 0.8;
                }
                
                /* 防止文本選擇 */
                .no-select {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    -khtml-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
                
                /* 改善滾動性能 */
                .smooth-scroll {
                    -webkit-overflow-scrolling: touch;
                    overflow-scrolling: touch;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // 顯示觸控反饋
    showTouchFeedback: function(x, y) {
        if (!TouchConfig.ENABLE_VISUAL_FEEDBACK) return;
        
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.left = `${x}px`;
        feedback.style.top = `${y}px`;
        
        document.body.appendChild(feedback);
        
        // 自動移除
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 600);
    },
    
    // 顯示長按反饋
    showLongPressFeedback: function(x, y) {
        if (!TouchConfig.ENABLE_VISUAL_FEEDBACK) return;
        
        const feedback = document.createElement('div');
        feedback.className = 'longpress-feedback';
        feedback.style.left = `${x}px`;
        feedback.style.top = `${y}px`;
        
        document.body.appendChild(feedback);
        
        // 自動移除
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 1000);
    },
    
    // 觸覺反饋（振動）
    vibrate: function(duration) {
        if (!TouchConfig.ENABLE_HAPTIC_FEEDBACK) return;
        
        try {
            // 檢查瀏覽器支持
            if (navigator.vibrate) {
                navigator.vibrate(duration);
            }
        } catch (error) {
            console.warn('觸覺反饋失敗:', error);
        }
    },
    
    // 發送觸控事件
    dispatchTouchEvent: function(type, originalEvent) {
        const event = new CustomEvent(`game:${type}`, {
            detail: {
                originalEvent,
                touchState: { ...this.touchState },
                gestureState: { ...this.gestureState }
            },
            bubbles: true,
            cancelable: true
        });
        
        // 發送到原始事件的目標元素
        if (originalEvent.target) {
            originalEvent.target.dispatchEvent(event);
        }
    },
    
    // 發送手勢事件
    dispatchGestureEvent: function(gestureType, data) {
        const event = new CustomEvent(`game:gesture:${gestureType}`, {
            detail: {
                ...data,
                touchState: { ...this.touchState },
                gestureState: { ...this.gestureState },
                timestamp: Date.now()
            },
            bubbles: true,
            cancelable: true
        });
        
        // 發送到文檔
        document.dispatchEvent(event);
        
        // 輸出調試信息
        if (TouchConfig.enableConsole !== false) {
            console.log(`手勢檢測: ${gestureType}`, data);
        }
    },
    
    // 檢測移動設備
    isMobileDevice: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    },
    
    // 檢測觸控支持
    hasTouchSupport: function() {
        return 'ontouchstart' in window ||
               navigator.maxTouchPoints > 0 ||
               navigator.msMaxTouchPoints > 0;
    },
    
    // 獲取觸控配置
    getConfig: function() {
        return { ...TouchConfig };
    },
    
    // 更新觸控配置
    updateConfig: function(newConfig) {
        Object.assign(TouchConfig, newConfig);
    },
    
    // 重置觸控狀態
    reset: function() {
        this.touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            currentX: 0,
            currentY: 0,
            isTouching: false,
            touchCount: 0,
            lastTapTime: 0,
            longPressTimer: null
        };
        
        this.gestureState = {
            scale: 1,
            rotation: 0,
            initialDistance: 0,
            initialAngle: 0
        };
    }
};

// ===== 移動設備適配工具 =====
const MobileAdapter = {
    // 檢測設備類型
    detectDevice: function() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        let deviceType = 'desktop';
        let orientation = 'landscape';
        
        // 檢測設備類型
        if (/iphone|ipod|android.*mobile|windows phone|blackberry|bb10|webos|iemobile|opera mini|mobile/i.test(userAgent)) {
            deviceType = 'mobile';
        } else if (/ipad|tablet|android(?!.*mobile)|kindle|silk/i.test(userAgent)) {
            deviceType = 'tablet';
        }
        
        // 檢測屏幕方向
        if (screenWidth < screenHeight) {
            orientation = 'portrait';
        }
        
        return {
            type: deviceType,
            orientation: orientation,
            screenWidth: screenWidth,
            screenHeight: screenHeight,
            pixelRatio: window.devicePixelRatio || 1,
            userAgent: navigator.userAgent
        };
    },
    
    // 適配遊戲界面
    adaptGameUI: function(gameContainer) {
        if (!gameContainer) return;
        
        const deviceInfo = this.detectDevice();
        
        // 根據設備類型調整UI
        if (deviceInfo.type === 'mobile') {
            // 移動設備優化
            gameContainer.classList.add('mobile-optimized');
            
            // 調整字體大小
            this.adjustFontSizes(gameContainer, 0.9);
            
            // 調整按鈕大小
            this.adjustButtonSizes(gameContainer);
            
            // 調整間距
            this.adjustSpacing(gameContainer, 0.8);
            
            // 添加移動設備特定樣式
            this.addMobileStyles();
        } else if (deviceInfo.type === 'tablet') {
            // 平板設備優化
            gameContainer.classList.add('tablet-optimized');
            
            // 調整字體大小
            this.adjustFontSizes(gameContainer, 0.95);
            
            // 調整間距
            this.adjustSpacing(gameContainer, 0.9);
        }
        
        // 根據屏幕方向調整
        if (deviceInfo.orientation === 'portrait') {
            gameContainer.classList.add('portrait-mode');
            this.adaptToPortrait(gameContainer);
        } else {
            gameContainer.classList.add('landscape-mode');
            this.adaptToLandscape(gameContainer);
        }
        
        return deviceInfo;
    },
    
    // 調整字體大小
    adjustFontSizes: function(container, scaleFactor) {
        const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a');
        
        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            const fontSize = parseFloat(computedStyle.fontSize);
            
            if (fontSize && fontSize > 0) {
                const newSize = Math.max(12, fontSize * scaleFactor);
                el.style.fontSize = `${newSize}px`;
            }
        });
    },
    
    // 調整按鈕大小
    adjustButtonSizes: function(container) {
        const buttons = container.querySelectorAll('button, .btn, [role="button"]');
        
        buttons.forEach(btn => {
            const minWidth = 60;
            const minHeight = 44;
            const padding = 12;
            
            btn.style.minWidth = `${minWidth}px`;
            btn.style.minHeight = `${minHeight}px`;
            btn.style.padding = `${padding}px ${padding * 1.5}px`;
            btn.style.margin = '8px';
        });
    },
    
    // 調整間距
    adjustSpacing: function(container, scaleFactor) {
        const elements = container.querySelectorAll('*');
        
        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            
            // 調整margin
            ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(prop => {
                const value = computedStyle[prop];
                if (value && value !== '0px' && value !== 'auto') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        el.style[prop] = `${numValue * scaleFactor}px`;
                    }
                }
            });
            
            // 調整padding
            ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].forEach(prop => {
                const value = computedStyle[prop];
                if (value && value !== '0px') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        el.style[prop] = `${numValue * scaleFactor}px`;
                    }
                }
            });
        });
    },
    
    // 適應豎屏模式
    adaptToPortrait: function(container) {
        // 豎屏模式優化
        container.style.maxWidth = '100%';
        container.style.padding = '15px';
        
        // 調整布局為垂直方向
        const flexContainers = container.querySelectorAll('.flex-row, .row, [style*="flex-direction: row"]');
        flexContainers.forEach(el => {
            el.style.flexDirection = 'column';
        });
    },
    
    // 適應橫屏模式
    adaptToLandscape: function(container) {
        // 橫屏模式優化
        container.style.maxWidth = '90%';
        container.style.padding = '20px';
    },
    
    // 添加移動設備樣式
    addMobileStyles: function() {
        if (!document.getElementById('mobile-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-styles';
            style.textContent = `
                /* 移動設備優化樣式 */
                .mobile-optimized {
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                }
                
                .mobile-optimized * {
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }
                
                .mobile-optimized button,
                .mobile-optimized .btn,
                .mobile-optimized [role="button"] {
                    cursor: pointer;
                    transition: all 0.1s ease;
                }
                
                .mobile-optimized button:active,
                .mobile-optimized .btn:active,
                .mobile-optimized [role="button"]:active {
                    transform: scale(0.95);
                    opacity: 0.8;
                }
                
                /* 防止300ms點擊延遲 */
                .mobile-optimized a,
                .mobile-optimized button,
                .mobile-optimized [role="button"] {
                    touch-action: manipulation;
                }
                
                /* 改善滾動性能 */
                .mobile-optimized .scrollable {
                    -webkit-overflow-scrolling: touch;
                    overflow-scrolling: touch;
                }
                
                /* 豎屏模式優化 */
                .portrait-mode .game-container {
                    max-height: 85vh;
                    overflow-y: auto;
                }
                
                /* 橫屏模式優化 */
                .landscape-mode .game-container {
                    max-height: 80vh;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // 監聽屏幕方向變化
    setupOrientationListener: function(callback) {
        const handleOrientationChange = () => {
            const orientation = window.screen.orientation ||
                               window.orientation ||
                               (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
            
            const info = this.detectDevice();
            
            if (callback) {
                callback(info);
            }
            
            // 發送方向變化事件
            const event = new CustomEvent('game:orientationchange', {
                detail: info,
                bubbles: true
            });
            document.dispatchEvent(event);
        };
        
        // 監聽方向變化
        window.addEventListener('resize', handleOrientationChange);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        if (window.screen.orientation) {
            window.screen.orientation.addEventListener('change', handleOrientationChange);
        }
        
        return handleOrientationChange;
    }
};

// ===== 導出觸控優化系統 =====
window.TouchOptimizer = {
    Config: TouchConfig,
    Handler: TouchHandler,
    Adapter: MobileAdapter,
    
    // 快捷方法
    init: (element, options) => TouchHandler.init(element, options),
    adaptUI: (container) => MobileAdapter.adaptGameUI(container),
    isMobile: () => TouchHandler.isMobileDevice(),
    hasTouch: () => TouchHandler.hasTouchSupport(),
    
    // 事件監聽快捷方法
    onGesture: (gestureType, callback) => {
        document.addEventListener(`game:gesture:${gestureType}`, (event) => {
            callback(event.detail);
        });
    },
    
    onOrientationChange: (callback) => {
        MobileAdapter.setupOrientationListener(callback);
    }
};

console.log('🎮 移動設備觸控優化工具已載入 (v1.0.0)');

// ===== 自動檢測和初始化（可選） =====
// 如果需要在頁面加載時自動初始化，取消註釋以下代碼：
/*
document.addEventListener('DOMContentLoaded', () => {
    if (TouchOptimizer.isMobile() || TouchOptimizer.hasTouch()) {
        console.log('檢測到移動設備或觸控支持，啟用觸控優化');
        
        // 初始化主遊戲容器的觸控處理
        const gameContainer = document.querySelector('.game-container, canvas, #gameContainer');
        if (gameContainer) {
            TouchOptimizer.init(gameContainer);
            TouchOptimizer.adaptUI(gameContainer);
        }
        
        // 監聽方向變化
        TouchOptimizer.onOrientationChange((deviceInfo) => {
            console.log('屏幕方向變化:', deviceInfo);
        });
    }
});
*/