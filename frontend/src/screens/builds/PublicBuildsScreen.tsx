import { useNavigate } from 'react-router-dom';
import { BuildsListScreen } from './BuildsListScreen';
import { API_ROUTES } from '../../config/api';
import type { BuildSummary } from '../../types/BuildLists.type';


export default function PublicBuildsScreen() {
  const navigate = useNavigate();

  const handleBuildClick = (build: BuildSummary) => {
    navigate(`/builds/${build.id}`);
  };

  return (
    <BuildsListScreen
      title="Public builds"
      apiUrl={API_ROUTES.PUBLIC_BUILDS}
      onBuildClick={handleBuildClick}
      cardVariant="public-builds"
    />
  );
}