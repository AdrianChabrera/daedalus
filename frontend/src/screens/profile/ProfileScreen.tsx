import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/general/ConfirmModal';

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

      <div style={{ padding: '20px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2>Profile Screen: To be implemented</h2>
        <button
          onClick={() => setModalOpen(true)}
          disabled={loading}
          style={{ background: 'red', color: 'white', padding: '10px', marginTop: '10px'}}
        >
          {loading ? 'Deleting...' : 'Delete My Profile'}
        </button>
        <button
          onClick={() => navigate('/builds/my-builds')}
          disabled={loading}
          style={{ background: 'white', color: 'black', padding: '10px', marginTop: '10px'}}
        >
          My builds
        </button>
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        loading={loading}
        title="Delete account"
        description={
          <>
            This action is <strong>permanent and irreversible</strong>. Your profile,
            builds, and all associated data will be deleted immediately.
          </>
        }
        confirmLabel="Yes, delete my account"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
}