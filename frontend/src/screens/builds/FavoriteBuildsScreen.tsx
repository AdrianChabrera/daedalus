import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BuildsListScreen } from '../builds/BuildsListScreen';
import type { BuildSummary } from '../../types/BuildLists.type';
import { API_ROUTES } from '../../config/api';
import { ArrowLeft } from 'lucide-react';

export default function FavoriteBuildsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBuildClick = (build: BuildSummary) => {
    navigate(`/builds/${build.id}`);
  };

  return (
    <BuildsListScreen
      title="Favourite Builds"
      apiUrl={API_ROUTES.LIST_FAVORITE_BUILDS}
      authToken={user?.accessToken}
      onBuildClick={handleBuildClick}
      cardVariant="public-builds"
      headerTop={
        <button className="backBtn" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />
          Back
        </button>
      }
    />
  );
}