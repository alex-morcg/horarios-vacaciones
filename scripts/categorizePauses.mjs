import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase.mjs";

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log("=== Categorizando pausas históricas ===\n");
  if (dryRun) console.log("🔍 MODO DRY-RUN - No se escribirán datos\n");

  // Obtener todos los registros de fichaje
  console.log("📋 Obteniendo registros de fichaje...");
  const recordsSnap = await getDocs(collection(db, 'vacation_timeclock'));

  const stats = {
    total: 0,
    withPauses: 0,
    updated: 0,
    alreadyCategorized: 0,
  };

  const recordsToUpdate = [];

  recordsSnap.forEach(docSnap => {
    const data = docSnap.data();
    stats.total++;

    if (!data.breaks || data.breaks.length === 0) return;

    stats.withPauses++;

    // Verificar si ya están categorizadas
    const hasUncategorized = data.breaks.some(b => b.type === 'pausa');
    if (!hasUncategorized) {
      stats.alreadyCategorized++;
      return;
    }

    // Categorizar pausas
    const uncategorizedPauses = data.breaks.filter(b => b.type === 'pausa');

    const newBreaks = data.breaks.map((brk, index) => {
      if (brk.type !== 'pausa') return brk;

      if (uncategorizedPauses.length >= 2) {
        // Si hay 2+ pausas: primera = desayuno, resto = comida
        return {
          ...brk,
          type: index === 0 ? 'desayuno' : 'comida'
        };
      } else {
        // Si hay 1 pausa: antes de 13:30 = desayuno, después = comida
        const [hours, mins] = (brk.startTime || '00:00').split(':').map(Number);
        const startMinutes = hours * 60 + mins;
        const threshold = 13 * 60 + 30; // 13:30

        return {
          ...brk,
          type: startMinutes < threshold ? 'desayuno' : 'comida'
        };
      }
    });

    recordsToUpdate.push({
      id: docSnap.id,
      breaks: newBreaks,
      original: data.breaks
    });
  });

  console.log(`   Total registros: ${stats.total}`);
  console.log(`   Con pausas: ${stats.withPauses}`);
  console.log(`   Ya categorizados: ${stats.alreadyCategorized}`);
  console.log(`   A actualizar: ${recordsToUpdate.length}\n`);

  if (recordsToUpdate.length > 0) {
    console.log("📝 Ejemplos de cambios:");
    recordsToUpdate.slice(0, 3).forEach(r => {
      console.log(`   ${r.id}:`);
      console.log(`     Antes: ${JSON.stringify(r.original)}`);
      console.log(`     Después: ${JSON.stringify(r.breaks)}`);
    });
    console.log();
  }

  if (!dryRun && recordsToUpdate.length > 0) {
    console.log("💾 Actualizando registros...");
    let updated = 0;
    for (const record of recordsToUpdate) {
      await updateDoc(doc(db, 'vacation_timeclock', record.id), {
        breaks: record.breaks
      });
      updated++;
      if (updated % 100 === 0) {
        console.log(`   Actualizados: ${updated}...`);
      }
    }
    stats.updated = updated;
    console.log(`\n✅ ${stats.updated} registros actualizados`);
  } else if (dryRun) {
    console.log("🔍 Ejecuta sin --dry-run para aplicar los cambios");
  } else {
    console.log("✅ No hay registros para actualizar");
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
