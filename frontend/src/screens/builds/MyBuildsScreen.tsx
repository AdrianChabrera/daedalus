import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BuildsListScreen } from './BuildsListScreen';
import { API_ROUTES } from '../../config/api';
import type { BuildSummary } from '../../types/BuildLists.type';
import ConfirmModal from '../../components/general/ConfirmModal';

export default function MyBuildsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [buildToDelete, setBuildToDelete] = useState<BuildSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleBuildClick = (build: BuildSummary) => {
    // TODO: navigate to build detail screen when implemented
    console.log('Clicked build', build.id);
    navigate(`/builds/${build.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!buildToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(API_ROUTES.DELETE_BUILD(buildToDelete.id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      });
      if (!res.ok) throw new Error();
      setBuildToDelete(null);
      setRefreshKey(k => k + 1);
    } catch {
      alert('Error deleting build');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <BuildsListScreen
        title="My builds"
        apiUrl={API_ROUTES.MY_BUILDS}
        authToken={user?.accessToken}
        showCreateButton
        key={refreshKey}
        onBuildClick={handleBuildClick}
        onDeleteBuild={setBuildToDelete}
        cardVariant="my-builds"
      />

      <ConfirmModal
        isOpen={!!buildToDelete}
        loading={deleting}
        title="Delete build"
        description={
          <>
            <strong>{buildToDelete?.name}</strong> will be permanently deleted.
            This action cannot be undone.
          </>
        }
        confirmLabel="Yes, delete it"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setBuildToDelete(null)}
      />
    </>
  );
}