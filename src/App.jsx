import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import './App.css'; 
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');

    if (savedToken) {
      setToken(savedToken);
      setUserRole(savedRole || 'user');
    }
    setLoading(false);
  }, []);

  // Вызывается из AuthPage при успешном входе
  const handleLoginSuccess = (roleFromAuth) => {
    // Токен и роль уже лежат в localStorage благодаря AuthPage
    const savedToken = localStorage.getItem('token'); 
    
    setToken(savedToken || '');
    setUserRole(roleFromAuth); // Устанавливаем роль, которую передал AuthPage
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken('');
    setUserRole('user');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <h3>Инициализация CCTV системы...</h3>
      </div>
    );
  }

  // Роутинг: если токена в стейте нет — показываем твою страницу авторизации/регистрации
  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Если авторизован — рендерим модульный Dashboard
  return (
    <Dashboard 
      userRole={userRole} 
      onLogout={handleLogout} 
    />
  );
}

export default App;