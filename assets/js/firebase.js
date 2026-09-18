// assets/js/firebase.js

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* ==============================
   CONFIGURATION FIREBASE
============================== */

const firebaseConfig = {

  apiKey:
    "AIzaSyBoTbCA3B9UWY807VUl-Wcu2-If1b-KJ08",

  authDomain:
    "suzini-bt.firebaseapp.com",

  projectId:
    "suzini-bt",

  storageBucket:
    "suzini-bt.firebasestorage.app",

  messagingSenderId:
    "1080058605729",

  appId:
    "1:1080058605729:web:83ffbd8cb3507abc3a40e0"

};


/* ==============================
   INITIALISATION
============================== */

const app =
  initializeApp(firebaseConfig);


/* ==============================
   SERVICES
============================== */

const db =
  getFirestore(app);

const auth =
  getAuth(app);


/* ==============================
   EXPORTS
============================== */

export {
  app,
  db,
  auth
};
