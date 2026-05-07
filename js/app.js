﻿import { state } from './state.js';
import { login, register, logout, changePassword } from './auth.js';
import { 
  createTest, updateTest, deleteTest, toggleTestActive, 
  regenerateTestCode, toggleFavorite, getTeacherTests,
  addQuestion, updateQuestion, deleteQuestion, exportTest, importTest
} from './teacher.js';
import { 
  findTestByCode, startQuiz, saveAnswer, finishQuiz, 
  getStudentReview, stopQuiz 
} from './student.js';
import { escapeHtml, showToast, formatTime } from './utils.js';

// DOM Elements
let appContainer;
let currentView = 'menu';
let currentTest = null;
let currentQuestionIndex = 0;
let editingQuestionIndex = null;
let quizData = null;
let quizStudentName = '';

// Initialize app
async function init() {
  appContainer = document.getElementById('app');
  await state.load();
  render();
}

function render() {
  if (currentView === 'menu') renderMenu();
  else if (currentView === 'teacherAuth') renderTeacherAuth();
  else if (currentView === 'teacherPanel') renderTeacherPanel();
  else if (currentView === 'testEditor') renderTestEditor();
  else if (currentView === 'studentPanel') renderStudentPanel();
  else if (currentView === 'quiz') renderQuiz();
  else if (currentView === 'result') renderResult();
}

function renderMenu() {
  appContainer.innerHTML = `
    <div class="container">
      <div class="main-header">
        <div class="logo-area" onclick="window.appBackToMenu && window.appBackToMenu()">
          <div class="vortex-icon">📚</div>
          <div class="logo-text">
            <h1>VORTEX</h1>
            <p>EXAM SYSTEM | CLOUD READY</p>
          </div>
        </div>
        <div class="theme-toggle" onclick="window.toggleTheme && window.toggleTheme()">
          <span>🌙</span><span>☀️</span>
        </div>
      </div>
      <div class="mode-selector">
        <div class="mode-card" onclick="window.appShowTeacherLogin && window.appShowTeacherLogin()">
          <div class="mode-icon">👨‍🏫</div>
          <h2>УСТОД</h2>
          <p>Эҷоди тест • Идоракунӣ • Аналитика</p>
        </div>
        <div class="mode-card" onclick="window.appShowStudentPanel && window.appShowStudentPanel()">
          <div class="mode-icon">👩‍🎓</div>
          <h2>ТАЛАБА</h2>
          <p>Иҷрои тест • Санҷиши дониш</p>
        </div>
      </div>
    </div>
  `;
}

function renderTeacherAuth() {
  appContainer.innerHTML = `
    <div class="container">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">🔐 VORTEX ACCESS</div>
          <button class="btn btn-outline" onclick="window.appBackToMenu()">Бозгашт</button>
        </div>
        <div class="input-group">
          <label>Номи корбарӣ:</label>
          <input type="text" id="authUsername" placeholder="Username">
        </div>
        <div class="input-group">
          <label>Парол:</label>
          <input type="password" id="authPassword" placeholder="Password">
        </div>
        <div class="input-group hidden" id="confirmPasswordGroup">
          <label>Такрори парол:</label>
          <input type="password" id="confirmPassword">
        </div>
        <button class="btn btn-primary" id="authBtn">Ворид шудан</button>
        <div id="authSwitch" style="margin-top:12px; text-align:center">
          <span style="color:var(--muted)">Ҳисоб надоред?</span>
          <button class="btn btn-sm btn-outline" onclick="window.appSwitchAuthMode()">Сабти ном</button>
        </div>
      </div>
    </div>
  `;
  
  let authMode = 'login';
  
  window.appSwitchAuthMode = () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    const title = document.querySelector('.panel-title');
    const confirmGroup = document.getElementById('confirmPasswordGroup');
    const authBtn = document.getElementById('authBtn');
    const authSwitch = document.getElementById('authSwitch');
    
    if (title) title.innerHTML = authMode === 'register' ? '🔐 REGISTER' : '🔑 LOGIN';
    if (confirmGroup) confirmGroup.classList.toggle('hidden', authMode !== 'register');
    if (authBtn) authBtn.textContent = authMode === 'register' ? 'Сабти ном' : 'Ворид шудан';
    if (authSwitch) {
      authSwitch.innerHTML = authMode === 'register'
        ? '<span style="color:var(--muted)">Аллакай ҳисоб доред?</span> <button class="btn btn-sm btn-outline" onclick="window.appSwitchAuthMode()">Ворид шавед</button>'
        : '<span style="color:var(--muted)">Ҳисоб надоред?</span> <button class="btn btn-sm btn-outline" onclick="window.appSwitchAuthMode()">Сабти ном</button>';
    }
  };
  
  document.getElementById('authBtn').onclick = () => {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    
    if (authMode === 'login') {
      if (login(username, password)) {
        currentView = 'teacherPanel';
        render();
      }
    } else {
      const confirm = document.getElementById('confirmPassword').value;
      if (register(username, password, confirm)) {
        authMode = 'login';
        window.appSwitchAuthMode();
        showToast('Акнун метавонед ворид шавед');
      }
    }
  };
}

function renderTeacherPanel() {
  const tests = getTeacherTests();
  const searchHtml = `
    <div class="search-box">
      <input type="text" id="searchTests" placeholder="🔍 Ҷустуҷӯи тестҳо..." style="width:100%; padding:12px; background:var(--surface2); border:1px solid var(--border); border-radius:12px; color:var(--text)">
    </div>
  `;
  
  const testsHtml = tests.length === 0
    ? '<div style="padding:20px; text-align:center; color:var(--muted)">Ҳеҷ тест нест</div>'
    : tests.map(test => `
      <div class="test-item">
        <div>
          <div style="display:flex; align-items:center; gap:8px">
            <span class="favorite-star" onclick="window.appToggleFavorite(${test.id})">${state.currentTeacher.favorites.includes(test.id) ? '⭐' : '☆'}</span>
            <h4>${escapeHtml(test.name)}</h4>
          </div>
          <p>${test.questions.length} савол | ${test.timeLimit} дақ | ${test.results?.length || 0} натиҷа</p>
          <p><span class="badge ${test.isActive ? 'badge-active' : 'badge-inactive'}">${test.isActive ? 'ФАЪОЛ' : 'ҒАЙРИФАЪОЛ'}</span> <span class="test-code">🔑 ${test.code}</span></p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="window.appEditTest(${test.id})">✏</button>
          <button class="btn btn-sm btn-warning" onclick="window.appToggleActive(${test.id})">${test.isActive ? '🔴' : '🟢'}</button>
          <button class="btn btn-sm btn-success" onclick="window.appNewCode(${test.id})">🔄</button>
          <button class="btn btn-sm btn-danger" onclick="window.appDeleteTest(${test.id})">🗑</button>
        </div>
      </div>
    `).join('');
  
  appContainer.innerHTML = `
    <div class="container">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">👨‍🏫 DASHBOARD | ${escapeHtml(state.currentTeacher.username)}</div>
          <div>
            <button class="btn btn-sm btn-outline" onclick="window.appChangePassword()">🔑 Тағйири парол</button>
            <button class="btn btn-sm btn-outline" onclick="window.appLogoutTeacher()">Хуруҷ</button>
          </div>
        </div>
        ${searchHtml}
        <div style="margin: 16px 0; display: flex; gap: 12px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.appCreateTest()">➕ Эҷоди тести нав</button>
          <button class="btn btn-outline" onclick="window.appOpenImport()">📥 Импорт</button>
        </div>
        <div class="test-list" id="teacherTestsList">
          ${testsHtml}
        </div>
      </div>
    </div>
  `;
  
  // Search functionality
  setTimeout(() => {
    const searchInput = document.getElementById('searchTests');
    if (searchInput) {
      searchInput.onkeyup = () => renderTeacherPanel();
    }
  }, 0);
}

function renderTestEditor() {
  if (!currentTest) return;
  
  appContainer.innerHTML = `
    <div class="container">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">✏️ ТАҲРИРИ ТЕСТ: ${escapeHtml(currentTest.name)}</div>
          <button class="btn btn-outline" onclick="window.appBackToTeacher()">Бозгашт</button>
        </div>
        <div class="input-group">
          <label>Номи тест:</label>
          <input type="text" id="testName" value="${escapeHtml(currentTest.name)}" placeholder="Масалан: Алгебра 10 - Муодилаҳо">
        </div>
        <div class="input-group">
          <label>Вақт (дақиқа):</label>
          <input type="number" id="testTime" value="${currentTest.timeLimit}" min="1" max="180">
        </div>
        <div class="input-group">
          <label>Тегҳо:</label>
          <input type="text" id="testTags" value="${currentTest.tags?.join(', ') || ''}" placeholder="алгебра,10-синф">
        </div>
        <div style="margin: 20px 0;">
          <h3>📝 САВОЛҲО</h3>
          <div id="questionsList"></div>
          <button class="btn btn-outline" onclick="window.appAddQuestion()">+ Иловаи савол</button>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.appSaveTest()">💾 Захира</button>
          <button class="btn btn-success" onclick="window.appExportTest()">📤 Экспорт</button>
        </div>
      </div>
    </div>
  `;
  
  renderQuestionsList();
}

function renderQuestionsList() {
  const container = document.getElementById('questionsList');
  if (!container) return;
  
  if (!currentTest.questions.length) {
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--muted)">Ҳеҷ савол нест</div>';
    return;
  }
  
  container.innerHTML = currentTest.questions.map((q, i) => {
    let preview = '';
    const hasImage = q.img ? '🖼️ ' : '';
    
    if (q.type === 'closed') preview = `${hasImage}${q.q.substring(0, 50)}... [${String.fromCharCode(65 + q.ans)}]`;
    else if (q.type === 'multi') preview = `${hasImage}${q.q.substring(0, 50)}... [${q.ans.map(a => String.fromCharCode(65 + a)).join(',')}]`;
    else if (q.type === 'match') preview = `${hasImage}${q.text?.substring(0, 50)}...`;
    else preview = `${hasImage}${q.q?.substring(0, 50)}...`;
    
    return `
      <div class="question-editor" style="background:var(--surface2); padding:12px; margin-bottom:8px; border-radius:12px">
        <div style="display:flex; justify-content:space-between">
          <strong>${i + 1}. ${q.type === 'closed' ? '📘' : q.type === 'multi' ? '🎯' : q.type === 'match' ? '🔗' : '💡'} ${q.img ? '🖼️' : ''}</strong>
          <div>
            <button class="btn btn-sm btn-outline" onclick="window.appEditQuestion(${i})">✏</button>
            <button class="btn btn-sm btn-danger" onclick="window.appDeleteQuestion(${i})">🗑</button>
          </div>
        </div>
        <div style="font-size:13px; color:var(--muted)">${escapeHtml(preview)}</div>
        ${q.img ? `<div style="font-size:10px; margin-top:4px; color:var(--accent)">🖼 Расм дорад</div>` : ''}
      </div>
    `;
  }).join('');
}
function renderStudentPanel() {
  appContainer.innerHTML = `
    <div class="container">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">🎓 STUDENT ACCESS</div>
          <button class="btn btn-outline" onclick="window.appBackToMenu()">Бозгашт</button>
        </div>
        <div class="input-group">
          <label>Рамзи тест:</label>
          <input type="text" id="studentCode" maxlength="6" style="text-transform:uppercase; font-size:24px; text-align:center; letter-spacing:4px">
        </div>
        <div class="input-group">
          <label>Номи шумо:</label>
          <input type="text" id="studentName" placeholder="Ном ва фамилия">
        </div>
        <button class="btn btn-primary" onclick="window.appStartTest()" style="width:100%; padding:16px; font-size:18px;">🚀 ОҒОЗИ ТЕСТ</button>
      </div>
    </div>
  `;
}

function renderQuiz() {
  if (!quizData) return;
  
  const question = quizData.test.questions[currentQuestionIndex];
  const timeDisplay = formatTime(quizData.timeLeft);
  
  // Барои расм
  const imageHtml = question.img ? `
    <div style="text-align:center; margin:16px 0; padding:12px; background:var(--surface2); border-radius:16px">
      <img src="${escapeHtml(question.img)}" alt="Расми савол" style="max-width:100%; max-height:200px; border-radius:12px; object-fit:contain">
    </div>
  ` : '';
  
  let contentHtml = '';
  
  if (question.type === 'closed') {
    contentHtml = `
      <div>
        ${imageHtml}
        <p style="font-size:20px; margin-bottom:20px">${escapeHtml(question.q)}</p>
        ${question.opts.map((opt, i) => `
          <button class="option-btn" onclick="window.appSelectClosed(${i})" id="opt_${i}">
            <strong>${String.fromCharCode(65 + i)}.</strong> ${escapeHtml(opt)}
          </button>
        `).join('')}
      </div>
    `;
  } else if (question.type === 'multi') {
    contentHtml = `
      <div>
        ${imageHtml}
        <p style="font-size:20px; margin-bottom:20px">${escapeHtml(question.q)}</p>
        ${question.opts.map((opt, i) => `
          <button class="option-btn" onclick="window.appToggleMulti(${i})" id="opt_${i}">
            <strong>${String.fromCharCode(65 + i)}.</strong> ${escapeHtml(opt)}
          </button>
        `).join('')}
      </div>
    `;
  } else if (question.type === 'match') {
    let matchHtml = `${imageHtml}<p style="font-size:18px; margin-bottom:16px">${escapeHtml(question.text)}</p>`;
    for (let i = 0; i < question.lefts.length; i++) {
      matchHtml += `
        <div class="match-row">
          <div class="match-left">${escapeHtml(question.lefts[i])}</div>
          <select class="match-select" id="match_${i}">
            <option value="">—</option>
            ${question.rights.map((r, ri) => `<option value="${ri}">${ri + 1}. ${escapeHtml(r)}</option>`).join('')}
          </select>
        </div>
      `;
    }
    contentHtml = matchHtml;
  } else {
    contentHtml = `
      <div>
        ${imageHtml}
        <p style="font-size:20px; margin-bottom:20px">${escapeHtml(question.q)}</p>
        <input type="text" id="openAns" style="width:100%; padding:14px; background:var(--surface2); border:1px solid var(--border); border-radius:12px; color:var(--text); font-size:16px" placeholder="Ҷавоби худро нависед...">
      </div>
    `;
  }
  
  appContainer.innerHTML = `
    <div class="container">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">${escapeHtml(quizData.test.name)} | ${currentQuestionIndex + 1}/${quizData.test.questions.length}</div>
          <div><span id="quizTimer" style="font-size:24px; font-weight:800; font-family:monospace">${timeDisplay}</span></div>
        </div>
        <div id="quizContent">${contentHtml}</div>
        <button class="btn btn-primary" id="quizNextBtn" style="width:100%; margin-top:16px; padding:16px; font-size:16px;">Ҷавоб додан →</button>
      </div>
    </div>
  `;
  
  window.onTimerUpdate = (time) => {
    const timerEl = document.getElementById('quizTimer');
    if (timerEl) timerEl.textContent = time;
  };
  
  document.getElementById('quizNextBtn').onclick = () => {
    if (question.type === 'match') {
      const q = quizData.test.questions[currentQuestionIndex];
      const selected = [];
      let allSelected = true;
      for (let i = 0; i < q.lefts.length; i++) {
        const val = document.getElementById(`match_${i}`)?.value;
        if (!val) allSelected = false;
        else selected.push(parseInt(val));
      }
      if (allSelected) {
        saveAnswer(currentQuestionIndex, { type: 'match', selected });
      } else {
        showToast('Ҳамаи ҷуфтҳоро интихоб кунед!');
        return;
      }
    } else if (question.type === 'open') {
      const val = document.getElementById('openAns')?.value.trim();
      if (!val) {
        showToast('Ҷавобро нависед!');
        return;
      }
      saveAnswer(currentQuestionIndex, { type: 'open', selected: val });
    }
    
    if (currentQuestionIndex < quizData.test.questions.length - 1) {
      currentQuestionIndex++;
      renderQuiz();
    } else {
      finishQuizAndShowResult();
    }
  };
}

function renderResult() {
  appContainer.innerHTML = `
    <div class="container">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title" id="resultTitle">📊 НАТИҶА</div>
          <button class="btn btn-outline" onclick="window.appBackToMenu()">Хона</button>
        </div>
        <div id="resultContent"></div>
      </div>
    </div>
  `;
}

async function finishQuizAndShowResult() {
  const result = finishQuiz(quizStudentName);
  stopQuiz();
  
  const gradeText = result.grade >= 9 ? 'АЪЛО!' : result.grade >= 7 ? 'ХУБ!' : result.grade >= 5 ? 'ҚАНОАТБАХШ' : 'ТАКРОР';
  
  document.getElementById('resultTitle').innerHTML = `📊 НАТИҶА: ${result.grade}/10 - ${gradeText}`;
  document.getElementById('resultContent').innerHTML = `
    <div style="text-align:center">
      <div style="font-size:72px; font-weight:800; color:var(--gold)">${result.percent}%</div>
      <div style="font-size:24px; margin:10px 0">Холҳо: ${result.earned}/${result.total}</div>
      <div style="font-size:18px">Баҳо: ${result.grade} аз 10</div>
      <div style="margin-top:20px; display:flex; gap:12px; justify-content:center">
        <button class="btn btn-outline" onclick="window.appShowReview()">📖 Хатоҳо</button>
        <button class="btn btn-success" onclick="window.appGeneratePDF()">📄 PDF Сертификат</button>
      </div>
    </div>
  `;
  
  currentView = 'result';
}

// Global functions for onclick
window.appBackToMenu = () => {
  currentView = 'menu';
  currentTest = null;
  quizData = null;
  stopQuiz();
  render();
};

window.appShowTeacherLogin = () => {
  currentView = 'teacherAuth';
  render();
};

window.appShowStudentPanel = () => {
  currentView = 'studentPanel';
  render();
};

window.appBackToTeacher = () => {
  currentView = 'teacherPanel';
  render();
};

window.appLogoutTeacher = () => {
  logout();
  currentView = 'menu';
  render();
};

window.appChangePassword = () => {
  const newPass = prompt('Пароли нав (4+ аломат):');
  if (newPass) changePassword(newPass);
};

window.appCreateTest = () => {
  currentTest = createTest();
  currentView = 'testEditor';
  render();
};

window.appEditTest = (id) => {
  currentTest = state.tests.find(t => t.id === id);
  if (currentTest) {
    currentView = 'testEditor';
    render();
  }
};

window.appDeleteTest = (id) => {
  deleteTest(id);
  renderTeacherPanel();
};

window.appToggleActive = (id) => {
  toggleTestActive(id);
  renderTeacherPanel();
};

window.appNewCode = (id) => {
  regenerateTestCode(id);
  renderTeacherPanel();
};

window.appToggleFavorite = (id) => {
  toggleFavorite(id);
  renderTeacherPanel();
};

window.appSaveTest = () => {
  if (currentTest) {
    const name = document.getElementById('testName').value;
    const timeLimit = parseInt(document.getElementById('testTime').value);
    const tags = document.getElementById('testTags').value.split(',').map(s => s.trim()).filter(s => s);
    
    updateTest(currentTest.id, { name, timeLimit, tags });
    showToast('Тест захира шуд!');
    currentView = 'teacherPanel';
    render();
  }
};

window.appAddQuestion = () => {
  editingQuestionIndex = null;
  openQuestionModal();
};

window.appEditQuestion = (index) => {
  editingQuestionIndex = index;
  openQuestionModal(index);
};

window.appDeleteQuestion = (index) => {
  if (confirm('Нест кардани савол?')) {
    deleteQuestion(currentTest.id, index);
    currentTest = state.tests.find(t => t.id === currentTest.id);
    renderQuestionsList();
  }
};

window.appExportTest = () => {
  exportTest(currentTest.id);
};

window.appOpenImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const newTest = await importTest(file, state.currentTeacher.username);
        showToast('Тест импорт шуд!');
        renderTeacherPanel();
      } catch (err) {
        showToast('Хатогӣ ҳангоми импорт');
      }
    }
  };
  input.click();
};

window.appStartTest = () => {
  const code = document.getElementById('studentCode').value.trim().toUpperCase();
  const name = document.getElementById('studentName').value.trim();
  
  if (!code) {
    showToast('Рамзи тест ворид кунед!');
    return;
  }
  if (!name) {
    showToast('Номи худро ворид кунед!');
    return;
  }
  
  const test = findTestByCode(code);
  if (!test) {
    showToast('Рамз нодуруст ё тест ғайрифаъол!');
    return;
  }
  
  quizStudentName = name;
  quizData = startQuiz(test, name);
  quizData.startQuiz();
  currentQuestionIndex = 0;
  currentView = 'quiz';
  render();
};

window.appSelectClosed = (index) => {
  saveAnswer(currentQuestionIndex, { type: 'closed', selected: index });
  
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`opt_${i}`);
    if (btn) btn.style.borderColor = i === index ? '#3b82f6' : '';
  }
};

window.appToggleMulti = (index) => {
  if (!window.multiSelected) window.multiSelected = [];
  
  const pos = window.multiSelected.indexOf(index);
  if (pos === -1) {
    window.multiSelected.push(index);
  } else {
    window.multiSelected.splice(pos, 1);
  }
  
  saveAnswer(currentQuestionIndex, { type: 'multi', selected: [...window.multiSelected] });
  
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`opt_${i}`);
    if (btn) {
      btn.style.borderColor = window.multiSelected.includes(i) ? '#10b981' : '';
    }
  }
};

window.appShowReview = () => {
  const review = getStudentReview();
  const questions = quizData?.test.questions || [];
  
  let html = '<h3>📖 ТАҲЛИЛИ ҶАВОБҲО</h3>';
  review.forEach((r, idx) => {
    const question = questions[idx];
    const imageHtml = question?.img ? `
      <div style="margin:8px 0">
        <img src="${escapeHtml(question.img)}" style="max-width:100%; max-height:120px; border-radius:8px">
      </div>
    ` : '';
    
    html += `
      <div class="review-item" style="border-left-color: ${r.status === 'correct' ? '#10b981' : '#ef4444'}">
        <div><strong>Савол ${r.index}:</strong> ${r.status === 'correct' ? '✅' : '❌'}</div>
        ${imageHtml}
        <div style="font-size:13px; margin:8px 0">${escapeHtml(r.question)}</div>
        <div style="font-size:12px">
          <div>📝 Шумо: ${escapeHtml(r.userAnswer)}</div>
          <div>✓ Дуруст: ${escapeHtml(r.correctAnswer)}</div>
          ${r.comment ? `<div>💡 ${escapeHtml(r.comment)}</div>` : ''}
        </div>
      </div>
    `;
  });
  
  document.getElementById('resultTitle').innerHTML = '📖 ТАҲЛИЛИ ҶАВОБҲО';
  document.getElementById('resultContent').innerHTML = html;
};
window.appGeneratePDF = async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFont('helvetica');
  doc.setFontSize(24);
  doc.text('VORTEX EXAM SYSTEM', 105, 30, { align: 'center' });
  doc.setFontSize(18);
  doc.text('СЕРТИФИКАТИ ИҶРОИ ТЕСТ', 105, 50, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Номи талаба: ${quizStudentName}`, 20, 80);
  doc.text(`Номи тест: ${quizData?.test.name || ''}`, 20, 95);
  doc.text(`Сана: ${new Date().toLocaleDateString('tg-TJ')}`, 20, 110);
  
  const result = finishQuiz(quizStudentName);
  doc.text(`Натиҷа: ${result.earned}/${result.total} хол (${result.percent}%)`, 20, 125);
  doc.text(`Баҳо: ${result.grade} аз 10`, 20, 140);
  doc.setFontSize(10);
  doc.text('Ин сертификат тасдиқ мекунад, ки талаба тести мазкурро бомуваффақият иҷро намудааст.', 20, 170, { maxWidth: 170 });
  doc.save(`certificate_${quizStudentName}.pdf`);
};

// Question Modal
// Question Modal
function openQuestionModal(index = null) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'questionModal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <div class="panel-header">
        <h3>${index !== null ? 'Таҳрири савол' : 'Саволи нав'}</h3>
        <button class="btn btn-outline" onclick="document.getElementById('questionModal').remove()">✖</button>
      </div>
      <div class="input-group">
        <label>Намуд:</label>
        <select id="questionType">
          <option value="closed">Пӯшида</option>
          <option value="multi">Бисёрҷавоба</option>
          <option value="match">Мувофиқат</option>
          <option value="open">Кушода</option>
        </select>
      </div>
      
      <!-- РАСМ ИЛОВА КУНЕД -->
      <div class="input-group">
        <label>🖼 РАСМИ САВОЛ:</label>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <input type="text" id="questionImage" placeholder="URL ё Base64" style="flex:2">
          <input type="file" id="questionImageFile" accept="image/*" style="flex:1">
          <button type="button" class="btn btn-sm btn-primary" onclick="window.uploadQuestionImage()">📤 Боргузорӣ</button>
        </div>
        <div id="imagePreviewArea" style="margin-top:8px; display:none">
          <img id="imagePreviewImg" style="max-width:100%; max-height:100px; border-radius:8px">
          <button type="button" class="btn btn-sm btn-danger" onclick="window.clearQuestionImage()" style="margin-top:4px">✖ Тоза кардан</button>
        </div>
      </div>
      
      <div id="questionTypeFields"></div>
      <div class="input-group">
        <label>Шарҳ:</label>
        <textarea id="questionComment" rows="2" placeholder="Шарҳи ҷавоб..."></textarea>
      </div>
      <div style="display:flex; gap:12px; margin-top:20px">
        <button class="btn btn-primary" id="saveQuestionBtn">Сабт</button>
        <button class="btn btn-outline" onclick="document.getElementById('questionModal').remove()">Бекор</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const typeSelect = document.getElementById('questionType');
  const fieldsContainer = document.getElementById('questionTypeFields');
  
  const updateFields = () => {
    const type = typeSelect.value;
    
    if (type === 'closed') {
      fieldsContainer.innerHTML = `
        <div class="input-group"><label>Матн:</label><textarea id="closed_q" rows="3"></textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">
          <div><label>A:</label><input id="closed_opt_0"></div>
          <div><label>B:</label><input id="closed_opt_1"></div>
          <div><label>C:</label><input id="closed_opt_2"></div>
          <div><label>D:</label><input id="closed_opt_3"></div>
        </div>
        <div class="input-group"><label>Ҷавоб (0-3):</label><input type="number" id="closed_ans" min="0" max="3"></div>
      `;
    } else if (type === 'multi') {
      fieldsContainer.innerHTML = `
        <div class="input-group"><label>Матн:</label><textarea id="multi_q" rows="3"></textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">
          <div><label>A:</label><input id="multi_opt_0"></div>
          <div><label>B:</label><input id="multi_opt_1"></div>
          <div><label>C:</label><input id="multi_opt_2"></div>
          <div><label>D:</label><input id="multi_opt_3"></div>
        </div>
        <div class="input-group"><label>Ҷавобҳо (0,1,2,3):</label><input id="multi_ans" placeholder="0,2"></div>
      `;
    } else if (type === 'match') {
      fieldsContainer.innerHTML = `
        <div class="input-group"><label>Матн:</label><textarea id="match_text" rows="2"></textarea></div>
        <div id="match_lefts_container"></div>
        <button class="btn btn-sm btn-outline" onclick="window.appAddMatchLeft()">+ Чап</button>
        <div class="input-group"><label>Вариантҳои рост:</label></div>
        <div id="match_rights_container"></div>
        <button class="btn btn-sm btn-outline" onclick="window.appAddMatchRight()">+ Рост</button>
      `;
      window.matchLefts = [];
      window.matchRights = [];
      window.matchPairs = [];
      renderMatchFields();
    } else {
      fieldsContainer.innerHTML = `
        <div class="input-group"><label>Матн:</label><textarea id="open_q" rows="3"></textarea></div>
        <div class="input-group"><label>Ҷавоби дуруст:</label><input id="open_ans"></div>
      `;
    }
    
    if (index !== null) {
      const q = currentTest.questions[index];
      if (q) {
        document.getElementById('questionComment').value = q.comment || '';
        
        // Боркунии расм барои таҳрир
        const questionImage = document.getElementById('questionImage');
        const previewArea = document.getElementById('imagePreviewArea');
        const previewImg = document.getElementById('imagePreviewImg');
        if (q.img && questionImage) {
          questionImage.value = q.img;
          if (previewImg) previewImg.src = q.img;
          if (previewArea) previewArea.style.display = 'block';
        }
        
        if (q.type === 'closed') {
          setTimeout(() => {
            const el = document.getElementById('closed_q');
            if (el) el.value = q.q || '';
            for (let i = 0; i < 4; i++) {
              const opt = document.getElementById(`closed_opt_${i}`);
              if (opt) opt.value = q.opts?.[i] || '';
            }
            const ans = document.getElementById('closed_ans');
            if (ans) ans.value = q.ans || 0;
          }, 0);
        } else if (q.type === 'multi') {
          setTimeout(() => {
            const el = document.getElementById('multi_q');
            if (el) el.value = q.q || '';
            for (let i = 0; i < 4; i++) {
              const opt = document.getElementById(`multi_opt_${i}`);
              if (opt) opt.value = q.opts?.[i] || '';
            }
            const ans = document.getElementById('multi_ans');
            if (ans) ans.value = q.ans?.join(',') || '';
          }, 0);
        } else if (q.type === 'match') {
          setTimeout(() => {
            const text = document.getElementById('match_text');
            if (text) text.value = q.text || '';
            window.matchLefts = [...q.lefts];
            window.matchRights = [...q.rights];
            window.matchPairs = [...q.pairs];
            renderMatchFields();
          }, 0);
        } else {
          setTimeout(() => {
            const qEl = document.getElementById('open_q');
            if (qEl) qEl.value = q.q || '';
            const ans = document.getElementById('open_ans');
            if (ans) ans.value = q.ans || '';
          }, 0);
        }
      }
    }
  };
  
  typeSelect.onchange = updateFields;
  updateFields();
  
  document.getElementById('saveQuestionBtn').onclick = () => {
    const type = typeSelect.value;
    const comment = document.getElementById('questionComment').value;
    const imageUrl = document.getElementById('questionImage').value;
    let question = null;
    
    if (type === 'closed') {
      const q = document.getElementById('closed_q').value;
      const opts = [0,1,2,3].map(i => document.getElementById(`closed_opt_${i}`).value);
      const ans = parseInt(document.getElementById('closed_ans').value);
      if (!q || opts.some(o => !o)) {
        showToast('Ҳамаи майдонҳоро пур кунед!');
        return;
      }
      question = { type, q, opts, ans, comment, img: imageUrl || null };
    } else if (type === 'multi') {
      const q = document.getElementById('multi_q').value;
      const opts = [0,1,2,3].map(i => document.getElementById(`multi_opt_${i}`).value);
      const ans = document.getElementById('multi_ans').value.split(',').map(Number);
      if (!q || opts.some(o => !o) || !ans.length) {
        showToast('Ҳамаи майдонҳоро пур кунед!');
        return;
      }
      question = { type, q, opts, ans, comment, img: imageUrl || null };
    } else if (type === 'match') {
      const text = document.getElementById('match_text').value;
      if (!text || window.matchLefts.length === 0 || window.matchRights.length === 0) {
        showToast('Ҳамаи майдонҳоро пур кунед!');
        return;
      }
      question = { type, text, lefts: window.matchLefts, rights: window.matchRights, pairs: window.matchPairs, comment, img: imageUrl || null };
    } else {
      const q = document.getElementById('open_q').value;
      const ans = document.getElementById('open_ans').value;
      if (!q || !ans) {
        showToast('Ҳамаи майдонҳоро пур кунед!');
        return;
      }
      question = { type, q, ans, comment, img: imageUrl || null };
    }
    
    if (index !== null) {
      updateQuestion(currentTest.id, index, question);
    } else {
      addQuestion(currentTest.id, question);
    }
    
    currentTest = state.tests.find(t => t.id === currentTest.id);
    renderQuestionsList();
    modal.remove();
  };
}
function renderMatchFields() {
  const leftContainer = document.getElementById('match_lefts_container');
  const rightContainer = document.getElementById('match_rights_container');
  
  if (leftContainer) {
    leftContainer.innerHTML = window.matchLefts.map((l, i) => `
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <input type="text" class="match-left-input" value="${escapeHtml(l)}" style="flex:1" onchange="window.matchLefts[${i}] = this.value">
        <select class="match-pair-select" onchange="window.matchPairs[${i}] = parseInt(this.value)">
          ${window.matchRights.map((r, ri) => `<option value="${ri}" ${window.matchPairs[i] === ri ? 'selected' : ''}>${ri + 1}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-danger" onclick="window.appRemoveMatchLeft(${i})">✖</button>
      </div>
    `).join('');
  }
  
  if (rightContainer) {
    rightContainer.innerHTML = window.matchRights.map((r, i) => `
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <input type="text" value="${escapeHtml(r)}" style="flex:1" onchange="window.matchRights[${i}] = this.value">
        <button class="btn btn-sm btn-danger" onclick="window.appRemoveMatchRight(${i})">✖</button>
      </div>
    `).join('');
  }
}

window.appRemoveMatchLeft = (i) => {
  window.matchLefts.splice(i, 1);
  window.matchPairs.splice(i, 1);
  renderMatchFields();
};

window.appRemoveMatchRight = (i) => {
  window.matchRights.splice(i, 1);
  renderMatchFields();
};

// Theme toggle
window.toggleTheme = () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
};

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
}
// ========== ФУНКСИЯҲОИ РАСМ (ГЛОБАЛӢ) ==========
window.uploadQuestionImage = () => {
  const fileInput = document.getElementById('questionImageFile');
  const imageInput = document.getElementById('questionImage');
  const previewImg = document.getElementById('imagePreviewImg');
  const previewArea = document.getElementById('imagePreviewArea');
  
  if (!fileInput || !imageInput) {
    showToast('Лутфан аввал modal-ро кушоед!');
    return;
  }
  
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageInput.value = e.target.result;
      if (previewImg) previewImg.src = e.target.result;
      if (previewArea) previewArea.style.display = 'block';
      showToast('Расм бор шуд!');
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else if (imageInput.value) {
    if (previewImg) previewImg.src = imageInput.value;
    if (previewArea) previewArea.style.display = 'block';
  } else {
    showToast('Файл ё URL интихоб кунед!');
  }
};

window.clearQuestionImage = () => {
  const imageInput = document.getElementById('questionImage');
  const fileInput = document.getElementById('questionImageFile');
  const previewArea = document.getElementById('imagePreviewArea');
  
  if (imageInput) imageInput.value = '';
  if (fileInput) fileInput.value = '';
  if (previewArea) previewArea.style.display = 'none';
  showToast('Расм тоза шуд');
};
// =============================================
// Start app
window.appAddMatchLeft = () => {
  if (!window.matchLefts) window.matchLefts = [];
  if (!window.matchPairs) window.matchPairs = [];
  window.matchLefts.push('');
  window.matchPairs.push(0);
  renderMatchFields();
};

window.appAddMatchRight = () => {
  if (!window.matchRights) window.matchRights = [];
  window.matchRights.push('');
  renderMatchFields();
};
init();