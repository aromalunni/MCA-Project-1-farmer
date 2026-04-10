import React, { createContext, useContext, useState } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // Default English

    const t = (key) => {
        // Check if translation exists, else fallback to English, else key
        return translations[language]?.[key] || translations['en']?.[key] || key;
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'ml' : 'en'));
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
