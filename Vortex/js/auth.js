import { state } from './state.js';
import { showToast } from './utils.js';

export function login(username, password) {
  const user = state.teachers.find(t => t.username === username && t.password === password);
  
  if (!user) {
    showToast('Номи корбарӣ ё парол нодуруст!');
    return false;
  }
  
  state.currentTeacher = user;
  showToast('Хуш омадед, ' + username);
  return true;
}

export function register(username, password, confirmPassword) {
  if (password !== confirmPassword) {
    showToast('Паролҳо мувофиқат намекунанд!');
    return false;
  }
  
  if (state.teachers.find(t => t.username === username)) {
    showToast('Ин номи корбарӣ аллакай вуҷуд дорад!');
    return false;
  }
  
  state.teachers.push({
    username,
    password,
    favorites: []
  });
  
  state.save();
  showToast('Ҳисоб бомуваффақият сохта шуд!');
  return true;
}

export function logout() {
  state.currentTeacher = null;
  showToast('Шумо аз система баромадед');
}

export function changePassword(newPassword) {
  if (state.currentTeacher && newPassword.length >= 4) {
    state.currentTeacher.password = newPassword;
    state.save();
    showToast('Парол тағйир ёфт!');
    return true;
  }
  showToast('Парол бояд камтар аз 4 рамз бошад!');
  return false;
}