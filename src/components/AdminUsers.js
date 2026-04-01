import React, { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/AdminUsers.css';

function AdminUsers() {
  const { users, addUser, deleteUser } = useContext(DataContext);
  const { t } = useContext(LanguageContext);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = () => {
    if (formData.name && formData.email) {
      addUser(formData);
      setFormData({
        name: '',
        email: '',
        role: 'user'
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h2>{t('usersManagement')} ({users.length})</h2>
        <button
          className="btn btn-primary"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? '✖️ ' + t('cancel') : '➕ Add User'}
        </button>
      </div>

      {isAdding && (
        <div className="user-form">
          <h3>Add New User</h3>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="User Name"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            <label>{t('status')}:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="user">{t('userName')}</option>
              <option value="admin">{t('adminName')}</option>
            </select>
          </div>
          <button className="btn btn-success" onClick={handleAddUser}>
            ✔️ {t('add')}
          </button>
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role ${user.role}`}>
                    {user.role === 'admin' ? '👑' : '👤'} {user.role === 'admin' ? t('adminName') : t('userName')}
                  </span>
                </td>
                <td>
                  {user.role !== 'admin' && (
                    <button
                      className="btn btn-delete"
                      onClick={() => deleteUser(user.id)}
                    >
                      🗑️ {t('delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
