import { state } from './state.js';
import { generateCode, showToast, escapeHtml } from './utils.js';

export function createTest() {
  const newTest = {
    id: Date.now(),
    teacherId: state.currentTeacher.username,
    name: 'Тести нав',
    timeLimit: 30,
    code: generateCode(),
    questions: [],
    tags: [],
    isActive: false,
    results: []
  };
  
  state.addTest(newTest);
  return newTest;
}

export function updateTest(testId, data) {
  state.updateTest(testId, data);
}

export function deleteTest(testId) {
  if (confirm('Шумо боварӣ доред, ки ин тестро нест кунед?')) {
    state.deleteTest(testId);
    showToast('Тест нест карда шуд');
  }
}

export function toggleTestActive(testId) {
  const test = state.tests.find(t => t.id === testId);
  if (test) {
    test.isActive = !test.isActive;
    state.updateTest(testId, { isActive: test.isActive });
    showToast(test.isActive ? 'Тест фаъол шуд' : 'Тест ғайрифаъол шуд');
  }
}

export function regenerateTestCode(testId) {
  const test = state.tests.find(t => t.id === testId);
  if (test) {
    const newCode = generateCode();
    state.updateTest(testId, { code: newCode });
    showToast(`Рамзи нав: ${newCode}`);
  }
}

export function toggleFavorite(testId) {
  if (!state.currentTeacher) return;
  
  const favorites = state.currentTeacher.favorites;
  const index = favorites.indexOf(testId);
  
  if (index === -1) {
    favorites.push(testId);
  } else {
    favorites.splice(index, 1);
  }
  
  state.save();
  showToast(index === -1 ? 'Ба любитҳо илова шуд' : 'Аз любитҳо хориҷ карда шуд');
}

export function getTeacherTests() {
  if (!state.currentTeacher) return [];
  return state.tests.filter(t => t.teacherId === state.currentTeacher.username);
}

export function addQuestion(testId, question) {
  const test = state.tests.find(t => t.id === testId);
  if (test) {
    test.questions.push(question);
    state.save();
  }
}

export function updateQuestion(testId, index, question) {
  const test = state.tests.find(t => t.id === testId);
  if (test && test.questions[index]) {
    test.questions[index] = question;
    state.save();
  }
}

export function deleteQuestion(testId, index) {
  const test = state.tests.find(t => t.id === testId);
  if (test) {
    test.questions.splice(index, 1);
    state.save();
  }
}

export function exportTest(testId) {
  const test = state.tests.find(t => t.id === testId);
  if (test) {
    const data = JSON.stringify({
      name: test.name,
      timeLimit: test.timeLimit,
      questions: test.questions,
      tags: test.tags
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = test.name.replace(/[^a-z0-9]/gi, '_') + '.json';
    a.click();
  }
}

export function importTest(file, teacherId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const newTest = {
          id: Date.now(),
          teacherId: teacherId,
          name: data.name,
          timeLimit: data.timeLimit || 30,
          code: generateCode(),
          questions: data.questions || [],
          tags: data.tags || [],
          isActive: false,
          results: []
        };
        state.addTest(newTest);
        resolve(newTest);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}