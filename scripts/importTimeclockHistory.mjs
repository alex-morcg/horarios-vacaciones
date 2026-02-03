import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase.mjs";
import { parse } from "csv-parse/sync";
import { execSync } from "child_process";

// Mapeo de nombres del Excel a códigos de usuario en Firebase
const operarioToCode = {
  "1 DE LA CRUZ RAMOS": "ALBDELAC",
  "2 CHICO LOPEZ": "DAVCHICO",
  "4 FONDEVILA PEREZ": "JOSANTFO",
  "5 HERRAIZ ABAD": "JUAHERRA",
  "6 PERERA CALVO": "JORPERER",
  "7 GARCIA VARON": "MAIGARCI",
  "8 ALFEREZ SEVILLANO": "SONALFER",
  "9 CANTARERO CEREIJIDO": "MONCANTA",
  "12 CARRIL GALERA": "MIRCARRI",
  "14 RETUERTA GARCIA": "GERRETUE",
  "15 RETUERTA GARCIA": "GERRETUEJR",
  "16 RETUERTA GALINDO": "MARRETUE",
  "24 ANABEL MIGUEL MANZANERA": "ANAMIGUE",
  "29 CARLA RODRIGUEZ DOMINGUEZ": "CARRODRI",
  "30 ANTONIO BLAZQUEZ MEJIAS": "ANTBLAZQ",
  "31 KEVIN LOPEZ RIOS": "KEVINR",
};

// Parsear fecha del formato "02/11/2022 Dim" a "2022-11-02"
function parseDate(dateStr) {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// Obtener día de la semana (0=domingo, 1=lunes, ..., 5=viernes)
function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay();
}

// Parsear tiempos del formato MARCATGES
// Extrae todos los tiempos válidos (HH:MM) ignorando NE:NE y NS:NS
function extractTimes(marcatgesStr) {
  if (!marcatgesStr) return [];
  const times = [];
  const matches = marcatgesStr.match(/\b\d{2}:\d{2}\b/g);
  if (matches) {
    for (const t of matches) {
      // Ignorar 00:00 que aparece a veces como placeholder
      if (t !== '00:00') {
        times.push(t);
      }
    }
  }
  return times.sort();
}

// Convertir tiempo HH:MM a minutos desde medianoche
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Convertir minutos a HH:MM
function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function getExistingUsers() {
  const usersSnap = await getDocs(collection(db, 'vacation_users'));
  const users = {};
  usersSnap.forEach(doc => {
    const data = doc.data();
    users[data.code] = { id: doc.id, ...data };
  });
  return users;
}

async function getExistingTimeclockRecords() {
  const recordsSnap = await getDocs(collection(db, 'vacation_timeclock'));
  const records = new Set();
  recordsSnap.forEach(doc => {
    const data = doc.data();
    records.add(`${data.userCode}-${data.date}`);
  });
  return records;
}

async function getExistingRequests() {
  const requestsSnap = await getDocs(collection(db, 'vacation_requests'));
  const requests = new Set();
  requestsSnap.forEach(doc => {
    const data = doc.data();
    // Para requests con fechas individuales
    if (data.dates) {
      for (const d of data.dates) {
        requests.add(`${data.userCode}-${d}-${data.type}`);
      }
    }
    // Para requests con rango
    if (data.startDate && data.endDate) {
      requests.add(`${data.userCode}-${data.startDate}-${data.endDate}-${data.type}`);
    }
  });
  return requests;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const limit = process.argv.find(a => a.startsWith('--limit='));
  const maxRecords = limit ? parseInt(limit.split('=')[1]) : Infinity;

  console.log("=== Importando histórico de fichajes ===\n");
  if (dryRun) console.log("🔍 MODO DRY-RUN - No se escribirán datos\n");

  // Leer Excel
  console.log("📄 Leyendo archivo Excel...");
  const csvData = execSync('npx xlsx-cli "history/Llistat_Marcatges (4).xlsx"', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024
  });

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    bom: true
  });

  console.log(`📊 Total registros en Excel: ${records.length}\n`);

  // Obtener datos existentes
  console.log("👥 Obteniendo usuarios de Firebase...");
  const existingUsers = await getExistingUsers();
  console.log(`   Usuarios encontrados: ${Object.keys(existingUsers).length}\n`);

  console.log("📋 Obteniendo registros existentes...");
  const existingTimeclock = await getExistingTimeclockRecords();
  const existingRequests = await getExistingRequests();
  console.log(`   Fichajes existentes: ${existingTimeclock.size}`);
  console.log(`   Solicitudes existentes: ${existingRequests.size}\n`);

  // FASE 1: Calcular medias de salida por usuario y día de la semana
  console.log("📊 Calculando medias de salida por usuario/día...");
  const endTimeStats = {}; // { userCode: { dayOfWeek: { total: X, count: Y } } }

  for (const record of records) {
    const operari = record.OPERARI || record['\ufeffOPERARI'];
    let userCode = null;
    for (const [key, code] of Object.entries(operarioToCode)) {
      if (operari?.startsWith(key)) {
        userCode = code;
        break;
      }
    }
    if (!userCode) continue;

    const date = parseDate(record.DATA);
    if (!date) continue;

    const dayOfWeek = getDayOfWeek(date);
    const times = extractTimes(record.MARCATGES);

    // Si tenemos al menos entrada y salida válidas
    if (times.length >= 2) {
      const endTime = times[times.length - 1];
      if (!endTimeStats[userCode]) endTimeStats[userCode] = {};
      if (!endTimeStats[userCode][dayOfWeek]) endTimeStats[userCode][dayOfWeek] = { total: 0, count: 0 };

      endTimeStats[userCode][dayOfWeek].total += timeToMinutes(endTime);
      endTimeStats[userCode][dayOfWeek].count += 1;
    }
  }

  // Calcular medias
  const avgEndTimes = {};
  for (const [userCode, days] of Object.entries(endTimeStats)) {
    avgEndTimes[userCode] = {};
    for (const [day, stats] of Object.entries(days)) {
      avgEndTimes[userCode][day] = Math.round(stats.total / stats.count);
    }
  }
  console.log("   Medias calculadas\n");

  // FASE 2: Procesar registros
  console.log("🔄 Procesando registros...\n");

  const stats = {
    total: 0,
    timeclock: { imported: 0, skipped: 0 },
    vacaciones: { imported: 0, skipped: 0 },
    enfermedad: { imported: 0, skipped: 0 },
    especiales: { imported: 0, skipped: 0 },
    noUser: 0,
    noDate: 0,
    usersMissing: new Set(),
  };

  const timeclockToImport = [];
  const requestsToImport = [];

  for (const record of records) {
    if (stats.total >= maxRecords) break;
    stats.total++;

    const operari = record.OPERARI || record['\ufeffOPERARI'];
    const data = record.DATA;
    const marcatges = record.MARCATGES;
    const vacances = record.VACANCES;
    const enfermetat = record.ENFERMETAT;
    const especials = record.ESPECIALS;

    // Buscar usuario
    let userCode = null;
    for (const [key, code] of Object.entries(operarioToCode)) {
      if (operari?.startsWith(key)) {
        userCode = code;
        break;
      }
    }

    if (!userCode || !existingUsers[userCode]) {
      stats.noUser++;
      if (operari) stats.usersMissing.add(operari);
      continue;
    }

    const date = parseDate(data);
    if (!date) {
      stats.noDate++;
      continue;
    }

    const dayOfWeek = getDayOfWeek(date);

    // CASO 1: VACANCES - Importar como vacation_request aprobada
    if (vacances && vacances.trim()) {
      const key = `${userCode}-${date}-vacation`;
      if (!existingRequests.has(key)) {
        requestsToImport.push({
          userCode,
          type: 'vacation',
          status: 'approved',
          isRange: false,
          dates: [date],
          comments: 'Importado desde histórico',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'IMPORT',
          approvedByName: 'Importación histórica',
          importedFrom: 'history'
        });
        stats.vacaciones.imported++;
      } else {
        stats.vacaciones.skipped++;
      }
      continue;
    }

    // CASO 2: ENFERMETAT - Importar como vacation_request tipo 'other' (día especial)
    if (enfermetat && enfermetat.trim()) {
      const key = `${userCode}-${date}-other`;
      if (!existingRequests.has(key)) {
        requestsToImport.push({
          userCode,
          type: 'other',
          status: 'approved',
          isRange: false,
          dates: [date],
          comments: 'Enfermedad - Importado desde histórico',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'IMPORT',
          approvedByName: 'Importación histórica',
          importedFrom: 'history'
        });
        stats.enfermedad.imported++;
      } else {
        stats.enfermedad.skipped++;
      }
      continue;
    }

    // CASO 3: ESPECIALS - Importar como vacation_request tipo 'other'
    if (especials && especials.trim()) {
      const key = `${userCode}-${date}-other`;
      if (!existingRequests.has(key)) {
        requestsToImport.push({
          userCode,
          type: 'other',
          status: 'approved',
          isRange: false,
          dates: [date],
          comments: 'Día especial - Importado desde histórico',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'IMPORT',
          approvedByName: 'Importación histórica',
          importedFrom: 'history'
        });
        stats.especiales.imported++;
      } else {
        stats.especiales.skipped++;
      }
      continue;
    }

    // CASO 4: Fichaje normal
    const times = extractTimes(marcatges);
    if (times.length === 0) {
      // Sin marcajes válidos (NE:NE NS:NS sin otros datos)
      continue;
    }

    const timeclockKey = `${userCode}-${date}`;
    if (existingTimeclock.has(timeclockKey)) {
      stats.timeclock.skipped++;
      continue;
    }

    const startTime = times[0];
    let endTime = times.length > 1 ? times[times.length - 1] : null;

    // Si no hay hora de salida, usar la media del usuario para ese día
    if (!endTime && avgEndTimes[userCode]?.[dayOfWeek]) {
      endTime = minutesToTime(avgEndTimes[userCode][dayOfWeek]);
    }

    // Parsear pausas intermedias (si hay más de 2 tiempos)
    const breaks = [];
    if (times.length > 2) {
      for (let i = 1; i < times.length - 1; i += 2) {
        if (i + 1 < times.length - 1) {
          breaks.push({
            type: 'pausa',
            startTime: times[i],
            endTime: times[i + 1]
          });
        }
      }
    }

    timeclockToImport.push({
      userCode,
      date,
      startTime,
      endTime,
      breaks,
      createdAt: new Date().toISOString(),
      importedFrom: 'history'
    });
    stats.timeclock.imported++;

    if ((stats.timeclock.imported + stats.vacaciones.imported + stats.enfermedad.imported + stats.especiales.imported) % 500 === 0) {
      console.log(`   Procesados: ${stats.total}...`);
    }
  }

  // FASE 3: Escribir a Firebase
  if (!dryRun) {
    console.log("\n💾 Escribiendo a Firebase...");

    console.log(`   Importando ${timeclockToImport.length} fichajes...`);
    for (const record of timeclockToImport) {
      await addDoc(collection(db, 'vacation_timeclock'), record);
    }

    console.log(`   Importando ${requestsToImport.length} solicitudes...`);
    for (const request of requestsToImport) {
      await addDoc(collection(db, 'vacation_requests'), request);
    }
  }

  // Resumen
  console.log("\n=== RESUMEN ===");
  console.log(`Total procesados: ${stats.total}`);
  console.log(`\n📅 Fichajes:`);
  console.log(`   ✅ Importados: ${stats.timeclock.imported}`);
  console.log(`   ⏭️ Duplicados: ${stats.timeclock.skipped}`);
  console.log(`\n🏖️ Vacaciones:`);
  console.log(`   ✅ Importadas: ${stats.vacaciones.imported}`);
  console.log(`   ⏭️ Duplicadas: ${stats.vacaciones.skipped}`);
  console.log(`\n🏥 Enfermedad:`);
  console.log(`   ✅ Importadas: ${stats.enfermedad.imported}`);
  console.log(`   ⏭️ Duplicadas: ${stats.enfermedad.skipped}`);
  console.log(`\n⭐ Días especiales:`);
  console.log(`   ✅ Importados: ${stats.especiales.imported}`);
  console.log(`   ⏭️ Duplicados: ${stats.especiales.skipped}`);
  console.log(`\n⚠️ Sin usuario: ${stats.noUser}`);
  console.log(`⚠️ Fecha inválida: ${stats.noDate}`);

  if (stats.usersMissing.size > 0) {
    console.log("\n⚠️ Operarios no encontrados:");
    for (const op of stats.usersMissing) {
      console.log(`   - ${op}`);
    }
  }

  if (dryRun) {
    console.log("\n🔍 Ejecuta sin --dry-run para importar los datos");
  } else {
    console.log("\n✅ Importación completada");
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
