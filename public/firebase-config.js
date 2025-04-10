// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD6vRi7kVjKK_A-WIlcg28hL4DZiK9Nh6g",
    authDomain: "cursor-f6c9b.firebaseapp.com",
    projectId: "cursor-f6c9b",
    storageBucket: "cursor-f6c9b.firebasestorage.app",
    messagingSenderId: "31747409332",
    appId: "1:31747409332:web:131d36c3c0a0b806f55ee1",
    measurementId: "G-RR9Q7ME0HK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure for local development
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    provider.setCustomParameters({
        prompt: 'select_account'
    });
}

export { db, auth, provider, signInWithPopup, signOut }; 