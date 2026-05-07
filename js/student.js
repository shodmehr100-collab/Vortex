import { state } from './state.js';
import { getGrade, showToast, escapeHtml, formatTime } from './utils.js';

let currentQuiz = null;
let currentAnswers = [];
let quizTimer = null;
let timeLeft = 0;
let quizActive = false;

export function findTestByCode(code) {
  return state.tests.find(t => t.code === code && t.isActive === true);
}

export function startQuiz(test, studentName) {
  currentQuiz = JSON.parse(JSON.stringify(test));
  currentAnswers = new Array(currentQuiz.questions.length).fill(null);
  timeLeft = currentQuiz.timeLimit * 60;
  quizActive = true;
  
  return {
    test: currentQuiz,
    timeLeft,
    startQuiz: () => {
      startTimer();
    }
  };
}

function startTimer() {
  if (quizTimer) clearInterval(quizTimer);
  
  quizTimer = setInterval(() => {
    if (!quizActive) return;
    
    if (timeLeft <= 0) {
      clearInterval(quizTimer);
      finishQuiz();
    } else {
      timeLeft--;
      if (window.onTimerUpdate) window.onTimerUpdate(formatTime(timeLeft));
    }
  }, 1000);
}

export function stopQuiz() {
  quizActive = false;
  if (quizTimer) {
    clearInterval(quizTimer);
    quizTimer = null;
  }
}

export function saveAnswer(index, answer) {
  if (currentAnswers && currentAnswers[index]) {
    currentAnswers[index] = answer;
  }
}

export function calculateScore() {
  let earned = 0;
  let total = 0;
  
  currentQuiz.questions.forEach((q, i) => {
    const answer = currentAnswers[i];
    
    if (q.type === 'closed') {
      total += 3;
      if (answer && answer.selected === q.ans) earned += 3;
    } else if (q.type === 'multi') {
      total += 4;
      if (answer && answer.selected) {
        let correct = 0;
        q.ans.forEach(ans => {
          if (answer.selected.includes(ans)) correct++;
        });
        earned += Math.min(4, correct * 2);
      }
    } else if (q.type === 'match') {
      total += 8;
      if (answer && answer.selected) {
        let points = 0;
        q.pairs.forEach((pair, idx) => {
          if (answer.selected[idx] === pair) points += 2;
        });
        earned += points;
      }
    } else {
      total += 4;
      if (answer && answer.selected) {
        const userAnswer = String(answer.selected).trim().replace(',', '.');
        const correctAnswer = String(q.ans).trim().replace(',', '.');
        if (userAnswer === correctAnswer) earned += 4;
      }
    }
  });
  
  const percent = Math.round((earned / total) * 100);
  const grade = getGrade(percent);
  
  return { earned, total, percent, grade };
}

export function finishQuiz(studentName) {
  if (!quizActive) return null;
  
  stopQuiz();
  
  const result = calculateScore();
  
  const finalResult = {
    name: studentName,
    date: new Date().toLocaleDateString('tg-TJ'),
    earned: result.earned,
    total: result.total,
    percent: result.percent,
    grade: result.grade,
    answers: currentAnswers
  };
  
  state.addResult(currentQuiz.code, finalResult);
  
  return finalResult;
}

export function getTestResults(testCode) {
  const test = state.tests.find(t => t.code === testCode);
  return test ? test.results || [] : [];
}

export function getStudentReview() {
  const review = [];
  
  currentQuiz.questions.forEach((q, i) => {
    const answer = currentAnswers[i];
    let status = 'unknown';
    let userAnswer = '';
    let correctAnswer = '';
    
    if (answer) {
      if (q.type === 'closed') {
        const isCorrect = answer.selected === q.ans;
        status = isCorrect ? 'correct' : 'wrong';
        userAnswer = q.opts[answer.selected];
        correctAnswer = q.opts[q.ans];
      } else if (q.type === 'multi') {
        const isCorrect = q.ans.every(a => answer.selected.includes(a)) && 
                         answer.selected.length === q.ans.length;
        status = isCorrect ? 'correct' : 'wrong';
        userAnswer = answer.selected.map(s => String.fromCharCode(65 + s)).join(',');
        correctAnswer = q.ans.map(a => String.fromCharCode(65 + a)).join(',');
      } else if (q.type === 'match') {
        const allCorrect = q.pairs.every((p, idx) => answer.selected[idx] === p);
        status = allCorrect ? 'correct' : 'wrong';
        userAnswer = answer.selected.map(s => s + 1).join(' → ');
        correctAnswer = q.pairs.map(p => p + 1).join(' → ');
      } else {
        const isCorrect = String(answer.selected).trim().toLowerCase() === String(q.ans).trim().toLowerCase();
        status = isCorrect ? 'correct' : 'wrong';
        userAnswer = answer.selected;
        correctAnswer = q.ans;
      }
    }
    
    review.push({
      index: i + 1,
      question: q.q || q.text,
      status,
      userAnswer,
      correctAnswer,
      comment: q.comment
    });
  });
  
  return review;
}