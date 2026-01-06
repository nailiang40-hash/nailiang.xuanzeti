// ===== 智能刷题系统 - JavaScript代码 =====

// 全局状态
let appState = {
    questions: [],
    currentIndex: 0,
    answers: {},
    settings: {
        mode: 'practice', // practice, test, random
        fontSize: 'medium',
        theme: 'light',
        showAnswer: false
    },
    stats: {
        correct: 0,
        incorrect: 0,
        total: 0,
        startTime: null
    }
};

// 示例题库
const SAMPLE_QUESTIONS = [
    {
        id: 1,
        question: "水的化学式是什么？",
        options: ["H₂O", "CO₂", "O₂", "NaCl"],
        correctAnswer: "A",
        explanation: "水是由两个氢原子和一个氧原子组成的化合物。"
    },
    {
        id: 2,
        question: "中国首都是哪里？",
        options: ["上海", "广州", "北京", "深圳"],
        correctAnswer: "C",
        explanation: "北京是中国的首都和政治中心。"
    },
    {
        id: 3,
        question: "一年有多少个月？",
        options: ["10", "11", "12", "13"],
        correctAnswer: "C",
        explanation: "一年有12个月，这是公历的标准划分。"
    }
];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    initApp();
});

// 初始化应用
function initApp() {
    bindEvents();
    loadFromStorage();
    showToast('智能刷题系统已就绪！', 'info');
}

// ==== 核心修复：选项按钮事件绑定 ====
function setupOptionButtons() {
    const optionsContainer = document.getElementById('optionsContainer');
    if (!optionsContainer) return;
    
    // 清空现有按钮
    optionsContainer.innerHTML = '';
    
    if (appState.questions.length === 0) return;
    
    const question = appState.questions[appState.currentIndex];
    const letters = ['A', 'B', 'C', 'D'];
    const userAnswer = appState.answers[question.id];
    
    letters.forEach((letter, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.option = letter;
        
        // 按钮内容
        button.innerHTML = `
            <span class="option-letter">${letter}</span>
            <span class="option-text">${question.options[index] || '选项' + letter}</span>
        `;
        
        // ==== 关键修复：使用事件委托 ====
        button.addEventListener('click', function() {
            console.log('选项按钮被点击:', letter);
            selectAnswer(letter);
        });
        
        // 如果用户已经回答了这道题，显示状态
        if (userAnswer) {
            const isSelected = userAnswer.userAnswer === letter;
            const isCorrect = letter === question.correctAnswer;
            
            if (isSelected && isCorrect) {
                button.classList.add('correct');
            } else if (isSelected && !isCorrect) {
                button.classList.add('incorrect');
            } else if (!isSelected && isCorrect && appState.settings.showAnswer) {
                button.classList.add('correct');
            }
            
            if (isSelected) {
                button.classList.add('selected');
            }
        }
        
        optionsContainer.appendChild(button);
    });
}

// 选择答案函数（关键）
function selectAnswer(selectedOption) {
    console.log('选择答案:', selectedOption);
    
    if (appState.questions.length === 0) {
        showToast('请先加载题库！', 'error');
        return;
    }
    
    const question = appState.questions[appState.currentIndex];
    const userAnswer = appState.answers[question.id];
    
    // 如果已经回答过且在测试模式下，不允许修改
    if (userAnswer && appState.settings.mode === 'test') {
        showToast('测试模式下不能修改答案！', 'warning');
        return;
    }
    
    const isCorrect = selectedOption === question.correctAnswer;
    console.log('正确答案:', question.correctAnswer, '是否正确:', isCorrect);
    
    // 保存答案
    appState.answers[question.id] = {
        userAnswer: selectedOption,
        isCorrect: isCorrect,
        timestamp: Date.now()
    };
    
    // 更新统计
    if (isCorrect) {
        appState.stats.correct++;
    } else {
        appState.stats.incorrect++;
    }
    
    // 保存到本地存储
    saveToStorage();
    
    // 更新显示
    updateQuestionDisplay();
    updateStats();
    
    // 显示反馈
    showAnswerFeedback(isCorrect, selectedOption, question.correctAnswer);
    
    // 显示下一题按钮（只在练习模式下）
    if (appState.settings.mode === 'practice') {
        showNextButton();
    }
    
    // 在测试模式下自动跳转到下一题
    if (appState.settings.mode === 'test') {
        setTimeout(() => {
            goToNextQuestion();
        }, 1500);
    }
}

// 显示答案反馈
function showAnswerFeedback(isCorrect, selectedOption, correctAnswer) {
    const feedbackBox = document.getElementById('feedbackBox');
    
    if (isCorrect) {
        feedbackBox.className = 'feedback-box correct';
        feedbackBox.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span><strong>正确！</strong> 答案 ${selectedOption} 是正确的。</span>
        `;
    } else {
        feedbackBox.className = 'feedback-box incorrect';
        feedbackBox.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span><strong>错误！</strong> 你选择了 ${selectedOption}，正确答案是 ${correctAnswer}。</span>
        `;
    }
}

// 显示下一题按钮
function showNextButton() {
    const questionActions = document.querySelector('.question-actions');
    if (!questionActions) return;
    
    // 移除可能已存在的下一题按钮
    const existingNextBtn = document.getElementById('nextQuestionBtn');
    if (existingNextBtn) existingNextBtn.remove();
    
    // 创建下一题按钮
    const nextBtn = document.createElement('button');
    nextBtn.id = 'nextQuestionBtn';
    nextBtn.className = 'btn btn-success';
    nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> 下一题';
    nextBtn.onclick = function() {
        goToNextQuestion();
        // 切换到下一题后清除反馈
        const feedbackBox = document.getElementById('feedbackBox');
        feedbackBox.className = 'feedback-box';
        feedbackBox.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>请选择一个答案</span>
        `;
        // 移除按钮本身
        this.remove();
    };
    
    // 在显示答案按钮前插入下一题按钮
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    questionActions.insertBefore(nextBtn, showAnswerBtn);
}

// 更新题目显示
function updateQuestionDisplay() {
    if (appState.questions.length === 0) return;
    
    const question = appState.questions[appState.currentIndex];
    
    // 更新题目编号和总数
    document.getElementById('questionNum').textContent = `题目 #${question.id}`;
    document.getElementById('totalQuestions').textContent = `/ ${appState.questions.length}`;
    
    // 更新题目文本
    document.getElementById('questionText').textContent = question.question;
    
    // ==== 关键：重新设置选项按钮 ====
    setupOptionButtons();
    
    // 更新进度
    updateProgress();
    
    // 更新导航按钮状态
    updateNavButtons();
}

// ==== 以下是完整的事件绑定函数 ====
function bindEvents() {
    console.log('绑定事件监听器...');
    
    // 文件选择按钮
    const selectFileBtn = document.getElementById('selectFileBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', () => {
            console.log('点击选择文件按钮');
            fileInput.click();
        });
    }
    
    // 文件选择变化
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 拖放上传
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#4a6bff';
            uploadArea.style.backgroundColor = 'rgba(74, 107, 255, 0.1)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.backgroundColor = '';
            
            if (e.dataTransfer.files.length > 0) {
                handleFileSelect({ target: { files: e.dataTransfer.files } });
            }
        });
    }
    
    // 开始刷题按钮
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', startQuiz);
    }
    
    // 加载示例题库按钮
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleQuestions);
    }
    
    // 模式选择按钮
    document.getElementById('practiceBtn')?.addEventListener('click', () => setMode('practice'));
    document.getElementById('testBtn')?.addEventListener('click', () => setMode('test'));
    document.getElementById('randomBtn')?.addEventListener('click', () => setMode('random'));
    
    // 导航按钮
    document.getElementById('firstBtn')?.addEventListener('click', goToFirstQuestion);
    document.getElementById('prevBtn')?.addEventListener('click', goToPrevQuestion);
    document.getElementById('nextBtn')?.addEventListener('click', goToNextQuestion);
    document.getElementById('lastBtn')?.addEventListener('click', goToLastQuestion);
    document.getElementById('jumpBtn')?.addEventListener('click', jumpToQuestion);
    
    // 其他按钮
    document.getElementById('showAnswerBtn')?.addEventListener('click', toggleShowAnswer);
    document.getElementById('resetBtn')?.addEventListener('click', resetAnswers);
    document.getElementById('backBtn')?.addEventListener('click', backToUpload);
    
    // 设置变化
    document.getElementById('fontSize')?.addEventListener('change', (e) => {
        appState.settings.fontSize = e.target.value;
        updateFontSize();
        saveToStorage();
    });
    
    document.getElementById('theme')?.addEventListener('change', (e) => {
        appState.settings.theme = e.target.value;
        updateTheme();
        saveToStorage();
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeydown);
    
    console.log('事件监听器绑定完成');
}

// 设置模式
function setMode(mode) {
    if (appState.questions.length === 0) {
        showToast('请先加载题库！', 'error');
        return;
    }
    
    appState.settings.mode = mode;
    
    // 如果是随机模式，打乱题目顺序
    if (mode === 'random') {
        // 复制题库并打乱顺序
        const shuffled = [...appState.questions].sort(() => Math.random() - 0.5);
        appState.questions = shuffled;
        appState.currentIndex = 0;
        showToast('已切换到随机模式，题目顺序已打乱！', 'info');
    } else if (mode === 'practice') {
        showToast('已切换到练习模式', 'info');
    } else if (mode === 'test') {
        showToast('已切换到测试模式', 'info');
    }
    
    // 更新模式按钮状态
    updateModeButtons();
    
    // 更新显示
    updateQuestionDisplay();
}

// 更新模式按钮状态
function updateModeButtons() {
    const practiceBtn = document.getElementById('practiceBtn');
    const testBtn = document.getElementById('testBtn');
    const randomBtn = document.getElementById('randomBtn');
    
    if (practiceBtn) practiceBtn.classList.toggle('active', appState.settings.mode === 'practice');
    if (testBtn) testBtn.classList.toggle('active', appState.settings.mode === 'test');
    if (randomBtn) randomBtn.classList.toggle('active', appState.settings.mode === 'random');
}

// 加载示例题库
function loadSampleQuestions() {
    console.log('加载示例题库...');
    
    appState.questions = SAMPLE_QUESTIONS;
    appState.stats.total = SAMPLE_QUESTIONS.length;
    
   
