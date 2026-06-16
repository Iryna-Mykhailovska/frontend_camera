import { useState, useEffect } from 'react';
import API from '../services/api';
import MainLayout from '../layouts/MainLayout';
import CompanyPanel from '../components/CompanyPanel';
import RecorderPanel from '../components/RecorderPanel';
import CameraPanel from '../components/CameraPanel';
import FormButton from '../components/FormButton';
import './Dashboard.css';

const Dashboard = ({ userRole, onLogout }) => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [recorders, setRecorders] = useState([]);
    const [selectedRecorder, setSelectedRecorder] = useState(null);
    const [cameras, setCameras] = useState([]);

    // Стани для пошуку
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [modalImage, setModalImage] = useState(null);

    // Завантаження компаній при старті
    useEffect(() => {
        API.get('/company/company')
            .then(res => setCompanies(res.data))
            .catch(err => alert('Помилка завантаження компаній: ' + err.response?.data?.error));
    }, []);

    const getProxiedImageUrl = (urlField) => {
        if (!urlField) return null;
        const fileId = urlField.toString().split('/').pop().trim();
        return `http://localhost:5001/cameras/snapshot/${fileId}`;
    };

    // Функція точного пошуку
    const handleSearchSubmit = async (e) => {
        if (e) e.preventDefault();

        const queryTrimmed = searchQuery.trim();
        if (!queryTrimmed) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        try {
            const res = await API.get(`/cameras?search=${encodeURIComponent(queryTrimmed)}`);
            setSearchResults(res.data);
            setIsSearching(true);
        } catch (err) {
            console.error('Помилка пошуку:', err);
            alert('Сталася помилка під час пошуку: ' + (err.response?.data?.error || 'Невідома помилка'));
        }
    };

    // Очистка пошуку
    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    };

    const handleSelectCompany = async (company) => {
        handleClearSearch();
        setSelectedCompany(company);
        setSelectedRecorder(null);
        setCameras([]);
        if (!company) { setRecorders([]); return; }
        try {
            const res = await API.get(`/recorders?companyId=${company._id}`);
            setRecorders(res.data);
        } catch (err) { alert('Помилка завантаження NVR: ' + err.response?.data?.error); }
    };

    const handleSelectRecorder = async (recorder) => {
        setSelectedRecorder(recorder);
        if (!recorder) { setCameras([]); return; }
        try {
            const res = await API.get(`/cameras?recorderId=${recorder._id}`);
            setCameras(res.data);
        } catch (err) { alert('Помилка завантаження камер: ' + err.response?.data?.error); }
    };

    return (
        <MainLayout userRole={userRole} onLogout={onLogout}>

            {/* БЛОК СТРОГОГО ПОШУКУ КАМЕРИ */}
            <div className="search-section">
                <form onSubmit={handleSearchSubmit}>
                    <label className="search-section__label" htmlFor="camera-search">
                        🔍 Точний пошук камери (Повне співпадіння Назви / IP / Серійника):
                    </label>
                    <div className="search-section__input-group">
                        <input
                            type="text"
                            id="camera-search"
                            placeholder="Введіть точне значення (наприклад: 192.168.1.52)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-section__input"
                        />
                        <FormButton
                            type="submit"
                            className="search-section__button btn"
                        >
                            Пошук
                        </FormButton>

                        {isSearching && (
                            <FormButton
                                type="button"
                                onClick={handleClearSearch}
                                className="search-clear"
                            >
                                Скинути
                            </FormButton>
                        )}
                    </div>
                </form>

                {/* Результати точного пошуку */}
                {isSearching && (
                    <div className="search-results">
                        <div className="search-results__header">
                            <h4 className="search-results__title">Знайдено камер: {searchResults.length}</h4>
                        </div>

                        <div className="search-results__grid">
                            {searchResults.map(cam => {
                                const proxiedImageUrl = getProxiedImageUrl(cam.url);
                                const hasImage = !!proxiedImageUrl;

                                return (
                                    <div key={cam._id} className="camera-card">
                                        <div
                                            onClick={() => proxiedImageUrl && setModalImage(proxiedImageUrl)} 
                                            className={`camera-card__preview ${hasImage ? 'camera-card__preview--clickable' : 'camera-card__preview--no-signal'}`}
                                            style={hasImage ? { backgroundImage: `url(${proxiedImageUrl})` } : {}}
                                        >
                                            {!proxiedImageUrl && 'Немає сигналу'}
                                        </div>

                                        <div className="camera-card__name">
                                            {cam.name}
                                        </div>
                                        <div className="camera-card__ip">
                                            IP: {cam.ip}
                                        </div>
                                        {cam.sn && (
                                            <div className="camera-card__sn">
                                                S/N: <span className="camera-card__sn-acent">{cam.sn}</span>
                                            </div>
                                        )}

                                        <div className="camera-card__additional-info">
                                            <div>🏢 <strong>Компанія:</strong> {cam.recorderId?.companyId?.name || 'Не вказана'}</div>
                                            <div className="camera-card__additional-info__recorder">
                                                📡 <strong>Реєстратор:</strong> {cam.recorderId?.name || 'Не вказан'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {searchResults.length === 0 && (
                            <p className="search-results__no-results">Камер з таким значенням не знайдено. Перевірьте вірність даних.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ОСНОВНИЙ КОНТЕНТ */}
            <div className={`dashboard-content ${isSearching ? 'dashboard-content--dimmed' : ''}`}>
                <CompanyPanel
                    companies={companies}
                    setCompanies={setCompanies}
                    selectedCompany={selectedCompany}
                    onSelectCompany={handleSelectCompany}
                    userRole={userRole}
                />

                <RecorderPanel
                    selectedCompany={selectedCompany}
                    recorders={recorders}
                    setRecorders={setRecorders}
                    selectedRecorder={selectedRecorder}
                    onSelectRecorder={handleSelectRecorder}
                    userRole={userRole}
                />

                <CameraPanel
                    selectedRecorder={selectedRecorder}
                    cameras={cameras}
                    setCameras={setCameras}
                    userRole={userRole}
                    getProxiedImageUrl={getProxiedImageUrl}
                    setModalImage={setModalImage}
                />
            </div>

            {/* Глобальна модалка */}
            {modalImage && (
                <div className="global-modal" onClick={() => setModalImage(null)}>
                    <img src={modalImage} alt="Кадр" className="global-modal__image" />
                </div>
            )}
        </MainLayout>
    );
};

export default Dashboard;