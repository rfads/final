// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSAhoY53rcKOU5si-f9nIOhzeN5O9KJ7s",
  authDomain: "finalproject-ccaa1.firebaseapp.com",
  projectId: "finalproject-ccaa1",
  storageBucket: "finalproject-ccaa1.firebasestorage.app",
  messagingSenderId: "499799186389",
  appId: "1:499799186389:web:d0dc71face00cb979efb5c",
  measurementId: "G-LNK79TYWYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };