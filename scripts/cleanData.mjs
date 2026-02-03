import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function deleteCollection(collectionName) {
  console.log(`Borrando ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id));
    count++;
  }
  console.log(`  ✅ ${count} documentos borrados de ${collectionName}`);
  return count;
}

async function main() {
  console.log("=== Limpieza de datos ===\n");
  console.log("Borrando: usuarios, fichajes, solicitudes");
  console.log("Manteniendo: departamentos, festivos\n");

  const users = await deleteCollection('vacation_users');
  const timeclock = await deleteCollection('vacation_timeclock');
  const requests = await deleteCollection('vacation_requests');

  console.log("\n=== Resumen ===");
  console.log(`Total borrado: ${users + timeclock + requests} documentos`);
  console.log("\nDepartamentos y festivos NO tocados.");

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
