// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDAQnVarAr2ECfZfUwj5aqcf3NpwlIcxnY",
  authDomain: "producao-lirio-branco-103ed.firebaseapp.com",
  projectId: "producao-lirio-branco-103ed",
  storageBucket: "producao-lirio-branco-103ed.firebasestorage.app",
  messagingSenderId: "369071765152",
  appId: "1:369071765152:web:3438deb839a09816577bc5",
  measurementId: "G-T5JTVH67PK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
