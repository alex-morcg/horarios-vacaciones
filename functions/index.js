const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const twilio = require("twilio");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10, region: "europe-west1" });

// Twilio config
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const twilioWhatsApp = `whatsapp:${process.env.TWILIO_WHATSAPP}`;

// Admin phone number - cambia esto por tu número
const ADMIN_PHONE = "whatsapp:+34615412222"; // Tu número de WhatsApp

// URL de la app
const APP_URL = "https://horarios-vacaciones.vercel.app";

// Obtener fechas de una solicitud
const getRequestDates = (request) => {
  if (request.isRange) {
    const dates = [];
    let cur = new Date(request.startDate);
    const end = new Date(request.endDate);
    while (cur <= end) {
      const dateStr = cur.toISOString().split("T")[0];
      // Excluir fines de semana
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(dateStr);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  return request.dates || [];
};

// Buscar conflictos con otros usuarios del mismo departamento
const findConflicts = async (request, userCode) => {
  try {
    // Obtener usuario y sus departamentos
    const userSnapshot = await db.collection("vacation_users").where("code", "==", userCode).get();
    if (userSnapshot.empty) return [];

    const user = userSnapshot.docs[0].data();
    const userDepts = user.departments || [];
    if (userDepts.length === 0) return [];

    // Obtener fechas de la solicitud
    const requestDates = getRequestDates(request);
    if (requestDates.length === 0) return [];

    // Buscar otras solicitudes aprobadas o pendientes
    const requestsSnapshot = await db.collection("vacation_requests")
      .where("status", "in", ["approved", "pending"])
      .get();

    const conflicts = [];

    for (const doc of requestsSnapshot.docs) {
      const otherReq = doc.data();
      if (otherReq.userCode === userCode) continue;

      // Verificar si el usuario está en alguno de los mismos departamentos
      const otherUserSnapshot = await db.collection("vacation_users").where("code", "==", otherReq.userCode).get();
      if (otherUserSnapshot.empty) continue;

      const otherUser = otherUserSnapshot.docs[0].data();
      const otherDepts = otherUser.departments || [];
      const sharedDepts = userDepts.filter(d => otherDepts.includes(d));

      if (sharedDepts.length === 0) continue;

      // Verificar solapamiento de fechas
      const otherDates = getRequestDates(otherReq);
      const overlapping = requestDates.filter(d => otherDates.includes(d));

      if (overlapping.length > 0) {
        conflicts.push({
          userName: `${otherUser.name} ${otherUser.lastName || ""}`.trim(),
          userCode: otherReq.userCode,
          dates: overlapping,
          status: otherReq.status,
          sharedDepts
        });
      }
    }

    return conflicts;
  } catch (error) {
    logger.error("Error buscando conflictos:", error);
    return [];
  }
};

// Enviar mensaje de WhatsApp
const sendWhatsApp = async (to, message) => {
  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioWhatsApp,
      to: to,
    });
    logger.info(`WhatsApp enviado a ${to}`);
    return true;
  } catch (error) {
    logger.error("Error enviando WhatsApp:", error);
    return false;
  }
};

// Cuando se crea una nueva solicitud de vacaciones -> avisar al admin
exports.onVacationRequestCreated = onDocumentCreated(
  "vacation_requests/{requestId}",
  async (event) => {
    const data = event.data.data();
    const requestId = event.params.requestId;

    if (data.status !== "pending") return;

    // Buscar conflictos
    const conflicts = await findConflicts(data, data.userCode);

    // Construir mensaje
    let message = `📋 Nueva solicitud de vacaciones\n\n`;
    message += `👤 Usuario: ${data.userCode}\n`;
    message += `📅 Fechas: ${data.isRange ? `${data.startDate} al ${data.endDate}` : data.dates?.join(", ")}\n`;

    if (data.comments) {
      message += `💬 Comentarios: ${data.comments}\n`;
    }

    // Añadir conflictos si los hay
    if (conflicts.length > 0) {
      message += `\n⚠️ CONFLICTOS DETECTADOS:\n`;
      conflicts.forEach(c => {
        message += `• ${c.userName} (${c.sharedDepts.join(", ")}) - ${c.status === "approved" ? "✅" : "⏳"} ${c.dates.length} día(s)\n`;
      });
    }

    // Añadir link
    message += `\n🔗 Ver solicitud: ${APP_URL}`;

    await sendWhatsApp(ADMIN_PHONE, message);
  }
);

// Cuando se actualiza una solicitud (aprobada/denegada) -> avisar al empleado
exports.onVacationRequestUpdated = onDocumentUpdated(
  "vacation_requests/{requestId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Solo si cambió el status de pending a approved/denied
    if (before.status === "pending" && (after.status === "approved" || after.status === "denied")) {
      const statusText = after.status === "approved" ? "✅ APROBADA" : "❌ DENEGADA";
      const message = `${statusText}\n\nTu solicitud de vacaciones ha sido ${after.status === "approved" ? "aprobada" : "denegada"}.\n\nFechas: ${after.isRange ? `${after.startDate} al ${after.endDate}` : after.dates?.join(", ")}`;

      // Buscar el teléfono del usuario
      const usersSnapshot = await db.collection("vacation_users").where("code", "==", after.userCode).get();

      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        if (userData.phone && userData.whatsappNotifications) {
          // Enviar al usuario
          await sendWhatsApp(`whatsapp:${userData.phone}`, message);
        } else {
          logger.info(`Usuario ${after.userCode} no tiene WhatsApp configurado o notificaciones desactivadas`);
        }
      }

      // También avisar al admin
      await sendWhatsApp(ADMIN_PHONE, `[Admin] Solicitud de ${after.userCode} ${after.status === "approved" ? "aprobada" : "denegada"}`);
    }
  }
);

// Endpoint de prueba
exports.testWhatsApp = onRequest(async (req, res) => {
  const result = await sendWhatsApp(ADMIN_PHONE, "🧪 Prueba de WhatsApp desde la app de vacaciones!");
  res.json({ success: result });
});
