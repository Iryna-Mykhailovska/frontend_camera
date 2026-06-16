import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';   // <-- Импортируем инпут
import FormButton from '../components/FormButton'; // <-- Импортируем кнопку
import API from '../services/api';
import './AuthPage.css';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true); // true = Вход, false = Регистрация
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Для регистрации: user или admin
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLoginMode) {
        // Запрос на Логин
        const response = await API.post('/auth/login', { email, password });
        
        // Сохраняем токен и роль в локальное хранилище браузера
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        
        onLoginSuccess(response.data.role);
        navigate('/'); // Перенаправляем на главную страницу с камерами
      } else {
        // Запрос на Регистрацию
        await API.post('/auth/register', { email, password, role });
        alert('Регистрация успешна! Теперь войдите в систему.');
        setIsLoginMode(true); // Переключаем на режим входа
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла сетевая ошибка');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLoginMode ? '🔑 Вхід до системи' : '📝 Реєстрація'}</h2>
      
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <FormInput 
          label="Email:" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        
        <FormInput 
          label="Пароль:" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />

        {!isLoginMode && (
          <div className="form-group">
            <label>Права доступу:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
              <option value="user">Оператор (Тільки перегляд)</option>
              <option value="admin">Адміністратор (Повний доступ)</option>
            </select>
          </div>
        )}

      <FormButton type="submit" className="btn">
          {isLoginMode ? 'Увійти' : 'Зареєструватися'}
        </FormButton>
      </form>

      <FormButton onClick={() => setIsLoginMode(!isLoginMode)} className="toggle-btn">
        {isLoginMode ? 'Немає аккаунта? Зареєструватися' : 'Вже є аккаунт? Увійти'}
      </FormButton>
    </div>
  );
};

export default AuthPage;