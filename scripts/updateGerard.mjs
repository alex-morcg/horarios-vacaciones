import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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
  const snapshot = await getDocs(collection(db, 'vacation_users'));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    // Gerard (sin Seguridad) es el Jr
    if (data.name === 'Gerard' && data.lastName === 'Retuerta') {
      await updateDoc(doc(db, 'vacation_users', docSnap.id), {
        code: 'GERRETUEJR'
      });
      console.log('✅ Gerard Retuerta actualizado a GERRETUEJR');
    }
  }

  process.exit(0);
}

main();
