import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmoiIKec5NIDYzyY_TqwXgjbI_pu4WUy8",
  authDomain: "patrick-masajes.firebaseapp.com",
  projectId: "patrick-masajes",
  storageBucket: "patrick-masajes.firebasestorage.app",
  messagingSenderId: "148332805394",
  appId: "1:148332805394:web:5c3307241ed2fb5af2c7cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const snapshot = await getDocs(collection(db, 'vacation_departments'));
  console.log("Departamentos en la app:");
  snapshot.docs.forEach(doc => {
    console.log(`  - ${doc.data().name}`);
  });
  process.exit(0);
}

main();
