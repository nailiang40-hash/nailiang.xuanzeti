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

// 示例题库（包含多选题）
const SAMPLE_QUESTIONS = [
    {
        id: 1,
        question: "水的化学式是什么？",
        options: ["H₂O", "CO₂", "O₂", "NaCl"],
        correctAnswer: "A",
        explanation: "水是由两个氢原子和一个氧原子组成的化合物。",
        type: "single" // 单选题
    },
    {
        id: 2,
        question: "中国首都是哪里？",
        options: ["上海", "广州", "北京", "深圳"],
        correctAnswer: "C",
        explanation: "北京是中国的首都和政治中心。",
        type: "single"
    },
    {
        id: 3,
        question: "以下哪些是哺乳动物？",
        options: ["鲸鱼", "鲨鱼", "海豚", "企鹅"],
        correctAnswer: "A,C", // 多选题，多个答案用逗号分隔
        explanation: "鲸鱼和海豚是哺乳动物，鲨鱼是鱼类，企鹅是鸟类。",
        type: "multi"
    },
    {
        id: 4,
        question: "一年有多少个月？",
        options: ["10", "11", "12", "13"],
        correctAnswer: "C",
        explanation: "一年有12个月，这是公历的标准划分。",
        type: "single"
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
    
    // 如果是多选题，显示提示
    if (question.type === 'multi') {
        const hint = document.createElement('div');
        hint.className = 'multi-hint';
        hint.innerHTML = '<i class="fas fa-check-double"></i> 多选题（可选多个答案）';
        optionsContainer.appendChild(hint);
    }
    
    letters.forEach((letter, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.option = letter;
        
        // 按钮内容
        button.innerHTML = `
            <span class="option-letter">${letter}</span>
            <span class="option-text">${question.options[index] || '选项' + letter}</span>
        `;
        
        // ==== 关键修复：使用事件监听器 ====
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('选项按钮被点击:', letter);
            selectAnswer(letter);
        });
        
        // 如果用户已经回答了这道题，显示状态
        if (userAnswer) {
            if (question.type === 'multi') {
                // 多选题：检查是否包含该选项
                const isSelected = userAnswer.userAnswer.includes(letter);
                const isCorrect = question.correctAnswer.includes(letter);
                
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
            } else {
                // 单选题
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
        }
        
        optionsContainer.appendChild(button);
    });
}

// 选择答案函数（支持多选）
function selectAnswer(selectedOption) {
    console.log('选择答案:', selectedOption);
    
    if (appState.questions.length === 0) {
        showToast('请先加载题库！', 'error');
        return;
    }
    
    const question = appState.questions[appState.currentIndex];
    let userAnswer = appState.answers[question.id];
    
    // 如果已经回答过且在测试模式下，不允许修改
    if (userAnswer && appState.settings.mode === 'test') {
        showToast('测试模式下不能修改答案！', 'warning');
        return;
    }
    
    // 处理多选题
    if (question.type === 'multi') {
        if (!userAnswer) {
            userAnswer = {
                userAnswer: selectedOption,
                isCorrect: false,
                timestamp: Date.now()
            };
        } else {
            // 切换选择状态
            let currentAnswers = userAnswer.userAnswer.split(',').filter(a => a.trim());
            
            if (currentAnswers.includes(selectedOption)) {
                // 取消选择
                currentAnswers = currentAnswers.filter(a => a !== selectedOption);
            } else {
                // 添加选择
                currentAnswers.push(selectedOption);
            }
            
            userAnswer.userAnswer = currentAnswers.sort().join(',');
        }
        
        // 检查是否正确（多选题需要全部正确且不多选）
        const correctAnswers = question.correctAnswer.split(',').sort().join(',');
        userAnswer.isCorrect = userAnswer.userAnswer === correctAnswers;
        
    } else {
        // 单选题
        userAnswer = {
            userAnswer: selectedOption,
            isCorrect: selectedOption === question.correctAnswer,
            timestamp: Date.now()
        };
    }
    
    // 保存答案
    appState.answers[question.id] = userAnswer;
    
    // 更新统计
    if (userAnswer.isCorrect && !appState.answers[question.id]?.isCorrect) {
        // 之前不正确，现在正确了
        appState.stats.correct++;
    } else if (!userAnswer.isCorrect && appState.answers[question.id]?.isCorrect) {
        // 之前正确，现在不正确了
        appState.stats.correct--;
        appState.stats.incorrect++;
    } else if (!appState.answers[question.id]) {
        // 新答题
        if (userAnswer.isCorrect) {
            appState.stats.correct++;
        } else {
            appState.stats.incorrect++;
        }
    }
    
    // 保存到本地存储
    saveToStorage();
    
    // 更新显示
    updateQuestionDisplay();
    updateStats();
    
    // 显示反馈
    showAnswerFeedback(userAnswer.isCorrect, userAnswer.userAnswer, question.correctAnswer);
    
    // 如果是单选题且回答正确，显示下一题按钮
    if (question.type === 'single' && userAnswer.isCorrect && appState.settings.mode === 'practice') {
        showNextButton();
    }
    
    // 在测试模式下自动跳转到下一题
    if (appState.settings.mode === 'test' && userAnswer.isCorrect) {
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
            <span><strong>正确！</strong> 你的答案是正确的。</span>
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
    
    // 更新模式按钮状态
    updateModeButtons();
    
    // 清除之前的下一题按钮
    const existingNextBtn = document.getElementById('nextQuestionBtn');
    if (existingNextBtn) existingNextBtn.remove();
    
    // 如果有答案，显示反馈
    const userAnswer = appState.answers[question.id];
    if (userAnswer) {
        showAnswerFeedback(userAnswer.isCorrect, userAnswer.userAnswer, question.correctAnswer);
    } else {
        const feedbackBox = document.getElementById('feedbackBox');
        feedbackBox.className = 'feedback-box';
        feedbackBox.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>请选择一个答案${question.type === 'multi' ? '（多选题可选多个）' : ''}</span>
        `;
    }
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

// ==== 以下是完整的事件绑定函数 ====
function bindEvents() {
    console.log('绑定事件监听器...');
    
    // 文件选择按钮
    const selectFileBtn = document.getElementById('selectFileBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', function() {
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
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#4a6bff';
            uploadArea.style.backgroundColor = 'rgba(74, 107, 255, 0.1)';
        });
        
        uploadArea.addEventListener('dragleave', function() {
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', function(e) {
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
    document.getElementById('practiceBtn')?.addEventListener('click', function() {
        setMode('practice');
    });
    document.getElementById('testBtn')?.addEventListener('click', function() {
        setMode('test');
    });
    document.getElementById('randomBtn')?.addEventListener('click', function() {
        setMode('random');
    });
    
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
    const fontSizeSelect = document.getElementById('fontSize');
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function(e) {
            appState.settings.fontSize = e.target.value;
            updateFontSize();
            saveToStorage();
        });
    }
    
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        themeSelect.addEventListener('change', function(e) {
            appState.settings.theme = e.target.value;
            updateTheme();
            saveToStorage();
        });
    }
    
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
        // 复制题库并打乱顺序，但保持id不变
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

// 加载示例题库
function loadSampleQuestions() {
    console.log('加载示例题库...');
    
    appState.questions = SAMPLE_QUESTIONS;
    appState.stats.total = SAMPLE_QUESTIONS.length;
    
    // 显示文件信息
    document.getElementById('fileName').textContent = '示例题库';
    document.getElementById('fileStats').textContent = `共 ${SAMPLE_QUESTIONS.length} 道题目`;
    document.getElementById('fileInfo').style.display = 'flex';
    
    showToast(`示例题库加载成功！共 ${SAMPLE_QUESTIONS.length} 道题目`, 'success');
}

// 开始刷题
function startQuiz() {
    if (appState.questions.length === 0) {
        showToast('请先上传题库或加载示例题库！', 'error');
        return;
    }
    
    console.log('开始刷题...');
    
    // 切换到答题界面
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    
    // 重置状态
    appState.currentIndex = 0;
    appState.stats.startTime = Date.now();
    
    // 更新显示
    updateQuestionDisplay();
    updateStats();
    
    // 开始计时器
    startTimer();
    
    showToast('开始刷题！使用键盘A/B/C/D键快速答题', 'info');
}

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.txt')) {
        showToast('请选择TXT格式的文件！', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const questions = parseQuestions(content);
            
            if (questions.length === 0) {
                showToast('未找到有效题目，请检查文件格式！', 'error');
                return;
            }
            
            appState.questions = questions;
            appState.stats.total = questions.length;
            
            // 显示文件信息
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileStats').textContent = `共 ${questions.length} 道题目`;
            document.getElementById('fileInfo').style.display = 'flex';
            
            showToast(`成功加载 ${questions.length} 道题目！`, 'success');
            
        } catch (error) {
            console.error('解析文件失败:', error);
            showToast('文件解析失败，请检查格式！', 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('读取文件失败！', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
}

// 解析题库文本（支持多选题）
function parseQuestions(text) {
    const lines = text.split('\n');
    const questions = [];
    let questionId = 1;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        let parts;
        if (line.includes('|')) {
            parts = line.split('|');
        } else if (line.includes(',')) {
            parts = line.split(',');
        } else {
            continue;
        }
        
        parts = parts.map(part => part.trim());
        
        if (parts.length >= 6) {
            // 检查是否为多选题（答案包含多个字母）
            const answer = parts[5].toUpperCase();
            const type = answer.includes(',') || answer.length > 1 ? 'multi' : 'single';
            
            const question = {
                id: questionId++,
                question: parts[0],
                options: [
                    parts[1] || '选项A',
                    parts[2] || '选项B',
                    parts[3] || '选项C',
                    parts[4] || '选项D'
                ],
                correctAnswer: answer,
                explanation: parts[6] || '',
                type: type
            };
            
            // 验证答案格式
            if (type === 'single' && ['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
                questions.push(question);
            } else if (type === 'multi') {
                // 多选题验证：答案应该是A,B,C,D的逗号分隔组合
                const answers = question.correctAnswer.split(',').map(a => a.trim());
                const isValid = answers.every(a => ['A', 'B', 'C', 'D'].includes(a));
                if (isValid) {
                    questions.push(question);
                }
            }
        }
    }
    
    return questions;
}

// 导航功能
function goToFirstQuestion() {
    appState.currentIndex = 0;
    updateQuestionDisplay();
}

function goToPrevQuestion() {
    if (appState.currentIndex > 0) {
        appState.currentIndex--;
        updateQuestionDisplay();
    }
}

function goToNextQuestion() {
    if (appState.currentIndex < appState.questions.length - 1) {
        appState.currentIndex++;
        updateQuestionDisplay();
    } else {
        if (appState.settings.mode === 'random') {
            // 随机模式重新打乱
            const shuffled = [...appState.questions].sort(() => Math.random() - 0.5);
            appState.questions = shuffled;
            appState.currentIndex = 0;
            updateQuestionDisplay();
            showToast('已重新随机排序题目！', 'info');
        } else {
            showToast('已经是最后一题了！', 'info');
        }
    }
}

function goToLastQuestion() {
    appState.currentIndex = appState.questions.length - 1;
    updateQuestionDisplay();
}

function jumpToQuestion() {
    const input = document.getElementById('jumpInput');
    const index = parseInt(input.value) - 1;
    
    if (!isNaN(index) && index >= 0 && index < appState.questions.length) {
        appState.currentIndex = index;
        updateQuestionDisplay();
    }
}

// 更新进度
function updateProgress() {
    const total = appState.questions.length;
    const current = appState.currentIndex + 1;
    const progressPercent = (current / total) * 100;
    
    document.getElementById('progressText').textContent = `${current}/${total}`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    
    const jumpInput = document.getElementById('jumpInput');
    if (jumpInput) {
        jumpInput.value = current;
        jumpInput.max = total;
    }
}

// 更新导航按钮状态
function updateNavButtons() {
    const firstBtn = document.getElementById('firstBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const lastBtn = document.getElementById('lastBtn');
    
    if (firstBtn) firstBtn.disabled = appState.currentIndex === 0;
    if (prevBtn) prevBtn.disabled = appState.currentIndex === 0;
    if (nextBtn) nextBtn.disabled = appState.currentIndex === appState.questions.length - 1;
    if (lastBtn) lastBtn.disabled = appState.currentIndex === appState.questions.length - 1;
}

// 更新统计信息
function updateStats() {
    const totalAnswered = appState.stats.correct + appState.stats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((appState.stats.correct / totalAnswered) * 100) : 0;
    
    document.getElementById('correctCount').textContent = appState.stats.correct;
    document.getElementById('incorrectCount').textContent = appState.stats.incorrect;
    document.getElementById('accuracyRate').textContent = `${accuracy}%`;
    document.getElementById('answeredCount').textContent = totalAnswered;
}

// 更新字体大小
function updateFontSize() {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${appState.settings.fontSize}`);
}

// 更新主题
function updateTheme() {
    if (appState.settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// 切换显示答案
function toggleShowAnswer() {
    appState.settings.showAnswer = !appState.settings.showAnswer;
    updateQuestionDisplay();
    
    const btn = document.getElementById('showAnswerBtn');
    if (btn) {
        btn.innerHTML = appState.settings.showAnswer 
            ? '<i class="fas fa-eye-slash"></i> 隐藏答案'
            : '<i class="fas fa-eye"></i> 显示答案';
    }
}

// 重置答题记录
function resetAnswers() {
    if (confirm('确定要重置所有答题记录吗？')) {
        appState.answers = {};
        appState.stats.correct = 0;
        appState.stats.incorrect = 0;
        appState.currentIndex = 0;
        
        saveToStorage();
        updateQuestionDisplay();
        updateStats();
        
        showToast('答题记录已重置', 'info');
    }
}

// 返回上传界面
function backToUpload() {
    if (confirm('返回上传界面？当前进度会保存。')) {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('quizSection').style.display = 'none';
    }
}

// 开始计时器
function startTimer() {
    updateTimer();
    setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!appState.stats.startTime) return;
    
    const elapsedSeconds = Math.floor((Date.now() - appState.stats.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// 键盘快捷键
function handleKeydown(event) {
    // 防止在输入框中触发快捷键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    const key = event.key.toUpperCase();
    
    // 选择答案
    if (['A', 'B', 'C', 'D'].includes(key)) {
        event.preventDefault();
        selectAnswer(key);
    } else if (['1', '2', '3', '4'].includes(key)) {
        event.preventDefault();
        const options = ['A', 'B', 'C', 'D'];
        selectAnswer(options[parseInt(key) - 1]);
    }
    // 导航
    else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevQuestion();
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextQuestion();
    }
    // 其他快捷键
    else if (event.key === ' ') {
        event.preventDefault();
        toggleShowAnswer();
    } else if (event.key === 'Enter' && document.getElementById('nextQuestionBtn')) {
        event.preventDefault();
        const nextBtn = document.getElementById('nextQuestionBtn');
        if (nextBtn) nextBtn.click();
    }
}

// 本地存储
function loadFromStorage() {
    try {
        const saved = localStorage.getItem('quizAppData');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.settings) {
                appState.settings = data.settings;
                // 应用设置
                updateFontSize();
                updateTheme();
                
                // 更新下拉菜单选项
                const fontSizeSelect = document.getElementById('fontSize');
                const themeSelect = document.getElementById('theme');
                
                if (fontSizeSelect) fontSizeSelect.value = appState.settings.fontSize;
                if (themeSelect) themeSelect.value = appState.settings.theme;
            }
            if (data.stats) appState.stats = data.stats;
            if (data.answers) appState.answers = data.answers;
            if (data.currentIndex) appState.currentIndex = data.currentIndex;
        }
    } catch (error) {
        console.error('加载本地存储数据失败:', error);
    }
}

function saveToStorage() {
    try {
        const data = {
            settings: appState.settings,
            stats: appState.stats,
            answers: appState.answers,
            currentIndex: appState.currentIndex
        };
        localStorage.setItem('quizAppData', JSON.stringify(data));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.display = 'block';
    
    switch(type) {
        case 'success':
            toast.style.backgroundColor = '#28a745';
            break;
        case 'error':
            toast.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            toast.style.backgroundColor = '#ffc107';
            break;
        default:
            toast.style.backgroundColor = '#17a2b8';
    }
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// 调试信息
console.log('智能刷题系统脚本加载完成');
