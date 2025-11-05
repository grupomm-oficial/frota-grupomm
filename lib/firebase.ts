import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDyuj_yllhbZb89yLBnwkp8eghWYTFhi2k",
  authDomain: "gerenciamento-de-frota-grupomm.firebaseapp.com",
  projectId: "gerenciamento-de-frota-grupomm",
  storageBucket: "gerenciamento-de-frota-grupomm.firebasestorage.app",
  messagingSenderId: "1092081985356",
  appId: "1:1092081985356:web:af10474c79e7596f5f91e9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);