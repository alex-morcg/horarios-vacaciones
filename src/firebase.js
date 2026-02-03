import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmoiIKec5NIDYzyY_TqwXgjbI_pu4WUy8",
  authDomain: "patrick-masajes.firebaseapp.com",
  projectId: "patrick-masajes",
  storageBucket: "patrick-masajes.firebasestorage.app",
  messagingSenderId: "148332805394",
  appId: "1:148332805394:web:5c3307241ed2fb5af2c7cb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
