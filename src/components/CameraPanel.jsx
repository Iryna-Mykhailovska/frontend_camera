import { useState, useEffect } from 'react';
import API from '../services/api';
import FormInput from './FormInput';   
import FormButton from './FormButton'; 
import './CameraPanel.css'; 

const CameraPanel = ({ 
  selectedRecorder, 
  cameras, 
  setCameras, 
  userRole,
  getProxiedImageUrl,
  setModalImage       
}) => {
  const [camName, setCamName] = useState('');
  const [camIp, setCamIp] = useState('');
  const [camChannelNum, setCamChannelNum] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); 
  const [camSn, setCamSn] = useState(''); 

  // Стейт для редагування конкретної камери
  const [editingCamId, setEditingCamId] = useState(null);
  const [editCamName, setEditCamName] = useState('');
  const [editCamIp, setEditCamIp] = useState('');
  const [editCamChannel, setEditCamChannel] = useState('');
  const [editCamSn, setEditCamSn] = useState('');

  // Динамічний ліміт каналів реєстратора
  const maxChannelsLimit = selectedRecorder?.channels || 16;

  // Автоматичний пошук першого вільного каналу
  useEffect(() => {
    if (selectedRecorder && cameras) {
      const occupiedChannels = cameras
        .filter(cam => cam.recorderId?._id === selectedRecorder._id || cam.recorderId === selectedRecorder._id)
        .map(cam => Number(cam.channelNumber));

      let firstFree = 1;
      while (occupiedChannels.includes(firstFree)) {
        firstFree++;
      }

      if (firstFree <= maxChannelsLimit) {
        setCamChannelNum(firstFree);
      } else {
        setCamChannelNum(''); 
      }
    }
  }, [selectedRecorder, cameras, maxChannelsLimit]);

  const handleAddCamera = async (e) => {
    e.preventDefault();
    if (!selectedRecorder) return;

    const channelNum = Number(camChannelNum);
    const cleanIp = camIp.trim();

    if (channelNum < 1 || channelNum > maxChannelsLimit) {
      alert(`Помилка: Номер каналу для цього NVR має бути в діапазоні від 1 до ${maxChannelsLimit}!`);
      return;
    }

    const channelExists = cameras.some(cam => 
      (cam.recorderId?._id === selectedRecorder._id || cam.recorderId === selectedRecorder._id) && 
      Number(cam.channelNumber) === channelNum
    );

    if (channelExists) {
      alert(`Помилка: Канал №${channelNum} вже зайнятий іншою камерою на цьому реєстраторі!`);
      return;
    }

    const ipExistsOnRecorder = cameras.some(cam => 
      (cam.recorderId?._id === selectedRecorder._id || cam.recorderId === selectedRecorder._id) && 
      cam.ip.trim() === cleanIp
    );

    if (ipExistsOnRecorder) {
      alert(`Помилка: Камера з IP-адресою ${cleanIp} вже додана на цей реєстратор!`);
      return;
    }

    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(cleanIp)) {
      alert("Помилка: Некоректний формат IP-адреси! Дозволені лише числа від 0 до 255 у форматі Х.Х.Х.Х");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', camName);
      formData.append('ip', camIp.trim()); 
      formData.append('channelNumber', channelNum);
      formData.append('sn', camSn);
      formData.append('recorderId', selectedRecorder._id);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await API.post('/cameras', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCameras([...cameras, res.data]);
      
      setCamName('');
      setCamIp('');
      setCamSn(''); 
      setSelectedFile(null);
      
      const fileInput = document.getElementById('camera-file-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при додаванні камери');
    }
  };

  // Увімкнення режиму редагування та заповнення полів поточними значеннями камери
  const startEditCam = (cam) => {
    setEditingCamId(cam._id);
    setEditCamName(cam.name);
    setEditCamIp(cam.ip);
    setEditCamChannel(cam.channelNumber);
    setEditCamSn(cam.sn || '');
  };

  // Збереження відредагованих даних
  const handleUpdateCamera = async (id) => {
    const cleanIp = editCamIp.trim();
    const channelNum = Number(editCamChannel);

    // 1. Валідація IP-адреси
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(cleanIp)) {
      alert("Помилка: Некоректний формат IP-адреси камери!");
      return;
    }

    // 2. Валідація ліміту каналів
    if (channelNum < 1 || channelNum > maxChannelsLimit) {
      alert(`Помилка: Номер каналу має бути від 1 до ${maxChannelsLimit}!`);
      return;
    }

    // 3. Перевірка на зайнятість каналу іншою камерою на цьому ж NVR
    const channelConflict = cameras.some(cam => 
      cam._id !== id && 
      (cam.recorderId?._id === selectedRecorder._id || cam.recorderId === selectedRecorder._id) && 
      Number(cam.channelNumber) === channelNum
    );

    if (channelConflict) {
      alert(`Помилка: Канал №${channelNum} вже зайнятий іншою камерою на цьому реєстраторі!`);
      return;
    }

    try {
      const res = await API.put(`/cameras/${id}`, {
        name: editCamName.trim(),
        ip: cleanIp,
        channelNumber: channelNum,
        sn: editCamSn.trim()
      });

      // Оновлюємо стейт масиву камер
      setCameras(cameras.map(c => c._id === id ? res.data : c));
      setEditingCamId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при оновленні камери');
    }
  };

  const handleDeleteCamera = async (id) => {
    if (!window.confirm('Видалити камеру з сітки?')) return;
    try {
      await API.delete(`/cameras/${id}`);
      setCameras(cameras.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Помилка при видаленні камери');
    }
  };

  if (!selectedRecorder) {
    return (
      <div className="camera-panel">
        <h3 className="camera-panel__title">🎥 Сітка відеокамер</h3>
        <p className="camera-panel__subtitle">← Виберіть NVR у центрі</p>
      </div>    
    );
  }

  return (
    <div className="camera-panel">
      <h3 className="camera-panel__title">🎥 Сітка відеокамер</h3>
      <div className="camera-panel__regik">
        Реєстратор: <strong>{selectedRecorder.name}</strong> (Макс. каналів: {maxChannelsLimit})
      </div>
      
      {userRole === 'admin' && (
        <form onSubmit={handleAddCamera} className="camera-panel__form">
          <h5 className="camera-panel__add">➕ Додати IP-камеру</h5>
          
          <div className="camera-panel__form-row">
            <FormInput 
              placeholder="Назва (наприклад: Вхід)" 
              value={camName} 
              onChange={e => setCamName(e.target.value)} 
              required 
            />
            <FormInput 
              placeholder="№ Каналу" 
              type="number" 
              value={camChannelNum} 
              onChange={e => setCamChannelNum(e.target.value)} 
              required 
              min="1"
              max={maxChannelsLimit}
              className="form-control form-control--short"
            />
          </div>

          <div className="camera-panel__form-row">
            <FormInput 
              placeholder="IP-адреса" 
              value={camIp} 
              onChange={e => setCamIp(e.target.value)} 
              required 
            />
            <FormInput 
              placeholder="Серійний номер (S/N)" 
              value={camSn} 
              onChange={e => setCamSn(e.target.value)} 
            />
          </div>

          <div className="camera-panel__form-row">
            <div className="form-group camera-panel__file-wrapper">
              <label className="camera-panel__file-label" htmlFor="camera-file-input">
                {selectedFile ? `📁 Обрано: ${selectedFile.name}` : '📷 Завантажити скріншот камери'}
              </label>
              <input 
                id="camera-file-input"
                type="file" 
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files[0])}
                style={{ display: 'none' }} 
              />
            </div>
          </div>

          <FormButton type="submit" className="btn">
            Додати камеру
          </FormButton>
        </form>
      )}

      {/* Сітка камер */}
      <div className="camera-panel__grid">
        {cameras.map(cam => {
          let proxiedImageUrl = null;
          if (cam.url) {
            if (getProxiedImageUrl) {
              proxiedImageUrl = getProxiedImageUrl(cam.url);
            } else {
              const fileId = cam.url.toString().split('/').pop().trim();
              proxiedImageUrl = `http://localhost:5001/cameras/snapshot/${fileId}`;
            }
          }

          const isEditing = editingCamId === cam._id;

          return (
            <div key={cam._id} className="camera-card">
              <div 
                onClick={() => proxiedImageUrl && setModalImage && setModalImage(proxiedImageUrl)}
                className={`camera-card__preview ${proxiedImageUrl ? 'camera-card__preview--clickable' : ''}`}
                style={{ backgroundImage: proxiedImageUrl ? `url(${proxiedImageUrl})` : 'none' }}
              >
                {!proxiedImageUrl && <span>🔴 Немає прев'ю</span>}
              </div>

              <div className="camera-card__body">
                {isEditing ? (
                  /* РЕЖИМ РЕДАГУВАННЯ КАМЕРИ */
                  <div className="camera-card__edit-form">
                    <div className="camera-card__edit-row">
                      <span className="camera-card__edit-label">#</span>
                      <input 
                        type="number" 
                        className="camera-panel__edit-input camera-panel__edit-input--short" 
                        value={editCamChannel} 
                        onChange={e => setEditCamChannel(e.target.value)} 
                        required
                        min="1"
                        max={maxChannelsLimit}
                      />
                      <input 
                        className="camera-panel__edit-input" 
                        value={editCamName} 
                        onChange={e => setEditCamName(e.target.value)} 
                        placeholder="Назва"
                        required
                      />
                    </div>
                    
                    <div className="camera-card__edit-row">
                      <span className="camera-card__edit-label">IP:</span>
                      <input 
                        className="camera-panel__edit-input" 
                        value={editCamIp} 
                        onChange={e => setEditCamIp(e.target.value)} 
                        placeholder="IP-адреса"
                        required
                      />
                    </div>

                    <div className="camera-card__edit-row">
                      <span className="camera-card__edit-label">S/N:</span>
                      <input 
                        className="camera-panel__edit-input" 
                        value={editCamSn} 
                        onChange={e => setEditCamSn(e.target.value)} 
                        placeholder="Серійний номер"
                      />
                    </div>
                    
                    <div className="camera-card__edit-actions">
                      <button onClick={() => handleUpdateCamera(cam._id)} className="camera-card__btn-save">
                        ✔️ Зберегти
                      </button>
                      <button onClick={() => setEditingCamId(null)} className="camera-card__btn-cancel">
                        ❌ Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  /* СТАНДАРТНИЙ РЕЖИМ ПЕРЕГЛЯДУ */
                  <>
                    <div className="camera-card__info">
                      <div className="camera-card__title">
                        #{cam.channelNumber} {cam.name}
                      </div>
                      <div className="camera-card__ip">IP: {cam.ip}</div>
                      
                      {cam.sn && (
                        <div className="camera-card__sn">
                          S/N: <span>{cam.sn}</span>
                        </div>
                      )}
                    </div>

                    {userRole === 'admin' && (
                      <div className="camera-card__actions">
                        <button 
                          onClick={() => startEditCam(cam)} 
                          className="camera-card__edit-btn"
                        >
                          ✏️ 
                        </button>
                        <button 
                          onClick={() => handleDeleteCamera(cam._id)} 
                          className="camera-card__delete-btn"
                        >
                          🗑️ 
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cameras.length === 0 && <p className="camera-panel__empty">Камери на цьому NVR відсутні.</p>}
    </div>
  );
};

export default CameraPanel;