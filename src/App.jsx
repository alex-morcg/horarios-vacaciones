import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Settings, LogOut, Plus, Check, X, Trash2, Eye, ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [calendarView, setCalendarView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [notification, setNotification] = useState(null);
  const [viewingUserHistory, setViewingUserHistory] = useState(null);

  const defaultHolidays = [
    { date: '2026-01-01', name: 'Año Nuevo', isLocal: true }, { date: '2026-01-06', name: 'Reyes', isLocal: true },
    { date: '2026-04-03', name: 'Viernes Santo', isLocal: true }, { date: '2026-04-06', name: 'Lunes de Pascua', isLocal: true },
    { date: '2026-05-01', name: 'Fiesta del Trabajo', isLocal: true }, { date: '2026-06-24', name: 'San Juan', isLocal: true },
    { date: '2026-08-15', name: 'Asunción', isLocal: true }, { date: '2026-09-11', name: 'Diada de Cataluña', isLocal: true },
    { date: '2026-09-24', name: 'La Mercè', isLocal: true }, { date: '2026-10-12', name: 'Fiesta Nacional', isLocal: true },
    { date: '2026-11-01', name: 'Todos los Santos', isLocal: true }, { date: '2026-12-06', name: 'Constitución', isLocal: true },
    { date: '2026-12-08', name: 'Inmaculada', isLocal: true }, { date: '2026-12-25', name: 'Navidad', isLocal: true },
    { date: '2026-12-26', name: 'San Esteban', isLocal: true },
    { date: '2027-01-01', name: 'Año Nuevo', isLocal: true }, { date: '2027-01-06', name: 'Reyes', isLocal: true },
    { date: '2027-03-26', name: 'Viernes Santo', isLocal: true }, { date: '2027-03-29', name: 'Lunes de Pascua', isLocal: true },
    { date: '2027-05-01', name: 'Fiesta del Trabajo', isLocal: true }, { date: '2027-06-24', name: 'San Juan', isLocal: true },
    { date: '2027-08-15', name: 'Asunción', isLocal: true }, { date: '2027-09-11', name: 'Diada de Cataluña', isLocal: true },
    { date: '2027-09-24', name: 'La Mercè', isLocal: true }, { date: '2027-10-12', name: 'Fiesta Nacional', isLocal: true },
    { date: '2027-11-01', name: 'Todos los Santos', isLocal: true }, { date: '2027-12-06', name: 'Constitución', isLocal: true },
    { date: '2027-12-08', name: 'Inmaculada', isLocal: true }, { date: '2027-12-25', name: 'Navidad', isLocal: true },
    { date: '2027-12-26', name: 'San Esteban', isLocal: true }
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

    return () => { unsubUsers(); unsubRequests(); unsubHolidays(); unsubDepts(); };
  }, []);

  const getUserDepartments = (user) => user?.departments || [];
  const showNotification = (type, message) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 3000); };
  const handleLogout = () => { setCurrentUser(null); setLoginCode(''); setActiveTab('calendar'); };
  const isWeekend = (date) => { const d = new Date(date).getDay(); return d === 0 || d === 6; };
  const isHoliday = (date) => companyHolidays.some(h => h.date === date);

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
    if (!user) return { total: 0, used: 0, pending: 0, waiting: 0, available: 0, carryOver: 0 };
    const approved = requests.filter(r => r.userCode === userCode && r.status === 'approved' && r.type === 'vacation');
    const pending = requests.filter(r => r.userCode === userCode && r.status === 'pending' && r.type === 'vacation');
    let used = 0, waiting = 0;
    approved.forEach(r => { used += r.isRange ? getBusinessDays(r.startDate, r.endDate) : (r.dates?.filter(d => !isWeekend(d) && !isHoliday(d)).length || 0); });
    pending.forEach(r => { waiting += r.isRange ? getBusinessDays(r.startDate, r.endDate) : (r.dates?.filter(d => !isWeekend(d) && !isHoliday(d)).length || 0); });
    const total = user.totalDays || 0, carryOver = user.carryOverDays || 0;
    return { total, used, pending: total + carryOver - used, waiting, available: total + carryOver - used - waiting, carryOver };
  };

  // Firebase CRUD
  const addUser = async (u) => { await addDoc(collection(db, 'vacation_users'), u); showNotification('success', 'Usuario creado'); };
  const updateUser = async (id, u) => { await updateDoc(doc(db, 'vacation_users', id), u); showNotification('success', 'Usuario actualizado'); };
  const deleteUser = async (id) => { await deleteDoc(doc(db, 'vacation_users', id)); showNotification('success', 'Usuario eliminado'); };
  const addRequest = async (r) => { await addDoc(collection(db, 'vacation_requests'), r); showNotification('success', 'Solicitud enviada'); };
  const updateRequest = async (id, r) => { await updateDoc(doc(db, 'vacation_requests', id), r); };
  const deleteRequest = async (id) => { await deleteDoc(doc(db, 'vacation_requests', id)); showNotification('success', 'Solicitud cancelada'); };
  const addHoliday = async (h) => { await addDoc(collection(db, 'vacation_holidays'), { ...h, isLocal: false }); showNotification('success', 'Festivo añadido'); };
  const deleteHoliday = async (id) => { await deleteDoc(doc(db, 'vacation_holidays', id)); showNotification('success', 'Festivo eliminado'); };
  const addDepartment = async (d) => { await addDoc(collection(db, 'vacation_departments'), d); showNotification('success', 'Departamento creado'); };
  const updateDepartment = async (id, d) => { await updateDoc(doc(db, 'vacation_departments', id), d); showNotification('success', 'Departamento actualizado'); };
  const deleteDepartment = async (id) => { await deleteDoc(doc(db, 'vacation_departments', id)); showNotification('success', 'Departamento eliminado'); };

  if (loading) return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100"><Calendar className="w-16 h-16 text-indigo-600 animate-pulse" /></div>;

  if (!currentUser) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {notification && <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white z-50`}>{notification.message}</div>}
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Sistema de Vacaciones</h1>
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
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8" />
            <div><h1 className="text-xl font-bold">Gestión de Vacaciones</h1><p className="text-indigo-200 text-sm">{currentUser.name} {currentUser.lastName}</p></div>
          </div>
          <div className="flex items-center space-x-3">
            {connected ? <Wifi className="w-5 h-5 text-green-300" /> : <WifiOff className="w-5 h-5 text-red-300" />}
            <button onClick={handleLogout} className="flex items-center space-x-2 bg-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-800"><LogOut className="w-4 h-4" /><span>Salir</span></button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            <TabButton icon={Calendar} label="Calendario" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
            {currentUser.isAdmin && <>
              <TabButton icon={Users} label="Usuarios" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
              <TabButton icon={FileText} label="Aprobar" active={activeTab === 'approve'} onClick={() => setActiveTab('approve')} />
              <TabButton icon={Settings} label="Festivos" active={activeTab === 'holidays'} onClick={() => setActiveTab('holidays')} />
              <TabButton icon={Users} label="Departamentos" active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
            </>}
            <TabButton icon={FileText} label="Mis Solicitudes" active={activeTab === 'myRequests'} onClick={() => setActiveTab('myRequests')} />
          </div>
          <div className="p-6">
            {activeTab === 'calendar' && <CalendarView view={calendarView} setView={setCalendarView} currentDate={currentDate} setCurrentDate={setCurrentDate} requests={requests} users={users} holidays={companyHolidays} filterDepartment={filterDepartment} setFilterDepartment={setFilterDepartment} filterUser={filterUser} setFilterUser={setFilterUser} departments={departments} getUserDepartments={getUserDepartments} />}
            {activeTab === 'users' && currentUser.isAdmin && <UsersManagement users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} showNotification={showNotification} calculateUserDays={calculateUserDays} requests={requests} viewingUserHistory={viewingUserHistory} setViewingUserHistory={setViewingUserHistory} departments={departments} getUserDepartments={getUserDepartments} />}
            {activeTab === 'approve' && currentUser.isAdmin && <ApproveRequests requests={requests} updateRequest={updateRequest} users={users} calculateUserDays={calculateUserDays} getBusinessDays={getBusinessDays} currentUser={currentUser} getUserDepartments={getUserDepartments} showNotification={showNotification} />}
            {activeTab === 'holidays' && currentUser.isAdmin && <HolidaysManagement holidays={companyHolidays} addHoliday={addHoliday} deleteHoliday={deleteHoliday} showNotification={showNotification} />}
            {activeTab === 'departments' && currentUser.isAdmin && <DepartmentsManagement departments={departments} addDepartment={addDepartment} updateDepartment={updateDepartment} deleteDepartment={deleteDepartment} showNotification={showNotification} users={users} getUserDepartments={getUserDepartments} />}
            {activeTab === 'myRequests' && <MyRequests currentUser={currentUser} requests={requests} addRequest={addRequest} deleteRequest={deleteRequest} calculateUserDays={calculateUserDays} isWeekend={isWeekend} isHoliday={isHoliday} getBusinessDays={getBusinessDays} showNotification={showNotification} users={users} />}
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

const RequestBadge = ({ req, user, departments, getUserDepartments }) => {
  const userDepts = getUserDepartments(user);
  const getEmoji = () => {
    if (req.type === 'other') return '⚠️';
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
      <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-3 rounded-lg"><span className="font-medium">Leyenda:</span><span>✅ Aprobado</span><span>⏳ Pendiente</span><span>❌ Denegado</span><span>⚠️ Día especial</span></div>
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

  const getRequestsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return requests.filter(r => {
      if (r.isRange) return dateStr >= r.startDate && dateStr <= r.endDate && new Date(dateStr).getDay() !== 0 && new Date(dateStr).getDay() !== 6 && !holidays.some(h => h.date === dateStr);
      return r.dates?.includes(dateStr);
    });
  };

  const getHolidayName = (day) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr)?.name || null;
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
          const holidayName = getHolidayName(day);
          return (
            <div key={idx} className={`min-h-20 border rounded p-1 ${!day ? 'bg-gray-50' : isToday(day) ? 'bg-blue-50 border-blue-400 border-2' : holidayName ? 'bg-red-50' : 'bg-white'}`}>
              {day && <>
                <div className={`font-semibold text-xs mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>{day}</div>
                {holidayName && <div className="text-xs text-red-600 mb-1 truncate" title={holidayName}>🎉 {holidayName}</div>}
                <div className="space-y-1">
                  {dayReqs.slice(0, 3).map((req, i) => <RequestBadge key={i} req={req} user={users.find(u => u.code === req.userCode)} departments={departments} getUserDepartments={getUserDepartments} />)}
                  {dayReqs.length > 3 && <div className="text-xs text-gray-500">+{dayReqs.length - 3}</div>}
                </div>
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

  const getRequestsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return requests.filter(r => {
      if (r.isRange) return dateStr >= r.startDate && dateStr <= r.endDate && date.getDay() !== 0 && date.getDay() !== 6 && !holidays.some(h => h.date === dateStr);
      return r.dates?.includes(dateStr);
    });
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
          const holidayName = holidays.find(h => h.date === dateStr)?.name;
          const weekend = date.getDay() === 0 || date.getDay() === 6;
          const isToday = dateStr === today;
          return (
            <div key={idx} className={`min-h-32 border rounded p-2 ${isToday ? 'bg-blue-50 border-blue-400 border-2' : weekend ? 'bg-gray-50' : holidayName ? 'bg-red-50' : 'bg-white'}`}>
              <div className={`font-semibold mb-2 text-xs ${isToday ? 'text-blue-600' : ''}`}>{date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}</div>
              {holidayName && <div className="text-xs text-red-600 mb-2 truncate" title={holidayName}>🎉 {holidayName}</div>}
              <div className="space-y-1">{dayReqs.map((req, i) => <RequestBadge key={i} req={req} user={users.find(u => u.code === req.userCode)} departments={departments} getUserDepartments={getUserDepartments} />)}</div>
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
    return { ...holiday, isLocal };
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
                    const userCount = usersOnDay.length;

                    // Determine background color
                    let bgClass = 'bg-white';
                    let textClass = 'text-gray-900';

                    if (!isCurrentYear) {
                      bgClass = 'bg-gray-50';
                      textClass = 'text-gray-300';
                    } else if (holiday) {
                      bgClass = holiday.isLocal ? 'bg-red-100' : 'bg-purple-100';
                      textClass = holiday.isLocal ? 'text-red-700' : 'text-purple-700';
                    } else if (weekend) {
                      bgClass = 'bg-gray-100';
                      textClass = 'text-gray-400';
                    }

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

                        {/* User count badge */}
                        {userCount > 0 && isCurrentYear && !weekend && !holiday && (
                          <div className="absolute bottom-0.5 right-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                            {userCount}
                          </div>
                        )}

                        {/* Holiday indicator */}
                        {holiday && isCurrentYear && (
                          <div className={`absolute bottom-0.5 right-0.5 text-[10px] font-bold ${holiday.isLocal ? 'text-red-600' : 'text-purple-600'}`} title={holiday.name}>
                            {holiday.isLocal ? '🔴' : '🟣'}
                          </div>
                        )}

                        {/* Hover tooltip */}
                        {hoveredDay === dateStr && userCount > 0 && (
                          <div className="absolute z-50 left-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[150px]">
                            <div className="text-xs font-semibold mb-1 text-gray-700">{date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                            <div className="space-y-1">
                              {usersOnDay.map((item, idx) => (
                                <div key={idx} className="text-xs flex items-center gap-1">
                                  <span>{item.request.status === 'approved' ? '✅' : '⏳'}</span>
                                  <span>{item.user?.name} {item.user?.lastName}</span>
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
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span> Festivo local</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></span> Día de cierre</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] flex items-center justify-center">3</span> Personas de vacaciones</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="border rounded-lg p-4 bg-white hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className={`px-3 py-1 rounded font-semibold ${dept.color}`}>{dept.name}</div>
              <div className="flex space-x-1">
                <button onClick={() => { setEditingDept(dept); setFormData({ name: dept.name, color: dept.color }); setShowForm(true); }} className="text-blue-600 p-1"><Eye className="w-4 h-4" /></button>
                <button onClick={() => { if (users.filter(u => getUserDepartments(u).includes(dept.name)).length > 0) showNotification('error', 'Tiene usuarios'); else deleteDepartment(dept.id); }} className="text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{users.filter(u => getUserDepartments(u).includes(dept.name)).length} empleados</p>
          </div>
        ))}
        {departments.length === 0 && <div className="col-span-full text-center py-12 text-gray-500">No hay departamentos</div>}
      </div>
    </div>
  );
};

const UsersManagement = ({ users, addUser, updateUser, deleteUser, showNotification, calculateUserDays, requests, viewingUserHistory, setViewingUserHistory, departments, getUserDepartments }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', lastName: '', departments: [], totalDays: 22, carryOverDays: 0, isAdmin: false });

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.lastName || formData.departments.length === 0) { showNotification('error', 'Completa todos los campos'); return; }
    if (editingUser) await updateUser(editingUser.id, formData);
    else { if (users.some(u => u.code === formData.code)) { showNotification('error', 'Código duplicado'); return; } await addUser(formData); }
    setShowForm(false); setEditingUser(null); setFormData({ code: '', name: '', lastName: '', departments: [], totalDays: 22, carryOverDays: 0, isAdmin: false });
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
        <div className="grid grid-cols-5 gap-4 bg-blue-50 p-4 rounded-lg">
          <div><p className="text-sm text-gray-600">Totales</p><p className="text-xl font-bold text-blue-600">{d.total}</p></div>
          <div><p className="text-sm text-gray-600">Sobrantes</p><p className="text-xl font-bold text-purple-600">{d.carryOver}</p></div>
          <div><p className="text-sm text-gray-600">Usados</p><p className="text-xl font-bold text-red-600">{d.used}</p></div>
          <div><p className="text-sm text-gray-600">En espera</p><p className="text-xl font-bold text-orange-600">{d.waiting}</p></div>
          <div><p className="text-sm text-gray-600">Disponibles</p><p className="text-xl font-bold text-green-600">{d.available}</p></div>
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
          <label className="flex items-center space-x-2"><input type="checkbox" checked={formData.isAdmin} onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })} className="w-4 h-4" /><span>Es Administrador</span></label>
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">{editingUser ? 'Actualizar' : 'Crear'}</button>
            <button onClick={() => { setShowForm(false); setEditingUser(null); }} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left">Código</th><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Depts</th><th className="px-4 py-3 text-left">Usados</th><th className="px-4 py-3 text-left">Disp.</th><th className="px-4 py-3 text-left">Acciones</th></tr></thead>
          <tbody>
            {users.map(user => {
              const d = calculateUserDays(user.code);
              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{user.code}</td>
                  <td className="px-4 py-3">{user.name} {user.lastName}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{getUserDepartments(user).map(d => <span key={d} className="text-xs px-2 py-1 rounded bg-gray-100">{d}</span>)}</div></td>
                  <td className="px-4 py-3 text-blue-600 font-semibold">{d.used}</td>
                  <td className="px-4 py-3 text-green-600 font-semibold">{d.available}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => setViewingUserHistory(user.code)} className="text-green-600"><FileText className="w-5 h-5" /></button>
                      <button onClick={() => { setEditingUser(user); setFormData({ ...user, departments: getUserDepartments(user) }); setShowForm(true); }} className="text-blue-600"><Eye className="w-5 h-5" /></button>
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

const ApproveRequests = ({ requests, updateRequest, users, calculateUserDays, getBusinessDays, currentUser, getUserDepartments, showNotification }) => {
  const pending = requests.filter(r => r.status === 'pending');
  const getReqDays = (r) => r.isRange ? getBusinessDays(r.startDate, r.endDate) : (r.dates?.length || 0);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Aprobar Solicitudes</h2>
      {pending.map(req => {
        const user = users.find(u => u.code === req.userCode);
        const d = calculateUserDays(req.userCode);
        return (
          <div key={req.id} className="border rounded-lg p-4 bg-yellow-50">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2"><span className="text-xl">⏳</span><h3 className="text-lg font-semibold">{user?.name} {user?.lastName}</h3></div>
                <div className="text-sm text-gray-700">
                  {req.isRange ? <p><strong>Rango:</strong> {req.startDate} al {req.endDate} ({getReqDays(req)} días)</p> : <p><strong>Fechas:</strong> {req.dates?.join(', ')}</p>}
                  {req.comments && <p><strong>Comentarios:</strong> {req.comments}</p>}
                  <p><strong>Saldo disponible:</strong> {d.available} días</p>
                </div>
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
  );
};

const HolidaysManagement = ({ holidays, addHoliday, deleteHoliday, showNotification }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ date: '', name: '' });

  const handleSubmit = async () => {
    if (!formData.date || !formData.name) { showNotification('error', 'Completa todos los campos'); return; }
    await addHoliday(formData);
    setShowForm(false); setFormData({ date: '', name: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Días de Cierre</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg"><Plus className="w-5 h-5" /><span>Nuevo</span></button>
      </div>
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="px-3 py-2 border rounded" />
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="px-3 py-2 border rounded" placeholder="Nombre" />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">Añadir</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}
      <table className="w-full">
        <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Acciones</th></tr></thead>
        <tbody>{holidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => <tr key={h.id} className="border-b"><td className="px-4 py-3">{h.date}</td><td className="px-4 py-3">{h.name}</td><td className="px-4 py-3"><button onClick={() => deleteHoliday(h.id)} className="text-red-600"><Trash2 className="w-5 h-5" /></button></td></tr>)}</tbody>
      </table>
    </div>
  );
};

const MyRequests = ({ currentUser, requests, addRequest, deleteRequest, calculateUserDays, isWeekend, isHoliday, getBusinessDays, showNotification, users = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState('range');
  const [selectedUserCode, setSelectedUserCode] = useState(currentUser.code);
  const [formData, setFormData] = useState({ type: 'vacation', startDate: '', endDate: '', dates: [], newDate: '', comments: '' });

  const targetUserCode = currentUser.isAdmin ? selectedUserCode : currentUser.code;
  const d = calculateUserDays(targetUserCode);
  const myReqs = requests.filter(r => r.userCode === targetUserCode).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const statusEmojis = { pending: '⏳', approved: '✅', denied: '❌' };
  const getTypeEmoji = (req) => req.type === 'other' ? '⚠️' : statusEmojis[req.status];

  const handleSubmit = async () => {
    if (requestType === 'range' && (!formData.startDate || !formData.endDate)) { showNotification('error', 'Selecciona fechas'); return; }
    if (requestType === 'individual' && formData.dates.length === 0) { showNotification('error', 'Añade fechas'); return; }
    if (currentUser.isAdmin && !selectedUserCode) { showNotification('error', 'Selecciona un usuario'); return; }

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
          <div className="flex space-x-2">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded">Enviar</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {myReqs.map(req => (
          <div key={req.id} className={`border rounded-lg p-4 ${req.type === 'other' ? 'bg-amber-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{getTypeEmoji(req)}</span>
                  <span className="font-medium">
                    {req.type === 'other' ? 'Día especial' : (req.status === 'approved' ? 'Aprobado' : req.status === 'pending' ? 'Pendiente' : 'Denegado')}
                  </span>
                </div>
                <div className="text-sm">{req.isRange ? <p>{req.startDate} al {req.endDate}</p> : <p>{req.dates?.join(', ')}</p>}</div>
              </div>
              {req.status === 'pending' && <button onClick={() => deleteRequest(req.id)} className="text-red-600 flex items-center"><Trash2 className="w-4 h-4" /><span className="text-sm ml-1">Cancelar</span></button>}
            </div>
          </div>
        ))}
        {myReqs.length === 0 && <div className="text-center py-12 text-gray-500">Sin solicitudes</div>}
      </div>
    </div>
  );
};

export default VacationManager;
