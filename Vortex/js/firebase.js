import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  update,
  remove,
  push,
  query,
  orderByChild,
  equalTo
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyACjm3u1yykb3YNO9ehbzXYfuqpGe8Xljo",
  authDomain: "vortex-57609.firebaseapp.com",
  projectId: "vortex-57609",
  storageBucket: "vortex-57609.firebasestorage.app",
  messagingSenderId: "163139872965",
  appId: "1:163139872965:web:a605d6bba3f4ab6eec68ac",
  measurementId: "G-CYXSLQS56T"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Database references
const dbRef = ref(database);
const vortexRef = ref(database, 'vortex_data');

export {
  database,
  dbRef,
  vortexRef,
  ref,
  set,
  get,
  child,
  update,
  remove,
  push,
  query,
  orderByChild,
  equalTo
};