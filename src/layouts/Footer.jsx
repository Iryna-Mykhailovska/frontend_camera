import './Footer.css';
const Footer = () => {
  return (
    <footer className='footer'>
      {new Date().getFullYear()} CCTV Моніторинг NVR та камер. Усі права захищені.&copy; Professorsha
    </footer>
  );
};

export default Footer;