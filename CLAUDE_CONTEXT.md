# Contexto del Proyecto - Vacation Manager App

## Stack Tecnológico
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Firebase Firestore (base de datos)
- **Functions**: Firebase Functions v2 (Node.js 24, región europe-west1)
- **Hosting**: Vercel (deploy automático desde GitHub)
- **Notificaciones**: Twilio WhatsApp (sandbox mode)

## Repositorio
- **GitHub**: https://github.com/alex-morcg/horarios-vacaciones.git
- **Rama principal**: main
- **Deploy**: Push a main → Vercel despliega automáticamente

## Firebase
- **Proyecto**: patrick-masajes
- **Colecciones Firestore**:
  - `vacation_users` - usuarios (code, name, lastName, phone, whatsappNotifications, departments, totalDays, carryOverDays, isAdmin)
  - `vacation_requests` - solicitudes de vacaciones (userCode, status, type, isRange, startDate, endDate, dates, comments, createdAt)
  - `vacation_holidays` - festivos/días especiales (date, name, emoji, isLocal, isClosure, isTurno)
  - `vacation_departments` - departamentos (name, color)

## Twilio WhatsApp
- **Credenciales**: en `functions/.env` (NO commitear)
- **Admin phone**: +34615412222
- **Sandbox**: Los usuarios deben unirse enviando "join [código]" al número de Twilio

## Firebase Functions
- `onVacationRequestCreated` - avisa al admin cuando se crea solicitud
- `onVacationRequestUpdated` - avisa al usuario cuando se aprueba/deniega
- `testWhatsApp` - endpoint de prueba: https://testwhatsapp-m7gzql3xia-ew.a.run.app

## Lógica de Vacaciones
- **Días que descuentan del saldo**:
  - Vacaciones propias del usuario
  - Días de cierre de empresa (isClosure) - descuentan a TODOS
  - Días de turno (isTurno) - descuentan a TODOS
- **Días que NO descuentan**:
  - Festivos locales (isLocal) - son festivos, no se trabaja
  - Días tipo "other" (días especiales médicos, etc.)

## Archivos Principales
- `src/App.jsx` - toda la aplicación React (componentes inline)
- `functions/index.js` - Firebase Functions para WhatsApp
- `functions/.env` - credenciales Twilio (gitignored)

## Comandos Útiles
```bash
# Deploy frontend (automático con push)
git add . && git commit -m "mensaje" && git push

# Deploy Firebase Functions
firebase deploy --only functions --project patrick-masajes

# Test local
npm run dev
```

## Notas Importantes
- El usuario ADMIN no tiene saldo de vacaciones (es solo para gestión)
- Los usuarios no-admin pueden configurar WhatsApp en "Mis Solicitudes"
- Validación de teléfono: formato internacional +34612345678

## WhatsApp Templates (pendientes de aprobación Meta)
- `vacation_request_new` - Para notificar al admin de nueva solicitud (con conflictos y link)
- `vacation_request_status` - Para notificar al empleado de aprobación/denegación
- Una vez aprobados, añadir los Content SID al código en functions/index.js
- Sin templates, solo funciona si el usuario escribe primero al +15558262786 (ventana 24h)
