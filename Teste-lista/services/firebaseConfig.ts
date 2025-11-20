import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZFqt1-PXjcs9aGF8jeUL6PWzPwsuzhB8",
  authDomain: "teste-cnpj-cead3.firebaseapp.com",
  projectId: "teste-cnpj-cead3",
  storageBucket: "teste-cnpj-cead3.firebasestorage.app",
  messagingSenderId: "819206470986",
  appId: "1:819206470986:web:c3c61a284b3ebe7d0095b3",
  measurementId: "G-C3CMHXHYFZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
