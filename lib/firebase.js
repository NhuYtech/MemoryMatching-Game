// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyC__TutgWaNGThrPUEdQQhAXd7kM4HuW8c",
//   authDomain: "memorymatchinggame-0909.firebaseapp.com",
//   projectId: "memorymatchinggame-0909",
//   storageBucket: "memorymatchinggame-0909.firebasestorage.app",
//   messagingSenderId: "46244036315",
//   appId: "1:46244036315:web:9f12bc777b2a523e4c16fe",
//   measurementId: "G-36ZGMM201B"
// };

// const app = initializeApp(firebaseConfig);
// const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
// const db = getFirestore(app);
// const auth = getAuth(app);

// export { app, analytics, db, auth };


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC__TutgWaNGThrPUEdQQhAXd7kM4HuW8c",
  authDomain: "memorymatchinggame-0909.firebaseapp.com",
  projectId: "memorymatchinggame-0909",
  storageBucket: "memorymatchinggame-0909.firebasestorage.app",
  messagingSenderId: "46244036315",
  appId: "1:46244036315:web:9f12bc777b2a523e4c16fe",
  measurementId: "G-36ZGMM201B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);