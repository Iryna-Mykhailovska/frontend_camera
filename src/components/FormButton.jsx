import './FormButton.css';

const FormButton = ({ children, onClick, type = 'button', className = 'btn' }) => {
  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export default FormButton;