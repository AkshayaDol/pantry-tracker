// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Correct import path

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC3ZDUcbGVnFw5ggLcnoP-XAcgw7AJ9hy4",
    authDomain: "inventory-management-2ee1a.firebaseapp.com",
    projectId: "inventory-management-2ee1a",
    storageBucket: "inventory-management-2ee1a.appspot.com",
    messagingSenderId: "432787262757",
    appId: "1:432787262757:web:529b025eb74c95698c5ecc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
