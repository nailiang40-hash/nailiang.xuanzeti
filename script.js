// 全局常量
const CONSTANTS = {
    STORAGE_KEY: 'quizAppData',
    TOAST_DURATION: 3000,
    TIMER_INTERVAL: 1000,
    SUPPORTED_FILE_TYPES: ['.txt'],
    ANSWER_OPTIONS: ['A', 'B', 'C', 'D'],
    MODES: {
        PRACTICE: 'practice',
        TEST: 'test'
    },
    SHORTCUT_KEYS: {
        NEXT_QUESTION: ['Enter', ' ']
    }
};

// DOM缓存
const DOM_CACHE = {
    optionsContainer: null,
    questionNum: null,
    totalQuestions: null,
    questionText: null,
    progressBar: null,
    correctCount: null,
    incorrectCount: null,
    attemptedCount: null,
    prevBtn: null,
    nextBtn: null,
    startQuizBtn: null,
    fileInput: null,
    timer: null,
    toast: null,
    actionContainer: null
};

// 全局状态
let appState = {
    questions: [],
    currentIndex: 0,
    answers: {},
    stats: {
        correct: 0,
        incorrect: 0,
        totalAttempted: 0
    },
    settings: {
        theme: 'light',
        showExplanation: true
    },
    timerId: null,
    elapsedTime: 0,
    selectedOptions: []
};

// 初始化DOM缓存
function initDOMCache() {
    DOM_CACHE.optionsContainer = document.getElementById('optionsContainer');
    DOM_CACHE.questionNum = document.getElementById('questionNum');
    DOM_CACHE.totalQuestions = document.getElementById('totalQuestions');
    DOM_CACHE.questionText = document.getElementById('questionText');
    DOM_CACHE.progressBar = document.getElementById('progressBar');
    DOM_CACHE.correctCount = document.getElementById('correctCount');
    DOM_CACHE.incorrectCount = document.getElementById('incorrectCount');
    DOM_CACHE.attemptedCount = document.getElementById('attemptedCount');
    DOM_CACHE.prevBtn = document.getElementById('prevBtn');
    DOM_CACHE.nextBtn = document.getElementById('nextBtn');
    DOM_CACHE.startQuizBtn = document.getElementById('startQuizBtn');
    DOM_CACHE.fileInput = document.getElementById('fileInput');
    DOM_CACHE.timer = document.getElementById('timer');
    DOM_CACHE.toast = document.getElementById('toast');
    DOM_CACHE.actionContainer = document.getElementById('actionContainer');
}

// 初始化应用
function initApp() {
    initDOMCache();
    bindEvents();
    loadFromStorage();
    
    // 恢复主题
    if (appState.settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    showToast('智能刷题系统已就绪！', 'info');
}

// 绑定事件
function bindEvents() {
    // 文件选择事件
    DOM_CACHE.fileInput.addEventListener('change', handleFileUpload);
    
    // 开始刷题按钮
    DOM_CACHE.startQuizBtn.addEventListener('click', startQuiz);
    
    // 选项按钮事件委托
    DOM_CACHE.optionsContainer.addEventListener('click', (e) => {
        const optionBtn = e.target.closest('.option-btn');
        if (optionBtn) {
            const selectedOption = optionBtn.dataset.option;
            selectAnswer(selectedOption);
        }
    });

    // 主题切换按钮
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // 快捷下一题按键
    document.addEventListener('keydown', (e) => {
        const quickNextBtn = document.getElementById('quickNextBtn');
        if (quickNextBtn && quickNextBtn.style.display !== 'none') {
            if (CONSTANTS.SHORTCUT_KEYS.NEXT_QUESTION.includes(e.key)) {
                e.preventDefault();
                goToNextQuestion();
            }
        }
    });

    // 页面卸载时清除定时器
    window.addEventListener('beforeunload', () => {
        if (appState.timerId) clearInterval(appState.timerId);
    });
}

// 处理文件上传
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 校验文件类型
    const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!CONSTANTS.SUPPORTED_FILE_TYPES.includes(fileExt)) {
        showToast('请上传TXT格式的文件！', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const text = event.target.result;
            appState.questions = parseQuestions(text);
            
            if (appState.questions.length > 0) {
                DOM_CACHE.startQuizBtn.disabled = false;
                showToast(`成功加载 ${appState.questions.length} 道题目！`, 'success');
                DOM_CACHE.totalQuestions.textContent = `/ ${appState.questions.length}`;
            } else {
                showToast('未解析到有效题目，请检查文件格式！', 'error');
            }
        } catch (error) {
            console.error('解析文件失败:', error);
            showToast('文件解析失败，请检查文件格式！', 'error');
        }
    };
    reader.readAsText(file);
}

/**
 * 解析文本格式的题库（支持单选/多选）
 * @param {string} text - 题库文本内容
 * @returns {Array<Object>} 解析后的题目数组
 * @example
 * // 单选题格式：问题|选项A|选项B|选项C|选项D|A|解析
 * // 多选题格式：问题|选项A|选项B|选项C|选项D|A,C|解析
 */
function parseQuestions(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n').filter(line => line.trim());
    const questions = [];
    let questionId = 1;

    for (let line of lines) {
        line = line.trim();
        let parts = line.split(/[,|]/).map(part => part.trim()).filter(part => part);
        
        if (parts.length < 6) {
            console.warn(`第${questionId}行格式错误，跳过：${line}`);
            continue;
        }

        // 处理正确答案（支持多选）
        const correctAnswers = parts[5]
            .toUpperCase()
            .split(',')
            .map(ans => ans.trim())
            .filter(ans => CONSTANTS.ANSWER_OPTIONS.includes(ans));

        const questionType = correctAnswers.length > 1 ? 'multiple' : 'single';

        const question = {
            id: questionId++,
            question: parts[0],
            type: questionType,
            options: [
                parts[1] || '选项A',
                parts[2] || '选项B',
                parts[3] || '选项C',
                parts[4] || '选项D'
            ],
            correctAnswers: correctAnswers,
            explanation: parts[6] || ''
        };

        if (question.correctAnswers.length > 0) {
            questions.push(question);
        } else {
            console.warn(`第${questionId}行正确答案错误，跳过：${line}`);
        }
    }

    return questions;
}

// 开始刷题
function startQuiz() {
    appState.currentIndex = 0;
    appState.elapsedTime = 0;
    appState.selectedOptions = [];
    
    updateQuestionDisplay();
    updateNavButtons();
    updateStatsDisplay();
    updateProgress();
    startTimer();
    
    showToast('开始刷题！加油！', 'success');
}

// 更新题目显示
function updateQuestionDisplay() {
    if (appState.questions.length === 0) return;
    
    const question = appState.questions[appState.currentIndex];
    
    DOM_CACHE.questionNum.textContent = `题目 #${question.id}`;
    DOM_CACHE.questionText.textContent = question.question;
    
    setupOptionButtons();
    updateProgress();
    updateNavButtons();
}

/**
 * 初始化选项按钮（适配单选/多选）
 */
function setupOptionButtons() {
    DOM_CACHE.optionsContainer.innerHTML = '';
    
    const question = appState.questions[appState.currentIndex];
    const letters = CONSTANTS.ANSWER_OPTIONS;
    
    // 重置当前题选中状态
    appState.selectedOptions = appState.answers[question.id]?.selected || [];

    letters.forEach((letter, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.option = letter;
        
        button.innerHTML = `
            <span class="option-letter">${letter}</span>
            <span class="option-text">${question.options[index] || '选项' + letter}</span>
        `;
        
        // 恢复选中状态
        if (appState.selectedOptions.includes(letter)) {
            button.classList.add('selected');
        }
        
        // 标记题型
        if (question.type === 'multiple') {
            button.classList.add('multiple-choice');
        }

        DOM_CACHE.optionsContainer.appendChild(button);
    });

    // 隐藏快捷下一题按钮
    hideQuickNextButton();
}

/**
 * 处理选项选择（支持单选/多选）
 * @param {string} selectedOption - 选中的选项（A/B/C/D）
 */
function selectAnswer(selectedOption) {
    const question = appState.questions[appState.currentIndex];
    const optionButtons = document.querySelectorAll('.option-btn');
    
    // 单选逻辑
    if (question.type === 'single') {
        optionButtons.forEach(btn => btn.classList.remove('selected'));
        appState.selectedOptions = [selectedOption];
    } 
    // 多选逻辑
    else {
        const optionIndex = appState.selectedOptions.indexOf(selectedOption);
        if (optionIndex > -1) {
            appState.selectedOptions.splice(optionIndex, 1);
        } else {
            appState.selectedOptions.push(selectedOption);
        }
    }

    // 更新按钮样式
    optionButtons.forEach(btn => {
        const option = btn.dataset.option;
        if (appState.selectedOptions.includes(option)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // 验证答案
    validateAnswer();
}

/**
 * 验证答案并更新统计
 */
function validateAnswer() {
    const question = appState.questions[appState.currentIndex];
    const userAnswer = appState.answers[question.id];
    
    // 撤销原有统计
    if (userAnswer) {
        if (userAnswer.isCorrect) {
            appState.stats.correct--;
        } else {
            appState.stats.incorrect--;
        }
    }

    // 排序后比较
    const sortedUserAnswers = [...appState.selectedOptions].sort();
    const sortedCorrectAnswers = [...question.correctAnswers].sort();
    const isCorrect = JSON.stringify(sortedUserAnswers) === JSON.stringify(sortedCorrectAnswers);

    // 保存答案
    appState.answers[question.id] = {
        selected: appState.selectedOptions,
        isCorrect: isCorrect,
        answeredAt: new Date().toISOString()
    };

    // 更新统计
    if (isCorrect) {
        appState.stats.correct++;
        showToast('回答正确！', 'success');
        showQuickNextButton();
    } else {
        appState.stats.incorrect++;
        hideQuickNextButton();
    }
    appState.stats.totalAttempted = Object.keys(appState.answers).length;

    // 更新UI
    updateStatsDisplay();
    debouncedSaveToStorage();
}

// 上一题
function goToPrevQuestion() {
    if (appState.currentIndex > 0) {
        appState.currentIndex--;
        updateQuestionDisplay();
    }
}

// 下一题
function goToNextQuestion() {
    if (appState.currentIndex < appState.questions.length - 1) {
        appState.currentIndex++;
        updateQuestionDisplay();
    } else {
        showToast('已完成所有题目！', 'info');
    }
}

// 更新导航按钮状态
function updateNavButtons() {
    DOM_CACHE.prevBtn.disabled = appState.currentIndex === 0;
    DOM_CACHE.nextBtn.disabled = appState.currentIndex >= appState.questions.length - 1;
}

// 更新进度条
function updateProgress() {
    const progress = (appState.currentIndex + 1) / appState.questions.length * 100;
    DOM_CACHE.progressBar.style.width = `${progress}%`;
}

// 更新统计显示
function updateStatsDisplay() {
    DOM_CACHE.correctCount.textContent = appState.stats.correct;
    DOM_CACHE.incorrectCount.textContent = appState.stats.incorrect;
    DOM_CACHE.attemptedCount.textContent = appState.stats.totalAttempted;
}

// 启动计时器
function startTimer() {
    if (appState.timerId) clearInterval(appState.timerId);
    updateTimer();
    appState.timerId = setInterval(updateTimer, CONSTANTS.TIMER_INTERVAL);
}

// 更新计时器显示
function updateTimer() {
    appState.elapsedTime++;
    const hours = Math.floor(appState.elapsedTime / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((appState.elapsedTime % 3600) / 60).toString().padStart(2, '0');
    const seconds = (appState.elapsedTime % 60).toString().padStart(2, '0');
    DOM_CACHE.timer.textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * 显示快捷下一题按钮
 */
function showQuickNextButton() {
    let quickNextBtn = document.getElementById('quickNextBtn');
    
    if (!quickNextBtn) {
        quickNextBtn = document.createElement('button');
        quickNextBtn.id = 'quickNextBtn';
        quickNextBtn.className = 'quick-next-btn';
        quickNextBtn.textContent = '快捷下一题 (Enter/空格)';
        quickNextBtn.addEventListener('click', goToNextQuestion);
        DOM_CACHE.actionContainer.appendChild(quickNextBtn);
    }
    
    quickNextBtn.style.display = 'block';
}

/**
 * 隐藏快捷下一题按钮
 */
function hideQuickNextButton() {
    const quickNextBtn = document.getElementById('quickNextBtn');
    if (quickNextBtn) {
        quickNextBtn.style.display = 'none';
    }
}

// 切换主题
function toggleTheme() {
    const body = document.body;
    appState.settings.theme = appState.settings.theme === 'light' ? 'dark' : 'light';
    
    if (appState.settings.theme === 'dark') {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
    
    saveToStorage();
}

// 显示提示框
function showToast(message, type = 'info') {
    const toast = DOM_CACHE.toast;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, CONSTANTS.TOAST_DURATION);
}

// 保存到本地存储
function saveToStorage() {
    try {
        const data = {
            settings: appState.settings,
            stats: appState.stats,
            answers: appState.answers,
            currentIndex: appState.currentIndex
        };
        localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 从本地存储加载
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(CONSTANTS.STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.settings) appState.settings = data.settings;
            if (data.stats) appState.stats = data.stats;
            if (data.answers) appState.answers = data.answers;
            if (typeof data.currentIndex === 'number') appState.currentIndex = data.currentIndex;
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 防抖函数
function debounce(fn, delay = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 防抖版保存
const debouncedSaveToStorage = debounce(saveToStorage);

// 初始化应用
window.onload = initApp;
