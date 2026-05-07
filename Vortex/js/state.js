import { loadFromLocal, saveToLocal } from './utils.js';
import { get, vortexRef, set } from './firebase.js';

class State {
  constructor() {
    this.teachers = [];
    this.tests = [];
    this.currentTeacher = null;
    this.currentTest = null;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this));
  }

  async load() {
    this.teachers = loadFromLocal('teachers', []);
    this.tests = loadFromLocal('tests', []);
    
    if (this.teachers.length === 0) {
      this.teachers = [{ username: 'admin', password: '12345', favorites: [] }];
      this.save();
    }
    
    await this.syncWithFirebase();
    this.notify();
  }

  async syncWithFirebase() {
    try {
      const snapshot = await get(vortexRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.teachers) this.teachers = data.teachers;
        if (data.tests) this.tests = data.tests;
        saveToLocal('teachers', this.teachers);
        saveToLocal('tests', this.tests);
      }
    } catch (e) {
      console.error('Firebase sync error:', e);
    }
  }

  async save() {
    saveToLocal('teachers', this.teachers);
    saveToLocal('tests', this.tests);
    
    try {
      await set(vortexRef, {
        teachers: this.teachers,
        tests: this.tests
      });
    } catch (e) {
      console.error('Firebase save error:', e);
    }
    
    this.notify();
  }

  addTest(test) {
    this.tests.push(test);
    this.save();
  }

  updateTest(testId, updates) {
    const index = this.tests.findIndex(t => t.id === testId);
    if (index !== -1) {
      this.tests[index] = { ...this.tests[index], ...updates };
      this.save();
    }
  }

  deleteTest(testId) {
    this.tests = this.tests.filter(t => t.id !== testId);
    this.save();
  }

  addResult(testCode, result) {
    const test = this.tests.find(t => t.code === testCode);
    if (test) {
      if (!test.results) test.results = [];
      test.results.push(result);
      this.save();
    }
  }
}

export const state = new State();