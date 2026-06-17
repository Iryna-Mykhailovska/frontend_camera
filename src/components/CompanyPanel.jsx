import { useState } from 'react';
import API from '../services/api'; 
import './CompanyPanel.css';
import FormInput from './FormInput';
import FormButton from './FormButton';

const CompanyPanel = ({ 
  companies, 
  setCompanies, 
  selectedCompany, 
  onSelectCompany, 
  userRole
}) => {
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Стан для редагування
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/company/company', { name: companyName, address: companyAddress });
      setCompanies([...companies, res.data]);
      setCompanyName('');
      setCompanyAddress('');
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при додаванні компанії');
    }
  };

  // Вхід у режим редагування
  const startEdit = (c, e) => {
    e.stopPropagation(); // щоб не спрацьовував вибір компанії
    setEditingId(c._id);
    setEditName(c.name);
    setEditAddress(c.address || '');
  };

  // Збереження оновлених даних
  const handleUpdateCompany = async (id, e) => {
    e.stopPropagation();
    try {
      // Припускаємо, що твій бекенд підтримує PUT або PATCH на /company/company/:id
      const res = await API.put(`/company/company/${id}`, { name: editName, address: editAddress });
      
      // Оновлюємо масив у стейті
      setCompanies(companies.map(c => c._id === id ? res.data : c));
      
      // Якщо редагували поточну вибрану компанію — оновлюємо і її фокус
      if (selectedCompany?._id === id) {
        onSelectCompany(res.data);
      }
      
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при оновленні компанії');
    }
  };

  const handleDeleteCompany = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm('Увага! Видалити цю компанію? Реєстратори та камери всередині втратять прив\'язку.')) return;
    try {
      await API.delete(`/company/company/${id}`);
      setCompanies(companies.filter(c => c._id !== id));
      if (selectedCompany?._id === id) {
        onSelectCompany(null); 
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при видаленні компанії');
    }
  };

  return (
    <div className="company-panel">
      <h3 className="company-panel__title">🏢 Компанії</h3>
      
      {userRole === 'admin' && (
        <form onSubmit={handleAddCompany} className="company-panel__form">
          <h5 className="company-panel__form-title">➕ Додати компанію</h5>
          <FormInput placeholder="Назва компанії" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
          <FormInput placeholder="Адреса" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
          <FormButton type="submit" className="company-panel__form-btn btn">Додати</FormButton>
        </form>
      )}

      <div className="company-panel__list">
        {companies.map(c => {
          const isSelected = selectedCompany?._id === c._id;
          const isEditing = editingId === c._id;

          return (
            <div 
              key={c._id} 
              onClick={() => !isEditing && onSelectCompany(c)}
              className={`company-item ${isSelected ? 'company-item--selected' : ''}`}
            >
              {isEditing ? (
                /* Режим редагування */
                <div className="company-item__edit-fields" onClick={e => e.stopPropagation()}>
                  <input className="company-panel__input" value={editName} onChange={e => setEditName(e.target.value)} required />
                  <input className="company-panel__input" value={editAddress} placeholder="Адреса" onChange={e => setEditAddress(e.target.value)} />
                </div>
              ) : (
                /* Звичайний режим */
                <div className="company-item__info">
                  <div className="company-item__name">{c.name}</div>
                  <div className="company-item__address">📍 {c.address || 'Адресу не вказано'}</div>
                </div>
              )}
              
              {userRole === 'admin' && (
                <div className="company-item__actions">
                  {isEditing ? (
                    <>
                      <button onClick={(e) => handleUpdateCompany(c._id, e)} className="company-item__action-btn" title="Зберегти">💾</button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="company-item__action-btn" title="Скасувати">❌</button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => startEdit(c, e)} className="company-item__action-btn" title="Редагувати">✏️</button>
                      <button onClick={(e) => handleDeleteCompany(c._id, e)} className="company-item__delete-btn" title="Видалити компанію">🗑️</button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {companies.length === 0 && <p className="company-panel__empty">Список компаній порожній.</p>}
      </div>
    </div>
  );
};

export default CompanyPanel;