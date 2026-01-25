import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Settings, LogOut, Plus, Check, X, Trash2, Eye, ChevronLeft, ChevronRight, Wifi, WifiOff, MessageSquare, Clock, Play, Pause, Coffee, UtensilsCrossed, Square, MapPin, Edit2, Save } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const VacationManager = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginCode, setLoginCode] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [notification, setNotification] = useState(null);
  const [viewingUserHistory, setViewingUserHistory] = useState(null);
  const [timeclockRecords, setTimeclockRecords] = useState([]);
  const [timeclockSettings, setTimeclockSettings] = useState(null);

  const defaultHolidays = [
    // 2025
    { date: '2025-01-01', name: 'Año Nuevo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-01-06', name: 'Reyes', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-04-18', name: 'Viernes Santo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-04-21', name: 'Lunes de Pascua', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-05-01', name: 'Fiesta del Trabajo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-06-24', name: 'San Juan', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-08-15', name: 'Asunción', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-09-11', name: 'Diada de Cataluña', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-09-24', name: 'La Mercè', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-10-12', name: 'Fiesta Nacional', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-11-01', name: 'Todos los Santos', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-12-06', name: 'Constitución', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-12-08', name: 'Inmaculada', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-12-25', name: 'Navidad', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2025-12-26', name: 'San Esteban', isLocal: true, holidayType: 'local', emoji: '📅' },
    // 2026
    { date: '2026-01-01', name: 'Año Nuevo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-01-06', name: 'Reyes', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-04-03', name: 'Viernes Santo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-04-06', name: 'Lunes de Pascua', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-05-01', name: 'Fiesta del Trabajo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-06-24', name: 'San Juan', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-08-15', name: 'Asunción', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-09-11', name: 'Diada de Cataluña', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-09-24', name: 'La Mercè', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-10-12', name: 'Fiesta Nacional', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-11-01', name: 'Todos los Santos', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-12-06', name: 'Constitución', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-12-08', name: 'Inmaculada', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-12-25', name: 'Navidad', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2026-12-26', name: 'San Esteban', isLocal: true, holidayType: 'local', emoji: '📅' },
    // 2027
    { date: '2027-01-01', name: 'Año Nuevo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-01-06', name: 'Reyes', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-03-26', name: 'Viernes Santo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-03-29', name: 'Lunes de Pascua', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-05-01', name: 'Fiesta del Trabajo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-06-24', name: 'San Juan', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-08-15', name: 'Asunción', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-09-11', name: 'Diada de Cataluña', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-09-24', name: 'La Mercè', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-10-12', name: 'Fiesta Nacional', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-11-01', name: 'Todos los Santos', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-12-06', name: 'Constitución', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-12-08', name: 'Inmaculada', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-12-25', name: 'Navidad', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2027-12-26', name: 'San Esteban', isLocal: true, holidayType: 'local', emoji: '📅' },
    // 2028
    { date: '2028-01-01', name: 'Año Nuevo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-01-06', name: 'Reyes', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-04-14', name: 'Viernes Santo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-04-17', name: 'Lunes de Pascua', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-05-01', name: 'Fiesta del Trabajo', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-06-24', name: 'San Juan', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-08-15', name: 'Asunción', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-09-11', name: 'Diada de Cataluña', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-09-24', name: 'La Mercè', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-10-12', name: 'Fiesta Nacional', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-11-01', name: 'Todos los Santos', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-12-06', name: 'Constitución', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-12-08', name: 'Inmaculada', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-12-25', name: 'Navidad', isLocal: true, holidayType: 'local', emoji: '📅' },
    { date: '2028-12-26', name: 'San Esteban', isLocal: true, holidayType: 'local', emoji: '📅' },
  ];

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'vacation_users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setConnected(true);
    }, () => setConnected(false));

    const unsubRequests = onSnapshot(collection(db, 'vacation_requests'), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubHolidays = onSnapshot(collection(db, 'vacation_holidays'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        defaultHolidays.forEach(h => addDoc(collection(db, 'vacation_holidays'), h));
        setCompanyHolidays(defaultHolidays);
      } else {
        setCompanyHolidays(data);
      }
    });

    const unsubDepts = onSnapshot(collection(db, 'vacation_departments'), (snap) => {
      setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubFeedbacks = onSnapshot(collection(db, 'vacation_feedbacks'), (snap) => {
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTimeclock = onSnapshot(collection(db, 'vacation_timeclock'), (snap) => {
      setTimeclockRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTimeclockSettings = onSnapshot(collection(db, 'vacation_timeclock_settings'), (snap) => {
      const settings = snap.docs.map(d => ({ id: d.id, ...d.data() }))[0];
      setTimeclockSettings(settings || null);
    });

    return () => { unsubUsers(); unsubRequests(); unsubHolidays(); unsubDepts(); unsubFeedbacks(); unsubTimeclock(); unsubTimeclockSettings(); };
  }, []);

  const getUserDepartments = (user) => user?.departments || [];
  const showNotification = (type, message) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 3000); };
  const handleLogout = () => { setCurrentUser(null); setLoginCode(''); setActiveTab('calendar'); };
  const isWeekend = (date) => { const d = new Date(date).getDay(); return d === 0 || d === 6; };
  const isHoliday = (date) => companyHolidays.some(h => h.date === date && h.isLocal === true);

  const handleLogin = () => {
    const user = users.find(u => u.code === loginCode);
    if (user) setCurrentUser(user);
    else if (loginCode === 'ADMIN') setCurrentUser({ code: 'ADMIN', isAdmin: true, name: 'Administrador', lastName: '', departments: [] });
    else showNotification('error', 'Código incorrecto');
  };

  const getBusinessDays = (startDate, endDate) => {
    let count = 0, cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      if (!isWeekend(dateStr) && !isHoliday(dateStr)) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const calculateUserDays = (userCode) => {
    const user = users.find(u => u.code === userCode);
    if (!user) return { total: 0, used: 0, pending: 0, waiting: 0, available: 0, carryOver: 0, usedOwn: 0, usedClosure: 0, usedTurno: 0, usedOther: 0 };

    const approved = requests.filter(r => r.userCode === userCode && r.status === 'approved' && r.type === 'vacation');
    const approvedOther = requests.filter(r => r.userCode === userCode && r.status === 'approved' && r.type === 'other');
    const pending = requests.filter(r => r.userCode === userCode && r.status === 'pending' && r.type === 'vacation');

    // All holiday types that deduct from vacation balance
    const localHolidays = companyHolidays.filter(h => h.isLocal === true || h.holidayType === 'local');
    const closureDays = companyHolidays.filter(h => h.isLocal === false && h.holidayType === 'closure');
    const turnoDays = companyHolidays.filter(h => h.holidayType === 'turno');

    // Count days from user's own vacation requests
    let usedOwn = 0, usedTurno = 0, usedOther = 0, waiting = 0;

    // Helper to get dates from a request (excluding weekends only - holidays count as used days)
    const getRequestDates = (r) => {
      if (r.isRange) {
        const dates = [];
        let cur = new Date(r.startDate);
        const end = new Date(r.endDate);
        while (cur <= end) {
          const dateStr = cur.toISOString().split('T')[0];
          if (!isWeekend(dateStr)) dates.push(dateStr);
          cur.setDate(cur.getDate() + 1);
        }
        return dates;
      }
      return r.dates?.filter(d => !isWeekend(d)) || [];
    };

    approved.forEach(r => {
      const dates = getRequestDates(r);
      dates.forEach(d => {
        // Don't count if it's a local holiday or closure day (already counted globally)
        if (localHolidays.some(h => h.date === d) || closureDays.some(h => h.date === d)) {
          // Skip - this day is already counted in usedClosure
        } else if (turnoDays.some(t => t.date === d)) {
          usedTurno++;
        } else {
          usedOwn++;
        }
      });
    });

    // Count special days (type: 'other')
    approvedOther.forEach(r => {
      const dates = getRequestDates(r);
      usedOther += dates.length;
    });

    pending.forEach(r => {
      const dates = getRequestDates(r);
      dates.forEach(d => {
        if (!localHolidays.some(h => h.date === d) && !closureDays.some(h => h.date === d)) {
          waiting++;
        }
      });
    });

    // Count closure days (local holidays + closure days - deducted from everyone's balance)
    const today = new Date();
    const currentYear = today.getFullYear();
    const usedClosure = [...localHolidays, ...closureDays].filter(h => {
      const hDate = new Date(h.date);
      return hDate.getFullYear() === currentYear && !isWeekend(h.date);
    }).length;

    const used = usedOwn + usedClosure + usedTurno;
    const total = user.totalDays || 0, carryOver = user.carryOverDays || 0;
    return { total, used, pending: total + carryOver - used, waiting, available: total + carryOver - used - waiting, carryOver, usedOwn, usedClosure, usedTurno, usedOther };
  };

  // Firebase CRUD
  const addUser = async (u) => { await addDoc(collection(db, 'vacation_users'), u); showNotification('success', 'Usuario creado'); };
  const updateUser = async (id, u) => { await updateDoc(doc(db, 'vacation_users', id), u); showNotification('success', 'Usuario actualizado'); };
  const deleteUser = async (id) => { await deleteDoc(doc(db, 'vacation_users', id)); showNotification('success', 'Usuario eliminado'); };
  const addRequest = async (r) => { await addDoc(collection(db, 'vacation_requests'), r); showNotification('success', 'Solicitud enviada'); };
  const updateRequest = async (id, r) => { await updateDoc(doc(db, 'vacation_requests', id), r); };
  const deleteRequest = async (id) => { await deleteDoc(doc(db, 'vacation_requests', id)); showNotification('success', 'Solicitud cancelada'); };
  const addHoliday = async (h) => { await addDoc(collection(db, 'vacation_holidays'), { ...h, isLocal: h.holidayType === 'local', holidayType: h.holidayType || 'closure', emoji: h.emoji }); showNotification('success', 'Festivo añadido'); };
  const updateHoliday = async (id, h) => { await updateDoc(doc(db, 'vacation_holidays', id), { ...h, isLocal: h.holidayType === 'local', holidayType: h.holidayType || 'closure', emoji: h.emoji }); showNotification('success', 'Festivo actualizado'); };
  const deleteHoliday = async (id) => { await deleteDoc(doc(db, 'vacation_holidays', id)); showNotification('success', 'Festivo eliminado'); };
  const addDepartment = async (d) => { await addDoc(collection(db, 'vacation_departments'), d); showNotification('success', 'Departamento creado'); };
  const updateDepartment = async (id, d) => { await updateDoc(doc(db, 'vacation_departments', id), d); showNotification('success', 'Departamento actualizado'); };
  const deleteDepartment = async (id) => { await deleteDoc(doc(db, 'vacation_departments', id)); showNotification('success', 'Departamento eliminado'); };
  const addFeedback = async (f) => { await addDoc(collection(db, 'vacation_feedbacks'), f); showNotification('success', 'Feedback añadido'); };
  const updateFeedback = async (id, f) => { await updateDoc(doc(db, 'vacation_feedbacks', id), f); };
  const deleteFeedback = async (id) => { await deleteDoc(doc(db, 'vacation_feedbacks', id)); showNotification('success', 'Feedback eliminado'); };
  const addTimeclockRecord = async (r) => { await addDoc(collection(db, 'vacation_timeclock'), r); };
  const updateTimeclockRecord = async (id, r) => { await updateDoc(doc(db, 'vacation_timeclock', id), r); };
  const deleteTimeclockRecord = async (id) => { await deleteDoc(doc(db, 'vacation_timeclock', id)); showNotification('success', 'Registro eliminado'); };
  const saveTimeclockSettings = async (s) => {
    if (timeclockSettings?.id) {
      await updateDoc(doc(db, 'vacation_timeclock_settings', timeclockSettings.id), s);
    } else {
      await addDoc(collection(db, 'vacation_timeclock_settings'), s);
    }
    showNotification('success', 'Configuración guardada');
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><Calendar className="w-16 h-16 text-indigo-600 animate-pulse" /></div>;

  if (!currentUser) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {notification && <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white z-50`}>{notification.message}</div>}
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Sistema de Vacaciones <span className="text-indigo-400 text-lg font-normal">(v1.19)</span></h1>
          <p className="text-gray-600 mt-2">Introduce tu código de empleado</p>
          <div className="flex items-center justify-center mt-2 text-sm">
            {connected ? <span className="flex items-center text-green-600"><Wifi className="w-4 h-4 mr-1" /> Conectado</span> : <span className="flex items-center text-red-600"><WifiOff className="w-4 h-4 mr-1" /> Sin conexión</span>}
          </div>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Código de empleado" className="w-full px-4 py-3 border rounded-lg" value={loginCode} onChange={(e) => setLoginCode(e.target.value.toUpperCase())} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold">Acceder</button>
          <p className="text-sm text-gray-500 text-center">Código admin: ADMIN</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white z-50`}>{notification.message}</div>}
      <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`p-2 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-indigo-500' : 'hover:bg-indigo-500'}`}
              title="Calendario"
            >
              <Calendar className="w-8 h-8" />
            </button>
            <button
              onClick={() => setActiveTab('timeclock')}
              className={`p-2 rounded-lg transition-colors ${activeTab === 'timeclock' ? 'bg-indigo-500' : 'hover:bg-indigo-500'}`}
              title="Fichajes"
            >
              <Clock className="w-8 h-8" />
            </button>
            <div><h1 className="text-xl font-bold">Gestión de Vacaciones <span className="text-indigo-300 text-sm font-normal">(v1.19)</span></h1><p className="text-indigo-200 text-sm">{currentUser.name} {currentUser.lastName}</p></div>
          </div>
          <div className="flex items-center space-x-3">
            {connected ? <Wifi className="w-5 h-5 text-green-300" /> : <WifiOff className="w-5 h-5 text-red-300" />}
            <button onClick={handleLogout} className="flex items-center space-x-2 bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-800"><LogOut className="w-4 h-4" /><span>Salir</span></button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b overflow-x-auto sticky top-[72px] z-30 bg-white">
            {activeTab !== 'timeclock' && <TabButton icon={Calendar} label="Calendario" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />}
            {currentUser.isAdmin && activeTab !== 'timeclock' && <>
              <TabButton icon={Users} label="Usuarios" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
              <TabButton icon={FileText} label="Aprobar" active={activeTab === 'approve'} onClick={() => setActiveTab('approve')} />
              <TabButton icon={Settings} label="Festivos" active={activeTab === 'holidays'} onClick={() => setActiveTab('holidays')} />
              <TabButton icon={Users} label="Departamentos" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
            </>}
            {activeTab !== 'timeclock' && <TabButton icon={FileText} label="Mis Solicitudes" active={activeTab === 'myRequests'} onClick={() => setActiveTab('myRequests')} />}
            {currentUser.isAdmin && activeTab !== 'timeclock' && <TabButton icon={MessageSquare} label="Feedback" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />}
          </div>
          <div className="p-6">
            {activeTab === 'calendar' && <CalendarView view={calendarView} setView={setCalendarView} currentDate={currentDate} setCurrentDate={setCurrentDate} requests={requests} users={users} holidays={companyHolidays} filterDepartment={filterDepartment} setFilterDepartment={setFilterDepartment} filterUser={filterUser} setFilterUser={setFilterUser} departments={departments} getUserDepartments={getUserDepartments} />}
            {activeTab === 'users' && currentUser.isAdmin && <UsersManagement users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} showNotification={showNotification} calculateUserDays={calculateUserDays} requests={requests} viewingUserHistory={viewingUserHistory} setViewingUserHistory={setViewingUserHistory} departments={departments} getUserDepartments={getUserDepartments} />}
            {activeTab === 'approve' && currentUser.isAdmin && <ApproveRequests requests={requests} updateRequest={updateRequest} deleteRequest={deleteRequest} users={users} calculateUserDays={calculateUserDays} getBusinessDays={getBusinessDays} currentUser={currentUser} getUserDepartments={getUserDepartments} showNotification={showNotification} isWeekend={isWeekend} isHoliday={isHoliday} />}
            {activeTab === 'holidays' && currentUser.isAdmin && <HolidaysManagement holidays={companyHolidays} addHoliday={addHoliday} updateHoliday={updateHoliday} deleteHoliday={deleteHoliday} showNotification={showNotification} />}
            {activeTab === 'departments' && currentUser.isAdmin && <DepartmentsManagement departments={departments} addDepartment={addDepartment} updateDepartment={updateDepartment} deleteDepartment={deleteDepartment} showNotification={showNotification} users={users} getUserDepartments={getUserDepartments} />}
            {activeTab === 'myRequests' && <MyRequests currentUser={currentUser} requests={requests} addRequest={addRequest} deleteRequest={deleteRequest} calculateUserDays={calculateUserDays} isWeekend={isWeekend} isHoliday={isHoliday} getBusinessDays={getBusinessDays} showNotification={showNotification} users={users} departments={departments} getUserDepartments={getUserDepartments} updateUser={updateUser} />}
            {activeTab === 'feedback' && currentUser.isAdmin && <FeedbackManagement feedbacks={feedbacks} addFeedback={addFeedback} updateFeedback={updateFeedback} deleteFeedback={deleteFeedback} currentUser={currentUser} showNotification={showNotification} />}
            {activeTab === 'timeclock' && <TimeclockView currentUser={currentUser} timeclockRecords={timeclockRecords} addTimeclockRecord={addTimeclockRecord} updateTimeclockRecord={updateTimeclockRecord} deleteTimeclockRecord={deleteTimeclockRecord} timeclockSettings={timeclockSettings} saveTimeclockSettings={saveTimeclockSettings} users={users} showNotification={showNotification} requests={requests} holidays={companyHolidays} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-2 px-6 py-4 font-medium whitespace-nowrap ${active ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600'}`}>
    <Icon className="w-5 h-5" /><span>{label}</span>
  </button>
);

const colorMap = {
  'bg-blue-100 text-blue-800': { bg: 'bg-blue-200', text: 'text-blue-900' },
  'bg-purple-100 text-purple-800': { bg: 'bg-purple-200', text: 'text-purple-900' },
  'bg-green-100 text-green-800': { bg: 'bg-green-200', text: 'text-green-900' },
  'bg-yellow-100 text-yellow-800': { bg: 'bg-yellow-200', text: 'text-yellow-900' },
  'bg-orange-100 text-orange-800': { bg: 'bg-orange-200', text: 'text-orange-900' },
  'bg-red-100 text-red-800': { bg: 'bg-red-200', text: 'text-red-900' },
  'bg-gray-100 text-gray-800': { bg: 'bg-gray-200', text: 'text-gray-900' },
  'bg-pink-100 text-pink-800': { bg: 'bg-pink-200', text: 'text-pink-900' },
  'bg-teal-100 text-teal-800': { bg: 'bg-teal-200', text: 'text-teal-900' },
  'bg-indigo-100 text-indigo-800': { bg: 'bg-indigo-200', text: 'text-indigo-900' },
};

const getDeptColorInfo = (deptName, departments) => {
  const dept = departments.find(d => d.name === deptName);
  return dept ? colorMap[dept.color] || colorMap['bg-gray-100 text-gray-800'] : colorMap['bg-gray-100 text-gray-800'];
};

const RequestBadge = ({ req, user, departments, getUserDepartments, isTurnoDay = false }) => {
  const userDepts = getUserDepartments(user);
  const getEmoji = () => {
    if (req.type === 'other') return '⚠️';
    if (isTurnoDay && req.status === 'approved') return '🔄';
    return req.status === 'approved' ? '✅' : req.status === 'pending' ? '⏳' : '❌';
  };
  const emoji = getEmoji();
  if (userDepts.length <= 1) {
    const color = userDepts.length === 1 ? getDeptColorInfo(userDepts[0], departments) : { bg: 'bg-gray-200', text: 'text-gray-900' };
    return <div className={`text-xs px-1 py-0.5 rounded truncate flex items-center gap-1 ${color.bg} ${color.text}`} title={`${user?.name} ${user?.lastName}${req.type === 'other' ? ' (Día especial)' : ''}`}><span>{emoji}</span><span className="truncate">{user?.name}</span></div>;
  }
  const colors = userDepts.slice(0, 3).map(d => getDeptColorInfo(d, departments));
  const w = 100 / colors.length;
  return (
    <div className="text-xs rounded overflow-hidden relative" style={{ minHeight: '22px' }} title={`${user?.name} - ${userDepts.join(', ')}${req.type === 'other' ? ' (Día especial)' : ''}`}>
      <div className="absolute inset-0 flex">{colors.map((c, i) => <div key={i} className={c.bg} style={{ width: `${w}%`, borderRight: i < colors.length - 1 ? '1px solid #666' : 'none' }} />)}</div>
      <div className="relative px-1 py-0.5 flex items-center gap-1 text-gray-900"><span>{emoji}</span><span className="truncate">{user?.name}</span></div>
    </div>
  );
};

const CalendarView = ({ view, setView, currentDate, setCurrentDate, requests, users, holidays, filterDepartment, setFilterDepartment, filterUser, setFilterUser, departments, getUserDepartments }) => {
  const deptNames = departments.map(d => d.name);
  const filteredRequests = requests.filter(r => {
    if (r.status !== 'approved' && r.status !== 'pending') return false;
    if (filterDepartment !== 'all') { const u = users.find(x => x.code === r.userCode); if (!getUserDepartments(u).includes(filterDepartment)) return false; }
    if (filterUser !== 'all' && r.userCode !== filterUser) return false;
    return true;
  });
  const filteredUsers = filterDepartment === 'all' ? users : users.filter(u => getUserDepartments(u).includes(filterDepartment));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex space-x-2">
          <button onClick={() => setView('week')} className={`px-4 py-2 rounded ${view === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Semana</button>
          <button onClick={() => setView('month')} className={`px-4 py-2 rounded ${view === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Mes</button>
          <button onClick={() => setView('year')} className={`px-4 py-2 rounded ${view === 'year' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Año</button>
        </div>
        <div className="flex space-x-2 flex-wrap gap-2">
          <select value={filterDepartment} onChange={(e) => { setFilterDepartment(e.target.value); setFilterUser('all'); }} className="px-3 py-2 border rounded">
            <option value="all">Todos los departamentos</option>
            {deptNames.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-3 py-2 border rounded">
            <option value="all">Todos</option>
            {filteredUsers.map(u => <option key={u.code} value={u.code}>{u.name} {u.lastName}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-3 rounded-lg"><span className="font-medium">Leyenda:</span><span>✅ Aprobado</span><span>🔄 Turno</span><span>⏳ Pendiente</span><span>❌ Denegado</span><span>⚠️ Día especial</span></div>
      {view === 'month' && <MonthCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} requests={filteredRequests} users={users} holidays={holidays} departments={departments} getUserDepartments={getUserDepartments} />}
      {view === 'week' && <WeekCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} requests={filteredRequests} users={users} holidays={holidays} departments={departments} getUserDepartments={getUserDepartments} />}
      {view === 'year' && <YearCalendar currentDate={currentDate} setCurrentDate={setCurrentDate} requests={filteredRequests} users={users} holidays={holidays} departments={departments} getUserDepartments={getUserDepartments} />}
    </div>
  );
};

const MonthCalendar = ({ currentDate, setCurrentDate, requests, users, holidays, departments, getUserDepartments }) => {
  const year = currentDate.getFullYear(), month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay() - 1; if (startDay === -1) startDay = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const today = new Date();
  const isToday = (day) => day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  const [hoveredDay, setHoveredDay] = useState(null);

  // Local holidays month-day patterns
  const localHolidayMonthDays = new Set([
    '01-01', '01-06', '04-03', '04-06', '03-26', '03-29', '05-01', '06-24', '08-15', '09-11', '09-24', '10-12', '11-01', '12-06', '12-08', '12-25', '12-26'
  ]);

  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getRequestsForDate = (day) => {
    if (!day) return [];
    const dateStr = getDateStr(day);
    return requests.filter(r => {
      if (r.isRange) return dateStr >= r.startDate && dateStr <= r.endDate && new Date(dateStr).getDay() !== 0 && new Date(dateStr).getDay() !== 6 && !holidays.some(h => h.date === dateStr);
      return r.dates?.includes(dateStr);
    });
  };

  const getHolidayInfo = (day) => {
    if (!day) return null;
    const dateStr = getDateStr(day);
    const holiday = holidays.find(h => h.date === dateStr);
    if (!holiday) return null;
    const monthDay = dateStr.slice(5);
    const isLocal = holiday.isLocal === true || localHolidayMonthDays.has(monthDay);
    const isTurno = holiday.holidayType === 'turno';
    return { ...holiday, isLocal, isTurno };
  };

  const getHolidayBgClass = (holiday) => {
    if (holiday.isTurno) return 'bg-yellow-50';
    if (holiday.isLocal) return 'bg-red-50';
    return 'bg-purple-50';
  };

  const getDeptBgClass = (depts) => {
    if (!depts || depts.length === 0) return 'bg-gray-100';
    const dept = departments.find(d => d.name === depts[0]);
    if (!dept) return 'bg-gray-100';
    const colorMap = {
      'bg-blue-100 text-blue-800': 'bg-blue-200',
      'bg-purple-100 text-purple-800': 'bg-purple-200',
      'bg-green-100 text-green-800': 'bg-green-200',
      'bg-yellow-100 text-yellow-800': 'bg-yellow-200',
      'bg-orange-100 text-orange-800': 'bg-orange-200',
      'bg-red-100 text-red-800': 'bg-red-200',
      'bg-pink-100 text-pink-800': 'bg-pink-200',
      'bg-teal-100 text-teal-800': 'bg-teal-200',
      'bg-indigo-100 text-indigo-800': 'bg-indigo-200',
      'bg-gray-100 text-gray-800': 'bg-gray-200',
    };
    return colorMap[dept.color] || 'bg-gray-200';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft /></button>
        <h2 className="text-xl font-bold">{monthNames[month]} {year}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="text-center font-semibold text-gray-600 py-2 text-xs">{d}</div>)}
        {days.map((day, idx) => {
          const dayReqs = getRequestsForDate(day);
          const holiday = getHolidayInfo(day);
          const dateStr = day ? getDateStr(day) : null;
          return (
            <div
              key={idx}
              className={`min-h-20 border rounded p-1 relative ${!day ? 'bg-gray-50' : isToday(day) ? 'bg-blue-50 border-blue-400 border-2' : holiday ? getHolidayBgClass(holiday) : 'bg-white'}`}
              onMouseEnter={() => dayReqs.length > 3 && setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {day && <>
                <div className={`font-semibold text-xs mb-1 flex items-center gap-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                  {day}
                  {holiday && holiday.isTurno && <span title={holiday.name}>{holiday.emoji || '🔄'}</span>}
                </div>
                {holiday && !holiday.isTurno && <div className={`text-xs mb-1 truncate ${holiday.isLocal ? 'text-red-600' : 'text-purple-600'}`} title={holiday.name}>{holiday.emoji || (holiday.isLocal ? '🎉' : '🏢')} {holiday.name}</div>}
                <div className="space-y-1">
                  {dayReqs.slice(0, 3).map((req, i) => <RequestBadge key={i} req={req} user={users.find(u => u.code === req.userCode)} departments={departments} getUserDepartments={getUserDepartments} isTurnoDay={holiday?.isTurno} />)}
                  {dayReqs.length > 3 && <div className="text-xs text-gray-500 cursor-pointer">+{dayReqs.length - 3} más</div>}
                </div>
                {/* Hover tooltip */}
                {hoveredDay === dateStr && dayReqs.length > 3 && (
                  <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[180px]">
                    <div className="text-xs font-semibold mb-2 text-gray-700">{new Date(year, month, day).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <div className="space-y-1">
                      {dayReqs.map((req, i) => {
                        const user = users.find(u => u.code === req.userCode);
                        const depts = getUserDepartments(user);
                        return (
                          <div key={i} className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${getDeptBgClass(depts)}`}>
                            <span>{req.status === 'approved' ? '✅' : '⏳'}</span>
                            <span className="font-medium">{user?.name} {user?.lastName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WeekCalendar = ({ currentDate, setCurrentDate, requests, users, holidays, departments, getUserDepartments }) => {
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(currentDate.getDate() + (day === 0 ? -6 : 1 - day));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
  const today = new Date().toISOString().split('T')[0];

  // Local holidays month-day patterns
  const localHolidayMonthDays = new Set([
    '01-01', '01-06', '04-03', '04-06', '03-26', '03-29', '05-01', '06-24', '08-15', '09-11', '09-24', '10-12', '11-01', '12-06', '12-08', '12-25', '12-26'
  ]);

  const getRequestsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return requests.filter(r => {
      if (r.isRange) return dateStr >= r.startDate && dateStr <= r.endDate && date.getDay() !== 0 && date.getDay() !== 6 && !holidays.some(h => h.date === dateStr);
      return r.dates?.includes(dateStr);
    });
  };

  const getHolidayInfo = (dateStr) => {
    const holiday = holidays.find(h => h.date === dateStr);
    if (!holiday) return null;
    const monthDay = dateStr.slice(5);
    const isLocal = holiday.isLocal === true || localHolidayMonthDays.has(monthDay);
    const isTurno = holiday.holidayType === 'turno';
    return { ...holiday, isLocal, isTurno };
  };

  const getHolidayBgClass = (holiday) => {
    if (holiday.isTurno) return 'bg-yellow-50';
    if (holiday.isLocal) return 'bg-red-50';
    return 'bg-purple-50';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft /></button>
        <h2 className="text-lg font-bold">{days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</h2>
        <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-2 hover:bg-gray-100 rounded"><ChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, idx) => {
          const dayReqs = getRequestsForDate(date);
          const dateStr = date.toISOString().split('T')[0];
          const holiday = getHolidayInfo(dateStr);
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const isToday = dateStr === today;
          return (
            <div key={idx} className={`min-h-64 border rounded p-2 ${isToday ? 'bg-blue-50 border-blue-400 border-2' : weekend ? 'bg-gray-50' : holiday ? getHolidayBgClass(holiday) : 'bg-white'}`}>
              <div className={`font-semibold mb-2 text-xs ${isToday ? 'text-blue-600' : ''}`}>{date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</div>
              {holiday && !holiday.isTurno && <div className={`text-xs mb-2 truncate ${holiday.isLocal ? 'text-red-600' : 'text-purple-600'}`} title={holiday.name}>{holiday.emoji || (holiday.isLocal ? '🎉' : '🏢')} {holiday.name}</div>}
              {holiday && holiday.isTurno && <div className="text-xs mb-2 text-yellow-600" title={holiday.name}>{holiday.emoji || '🔄'}</div>}
              <div className="space-y-1">{dayReqs.map((req, i) => <RequestBadge key={i} req={req} user={users.find(u => u.code === req.userCode)} departments={departments} getUserDepartments={getUserDepartments} isTurnoDay={holiday?.isTurno} />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const YearCalendar = ({ currentDate, setCurrentDate, requests, users, holidays, departments, getUserDepartments }) => {
  const year = currentDate.getFullYear();
  const [hoveredDay, setHoveredDay] = useState(null);
  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Local holidays - use the same dates from defaultHolidays for accurate detection
  // These are month-day patterns that identify local/national holidays vs admin-added closures
  const localHolidayMonthDays = new Set([
    '01-01', // Año Nuevo
    '01-06', // Reyes
    '04-03', // Viernes Santo 2026
    '04-06', // Lunes de Pascua 2026
    '03-26', // Viernes Santo 2027
    '03-29', // Lunes de Pascua 2027
    '05-01', // Fiesta del Trabajo
    '06-24', // San Juan
    '08-15', // Asunción
    '09-11', // Diada de Cataluña
    '09-24', // La Mercè
    '10-12', // Fiesta Nacional
    '11-01', // Todos los Santos
    '12-06', // Constitución
    '12-08', // Inmaculada
    '12-25', // Navidad
    '12-26', // San Esteban
  ]);

  // Format date as YYYY-MM-DD without timezone issues
  const getDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate all days of the year
  const getAllDaysOfYear = () => {
    const days = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Find the Monday of the week containing Jan 1
    let current = new Date(startDate);
    const dayOfWeek = current.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    current.setDate(current.getDate() + diff);

    // Generate weeks until we pass Dec 31
    while (current <= endDate || current.getDay() !== 1) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      days.push(week);
      if (current > endDate && current.getDay() === 1) break;
    }
    return days;
  };

  const weeks = getAllDaysOfYear();

  const getHolidayInfo = (dateStr) => {
    const holiday = holidays.find(h => h.date === dateStr);
    if (!holiday) return null;
    // Check if it's a local holiday by comparing month-day
    const monthDay = dateStr.slice(5); // Get MM-DD part
    const isLocal = holiday.isLocal === true || localHolidayMonthDays.has(monthDay);
    const isTurno = holiday.holidayType === 'turno';
    return { ...holiday, isLocal, isTurno };
  };

  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  const getRequestsForDate = (dateStr) => {
    return requests.filter(r => {
      if (r.status !== 'approved' && r.status !== 'pending') return false;
      if (r.isRange) {
        return dateStr >= r.startDate && dateStr <= r.endDate;
      }
      return r.dates?.includes(dateStr);
    });
  };

  const getUsersForDate = (dateStr) => {
    const dayRequests = getRequestsForDate(dateStr);
    return dayRequests.map(r => {
      const user = users.find(u => u.code === r.userCode);
      return {
        user,
        request: r,
        depts: getUserDepartments(user)
      };
    });
  };

  const today = new Date();
  const todayStr = getDateStr(today);

  // Check if week contains first day of a month
  const getMonthStart = (week) => {
    return week.find(d => d.getDate() === 1 && d.getFullYear() === year);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentDate(new Date(year - 1, 0, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft /></button>
        <h2 className="text-2xl font-bold">{year}</h2>
        <button onClick={() => setCurrentDate(new Date(year + 1, 0, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight /></button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header with day names */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b-2 border-gray-300">
            <div className="bg-gray-50 p-2 text-xs font-semibold text-gray-500"></div>
            {dayNames.map(d => (
              <div key={d} className="bg-gray-50 p-2 text-xs font-semibold text-gray-500 text-center border-l border-gray-200">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div>
            {weeks.map((week, weekIdx) => {
              const monthLabelDay = getMonthStart(week);
              const isMonthStart = !!monthLabelDay;
              const nextWeek = weeks[weekIdx + 1];
              const nextWeekHasMonthStart = nextWeek && getMonthStart(nextWeek);

              return (
                <div
                  key={weekIdx}
                  className={`grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-300 ${isMonthStart ? 'border-t-4 border-t-gray-500' : ''}`}
                >
                  {/* Month label column */}
                  <div className={`bg-gray-50 p-1 text-xs font-bold text-gray-700 flex items-center justify-center border-r border-gray-200 ${isMonthStart ? 'bg-gray-100' : ''}`}>
                    {monthLabelDay && monthNames[monthLabelDay.getMonth()]}
                  </div>

                  {/* Days */}
                  {week.map((date, dayIdx) => {
                    const dateStr = getDateStr(date);
                    const isCurrentYear = date.getFullYear() === year;
                    const holiday = getHolidayInfo(dateStr);
                    const weekend = isWeekend(date);
                    const isToday = dateStr === todayStr;
                    const usersOnDay = isCurrentYear ? getUsersForDate(dateStr) : [];
                    const approvedCount = usersOnDay.filter(u => u.request.status === 'approved').length;
                    const pendingCount = usersOnDay.filter(u => u.request.status === 'pending').length;
                    const userCount = usersOnDay.length;

                    // Determine background color
                    let bgClass = 'bg-white';
                    let textClass = 'text-gray-900';

                    if (!isCurrentYear) {
                      bgClass = 'bg-gray-50';
                      textClass = 'text-gray-300';
                    } else if (holiday) {
                      if (holiday.isTurno) {
                        bgClass = 'bg-yellow-100';
                        textClass = 'text-yellow-700';
                      } else if (holiday.isLocal) {
                        bgClass = 'bg-red-100';
                        textClass = 'text-red-700';
                      } else {
                        bgClass = 'bg-purple-100';
                        textClass = 'text-purple-700';
                      }
                    } else if (weekend) {
                      bgClass = 'bg-gray-100';
                      textClass = 'text-gray-400';
                    }

                    // Get department color for user in tooltip
                    const getDeptBgClass = (depts) => {
                      if (!depts || depts.length === 0) return 'bg-gray-100';
                      const dept = departments.find(d => d.name === depts[0]);
                      if (!dept) return 'bg-gray-100';
                      // Extract bg class from color (e.g., 'bg-blue-100 text-blue-800' -> 'bg-blue-200')
                      const colorMap = {
                        'bg-blue-100 text-blue-800': 'bg-blue-200',
                        'bg-purple-100 text-purple-800': 'bg-purple-200',
                        'bg-green-100 text-green-800': 'bg-green-200',
                        'bg-yellow-100 text-yellow-800': 'bg-yellow-200',
                        'bg-orange-100 text-orange-800': 'bg-orange-200',
                        'bg-red-100 text-red-800': 'bg-red-200',
                        'bg-pink-100 text-pink-800': 'bg-pink-200',
                        'bg-teal-100 text-teal-800': 'bg-teal-200',
                        'bg-indigo-100 text-indigo-800': 'bg-indigo-200',
                        'bg-gray-100 text-gray-800': 'bg-gray-200',
                      };
                      return colorMap[dept.color] || 'bg-gray-200';
                    };

                    return (
                      <div
                        key={dayIdx}
                        className={`${bgClass} p-1 min-h-[36px] relative cursor-pointer hover:ring-2 hover:ring-indigo-300 border-l border-gray-200 ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                        onMouseEnter={() => userCount > 0 && setHoveredDay(dateStr)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <div className={`text-xs font-medium ${textClass} ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                          {date.getDate()}
                        </div>

                        {/* Holiday indicator */}
                        {holiday && isCurrentYear && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-3">
                            <span className="text-[10px]">
                              {holiday.emoji || (holiday.isTurno ? '🔄' : holiday.isLocal ? '🎉' : '🏢')}
                            </span>
                            <span className={`text-[8px] font-bold text-center leading-tight px-0.5 truncate max-w-full ${holiday.isTurno ? 'text-yellow-700' : holiday.isLocal ? 'text-red-700' : 'text-purple-700'}`}>
                              {holiday.name}
                            </span>
                          </div>
                        )}

                        {/* User count badges - separated by status */}
                        {isCurrentYear && !weekend && (approvedCount > 0 || pendingCount > 0) && (
                          <div className="absolute bottom-0.5 right-0.5 flex gap-0.5">
                            {approvedCount > 0 && (
                              <div className="bg-green-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                {approvedCount}
                              </div>
                            )}
                            {pendingCount > 0 && (
                              <div className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                {pendingCount}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hover tooltip */}
                        {hoveredDay === dateStr && userCount > 0 && (
                          <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[180px]">
                            <div className="text-xs font-semibold mb-2 text-gray-700">{date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                            <div className="space-y-1">
                              {usersOnDay.map((item, idx) => (
                                <div key={idx} className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${getDeptBgClass(item.depts)}`}>
                                  <span>{item.request.status !== 'approved' ? '⏳' : item.request.type === 'other' ? '⚠️' : item.request.type === 'turno' ? '🔄' : '✅'}</span>
                                  <span className="font-medium">{item.user?.name} {item.user?.lastName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs bg-gray-50 p-3 rounded-lg">
        <span className="font-medium">Leyenda:</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center">🎉</span><span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Festivo local</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center">🏢</span><span className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></span> Día de cierre</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 flex items-center justify-center">🔄</span><span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></span> Turno</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-500 text-white rounded-full text-[10px] flex items-center justify-center">2</span> Aprobadas</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center">1</span> Pendientes</span>
      </div>
    </div>
  );
};

const DepartmentsManagement = ({ departments, addDepartment, updateDepartment, deleteDepartment, showNotification, users, getUserDepartments }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: 'bg-blue-100 text-blue-800' });
  const colorOptions = [
    { value: 'bg-blue-100 text-blue-800', label: 'Azul', preview: 'bg-blue-200' },
    { value: 'bg-purple-100 text-purple-800', label: 'Morado', preview: 'bg-purple-200' },
    { value: 'bg-green-100 text-green-800', label: 'Verde', preview: 'bg-green-200' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Amarillo', preview: 'bg-yellow-200' },
    { value: 'bg-orange-100 text-orange-800', label: 'Naranja', preview: 'bg-orange-200' },
    { value: 'bg-red-100 text-red-800', label: 'Rojo', preview: 'bg-red-200' },
    { value: 'bg-pink-100 text-pink-800', label: 'Rosa', preview: 'bg-pink-200' },
    { value: 'bg-teal-100 text-teal-800', label: 'Teal', preview: 'bg-teal-200' },
  ];

  const handleSubmit = async () => {
    if (!formData.name) { showNotification('error', 'Completa el nombre'); return; }
    if (editingDept) await updateDepartment(editingDept.id, formData);
    else { if (departments.some(d => d.name === formData.name)) { showNotification('error', 'Ya existe'); return; } await addDepartment(formData); }
    setShowForm(false); setEditingDept(null); setFormData({ name: '', color: 'bg-blue-100 text-blue-800' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Departamentos</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /><span>Nuevo</span></button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-xl font-semibold">{editingDept ? 'Editar' : 'Nuevo'} Departamento</h3>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Nombre" />
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map(o => <button key={o.value} onClick={() => setFormData({ ...formData, color: o.value })} className={`flex items-center space-x-2 px-3 py-2 rounded border-2 ${formData.color === o.value ? 'border-indigo-600' : 'border-gray-300'}`}><div className={`w-6 h-6 rounded ${o.preview}`}></div><span className="text-sm">{o.label}</span></button>)}
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">{editingDept ? 'Actualizar' : 'Crear'}</button>
            <button onClick={() => { setShowForm(false); setEditingDept(null); }} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => {
          const deptUsers = users.filter(u => getUserDepartments(u).includes(dept.name));
          return (
            <div key={dept.id} className="border rounded-lg p-4 bg-white hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div className={`px-3 py-1 rounded font-semibold ${dept.color}`}>{dept.name}</div>
                <div className="flex space-x-1">
                  <button onClick={() => { setEditingDept(dept); setFormData({ name: dept.name, color: dept.color }); setShowForm(true); }} className="text-blue-600 p-1"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => { if (deptUsers.length > 0) showNotification('error', 'Tiene usuarios'); else deleteDepartment(dept.id); }} className="text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{deptUsers.length} empleados</p>
              {deptUsers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {deptUsers.map(u => (
                    <span key={u.code} className="text-xs bg-gray-100 px-2 py-1 rounded">{u.name} {u.lastName}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {departments.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No hay departamentos</div>}
      </div>
    </div>
  );
};

const UsersManagement = ({ users, addUser, updateUser, deleteUser, showNotification, calculateUserDays, requests, viewingUserHistory, setViewingUserHistory, departments, getUserDepartments }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const defaultSchedule = {
    lunes: { entrada: '08:00', salida: '17:00', activo: true },
    martes: { entrada: '08:00', salida: '17:00', activo: true },
    miercoles: { entrada: '08:00', salida: '17:00', activo: true },
    jueves: { entrada: '08:00', salida: '17:00', activo: true },
    viernes: { entrada: '08:00', salida: '15:00', activo: true }
  };
  const [formData, setFormData] = useState({ code: '', name: '', lastName: '', phone: '', departments: [], totalDays: 22, carryOverDays: 0, isAdmin: false, schedule: defaultSchedule });

  const calcDayHours = (day) => {
    if (!day.activo) return 0;
    const [eh, em] = day.entrada.split(':').map(Number);
    const [sh, sm] = day.salida.split(':').map(Number);
    const mins = (sh * 60 + sm) - (eh * 60 + em);
    return mins > 0 ? mins / 60 : 0;
  };

  const calcWeeklyHours = (schedule) => {
    return Object.values(schedule).reduce((sum, day) => sum + calcDayHours(day), 0);
  };

  const updateScheduleDay = (dayName, field, value) => {
    setFormData(p => ({
      ...p,
      schedule: {
        ...p.schedule,
        [dayName]: { ...p.schedule[dayName], [field]: value }
      }
    }));
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.lastName || formData.departments.length === 0) { showNotification('error', 'Completa todos los campos'); return; }
    if (editingUser) await updateUser(editingUser.id, formData);
    else { if (users.some(u => u.code === formData.code)) { showNotification('error', 'Código duplicado'); return; } await addUser(formData); }
    setShowForm(false); setEditingUser(null); setFormData({ code: '', name: '', lastName: '', departments: [], totalDays: 22, carryOverDays: 0, isAdmin: false, schedule: defaultSchedule });
  };

  const toggleDept = (name) => setFormData(p => ({ ...p, departments: p.departments.includes(name) ? p.departments.filter(d => d !== name) : [...p.departments, name] }));

  if (viewingUserHistory) {
    const user = users.find(u => u.code === viewingUserHistory);
    const userReqs = requests.filter(r => r.userCode === viewingUserHistory).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const d = calculateUserDays(viewingUserHistory);
    const statusEmojis = { pending: '⏳', approved: '✅', denied: '❌' };
    return (
      <div className="space-y-4">
        <button onClick={() => setViewingUserHistory(null)} className="text-indigo-600">← Volver</button>
        <h2 className="text-2xl font-bold">{user?.name} {user?.lastName}</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-5 gap-4">
            <div><p className="text-sm text-gray-600">Totales</p><p className="text-xl font-bold text-blue-600">{d.total}</p></div>
            <div><p className="text-sm text-gray-600">Sobrantes</p><p className="text-xl font-bold text-purple-600">{d.carryOver}</p></div>
            <div><p className="text-sm text-gray-600">Usados</p><p className="text-xl font-bold text-red-600">{d.used}</p></div>
            <div><p className="text-sm text-gray-600">En espera</p><p className="text-xl font-bold text-orange-600">{d.waiting}</p></div>
            <div><p className="text-sm text-gray-600">Disponibles</p><p className="text-xl font-bold text-green-600">{d.available}</p></div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Desglose de días usados:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>📅 Vacaciones propias: <strong>{d.usedOwn || 0}</strong></span>
              <span>🏢 Días de cierre: <strong>{d.usedClosure || 0}</strong></span>
              <span>🔄 Vacaciones en turno: <strong>{d.usedTurno || 0}</strong></span>
              <span>⚠️ Días especiales: <strong>{d.usedOther || 0}</strong></span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {userReqs.map(req => (
            <div key={req.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center space-x-2 mb-2"><span className="text-xl">{statusEmojis[req.status]}</span><span className="font-semibold">{req.status}</span></div>
              <div className="text-sm">{req.isRange ? <p>{req.startDate} al {req.endDate}</p> : <p>{req.dates?.join(', ')}</p>}</div>
            </div>
          ))}
          {userReqs.length === 0 && <div className="text-center py-12 text-gray-500">Sin solicitudes</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /><span>Nuevo</span></button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-xl font-semibold">{editingUser ? 'Editar' : 'Nuevo'} Usuario</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" disabled={!!editingUser} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="px-3 py-2 border rounded disabled:bg-gray-100" placeholder="Código" />
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded" placeholder="Nombre" />
            <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="px-3 py-2 border rounded" placeholder="Apellido" />
            <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="px-3 py-2 border rounded" placeholder="Teléfono (+34...)" />
            <input type="number" min="0" value={formData.totalDays} onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) || 0 })} className="px-3 py-2 border rounded" placeholder="Días totales" />
            <input type="number" min="0" value={formData.carryOverDays} onChange={(e) => setFormData({ ...formData, carryOverDays: parseInt(e.target.value) || 0 })} className="px-3 py-2 border rounded" placeholder="Días sobrantes" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Departamentos</label>
            <div className="flex flex-wrap gap-2">
              {departments.map(dept => (
                <button key={dept.name} type="button" onClick={() => toggleDept(dept.name)} className={`px-3 py-2 rounded border-2 ${formData.departments.includes(dept.name) ? 'border-indigo-600 ' + dept.color : 'border-gray-300 bg-white'}`}>
                  {dept.name} {formData.departments.includes(dept.name) && <Check className="w-4 h-4 inline ml-1" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Horario Semanal</label>
              <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Total: {calcWeeklyHours(formData.schedule).toFixed(1)}h / semana
              </span>
            </div>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Día</th>
                    <th className="px-3 py-2 text-center">Activo</th>
                    <th className="px-3 py-2 text-center">Entrada</th>
                    <th className="px-3 py-2 text-center">Salida</th>
                    <th className="px-3 py-2 text-center">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'lunes', label: 'Lunes' },
                    { key: 'martes', label: 'Martes' },
                    { key: 'miercoles', label: 'Miércoles' },
                    { key: 'jueves', label: 'Jueves' },
                    { key: 'viernes', label: 'Viernes' }
                  ].map(({ key, label }) => (
                    <tr key={key} className={`border-t ${!formData.schedule[key].activo ? 'bg-gray-50 opacity-60' : ''}`}>
                      <td className="px-3 py-2 font-medium">{label}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={formData.schedule[key].activo}
                          onChange={(e) => updateScheduleDay(key, 'activo', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="time"
                          value={formData.schedule[key].entrada}
                          onChange={(e) => updateScheduleDay(key, 'entrada', e.target.value)}
                          disabled={!formData.schedule[key].activo}
                          className="px-2 py-1 border rounded text-center disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="time"
                          value={formData.schedule[key].salida}
                          onChange={(e) => updateScheduleDay(key, 'salida', e.target.value)}
                          disabled={!formData.schedule[key].activo}
                          className="px-2 py-1 border rounded text-center disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-indigo-600">
                        {formData.schedule[key].activo ? calcDayHours(formData.schedule[key]).toFixed(1) + 'h' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <label className="flex items-center space-x-2"><input type="checkbox" checked={formData.isAdmin} onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })} className="w-4 h-4" /><span>Es Administrador</span></label>
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">{editingUser ? 'Actualizar' : 'Crear'}</button>
            <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left">Código</th><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Teléfono</th><th className="px-4 py-3 text-left">Depts</th><th className="px-4 py-3 text-left">H/sem</th><th className="px-4 py-3 text-left">Usados</th><th className="px-4 py-3 text-left">Disp.</th><th className="px-4 py-3 text-left">Acciones</th></tr></thead>
          <tbody>
            {users.map(user => {
              const d = calculateUserDays(user.code);
              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{user.code}</td>
                  <td className="px-4 py-3">{user.name} {user.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.phone || '-'}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{getUserDepartments(user).map(d => <span key={d} className="text-xs px-2 py-1 rounded bg-gray-100">{d}</span>)}</div></td>
                  <td className="px-4 py-3 text-indigo-600 font-semibold">{user.schedule ? calcWeeklyHours(user.schedule).toFixed(0) + 'h' : '40h'}</td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">{d.used}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">{d.available}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => setViewingUserHistory(user.code)} className="text-green-600"><FileText className="w-5 h-5" /></button>
                      <button onClick={() => { setEditingUser(user); setFormData({ ...user, departments: getUserDepartments(user), schedule: user.schedule || defaultSchedule }); setShowForm(true); }} className="text-blue-600"><Eye className="w-5 h-5" /></button>
                      <button onClick={() => deleteUser(user.id)} className="text-red-600"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ApproveRequests = ({ requests, updateRequest, deleteRequest, users, calculateUserDays, getBusinessDays, currentUser, getUserDepartments, showNotification, isWeekend, isHoliday }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const pending = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved').sort((a, b) => new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt));
  const getReqDays = (r) => r.isRange ? getBusinessDays(r.startDate, r.endDate) : (r.dates?.length || 0);

  // Separate current vs past approved requests
  const today = new Date().toISOString().split('T')[0];
  const isRequestPast = (req) => {
    if (req.isRange) return req.endDate < today;
    return req.dates?.every(d => d < today) || false;
  };
  const approvedCurrent = approved.filter(r => !isRequestPast(r));
  const approvedPast = approved.filter(r => isRequestPast(r));

  // Find conflicts for a specific request
  const findConflictsForRequest = (req) => {
    const reqUser = users.find(u => u.code === req.userCode);
    const reqDepts = getUserDepartments ? getUserDepartments(reqUser) : (reqUser?.departments || []);
    if (reqDepts.length === 0) return [];

    let reqDates = [];
    if (req.isRange) {
      let cur = new Date(req.startDate);
      const end = new Date(req.endDate);
      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];
        if (!isWeekend(dateStr) && !isHoliday(dateStr)) reqDates.push(dateStr);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      reqDates = (req.dates || []).filter(d => !isWeekend(d) && !isHoliday(d));
    }

    const coworkers = users.filter(u => {
      if (u.code === req.userCode) return false;
      const userDepts = getUserDepartments ? getUserDepartments(u) : (u.departments || []);
      return userDepts.some(d => reqDepts.includes(d));
    });

    const conflicts = [];
    coworkers.forEach(coworker => {
      const coworkerReqs = requests.filter(r =>
        r.userCode === coworker.code &&
        r.id !== req.id &&
        (r.status === 'approved' || r.status === 'pending')
      );

      coworkerReqs.forEach(coworkerReq => {
        let coworkerDates = [];
        if (coworkerReq.isRange) {
          let cur = new Date(coworkerReq.startDate);
          const end = new Date(coworkerReq.endDate);
          while (cur <= end) {
            coworkerDates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }
        } else {
          coworkerDates = coworkerReq.dates || [];
        }

        const overlappingDates = reqDates.filter(d => coworkerDates.includes(d));
        if (overlappingDates.length > 0) {
          const coworkerDepts = getUserDepartments ? getUserDepartments(coworker) : (coworker.departments || []);
          const sharedDepts = coworkerDepts.filter(d => reqDepts.includes(d));
          conflicts.push({
            user: coworker,
            dates: overlappingDates,
            status: coworkerReq.status,
            sharedDepts
          });
        }
      });
    });

    return conflicts;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gestión de Solicitudes</h2>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pendientes ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 font-medium ${activeTab === 'approved' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Aprobadas ({approved.length})
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pending.map(req => {
            const user = users.find(u => u.code === req.userCode);
            const d = calculateUserDays(req.userCode);
            const conflicts = findConflictsForRequest(req);
            return (
              <div key={req.id} className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2"><span className="text-xl">⏳</span><h3 className="text-lg font-semibold">{user?.name} {user?.lastName}</h3></div>
                    <div className="text-sm text-gray-700">
                      {req.isRange ? <p><strong>Rango:</strong> {req.startDate} al {req.endDate} ({getReqDays(req)} días)</p> : <p><strong>Fechas:</strong> {req.dates?.join(', ')}</p>}
                      {req.comments && <p><strong>Comentarios:</strong> {req.comments}</p>}
                      <p><strong>Saldo disponible:</strong> {d.available} días</p>
                    </div>
                    {conflicts.length > 0 && (
                      <div className="mt-3 text-sm bg-orange-50 border border-orange-200 p-3 rounded">
                        <div className="font-semibold text-orange-700 mb-2">⚠️ Conflictos con compañeros de departamento:</div>
                        <div className="space-y-1">
                          {conflicts.map((c, idx) => (
                            <div key={idx} className="text-orange-600">
                              <span className="font-medium">{c.user.name} {c.user.lastName}</span>
                              <span className="text-gray-500"> ({c.sharedDepts.join(', ')})</span>
                              <span> - {c.status === 'approved' ? '✅ Aprobado' : '⏳ Pendiente'}</span>
                              <span className="text-gray-500"> - {c.dates.length} día(s): {c.dates.slice(0, 3).join(', ')}{c.dates.length > 3 ? '...' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={async () => { await updateRequest(req.id, { status: 'approved', approvedBy: currentUser.code, approvedByName: currentUser.name, approvedAt: new Date().toISOString() }); showNotification('success', 'Aprobada'); }} className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded"><Check className="w-4 h-4" /><span>Aprobar</span></button>
                    <button onClick={async () => { await updateRequest(req.id, { status: 'denied', approvedBy: currentUser.code, approvedByName: currentUser.name, approvedAt: new Date().toISOString() }); showNotification('success', 'Denegada'); }} className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded"><X className="w-4 h-4" /><span>Denegar</span></button>
                  </div>
                </div>
              </div>
            );
          })}
          {pending.length === 0 && <div className="text-center py-12 text-gray-500">Sin solicitudes pendientes</div>}
        </div>
      )}

      {/* Approved Tab */}
      {activeTab === 'approved' && (
        <ApprovedRequestsSubTabs
          approvedCurrent={approvedCurrent}
          approvedPast={approvedPast}
          users={users}
          getReqDays={getReqDays}
          deleteRequest={deleteRequest}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

const ApprovedRequestsSubTabs = ({ approvedCurrent, approvedPast, users, getReqDays, deleteRequest, showNotification }) => {
  const [subTab, setSubTab] = useState('current');

  const renderApprovedRequest = (req, showDelete = true) => {
    const user = users.find(u => u.code === req.userCode);
    return (
      <div key={req.id} className="border rounded-lg p-4 bg-green-50">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">{req.type === 'other' ? '⚠️' : '✅'}</span>
              <h3 className="text-lg font-semibold">{user?.name} {user?.lastName}</h3>
            </div>
            <div className="text-sm text-gray-700">
              {req.isRange ? <p><strong>Rango:</strong> {req.startDate} al {req.endDate} ({getReqDays(req)} días)</p> : <p><strong>Fechas:</strong> {req.dates?.join(', ')}</p>}
              {req.type === 'other' && <p className="text-amber-600"><strong>Tipo:</strong> Día especial</p>}
              {req.comments && <p><strong>Comentarios:</strong> {req.comments}</p>}
              <p className="mt-2 text-green-700">
                <strong>Aprobada por:</strong> {req.approvedByName || 'Sistema'}
                {req.approvedAt && <span className="text-gray-500"> el {new Date(req.approvedAt).toLocaleDateString('es-ES')}</span>}
              </p>
            </div>
          </div>
          {showDelete && (
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  if (window.confirm('¿Seguro que quieres eliminar esta solicitud aprobada?')) {
                    await deleteRequest(req.id);
                    showNotification('success', 'Solicitud eliminada');
                  }
                }}
                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded"
              >
                <Trash2 className="w-4 h-4" /><span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs for current/past */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setSubTab('current')}
          className={`px-4 py-2 font-medium ${subTab === 'current' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Actuales ({approvedCurrent.length})
        </button>
        <button
          onClick={() => setSubTab('past')}
          className={`px-4 py-2 font-medium ${subTab === 'past' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Historial ({approvedPast.length})
        </button>
      </div>

      {subTab === 'current' && (
        <>
          {approvedCurrent.map(req => renderApprovedRequest(req, true))}
          {approvedCurrent.length === 0 && <div className="text-center py-12 text-gray-500">Sin solicitudes aprobadas actuales</div>}
        </>
      )}
      {subTab === 'past' && (
        <>
          {approvedPast.map(req => renderApprovedRequest(req, true))}
          {approvedPast.length === 0 && <div className="text-center py-12 text-gray-500">Sin historial de solicitudes</div>}
        </>
      )}
    </div>
  );
};

const HolidaysManagement = ({ holidays, addHoliday, deleteHoliday, updateHoliday, showNotification }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [formData, setFormData] = useState({ date: '', name: '', holidayType: 'closure', emoji: '🏢' });

  const emojiOptions = ['🏢', '🔄', '🎄', '🎅', '🎁', '⭐', '🌟', '💼', '📅', '🗓️', '✨', '🎊', '🎈', '🏖️', '🌴', '☀️', '❄️', '🎃', '🐰', '💝'];

  const today = new Date().toISOString().split('T')[0];

  // Show all holidays
  const currentHolidays = holidays.filter(h => h.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const pastHolidays = holidays.filter(h => h.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const getHolidayEmoji = (h) => {
    if (h.emoji) return h.emoji;
    if (h.isLocal || h.holidayType === 'local') return '📅';
    if (h.holidayType === 'turno') return '🔄';
    return '🏢';
  };

  const getHolidayTypeName = (h) => {
    if (h.isLocal || h.holidayType === 'local') return 'Festivo local';
    if (h.holidayType === 'turno') return 'Turno';
    return 'Día de cierre';
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.name) { showNotification('error', 'Completa todos los campos'); return; }
    if (editingHoliday) {
      await updateHoliday(editingHoliday.id, formData);
      setEditingHoliday(null);
    } else {
      await addHoliday(formData);
    }
    setShowForm(false); setFormData({ date: '', name: '', holidayType: 'closure', emoji: '🏢' });
  };

  const startEdit = (h) => {
    setEditingHoliday(h);
    setFormData({ date: h.date, name: h.name, holidayType: h.holidayType || 'closure', emoji: h.emoji || getHolidayEmoji(h) });
    setShowForm(true);
  };

  const renderTable = (holidayList, showActions = true) => (
    <table className="w-full">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-3 text-left">Emoji</th>
          <th className="px-4 py-3 text-left">Tipo</th>
          <th className="px-4 py-3 text-left">Fecha</th>
          <th className="px-4 py-3 text-left">Nombre</th>
          {showActions && <th className="px-4 py-3 text-left">Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {holidayList.map(h => (
          <tr key={h.id} className="border-b">
            <td className="px-4 py-3 text-xl">{getHolidayEmoji(h)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{getHolidayTypeName(h)}</td>
            <td className="px-4 py-3">{h.date}</td>
            <td className="px-4 py-3">{h.name}</td>
            {showActions && (
              <td className="px-4 py-3 flex gap-2">
                <button onClick={() => startEdit(h)} className="text-blue-600"><Eye className="w-5 h-5" /></button>
                <button onClick={() => deleteHoliday(h.id)} className="text-red-600"><Trash2 className="w-5 h-5" /></button>
              </td>
            )}
          </tr>
        ))}
        {holidayList.length === 0 && (
          <tr><td colSpan={showActions ? 5 : 4} className="px-4 py-8 text-center text-gray-500">No hay días</td></tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Días Especiales</h2>
        <button onClick={() => { setEditingHoliday(null); setFormData({ date: '', name: '', holidayType: 'closure', emoji: '🏢' }); setShowForm(true); }} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /><span>Nuevo</span></button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">{editingHoliday ? 'Editar' : 'Nuevo'} Día Especial</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="px-3 py-2 border rounded" />
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded" placeholder="Nombre" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de día</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="local" checked={formData.holidayType === 'local'} onChange={(e) => setFormData({ ...formData, holidayType: e.target.value, emoji: '📅' })} />
                <span className="text-red-600">Festivo local</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="closure" checked={formData.holidayType === 'closure'} onChange={(e) => setFormData({ ...formData, holidayType: e.target.value, emoji: '🏢' })} />
                <span className="text-purple-600">Día de cierre</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="turno" checked={formData.holidayType === 'turno'} onChange={(e) => setFormData({ ...formData, holidayType: e.target.value, emoji: '🔄' })} />
                <span className="text-yellow-600">Turno</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map(e => (
                <button key={e} type="button" onClick={() => setFormData({ ...formData, emoji: e })} className={`text-2xl p-2 rounded border-2 ${formData.emoji === e ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-400'}`}>{e}</button>
              ))}
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">{editingHoliday ? 'Guardar' : 'Añadir'}</button>
            <button onClick={() => { setShowForm(false); setEditingHoliday(null); }} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium ${activeTab === 'current' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Próximos ({currentHolidays.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 font-medium ${activeTab === 'past' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pasados ({pastHolidays.length})
        </button>
      </div>

      {activeTab === 'current' && renderTable(currentHolidays, true)}
      {activeTab === 'past' && renderTable(pastHolidays, false)}
    </div>
  );
};

const MyRequests = ({ currentUser, requests, addRequest, deleteRequest, calculateUserDays, isWeekend, isHoliday, getBusinessDays, showNotification, users = [], departments = [], getUserDepartments, updateUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState('range');
  const [selectedUserCode, setSelectedUserCode] = useState(currentUser.code);
  const [formData, setFormData] = useState({ type: 'vacation', startDate: '', endDate: '', dates: [], newDate: '', comments: '' });

  // Profile/WhatsApp settings
  const [showProfile, setShowProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileWhatsApp, setProfileWhatsApp] = useState(currentUser.whatsappNotifications ?? false);
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (phone) => {
    if (!phone) return true; // Empty is valid (optional)
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    return phoneRegex.test(phone);
  };

  const handleSaveProfile = async () => {
    if (profilePhone && !validatePhone(profilePhone)) {
      setPhoneError('Formato inválido. Usa formato internacional: +34612345678');
      return;
    }

    const userToUpdate = users.find(u => u.code === currentUser.code);
    if (userToUpdate) {
      await updateUser(userToUpdate.id, {
        ...userToUpdate,
        phone: profilePhone,
        whatsappNotifications: profileWhatsApp
      });
      setPhoneError('');
      setShowProfile(false);
      showNotification('success', 'Perfil actualizado');
    }
  };

  const targetUserCode = currentUser.isAdmin ? selectedUserCode : currentUser.code;
  const d = calculateUserDays(targetUserCode);
  const myReqs = requests.filter(r => r.userCode === targetUserCode).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const statusEmojis = { pending: '⏳', approved: '✅', denied: '❌' };
  const getTypeEmoji = (req) => req.type === 'other' ? '⚠️' : statusEmojis[req.status];

  // Get dates for the current request being created
  const getRequestDates = () => {
    if (requestType === 'range' && formData.startDate && formData.endDate) {
      const dates = [];
      let cur = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];
        if (!isWeekend(dateStr) && !isHoliday(dateStr)) dates.push(dateStr);
        cur.setDate(cur.getDate() + 1);
      }
      return dates;
    }
    return formData.dates.filter(d => !isWeekend(d) && !isHoliday(d));
  };

  // Find conflicts with coworkers in the same department(s)
  const findConflicts = () => {
    const requestDates = getRequestDates();
    if (requestDates.length === 0) return [];

    const targetUser = users.find(u => u.code === targetUserCode);
    const targetDepts = getUserDepartments ? getUserDepartments(targetUser) : (targetUser?.departments || []);
    if (targetDepts.length === 0) return [];

    // Find coworkers in the same department(s)
    const coworkers = users.filter(u => {
      if (u.code === targetUserCode) return false;
      const userDepts = getUserDepartments ? getUserDepartments(u) : (u.departments || []);
      return userDepts.some(d => targetDepts.includes(d));
    });

    const conflicts = [];
    coworkers.forEach(coworker => {
      const coworkerReqs = requests.filter(r =>
        r.userCode === coworker.code &&
        (r.status === 'approved' || r.status === 'pending')
      );

      coworkerReqs.forEach(req => {
        let reqDates = [];
        if (req.isRange) {
          let cur = new Date(req.startDate);
          const end = new Date(req.endDate);
          while (cur <= end) {
            reqDates.push(cur.toISOString().split('T')[0]);
            cur.setDate(cur.getDate() + 1);
          }
        } else {
          reqDates = req.dates || [];
        }

        const overlappingDates = requestDates.filter(d => reqDates.includes(d));
        if (overlappingDates.length > 0) {
          const coworkerDepts = getUserDepartments ? getUserDepartments(coworker) : (coworker.departments || []);
          const sharedDepts = coworkerDepts.filter(d => targetDepts.includes(d));
          conflicts.push({
            user: coworker,
            dates: overlappingDates,
            status: req.status,
            sharedDepts
          });
        }
      });
    });

    return conflicts;
  };

  const conflicts = findConflicts();

  // Check if user already has requests on the same dates
  const findOwnOverlap = () => {
    const requestDates = getRequestDates();
    if (requestDates.length === 0) return [];

    const userReqs = requests.filter(r =>
      r.userCode === targetUserCode &&
      (r.status === 'approved' || r.status === 'pending')
    );

    const overlappingDates = [];
    userReqs.forEach(req => {
      let reqDates = [];
      if (req.isRange) {
        let cur = new Date(req.startDate);
        const end = new Date(req.endDate);
        while (cur <= end) {
          reqDates.push(cur.toISOString().split('T')[0]);
          cur.setDate(cur.getDate() + 1);
        }
      } else {
        reqDates = req.dates || [];
      }
      requestDates.forEach(d => {
        if (reqDates.includes(d) && !overlappingDates.includes(d)) {
          overlappingDates.push(d);
        }
      });
    });

    return overlappingDates;
  };

  const handleSubmit = async () => {
    if (requestType === 'range' && (!formData.startDate || !formData.endDate)) { showNotification('error', 'Selecciona fechas'); return; }
    if (requestType === 'individual' && formData.dates.length === 0) { showNotification('error', 'Añade fechas'); return; }
    if (currentUser.isAdmin && !selectedUserCode) { showNotification('error', 'Selecciona un usuario'); return; }

    // Check for own overlapping dates
    const ownOverlap = findOwnOverlap();
    if (ownOverlap.length > 0) {
      showNotification('error', `Ya tienes una solicitud para: ${ownOverlap.slice(0, 3).join(', ')}${ownOverlap.length > 3 ? '...' : ''}`);
      return;
    }

    const requestData = {
      userCode: targetUserCode,
      type: currentUser.isAdmin ? formData.type : 'vacation',
      isRange: requestType === 'range',
      status: currentUser.isAdmin && formData.type === 'other' ? 'approved' : 'pending',
      comments: formData.comments,
      createdAt: new Date().toISOString(),
      startDate: requestType === 'range' ? formData.startDate : null,
      endDate: requestType === 'range' ? formData.endDate : null,
      dates: requestType === 'individual' ? formData.dates : [],
      createdByAdmin: currentUser.isAdmin ? currentUser.code : null
    };

    if (currentUser.isAdmin && formData.type === 'other') {
      requestData.approvedBy = currentUser.code;
      requestData.approvedByName = currentUser.name;
      requestData.approvedAt = new Date().toISOString();
    }

    await addRequest(requestData);
    setShowForm(false);
    setFormData({ type: 'vacation', startDate: '', endDate: '', dates: [], newDate: '', comments: '' });
  };

  const selectedUser = users.find(u => u.code === selectedUserCode);

  const [reqTab, setReqTab] = useState('current');

  // Separate current vs past requests
  const today = new Date().toISOString().split('T')[0];
  const isRequestPast = (req) => {
    if (req.isRange) return req.endDate < today;
    return req.dates?.every(d => d < today) || false;
  };

  const currentReqs = myReqs.filter(r => !isRequestPast(r));
  const pastReqs = myReqs.filter(r => isRequestPast(r));

  const renderRequest = (req, showDelete = true) => {
    const canDelete = req.status === 'pending' || (req.status === 'approved' && currentUser.isAdmin);
    return (
      <div key={req.id} className={`border rounded-lg p-4 ${req.type === 'other' ? 'bg-amber-50' : req.status === 'approved' ? 'bg-green-50' : ''}`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xl">{getTypeEmoji(req)}</span>
              <span className="font-medium">
                {req.type === 'other' ? 'Día especial' : (req.status === 'approved' ? 'Aprobado' : req.status === 'pending' ? 'Pendiente' : 'Denegado')}
              </span>
            </div>
            <div className="text-sm">{req.isRange ? <p>{req.startDate} al {req.endDate}</p> : <p>{req.dates?.join(', ')}</p>}</div>
            {req.status === 'approved' && req.approvedByName && (
              <p className="text-sm text-green-700 mt-1">
                Aprobada por: {req.approvedByName}
                {req.approvedAt && <span className="text-gray-500"> el {new Date(req.approvedAt).toLocaleDateString('es-ES')}</span>}
              </p>
            )}
          </div>
          {showDelete && canDelete && (
            <button onClick={() => { if (req.status === 'approved') { if (window.confirm('¿Seguro que quieres eliminar esta solicitud aprobada?')) deleteRequest(req.id); } else deleteRequest(req.id); }} className="text-red-600 flex items-center">
              <Trash2 className="w-4 h-4" /><span className="text-sm ml-1">{req.status === 'pending' ? 'Cancelar' : 'Eliminar'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {currentUser.isAdmin && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <label className="block text-sm font-medium mb-2">Seleccionar usuario</label>
          <select value={selectedUserCode} onChange={(e) => setSelectedUserCode(e.target.value)} className="w-full px-3 py-2 border rounded">
            <option value={currentUser.code}>{currentUser.name} {currentUser.lastName} (Yo)</option>
            {users.map(u => <option key={u.code} value={u.code}>{u.name} {u.lastName}</option>)}
          </select>
        </div>
      )}
      {selectedUserCode !== 'ADMIN' && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">{currentUser.isAdmin && selectedUserCode !== currentUser.code ? `Saldo de ${selectedUser?.name || 'Usuario'}` : 'Mi Saldo'}</h3>
          <div className="grid grid-cols-5 gap-4">
            <div><p className="text-sm text-gray-600">Totales</p><p className="text-xl font-bold text-blue-600">{d.total}</p></div>
            <div><p className="text-sm text-gray-600">Sobrantes</p><p className="text-xl font-bold text-purple-600">{d.carryOver}</p></div>
            <div><p className="text-sm text-gray-600">Usados</p><p className="text-xl font-bold text-red-600">{d.used}</p></div>
            <div><p className="text-sm text-gray-600">En espera</p><p className="text-xl font-bold text-orange-600">{d.waiting}</p></div>
            <div><p className="text-sm text-gray-600">Disponibles</p><p className="text-xl font-bold text-green-600">{d.available}</p></div>
          </div>
          {/* Desglose de días usados */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Desglose de días usados:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>📅 Vacaciones propias: <strong>{d.usedOwn || 0}</strong></span>
              <span>🏢 Días de cierre: <strong>{d.usedClosure || 0}</strong></span>
              <span>🔄 Vacaciones en turno: <strong>{d.usedTurno || 0}</strong></span>
              <span>⚠️ Días especiales: <strong>{d.usedOther || 0}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Profile/WhatsApp Settings - only for non-admin users viewing their own profile */}
      {!currentUser.isAdmin && (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notificaciones WhatsApp</h3>
            <button onClick={() => setShowProfile(!showProfile)} className="text-green-600 text-sm font-medium hover:text-green-700">
              {showProfile ? 'Cerrar' : 'Configurar'}
            </button>
          </div>
          {!showProfile && (
            <p className="text-sm text-gray-600 mt-1">
              {currentUser.whatsappNotifications && currentUser.phone
                ? `Activas - ${currentUser.phone}`
                : 'Desactivadas - Configura tu teléfono para recibir alertas'}
            </p>
          )}
          {showProfile && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={profileWhatsApp}
                    onChange={(e) => setProfileWhatsApp(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="font-medium">Recibir notificaciones por WhatsApp</span>
                </label>
              </div>
              {profileWhatsApp && (
                <div>
                  <label className="block text-sm font-medium mb-1">Número de teléfono</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => {
                      setProfilePhone(e.target.value);
                      setPhoneError('');
                    }}
                    className={`w-full px-3 py-2 border rounded ${phoneError ? 'border-red-500' : ''}`}
                    placeholder="+34612345678"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato internacional: +34 seguido del número (ej: +34612345678)</p>
                  {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
                </div>
              )}
              <div className="flex space-x-2">
                <button onClick={handleSaveProfile} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Guardar
                </button>
                <button onClick={() => {
                  setShowProfile(false);
                  setProfilePhone(currentUser.phone || '');
                  setProfileWhatsApp(currentUser.whatsappNotifications ?? false);
                  setPhoneError('');
                }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{currentUser.isAdmin && selectedUserCode !== currentUser.code ? `Solicitudes de ${selectedUser?.name || 'Usuario'}` : 'Mis Solicitudes'}</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /><span>Nueva</span></button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          {currentUser.isAdmin && (
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded">
              <option value="vacation">Vacaciones</option>
              <option value="other">Otros (Días especiales)</option>
            </select>
          )}
          <div className="flex space-x-4">
            <label className="flex items-center"><input type="radio" value="range" checked={requestType === 'range'} onChange={(e) => setRequestType(e.target.value)} className="mr-2" />Rango</label>
            <label className="flex items-center"><input type="radio" value="individual" checked={requestType === 'individual'} onChange={(e) => setRequestType(e.target.value)} className="mr-2" />Días sueltos</label>
          </div>
          {requestType === 'range' ? (
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="px-3 py-2 border rounded" />
            </div>
          ) : (
            <div>
              <div className="flex space-x-2 mb-2">
                <input type="date" value={formData.newDate} onChange={(e) => setFormData({ ...formData, newDate: e.target.value })} className="flex-1 px-3 py-2 border rounded" />
                <button onClick={() => { if (formData.newDate && !formData.dates.includes(formData.newDate)) setFormData({ ...formData, dates: [...formData.dates, formData.newDate].sort(), newDate: '' }); }} className="bg-indigo-600 text-white px-4 py-2 rounded">Añadir</button>
              </div>
              <div className="flex flex-wrap gap-2">{formData.dates.map(dt => <div key={dt} className="flex items-center bg-blue-100 px-3 py-1 rounded"><span>{dt}</span><button onClick={() => setFormData({ ...formData, dates: formData.dates.filter(x => x !== dt) })} className="ml-2 text-red-600"><X className="w-4 h-4" /></button></div>)}</div>
            </div>
          )}
          <textarea value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} className="w-full px-3 py-2 border rounded" rows="2" placeholder="Comentarios" />
          {currentUser.isAdmin && formData.type === 'other' && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">⚠️ Los días de tipo "Otros" se aprueban automáticamente y no restan del saldo de vacaciones.</div>
          )}
          {conflicts.length > 0 && (
            <div className="text-sm bg-orange-50 border border-orange-200 p-3 rounded">
              <div className="font-semibold text-orange-700 mb-2">⚠️ Conflictos detectados con compañeros de departamento:</div>
              <div className="space-y-1">
                {conflicts.map((c, idx) => (
                  <div key={idx} className="text-orange-600">
                    <span className="font-medium">{c.user.name} {c.user.lastName}</span>
                    <span className="text-gray-500"> ({c.sharedDepts.join(', ')})</span>
                    <span> - {c.status === 'approved' ? '✅ Aprobado' : '⏳ Pendiente'}</span>
                    <span className="text-gray-500"> - {c.dates.length} día(s): {c.dates.slice(0, 3).join(', ')}{c.dates.length > 3 ? '...' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">Enviar</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabs for current/past requests */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setReqTab('current')}
          className={`px-4 py-2 font-medium ${reqTab === 'current' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Actuales ({currentReqs.length})
        </button>
        <button
          onClick={() => setReqTab('past')}
          className={`px-4 py-2 font-medium ${reqTab === 'past' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Historial ({pastReqs.length})
        </button>
      </div>

      <div className="space-y-3">
        {reqTab === 'current' && (
          <>
            {currentReqs.map(req => renderRequest(req, true))}
            {currentReqs.length === 0 && <div className="text-center py-12 text-gray-500">Sin solicitudes actuales</div>}
          </>
        )}
        {reqTab === 'past' && (
          <>
            {pastReqs.map(req => renderRequest(req, currentUser.isAdmin))}
            {pastReqs.length === 0 && <div className="text-center py-12 text-gray-500">Sin historial</div>}
          </>
        )}
      </div>
    </div>
  );
};

const FeedbackManagement = ({ feedbacks, addFeedback, updateFeedback, deleteFeedback, currentUser, showNotification }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSubmit = async () => {
    if (!newMessage.trim()) {
      showNotification('error', 'Escribe un mensaje');
      return;
    }
    await addFeedback({
      message: newMessage.trim(),
      completed: false,
      createdBy: currentUser.name || currentUser.code,
      createdAt: new Date().toISOString(),
    });
    setNewMessage('');
  };

  const toggleComplete = async (feedback) => {
    await updateFeedback(feedback.id, {
      ...feedback,
      completed: !feedback.completed,
      completedAt: !feedback.completed ? new Date().toISOString() : null,
      completedBy: !feedback.completed ? (currentUser.name || currentUser.code) : null,
    });
  };

  const sortedFeedbacks = [...feedbacks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Feedback / Tareas</h2>

      {/* Formulario para añadir */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje o tarea..."
            className="flex-1 px-4 py-2 border rounded-lg"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Añadir
          </button>
        </div>
      </div>

      {/* Lista de feedbacks */}
      <div className="space-y-2">
        {sortedFeedbacks.length === 0 && (
          <div className="text-center py-12 text-gray-500">No hay feedback todavía</div>
        )}
        {sortedFeedbacks.map((fb) => (
          <div
            key={fb.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${fb.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
          >
            <button
              onClick={() => toggleComplete(fb)}
              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${fb.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-500'}`}
            >
              {fb.completed && <Check className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`${fb.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {fb.message}
              </p>
              <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                <span>Creado por: {fb.createdBy}</span>
                <span>·</span>
                <span>{new Date(fb.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {fb.completed && fb.completedBy && (
                  <>
                    <span>·</span>
                    <span className="text-green-600">Completado por: {fb.completedBy}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteFeedback(fb.id)}
              className="text-red-500 hover:text-red-700 p-1"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== TIMECLOCK VIEW ====================
const TimeclockView = ({ currentUser, timeclockRecords, addTimeclockRecord, updateTimeclockRecord, deleteTimeclockRecord, timeclockSettings, saveTimeclockSettings, users, showNotification, requests, holidays }) => {
  const [activeTimeclockTab, setActiveTimeclockTab] = useState('fichar');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState(null); // null, 'checking', 'valid', 'invalid', 'error'
  const [userLocation, setUserLocation] = useState(null);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = timeclockRecords.find(r => r.userCode === currentUser.code && r.date === today);

  // Calculate distance between two GPS coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Check GPS location
  const checkLocation = () => {
    return new Promise((resolve) => {
      if (!timeclockSettings?.latitude || !timeclockSettings?.longitude) {
        resolve({ valid: true, message: 'GPS no configurado' });
        return;
      }

      setLocationStatus('checking');

      if (!navigator.geolocation) {
        setLocationStatus('error');
        resolve({ valid: false, message: 'Geolocalización no disponible en tu navegador' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            timeclockSettings.latitude,
            timeclockSettings.longitude
          );
          const isValid = distance <= (timeclockSettings.radius || 100);
          setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude, distance });
          setLocationStatus(isValid ? 'valid' : 'invalid');
          resolve({
            valid: isValid,
            message: isValid ? 'Ubicación válida' : `Estás a ${Math.round(distance)}m de la oficina (máx: ${timeclockSettings.radius || 100}m)`,
            distance
          });
        },
        (error) => {
          setLocationStatus('error');
          let message = 'Error de ubicación';
          if (error.code === 1) message = 'Permiso de ubicación denegado';
          if (error.code === 2) message = 'Ubicación no disponible';
          if (error.code === 3) message = 'Tiempo de espera agotado';
          resolve({ valid: false, message });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Handle clock actions
  const handleClockAction = async (action) => {
    const locationCheck = await checkLocation();
    if (!locationCheck.valid) {
      showNotification('error', locationCheck.message);
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    // Get device info
    const userAgent = navigator.userAgent;
    let ipAddress = null;
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ipAddress = ipData.ip;
    } catch (e) {
      console.log('Could not get IP');
    }

    if (action === 'start') {
      await addTimeclockRecord({
        userCode: currentUser.code,
        date: today,
        startTime: timeStr,
        breaks: [],
        endTime: null,
        createdAt: now.toISOString(),
        deviceInfo: {
          userAgent,
          ip: ipAddress,
          timestamp: now.toISOString()
        }
      });
      showNotification('success', `Jornada iniciada a las ${timeStr}`);
    } else if (todayRecord) {
      if (action === 'breakfast' || action === 'lunch') {
        const breakType = action === 'breakfast' ? 'desayuno' : 'comida';
        const existingBreak = todayRecord.breaks?.find(b => b.type === breakType && !b.endTime);

        if (existingBreak) {
          // End existing break
          const updatedBreaks = todayRecord.breaks.map(b =>
            b.type === breakType && !b.endTime ? { ...b, endTime: timeStr } : b
          );
          await updateTimeclockRecord(todayRecord.id, { breaks: updatedBreaks });
          showNotification('success', `Pausa ${breakType} finalizada a las ${timeStr}`);
        } else {
          // Start new break
          const newBreaks = [...(todayRecord.breaks || []), { type: breakType, startTime: timeStr, endTime: null }];
          await updateTimeclockRecord(todayRecord.id, { breaks: newBreaks });
          showNotification('success', `Pausa ${breakType} iniciada a las ${timeStr}`);
        }
      } else if (action === 'end') {
        await updateTimeclockRecord(todayRecord.id, { endTime: timeStr });
        showNotification('success', `Jornada finalizada a las ${timeStr}`);
      }
    }
  };

  // Calculate worked time
  const calculateWorkedTime = (record) => {
    if (!record?.startTime) return { hours: 0, minutes: 0, formatted: '0h 0m' };

    const start = new Date(`${record.date}T${record.startTime}`);
    const end = record.endTime ? new Date(`${record.date}T${record.endTime}`) : new Date();
    let totalMinutes = Math.floor((end - start) / 60000);

    // Don't subtract breaks - they are just recorded, not deducted
    // (as per user requirement)

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, formatted: `${hours}h ${minutes}m` };
  };

  if (currentUser.isAdmin) {
    return (
      <TimeclockAdminView
        timeclockRecords={timeclockRecords}
        users={users}
        timeclockSettings={timeclockSettings}
        saveTimeclockSettings={saveTimeclockSettings}
        updateTimeclockRecord={updateTimeclockRecord}
        deleteTimeclockRecord={deleteTimeclockRecord}
        showNotification={showNotification}
        calculateWorkedTime={calculateWorkedTime}
        requests={requests}
        holidays={holidays}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs for normal users */}
      <div className="flex space-x-2 border-b pb-2">
        <button
          onClick={() => setActiveTimeclockTab('fichar')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeTimeclockTab === 'fichar' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Fichar
        </button>
        <button
          onClick={() => setActiveTimeclockTab('historial')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeTimeclockTab === 'historial' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Historial
        </button>
      </div>

      {activeTimeclockTab === 'fichar' && (
        <TimeclockUserDay
          todayRecord={todayRecord}
          currentTime={currentTime}
          locationStatus={locationStatus}
          handleClockAction={handleClockAction}
          calculateWorkedTime={calculateWorkedTime}
          timeclockSettings={timeclockSettings}
          onReopenDay={() => todayRecord && updateTimeclockRecord(todayRecord.id, { endTime: null })}
        />
      )}

      {activeTimeclockTab === 'historial' && (
        <TimeclockUserHistory
          timeclockRecords={timeclockRecords.filter(r => r.userCode === currentUser.code)}
          calculateWorkedTime={calculateWorkedTime}
        />
      )}
    </div>
  );
};

// ==================== USER DAY VIEW ====================
const TimeclockUserDay = ({ todayRecord, currentTime, locationStatus, handleClockAction, calculateWorkedTime, timeclockSettings, onReopenDay }) => {
  const workedTime = calculateWorkedTime(todayRecord);
  const hasActiveBreakfast = todayRecord?.breaks?.some(b => b.type === 'desayuno' && !b.endTime);
  const hasActiveLunch = todayRecord?.breaks?.some(b => b.type === 'comida' && !b.endTime);
  const hasEndedBreakfast = todayRecord?.breaks?.some(b => b.type === 'desayuno' && b.endTime);
  const hasEndedLunch = todayRecord?.breaks?.some(b => b.type === 'comida' && b.endTime);

  return (
    <div className="max-w-lg mx-auto">
      {/* Current time display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-bold text-gray-800 mb-2">
          {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-gray-500">
          {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* GPS Status */}
      {timeclockSettings?.latitude && (
        <div className={`flex items-center justify-center gap-2 mb-4 p-2 rounded-lg ${
          locationStatus === 'valid' ? 'bg-green-100 text-green-700' :
          locationStatus === 'invalid' ? 'bg-red-100 text-red-700' :
          locationStatus === 'error' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {locationStatus === 'checking' && 'Verificando ubicación...'}
            {locationStatus === 'valid' && 'Ubicación válida'}
            {locationStatus === 'invalid' && 'Fuera de la zona permitida'}
            {locationStatus === 'error' && 'Error de ubicación'}
            {!locationStatus && 'GPS requerido para fichar'}
          </span>
        </div>
      )}

      {/* Main action buttons */}
      <div className="space-y-4">
        {!todayRecord ? (
          <button
            onClick={() => handleClockAction('start')}
            className="w-full py-6 bg-green-500 hover:bg-green-600 text-white rounded-xl text-2xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.02]"
          >
            <Play className="w-8 h-8" />
            Empezar Jornada
          </button>
        ) : (
          <>
            {/* Status message */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-green-700 font-semibold text-lg">
                Jornada empezada a las {todayRecord.startTime}
              </div>
              {todayRecord.endTime && (
                <div className="text-green-600 mt-1">
                  Finalizada a las {todayRecord.endTime}
                </div>
              )}
            </div>

            {/* Break buttons */}
            {!todayRecord.endTime && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleClockAction('breakfast')}
                  className={`py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    hasActiveBreakfast
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : hasEndedBreakfast
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                  disabled={hasEndedBreakfast && !hasActiveBreakfast}
                >
                  <Coffee className="w-5 h-5" />
                  {hasActiveBreakfast ? 'Fin Desayuno' : hasEndedBreakfast ? 'Desayuno ✓' : 'Pausa Desayuno'}
                </button>
                <button
                  onClick={() => handleClockAction('lunch')}
                  className={`py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    hasActiveLunch
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : hasEndedLunch
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  disabled={hasEndedLunch && !hasActiveLunch}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  {hasActiveLunch ? 'Fin Comida' : hasEndedLunch ? 'Comida ✓' : 'Pausa Comida'}
                </button>
              </div>
            )}

            {/* End day button */}
            {!todayRecord.endTime && (
              <button
                onClick={() => handleClockAction('end')}
                className="w-full py-5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xl font-bold flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.02]"
              >
                <Square className="w-6 h-6" />
                Finalizar Jornada
              </button>
            )}
          </>
        )}
      </div>

      {/* Day summary */}
      {todayRecord && (
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">Resumen del día</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inicio:</span>
              <span className="font-medium">{todayRecord.startTime}</span>
            </div>
            {todayRecord.breaks?.map((brk, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 capitalize">Pausa {brk.type}:</span>
                <span className="font-medium">
                  {brk.startTime} - {brk.endTime || 'en curso'}
                </span>
              </div>
            ))}
            {todayRecord.endTime && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fin:</span>
                <span className="font-medium">{todayRecord.endTime}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-3 flex justify-between items-center">
              <span className="text-gray-800 font-semibold">Tiempo trabajado:</span>
              <span className="text-2xl font-bold text-indigo-600">{workedTime.formatted}</span>
            </div>
          </div>

          {/* Reopen day button */}
          {todayRecord.endTime && onReopenDay && (
            <button
              onClick={onReopenDay}
              className="mt-4 w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4" />
              Me he equivocado, jornada no terminada aún
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ==================== USER HISTORY VIEW ====================
const TimeclockUserHistory = ({ timeclockRecords, calculateWorkedTime }) => {
  const sortedRecords = [...timeclockRecords].sort((a, b) => b.date.localeCompare(a.date));

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Historial de fichajes</h3>

      {sortedRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay registros de fichaje
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRecords.map(record => {
            const worked = calculateWorkedTime(record);
            return (
              <div key={record.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800">{formatDate(record.date)}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {record.startTime} - {record.endTime || 'En curso'}
                    </div>
                    {record.breaks?.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Pausas: {record.breaks.map(b => `${b.type} (${b.startTime}-${b.endTime || '...'})`).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">{worked.formatted}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== WEEKLY STATS TABLE ====================
const WeeklyStatsTable = ({ timeclockRecords, users, calculateWorkedTime, requests, holidays, onCellClick, weekOffset: externalWeekOffset, setWeekOffset: externalSetWeekOffset }) => {
  const [internalWeekOffset, setInternalWeekOffset] = useState(0);
  const weekOffset = externalWeekOffset !== undefined ? externalWeekOffset : internalWeekOffset;
  const setWeekOffset = externalSetWeekOffset || setInternalWeekOffset;

  // Get week dates based on offset (0 = current week, -1 = last week, etc.) - ONLY Mon-Fri
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday + (weekOffset * 7));

    const dates = [];
    for (let i = 0; i < 5; i++) { // Only 5 days (Mon-Fri)
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Get ISO week number
  const getWeekNumber = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const weekDates = getWeekDates();
  const weekNumber = getWeekNumber(weekDates[0]);
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

  // Calculate break duration in minutes
  const getBreakMinutes = (record, breakType) => {
    if (!record?.breaks) return 0;
    const brk = record.breaks.find(b => b.type === breakType);
    if (!brk || !brk.startTime || !brk.endTime) return 0;
    const start = new Date(`2000-01-01T${brk.startTime}`);
    const end = new Date(`2000-01-01T${brk.endTime}`);
    return Math.floor((end - start) / 60000);
  };

  const formatMinutes = (mins) => {
    if (mins === 0) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  // Get record for user on specific date
  const getRecord = (userCode, date) => {
    return timeclockRecords.find(r => r.userCode === userCode && r.date === date);
  };

  // Check if entry time deviates more than 20 minutes from scheduled time
  const hasEntryDeviation = (user, record, date) => {
    if (!record?.startTime) return false;
    const defaultSchedule = {
      lunes: { entrada: '08:00', salida: '17:00', activo: true },
      martes: { entrada: '08:00', salida: '17:00', activo: true },
      miercoles: { entrada: '08:00', salida: '17:00', activo: true },
      jueves: { entrada: '08:00', salida: '17:00', activo: true },
      viernes: { entrada: '08:00', salida: '15:00', activo: true }
    };
    const schedule = user?.schedule || defaultSchedule;
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const dayMap = { 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes' };
    const dayKey = dayMap[dayOfWeek];
    if (!dayKey || !schedule[dayKey]?.activo) return false;

    const scheduledEntry = schedule[dayKey].entrada;
    const [schedH, schedM] = scheduledEntry.split(':').map(Number);
    const [actualH, actualM] = record.startTime.split(':').map(Number);
    const schedMins = schedH * 60 + schedM;
    const actualMins = actualH * 60 + actualM;
    const diff = Math.abs(actualMins - schedMins);
    return diff > 20;
  };

  // Check if user has vacation/request on a specific date
  const getVacationInfo = (userCode, date) => {
    const req = requests?.find(r => {
      if (r.userCode !== userCode) return false;
      if (r.status !== 'approved' && r.status !== 'pending') return false;
      if (r.isRange) {
        return date >= r.startDate && date <= r.endDate;
      }
      return r.dates?.includes(date);
    });
    return req;
  };

  // Check if date is a holiday
  const getHolidayInfo = (date) => {
    return holidays?.find(h => h.date === date);
  };

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDate();
  };

  const getMonthYear = () => {
    const d = new Date(weekDates[0] + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Semana anterior
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold capitalize">{getMonthYear()}</h3>
          <span className="text-sm text-gray-500">Semana {weekNumber}</span>
        </div>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
          disabled={weekOffset >= 0}
        >
          Semana siguiente <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekly table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* Day names row */}
            <tr className="bg-indigo-600 text-white">
              <th className="p-2 border border-indigo-500 text-left sticky left-0 bg-indigo-600 z-10" rowSpan={2}>
                Empleado
              </th>
              {weekDates.map((date, idx) => {
                const holiday = getHolidayInfo(date);
                return (
                  <th key={date} colSpan={3} className={`p-2 border border-indigo-500 text-center ${holiday ? 'bg-red-500' : ''}`}>
                    {dayNames[idx]} {formatDateHeader(date)}
                    {holiday && <span className="ml-1" title={holiday.name}>{holiday.emoji || '🎉'}</span>}
                  </th>
                );
              })}
              <th className="p-2 border border-indigo-500 text-center bg-indigo-800" colSpan={3}>
                Totales
              </th>
            </tr>
            {/* Sub-headers row */}
            <tr className="bg-indigo-100 text-indigo-800 text-xs">
              {weekDates.map((date) => (
                <React.Fragment key={`sub-${date}`}>
                  <th className="p-1 border text-center" title="Horas trabajadas">Trab</th>
                  <th className="p-1 border text-center" title="Pausa desayuno">Des</th>
                  <th className="p-1 border text-center" title="Pausa comida">Com</th>
                </React.Fragment>
              ))}
              <th className="p-1 border text-center bg-indigo-200" title="Total trabajado">Trab</th>
              <th className="p-1 border text-center bg-indigo-200" title="Total desayuno">Des</th>
              <th className="p-1 border text-center bg-indigo-200" title="Total comida">Com</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => !u.isAdmin).map(user => {
              let totalWorkedMinutes = 0;
              let totalBreakfastMinutes = 0;
              let totalLunchMinutes = 0;

              return (
                <tr key={user.code} className="hover:bg-gray-50">
                  <td className="p-2 border font-medium sticky left-0 bg-white z-10">
                    {user.name} {user.lastName}
                  </td>
                  {weekDates.map((date) => {
                    const record = getRecord(user.code, date);
                    const vacation = getVacationInfo(user.code, date);
                    const holiday = getHolidayInfo(date);

                    const worked = record ? calculateWorkedTime(record) : { hours: 0, minutes: 0 };
                    const workedMins = worked.hours * 60 + worked.minutes;
                    const breakfastMins = getBreakMinutes(record, 'desayuno');
                    const lunchMins = getBreakMinutes(record, 'comida');

                    if (record?.endTime) {
                      totalWorkedMinutes += workedMins;
                      totalBreakfastMinutes += breakfastMins;
                      totalLunchMinutes += lunchMins;
                    }

                    // Determine cell background and content based on vacation/holiday
                    let cellBg = '';
                    let cellContent = null;

                    if (vacation) {
                      const emoji = vacation.type === 'other' ? '⚠️' : (vacation.status === 'approved' ? '✅' : '⏳');
                      const bgColor = vacation.status === 'approved' ? 'bg-green-100' : 'bg-yellow-100';
                      cellBg = bgColor;
                      cellContent = (
                        <td colSpan={3} className={`p-1 border text-center ${bgColor}`}>
                          <span title={vacation.type === 'other' ? 'Día especial' : 'Vacaciones'}>
                            {emoji} {vacation.type === 'other' ? 'Especial' : 'Vacaciones'}
                          </span>
                        </td>
                      );
                    } else if (holiday?.isLocal) {
                      cellContent = (
                        <td colSpan={3} className="p-1 border text-center bg-red-50">
                          <span title={holiday.name}>
                            {holiday.emoji || '🎉'} Festivo
                          </span>
                        </td>
                      );
                    }

                    if (cellContent) return <React.Fragment key={`${user.code}-${date}`}>{cellContent}</React.Fragment>;

                    const handleClick = () => onCellClick && onCellClick(date, user.code);
                    const clickableClass = onCellClick ? 'cursor-pointer hover:bg-gray-100' : '';
                    const deviation = hasEntryDeviation(user, record, date);
                    const deviationClass = deviation && record?.endTime ? 'bg-red-100' : '';

                    return (
                      <React.Fragment key={`${user.code}-${date}`}>
                        <td
                          className={`p-1 border text-center ${record?.endTime ? 'text-green-700 font-medium' : 'text-gray-400'} ${clickableClass} ${deviationClass}`}
                          onClick={handleClick}
                          title={deviation ? 'Entrada desviada más de 20 min' : 'Clic para ver registro'}
                        >
                          {record?.endTime ? formatMinutes(workedMins) : (record?.startTime ? '...' : '-')}
                        </td>
                        <td
                          className={`p-1 border text-center text-xs text-orange-600 ${clickableClass}`}
                          onClick={handleClick}
                          title="Clic para ver registro"
                        >
                          {formatMinutes(breakfastMins)}
                        </td>
                        <td
                          className={`p-1 border text-center text-xs text-blue-600 ${clickableClass}`}
                          onClick={handleClick}
                          title="Clic para ver registro"
                        >
                          {formatMinutes(lunchMins)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="p-2 border text-center font-bold text-indigo-600 bg-indigo-50">
                    {formatMinutes(totalWorkedMinutes)}
                  </td>
                  <td className="p-1 border text-center text-xs text-orange-600 bg-indigo-50">
                    {formatMinutes(totalBreakfastMinutes)}
                  </td>
                  <td className="p-1 border text-center text-xs text-blue-600 bg-indigo-50">
                    {formatMinutes(totalLunchMinutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span><span className="text-green-700 font-medium">Trab</span> = Horas trabajadas</span>
        <span><span className="text-orange-600">Des</span> = Pausa desayuno</span>
        <span><span className="text-blue-600">Com</span> = Pausa comida</span>
        <span>✅ = Vacaciones aprobadas</span>
        <span>⏳ = Vacaciones pendientes</span>
        <span>⚠️ = Día especial</span>
        <span>🎉 = Festivo</span>
      </div>
    </div>
  );
};

// ==================== YEARLY STATS TABLE ====================
const YearlyStatsTable = ({ timeclockRecords, users, calculateWorkedTime, onWeekClick }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get all weeks of the year with their date ranges
  const getWeeksOfYear = (year) => {
    const weeks = [];
    const firstDay = new Date(year, 0, 1);
    // Find first Monday
    let firstMonday = new Date(firstDay);
    const dayOfWeek = firstMonday.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
    firstMonday.setDate(firstMonday.getDate() + daysToMonday);

    let currentMonday = new Date(firstMonday);
    let weekNum = 1;

    while (currentMonday.getFullYear() === year || (currentMonday.getFullYear() === year - 1 && weekNum === 1)) {
      const weekStart = new Date(currentMonday);
      const weekEnd = new Date(currentMonday);
      weekEnd.setDate(weekEnd.getDate() + 4); // Friday

      if (weekStart.getFullYear() > year) break;

      weeks.push({
        weekNum,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        month: weekStart.getMonth()
      });

      currentMonday.setDate(currentMonday.getDate() + 7);
      weekNum++;
      if (weekNum > 53) break;
    }
    return weeks;
  };

  const weeks = getWeeksOfYear(selectedYear);
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Group weeks by month for header
  const getMonthSpans = () => {
    const spans = [];
    let currentMonth = -1;
    let count = 0;

    weeks.forEach((week, idx) => {
      if (week.month !== currentMonth) {
        if (count > 0) {
          spans.push({ month: currentMonth, count });
        }
        currentMonth = week.month;
        count = 1;
      } else {
        count++;
      }
      if (idx === weeks.length - 1) {
        spans.push({ month: currentMonth, count });
      }
    });
    return spans;
  };

  const monthSpans = getMonthSpans();

  // Calculate break duration in minutes
  const getBreakMinutes = (record, breakType) => {
    if (!record?.breaks) return 0;
    const brk = record.breaks.find(b => b.type === breakType);
    if (!brk || !brk.startTime || !brk.endTime) return 0;
    const start = new Date(`2000-01-01T${brk.startTime}`);
    const end = new Date(`2000-01-01T${brk.endTime}`);
    return Math.floor((end - start) / 60000);
  };

  // Get stats for a user in a specific week
  const getWeekStats = (userCode, week) => {
    const weekRecords = timeclockRecords.filter(r => {
      if (r.userCode !== userCode) return false;
      return r.date >= week.startDate && r.date <= week.endDate;
    });

    let workedMins = 0;
    let breakfastMins = 0;
    let lunchMins = 0;

    weekRecords.forEach(r => {
      if (r.endTime) {
        const worked = calculateWorkedTime(r);
        workedMins += worked.hours * 60 + worked.minutes;
        breakfastMins += getBreakMinutes(r, 'desayuno');
        lunchMins += getBreakMinutes(r, 'comida');
      }
    });

    return { workedMins, breakfastMins, lunchMins };
  };

  const formatMinutes = (mins) => {
    if (mins === 0) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h${m > 0 ? `${m}m` : ''}`;
  };

  const formatHours = (mins) => {
    if (mins === 0) return '-';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setSelectedYear(selectedYear - 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> {selectedYear - 1}
        </button>
        <h3 className="text-xl font-bold">{selectedYear}</h3>
        <button
          onClick={() => setSelectedYear(selectedYear + 1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
          disabled={selectedYear >= currentYear}
        >
          {selectedYear + 1} <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Yearly table */}
      <div className="relative">
        <div className="overflow-x-auto" style={{ marginRight: '150px' }}>
          <table className="border-collapse text-xs">
            <thead>
              {/* Month row */}
              <tr className="bg-indigo-700 text-white">
                <th className="p-2 border border-indigo-600 text-left sticky left-0 bg-indigo-700 z-20 min-w-[140px]" rowSpan={3}>
                  Empleado
                </th>
                {monthSpans.map((span, idx) => (
                  <th
                    key={idx}
                    colSpan={span.count * 3}
                    className="p-1 border border-indigo-600 text-center font-bold"
                  >
                    {monthNames[span.month]}
                  </th>
                ))}
              </tr>
              {/* Week numbers row */}
              <tr className="bg-indigo-600 text-white">
                {weeks.map((week) => (
                  <th
                    key={week.weekNum}
                    colSpan={3}
                    className="p-1 border border-indigo-500 text-center cursor-pointer hover:bg-indigo-500"
                    onClick={() => onWeekClick && onWeekClick(week.weekNum, week.startDate)}
                    title={`Semana ${week.weekNum}: ${week.startDate} - ${week.endDate}`}
                  >
                    S{week.weekNum}
                  </th>
                ))}
              </tr>
              {/* Sub-headers row */}
              <tr className="bg-indigo-100 text-indigo-800">
                {weeks.map((week) => (
                  <React.Fragment key={`sub-${week.weekNum}`}>
                    <th className="p-1 border text-center" style={{ minWidth: '35px' }}>T</th>
                    <th className="p-1 border text-center" style={{ minWidth: '35px' }}>D</th>
                    <th className="p-1 border text-center" style={{ minWidth: '35px' }}>C</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.filter(u => !u.isAdmin).map(user => {
                let yearWorkedMins = 0;
                let yearBreakfastMins = 0;
                let yearLunchMins = 0;

                const weekCells = weeks.map(week => {
                  const stats = getWeekStats(user.code, week);
                  yearWorkedMins += stats.workedMins;
                  yearBreakfastMins += stats.breakfastMins;
                  yearLunchMins += stats.lunchMins;

                  return (
                    <React.Fragment key={`${user.code}-${week.weekNum}`}>
                      <td
                        className="p-1 border text-center cursor-pointer hover:bg-gray-100 text-green-700"
                        onClick={() => onWeekClick && onWeekClick(week.weekNum, week.startDate)}
                      >
                        {formatHours(stats.workedMins)}
                      </td>
                      <td
                        className="p-1 border text-center cursor-pointer hover:bg-gray-100 text-orange-600"
                        onClick={() => onWeekClick && onWeekClick(week.weekNum, week.startDate)}
                      >
                        {formatMinutes(stats.breakfastMins)}
                      </td>
                      <td
                        className="p-1 border text-center cursor-pointer hover:bg-gray-100 text-blue-600"
                        onClick={() => onWeekClick && onWeekClick(week.weekNum, week.startDate)}
                      >
                        {formatMinutes(stats.lunchMins)}
                      </td>
                    </React.Fragment>
                  );
                });

                return (
                  <tr key={user.code} className="hover:bg-gray-50">
                    <td className="p-2 border font-medium sticky left-0 bg-white z-10 min-w-[140px]">
                      {user.name} {user.lastName}
                    </td>
                    {weekCells}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fixed totals on the right */}
        <div className="absolute top-0 right-0 bg-white border-l-2 border-indigo-300 shadow-lg" style={{ width: '150px' }}>
          <table className="border-collapse text-xs w-full">
            <thead>
              <tr className="bg-indigo-800 text-white">
                <th colSpan={3} className="p-2 border border-indigo-700 text-center" style={{ height: '37px' }}>
                  Total Anual
                </th>
              </tr>
              <tr className="bg-indigo-600 text-white">
                <th colSpan={3} className="p-1 border border-indigo-500 text-center" style={{ height: '29px' }}>
                  {selectedYear}
                </th>
              </tr>
              <tr className="bg-indigo-200 text-indigo-800">
                <th className="p-1 border text-center" style={{ width: '50px' }}>T</th>
                <th className="p-1 border text-center" style={{ width: '50px' }}>D</th>
                <th className="p-1 border text-center" style={{ width: '50px' }}>C</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => !u.isAdmin).map(user => {
                let yearWorkedMins = 0;
                let yearBreakfastMins = 0;
                let yearLunchMins = 0;

                weeks.forEach(week => {
                  const stats = getWeekStats(user.code, week);
                  yearWorkedMins += stats.workedMins;
                  yearBreakfastMins += stats.breakfastMins;
                  yearLunchMins += stats.lunchMins;
                });

                return (
                  <tr key={user.code} className="bg-indigo-50">
                    <td className="p-1 border text-center font-bold text-green-700" style={{ height: '33px' }}>
                      {formatHours(yearWorkedMins)}
                    </td>
                    <td className="p-1 border text-center font-bold text-orange-600">
                      {formatMinutes(yearBreakfastMins)}
                    </td>
                    <td className="p-1 border text-center font-bold text-blue-600">
                      {formatMinutes(yearLunchMins)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-4">
        <span><span className="text-green-700 font-medium">T</span> = Horas trabajadas</span>
        <span><span className="text-orange-600">D</span> = Pausa desayuno</span>
        <span><span className="text-blue-600">C</span> = Pausa comida</span>
        <span className="text-gray-500">Click en semana para ver detalle</span>
      </div>
    </div>
  );
};

// ==================== ADMIN VIEW ====================
const TimeclockAdminView = ({ timeclockRecords, users, timeclockSettings, saveTimeclockSettings, updateTimeclockRecord, deleteTimeclockRecord, showNotification, calculateWorkedTime, requests, holidays }) => {
  const [activeAdminTab, setActiveAdminTab] = useState('estadisticas');
  const [statsSubTab, setStatsSubTab] = useState('semanal');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);

  // GPS Settings state
  const [gpsForm, setGpsForm] = useState({
    latitude: timeclockSettings?.latitude || '',
    longitude: timeclockSettings?.longitude || '',
    radius: timeclockSettings?.radius || 100
  });

  useEffect(() => {
    if (timeclockSettings) {
      setGpsForm({
        latitude: timeclockSettings.latitude || '',
        longitude: timeclockSettings.longitude || '',
        radius: timeclockSettings.radius || 100
      });
    }
  }, [timeclockSettings]);

  // Detect conflicts: vacation day with timeclock record
  const getConflicts = () => {
    const conflicts = [];
    const approvedVacations = requests?.filter(r => r.status === 'approved') || [];

    approvedVacations.forEach(vacation => {
      const user = users.find(u => u.code === vacation.userCode);
      let vacationDates = [];

      if (vacation.isRange) {
        let cur = new Date(vacation.startDate);
        const end = new Date(vacation.endDate);
        while (cur <= end) {
          vacationDates.push(cur.toISOString().split('T')[0]);
          cur.setDate(cur.getDate() + 1);
        }
      } else {
        vacationDates = vacation.dates || [];
      }

      vacationDates.forEach(date => {
        const record = timeclockRecords.find(r => r.userCode === vacation.userCode && r.date === date);
        if (record) {
          conflicts.push({
            id: `${vacation.id}-${record.id}`,
            user,
            date,
            vacation,
            record
          });
        }
      });
    });

    return conflicts.sort((a, b) => b.date.localeCompare(a.date));
  };

  const conflicts = getConflicts();

  const handleSaveGps = async () => {
    if (!gpsForm.latitude || !gpsForm.longitude) {
      showNotification('error', 'Introduce las coordenadas');
      return;
    }
    await saveTimeclockSettings({
      latitude: parseFloat(gpsForm.latitude),
      longitude: parseFloat(gpsForm.longitude),
      radius: parseInt(gpsForm.radius) || 100
    });
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record.id);
    setEditForm({
      startTime: record.startTime || '',
      endTime: record.endTime || '',
      breaks: record.breaks || []
    });
  };

  const handleSaveEdit = async (recordId) => {
    await updateTimeclockRecord(recordId, editForm);
    setEditingRecord(null);
    showNotification('success', 'Registro actualizado');
  };

  // Filter records
  const filteredRecords = timeclockRecords.filter(r => {
    if (selectedUser !== 'all' && r.userCode !== selectedUser) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Get records for selected date
  const dateRecords = filteredRecords.filter(r => r.date === selectedDate);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Admin sub-tabs */}
      <div className="flex space-x-2 border-b pb-2">
        <button
          onClick={() => setActiveAdminTab('estadisticas')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeAdminTab === 'estadisticas' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Estadísticas
        </button>
        <button
          onClick={() => setActiveAdminTab('registros')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeAdminTab === 'registros' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Registros
        </button>
        <button
          onClick={() => setActiveAdminTab('configuracion')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeAdminTab === 'configuracion' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Configuración GPS
        </button>
        <button
          onClick={() => setActiveAdminTab('conflictos')}
          className={`px-4 py-2 rounded-t-lg font-medium relative ${activeAdminTab === 'conflictos' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Conflictos
          {conflicts.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {conflicts.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats Tab with sub-tabs */}
      {activeAdminTab === 'estadisticas' && (
        <div className="space-y-4">
          {/* Sub-tabs: Semanal / Anual */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setStatsSubTab('semanal')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${statsSubTab === 'semanal' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setStatsSubTab('anual')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${statsSubTab === 'anual' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Anual
            </button>
          </div>

          {/* Weekly Stats */}
          {statsSubTab === 'semanal' && (
            <WeeklyStatsTable
              timeclockRecords={timeclockRecords}
              users={users}
              calculateWorkedTime={calculateWorkedTime}
              requests={requests}
              holidays={holidays}
              weekOffset={weekOffset}
              setWeekOffset={setWeekOffset}
              onCellClick={(date, userCode) => {
                setSelectedDate(date);
                setSelectedUser(userCode);
                setActiveAdminTab('registros');
              }}
            />
          )}

          {/* Yearly Stats */}
          {statsSubTab === 'anual' && (
            <YearlyStatsTable
              timeclockRecords={timeclockRecords}
              users={users}
              calculateWorkedTime={calculateWorkedTime}
              onWeekClick={(weekNum, startDate) => {
                // Calculate week offset from current week
                const today = new Date();
                const targetDate = new Date(startDate + 'T00:00:00');
                const diffTime = targetDate - today;
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const diffWeeks = Math.floor(diffDays / 7);
                setWeekOffset(diffWeeks);
                setStatsSubTab('semanal');
              }}
            />
          )}
        </div>
      )}

      {/* Records Tab */}
      {activeAdminTab === 'registros' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Usuario</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">Todos</option>
                {users.filter(u => !u.isAdmin).map(u => (
                  <option key={u.code} value={u.code}>{u.name} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {dateRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros para esta fecha
              </div>
            ) : (
              dateRecords.map(record => {
                const user = users.find(u => u.code === record.userCode);
                const worked = calculateWorkedTime(record);
                const isEditing = editingRecord === record.id;

                return (
                  <div key={record.id} className="bg-white border rounded-lg p-4 shadow-sm">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="font-semibold">{user?.name} {user?.lastName} - {formatDate(record.date)}</div>

                        {/* Entry/Exit times */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600">Entrada</label>
                            <input
                              type="time"
                              value={editForm.startTime}
                              onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600">Salida</label>
                            <input
                              type="time"
                              value={editForm.endTime}
                              onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                              className="w-full px-3 py-2 border rounded"
                            />
                          </div>
                        </div>

                        {/* Breaks editing */}
                        {editForm.breaks?.length > 0 && (
                          <div className="border-t pt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pausas</label>
                            {editForm.breaks.map((brk, idx) => (
                              <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-center">
                                <span className="text-sm text-gray-600 capitalize">{brk.type}:</span>
                                <input
                                  type="time"
                                  value={brk.startTime || ''}
                                  onChange={(e) => {
                                    const newBreaks = [...editForm.breaks];
                                    newBreaks[idx] = { ...newBreaks[idx], startTime: e.target.value };
                                    setEditForm({ ...editForm, breaks: newBreaks });
                                  }}
                                  className="px-2 py-1 border rounded text-sm"
                                  placeholder="Inicio"
                                />
                                <span className="text-center">-</span>
                                <input
                                  type="time"
                                  value={brk.endTime || ''}
                                  onChange={(e) => {
                                    const newBreaks = [...editForm.breaks];
                                    newBreaks[idx] = { ...newBreaks[idx], endTime: e.target.value };
                                    setEditForm({ ...editForm, breaks: newBreaks });
                                  }}
                                  className="px-2 py-1 border rounded text-sm"
                                  placeholder="Fin"
                                />
                                <button
                                  onClick={() => {
                                    const newBreaks = editForm.breaks.filter((_, i) => i !== idx);
                                    setEditForm({ ...editForm, breaks: newBreaks });
                                  }}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                  title="Eliminar pausa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add break buttons */}
                        <div className="flex gap-2">
                          {!editForm.breaks?.some(b => b.type === 'desayuno') && (
                            <button
                              onClick={() => setEditForm({
                                ...editForm,
                                breaks: [...(editForm.breaks || []), { type: 'desayuno', startTime: '', endTime: '' }]
                              })}
                              className="text-sm px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            >
                              + Desayuno
                            </button>
                          )}
                          {!editForm.breaks?.some(b => b.type === 'comida') && (
                            <button
                              onClick={() => setEditForm({
                                ...editForm,
                                breaks: [...(editForm.breaks || []), { type: 'comida', startTime: '', endTime: '' }]
                              })}
                              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              + Comida
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSaveEdit(record.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" /> Guardar
                          </button>
                          <button
                            onClick={() => setEditingRecord(null)}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {user?.name} {user?.lastName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {record.startTime} - {record.endTime || 'En curso'}
                          </div>
                          {record.breaks?.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Pausas: {record.breaks.map(b => `${b.type} (${b.startTime}-${b.endTime || '...'})`).join(', ')}
                            </div>
                          )}
                          {record.deviceInfo && (
                            <div className="text-xs text-gray-400 mt-1 font-mono">
                              📱 {record.deviceInfo.userAgent?.substring(0, 80)}{record.deviceInfo.userAgent?.length > 80 ? '...' : ''}
                              {record.deviceInfo.ip && <span className="ml-2">| IP: {record.deviceInfo.ip}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-indigo-600 mr-2">{worked.formatted}</div>
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTimeclockRecord(record.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Show all records if no date filter */}
          {selectedDate === '' && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Todos los registros</h4>
              {filteredRecords.slice(0, 50).map(record => {
                const user = users.find(u => u.code === record.userCode);
                const worked = calculateWorkedTime(record);
                return (
                  <div key={record.id} className="bg-white border rounded-lg p-3 mb-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{user?.name}</span>
                      <span className="text-gray-500 ml-2">{formatDate(record.date)}</span>
                      <span className="text-gray-600 ml-2">{record.startTime} - {record.endTime || '...'}</span>
                    </div>
                    <span className="font-bold text-indigo-600">{worked.formatted}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GPS Config Tab */}
      {activeAdminTab === 'configuracion' && (
        <div className="max-w-lg space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Configuración de ubicación GPS
            </h3>
            <p className="text-sm text-blue-700">
              Define las coordenadas de la oficina y el radio permitido para fichar.
              Los empleados solo podrán fichar si están dentro del radio especificado.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input
                type="number"
                step="any"
                placeholder="Ej: 41.3851"
                value={gpsForm.latitude}
                onChange={(e) => setGpsForm({ ...gpsForm, latitude: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input
                type="number"
                step="any"
                placeholder="Ej: 2.1734"
                value={gpsForm.longitude}
                onChange={(e) => setGpsForm({ ...gpsForm, longitude: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Radio permitido (metros)</label>
              <input
                type="number"
                placeholder="100"
                value={gpsForm.radius}
                onChange={(e) => setGpsForm({ ...gpsForm, radius: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={handleSaveGps}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Guardar configuración
            </button>
          </div>

          {timeclockSettings?.latitude && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700">
                <strong>Configuración actual:</strong><br />
                Lat: {timeclockSettings.latitude}, Lon: {timeclockSettings.longitude}<br />
                Radio: {timeclockSettings.radius}m
              </div>
            </div>
          )}

          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium mb-2">¿Cómo obtener las coordenadas?</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Abre Google Maps en el navegador</li>
              <li>Haz clic derecho en la ubicación de la oficina</li>
              <li>Copia las coordenadas que aparecen (primer número es latitud, segundo longitud)</li>
            </ol>
          </div>
        </div>
      )}

      {/* Conflicts Tab */}
      {activeAdminTab === 'conflictos' && (
        <div className="space-y-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>No hay conflictos detectados</p>
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>⚠️ {conflicts.length} conflicto{conflicts.length > 1 ? 's' : ''} detectado{conflicts.length > 1 ? 's' : ''}:</strong> Hay días con vacaciones aprobadas que también tienen registros de fichaje.
                </p>
              </div>
              <div className="space-y-3">
                {conflicts.map(conflict => {
                  const worked = calculateWorkedTime(conflict.record);
                  return (
                    <div key={conflict.id} className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {conflict.user?.name} {conflict.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            📅 <strong>{new Date(conflict.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                          </div>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="text-green-700">
                              ✅ Vacaciones aprobadas: {conflict.vacation.type === 'other' ? 'Día especial' : 'Vacaciones'}
                            </div>
                            <div className="text-blue-700">
                              🕐 Fichaje: {conflict.record.startTime} - {conflict.record.endTime || 'En curso'} ({worked.formatted})
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => deleteTimeclockRecord(conflict.record.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                            title="Eliminar el fichaje"
                          >
                            🗑️ Eliminar fichaje
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VacationManager;
