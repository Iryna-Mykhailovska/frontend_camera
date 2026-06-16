import './Header.css';
import FormButton from '../components/FormButton'; 

const Header = ({ userRole, onLogout }) => {
  const isAdmin = userRole === 'admin';

  return (
    <header className="header">
      <div className="header__logo">
        <span className="header__logo-icon">🛡️</span>
        <h2 className="header__logo-title">CCTV Control Hub</h2>
      </div>
      
      <div className="header__user-info">
       
        <span className={`header__user-role ${isAdmin ? 'header__user-role--admin' : 'header__user-role--operator'}`}>
          {userRole?.toUpperCase()}
        </span>
        
        {/* Замінюємо на FormButton із збереженням оригінального класу */}
        <FormButton 
          onClick={onLogout}
          className="header__logout-btn"
        >
          Вийти
        </FormButton>
      </div>
    </header>
  );
};

export default Header;