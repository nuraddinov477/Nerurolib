import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/AdminCategories.css';

function AdminCategories() {
  const { categories, addCategory, deleteCategory } = useContext(DataContext);
  const { t } = useContext(LanguageContext);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory);
      setNewCategory('');
    }
  };

  return (
    <div className="admin-categories">
      <div className="admin-header">
        <h2>{t('categoriesManagement')} ({categories.length})</h2>
      </div>

      <div className="category-form">
        <h3>{t('categoriesManagement')}</h3>
        <div className="form-group">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t('category')}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button className="btn btn-primary" onClick={handleAddCategory}>
            ➕ {t('add')}
          </button>
        </div>
      </div>

      <div className="categories-list">
        <h3>{t('categories')}</h3>
        <div className="category-items">
          {categories.map(category => (
            <div key={category} className="category-item">
              <span className="category-name">🏷️ {category}</span>
              <button
                className="btn btn-delete"
                onClick={() => deleteCategory(category)}
              >
                🗑️ {t('delete')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminCategories;
