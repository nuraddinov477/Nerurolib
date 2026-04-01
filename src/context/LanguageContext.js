import React, { createContext, useState } from 'react';
import { translations } from '../i18n/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language] = useState('uz');

  const t = (key) => {
    return translations['uz']?.[key] || key;
  };

  const changeLanguage = () => {};

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
