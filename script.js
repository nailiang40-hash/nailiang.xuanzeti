// ===== 智能刷题系统 - JavaScript代码 =====

// 全局状态
let appState = {
    questions: [],
    currentIndex: 0,
    answers: {},
    settings: {
        mode: 'practice',
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
        
        // ==== 关键修复：正确的点击事件绑定 ====
        button.onclick = function() {
            console.log('选项按钮被点击:', letter);
            selectAnswer(letter);
        };
        
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
    
    // 在测试模式下自动跳转到下一题
    if (appState.settings.mode === 'test') {
        setTimeout(() => {
            if (appState.currentIndex < appState.questions.length - 1) {
                appState.currentIndex++;
                updateQuestionDisplay();
            } else {
                showToast('测试完成！', 'success');
            }
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
    
    // 开始刷题按钮 - 关键修复
    const startQuizBtn = document.getElementById('startQuizBtn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', startQuiz);
    }
    
    // 加载示例题库按钮 - 关键修复
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleQuestions);
    }
    
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
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeydown);
    
    console.log('事件监听器绑定完成');
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
    
    reader.readAsText(file, 'UTF-8');
}

// 解析题库文本
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
            const question = {
                id: questionId++,
                question: parts[0],
                options: [
                    parts[1] || '选项A',
                    parts[2] || '选项B',
                    parts[3] || '选项C',
                    parts[4] || '选项D'
                ],
                correctAnswer: parts[5].toUpperCase().charAt(0),
                explanation: parts[6] || ''
            };
            
            if (['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
                questions.push(question);
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
    
    document.getElementById('jumpInput').value = current;
    document.getElementById('jumpInput').max = total;
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

// 切换显示答案
function toggleShowAnswer() {
    appState.settings.showAnswer = !appState.settings.showAnswer;
    updateQuestionDisplay();
    
    const btn = document.getElementById('showAnswerBtn');
    btn.innerHTML = appState.settings.showAnswer 
        ? '<i class="fas fa-eye-slash"></i> 隐藏答案'
        : '<i class="fas fa-eye"></i> 显示答案';
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
    
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    }
}

// 本地存储
function loadFromStorage() {
    try {
        const saved = localStorage.getItem('quizAppData');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.settings) appState.settings = data.settings;
            if (data.stats) appState.stats = data.stats;
            if (data.answers) appState.answers = data.answers;
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
    toast.textContent = message;
    toast.style.display = 'block';
    
    if (type === 'success') {
        toast.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#ffc107';
    } else {
        toast.style.backgroundColor = '#17a2b8';
    }
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// 调试信息
console.log('智能刷题系统脚本加载完成');