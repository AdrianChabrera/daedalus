import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import DeleteAccountModal from '../../components/DeleteAccountModal';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.DELETE, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.accessToken}`,
        },
      });

      if (response.ok) {
        logout();
        navigate('/');
      } else {
        alert('Error deleting profile');
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  return (
    <div>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div style={{ padding: '20px', position: 'relative', zIndex: 10 }}>
        <h2>Profile Screen: To be implemented</h2>
        <button
          onClick={() => setModalOpen(true)}
          disabled={loading}
          style={{ background: 'red', color: 'white', padding: '10px', marginTop: '10px' }}
        >
          {loading ? 'Deleting...' : 'Delete My Profile'}
        </button>
      </div>

      <DeleteAccountModal
        isOpen={modalOpen}
        loading={loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}