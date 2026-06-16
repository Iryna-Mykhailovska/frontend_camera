import './FormInput.css';

const FormInput = ({ label, type = 'text', value, onChange, required = false, placeholder = '' }) => {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        required={required} 
        placeholder={placeholder}
        className="form-control" 
      />
    </div>
  );
};

export default FormInput;