// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD97U0xgmSTHECWjZVSBdaFSd9NPu2x_Tc",
  authDomain: "psap-ai.firebaseapp.com",
  projectId: "psap-ai",
  storageBucket: "psap-ai.firebasestorage.app",
  messagingSenderId: "936171427687",
  appId: "1:936171427687:web:8474ffb73e8f94a422c1c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
