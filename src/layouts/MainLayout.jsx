import Header from './Header';
import Footer from './Footer';
import './MainLayout.css';
const MainLayout = ({ children, userRole, onLogout }) => {
  return (
    <div className="main-layout">
      <Header userRole={userRole} onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;