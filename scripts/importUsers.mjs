import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase.mjs";

const defaultSchedule = {
  lunes: { entrada: '08:00', salida: '17:00', activo: true },
  martes: { entrada: '08:00', salida: '17:00', activo: true },
  miercoles: { entrada: '08:00', salida: '17:00', activo: true },
  jueves: { entrada: '08:00', salida: '17:00', activo: true },
  viernes: { entrada: '08:00', salida: '15:00', activo: true }
};

const users = [
  { fullName: "ALBERTO DE LA CRUZ", depts: ["Seguridad", "Gestión ORO"] },
  { fullName: "ALEX MORCEGO FIJO", depts: ["Gestión ORO", "Seguridad"] },
  { fullName: "ANABEL MIGUEL", depts: ["Gestión ORO", "Conta"] },
  { fullName: "ANNA CAPDEVILA", depts: ["Conta", "Gestión ORO"] },
  { fullName: "ANTONIO BLAZQUEZ", depts: ["Conta"] },
  { fullName: "CARLA RODRIGUEZ", depts: ["Análisis", "Gestión ORO"] },
  { fullName: "DAVID CHICO", depts: ["Gestión ORO"] },
  { fullName: "GERARD RETUERTA", depts: ["Rascado", "Fundir"] },
  { fullName: "GERARDO RETUERTA", depts: ["Seguridad", "Rascado", "Fundir"] },
  { fullName: "JORDI PERERA", depts: ["Análisis", "Rascado", "Fundir"] },
  { fullName: "JOSE ANT FONDEVILA", depts: ["Rascado", "Fundir"] },
  { fullName: "JUANJO HERRAIZ", depts: ["Rascado", "Fundir"] },
  { fullName: "MAITE GARCIA", depts: ["Análisis"] },
  { fullName: "MARTA RETUERTA", depts: ["Conta", "Gestión ORO"] },
  { fullName: "MIRIAM CARRIL GALERA", depts: ["Análisis", "Gestión ORO"] },
  { fullName: "MONTSE CANTARERO", depts: ["Gestión ORO"] },
  { fullName: "ROSANA FIJO", depts: ["Conta", "Gestión ORO"] },
  { fullName: "SONIA ALFEREZ", depts: ["Gestión ORO"] },
];

function capitalize(str) {
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function generateCode(name, lastName) {
  const n = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const l = lastName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
  return n + l;
}

async function main() {
  console.log("=== Importando usuarios ===\n");

  for (const user of users) {
    const parts = user.fullName.split(' ');
    const name = capitalize(parts[0]);
    const lastName = capitalize(parts.slice(1).join(' '));
    const code = generateCode(name, lastName);

    const userData = {
      code,
      name,
      lastName,
      departments: user.depts,
      totalDays: 22,
      carryOverDays: 0,
      isAdmin: false,
      schedule: defaultSchedule,
      phone: '',
    };

    await addDoc(collection(db, 'vacation_users'), userData);
    console.log(`✅ ${name} ${lastName} (${code}) - ${user.depts.join(', ')}`);
  }

  console.log(`\n=== ${users.length} usuarios importados ===`);
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
