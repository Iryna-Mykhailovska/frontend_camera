import { useState } from 'react';
import API from '../services/api'; 
import './RecorderPanel.css'; 
import FormInput from './FormInput'; 
import FormButton from './FormButton'; 

const RecorderPanel = ({ 
  selectedCompany, 
  recorders, 
  setRecorders, 
  selectedRecorder, 
  onSelectRecorder, 
  userRole
}) => {
  const [recName, setRecName] = useState('');
  const [recIp, setRecIp] = useState('');
  const [recChannels, setRecChannels] = useState(16);

  // Стейт для редагування NVR
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editChannels, setEditChannels] = useState(16);

  const handleAddRecorder = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const cleanIp = recIp.trim();

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(cleanIp)) {
      alert("Помилка: Некоректний формат IP-адреси реєстратора!");
      return;
    }

    try {
      const res = await API.post('/recorders', {
        name: recName,
        ip: cleanIp,
        channels: Number(recChannels),
        companyId: selectedCompany._id
      });
      setRecorders([...recorders, res.data]);
      setRecName('');
      setRecIp('');
      setRecChannels(16);
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при додаванні реєстратора');
    }
  };

  const startEdit = (r, e) => {
    e.stopPropagation();
    setEditingId(r._id);
    setEditName(r.name);
    setEditIp(r.ip);
    setEditChannels(r.channels);
  };

  const handleUpdateRecorder = async (id, e) => {
    e.stopPropagation();
    const cleanIp = editIp.trim();
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (!ipRegex.test(cleanIp)) {
      alert("Помилка: Некоректний формат IP-адреси!");
      return;
    }

    try {
      const res = await API.put(`/recorders/${id}`, {
        name: editName,
        ip: cleanIp,
        channels: Number(editChannels)
      });
      setRecorders(recorders.map(r => r._id === id ? res.data : r));
      if (selectedRecorder?._id === id) {
        onSelectRecorder(res.data);
      }
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при оновленні реєстратора');
    }
  };

  const handleDeleteRecorder = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm('Ви впевнені, що хочете видалити цей реєстратор? Усі прив\'язані камери втратять зв\'язок.')) return;
    try {
      await API.delete(`/recorders/${id}`);
      setRecorders(recorders.filter(r => r._id !== id));
      if (selectedRecorder?._id === id) {
        onSelectRecorder(null); 
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка видалення');
    }
  };

  if (!selectedCompany) {
    return (
      <div className="recorder-panel recorder-panel--empty">
        <h3 className="recorder-panel__title">📹 Реєстратори (NVR)</h3>
        <p className="recorder-panel__subtitle">← Оберіть об'єкт зліва</p>
      </div>
    );
  }

  return (
    <div className="recorder-panel">
      <h3 className="recorder-panel__title">📹 Реєстратори (NVR)</h3>
      <div className="recorder-panel__company">Компанія: <strong>{selectedCompany.name}</strong></div>
      
      {userRole === 'admin' && (
        <form onSubmit={handleAddRecorder} className="recorder-panel__form">
          <h5 className="recorder-panel__form-title">➕ Додати NVR</h5>
          <FormInput placeholder="Назва (наприклад: NVR-Бухгалтерія)" value={recName} onChange={e => setRecName(e.target.value)} required />
          <FormInput placeholder="IP-адрес" value={recIp} onChange={e => setRecIp(e.target.value)} required />
          <FormInput type="number" placeholder="Кількість каналів" value={recChannels} onChange={e => setRecChannels(e.target.value)} required min="1" />
          <FormButton type="submit" className="submit-btn submit-btn--green">Додати NVR</FormButton>
        </form>
      )}

      <div className="recorder-panel__list">
        {recorders.map(r => {
          const isSelected = selectedRecorder?._id === r._id;
          const isEditing = editingId === r._id;

          return (
            <div 
              key={r._id}
              onClick={() => !isEditing && onSelectRecorder(r)}
              className={`recorder-item ${isSelected ? 'recorder-item--selected' : ''}`}
            >
              {isEditing ? (
                <div className="recorder-item__edit-fields" onClick={e => e.stopPropagation()}>
                  <input className="company-panel__input" value={editName} onChange={e => setEditName(e.target.value)} required />
                  <input className="company-panel__input" value={editIp} onChange={e => setEditIp(e.target.value)} required />
                  <input className="company-panel__input" type="number" value={editChannels} onChange={e => setEditChannels(e.target.value)} required />
                </div>
              ) : (
                <div className="recorder-item__info">
                  <div className="recorder-item__name">📡 {r.name}</div>
                  <div className="recorder-item__details">IP: {r.ip} | Каналів: {r.channels}</div>
                </div>
              )}
              
              {userRole === 'admin' && (
                <div className="recorder-item__actions">
                  {isEditing ? (
                    <>
                      <button onClick={(e) => handleUpdateRecorder(r._id, e)} className="recorder-item__action-btn" title="Зберегти">💾</button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="recorder-item__action-btn" title="Скасувати">❌</button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => startEdit(r, e)} className="recorder-item__action-btn" title="Редагувати">✏️</button>
                      <button onClick={(e) => handleDeleteRecorder(r._id, e)} className="recorder-item__delete-btn" title="Видалити реєстратор">🗑️</button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {recorders.length === 0 && <p className="recorder-panel__empty-msg">Немає реєстраторів на цьому об'єкті.</p>}
      </div>
    </div>
  );
};

export default RecorderPanel;