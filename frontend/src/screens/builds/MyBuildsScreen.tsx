import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BuildsListScreen } from './BuildsListScreen';
import { API_ROUTES } from '../../config/api';
import type { BuildSummary } from '../../types/BuildLists.type';

export default function MyBuildsScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBuildClick = (build: BuildSummary) => {
    // TODO: navigate to build detail screen when implemented
    console.log('Clicked build', build.id);
    navigate(`/builds/${build.id}`);
  };

  return (
    <BuildsListScreen
      title="My builds"
      apiUrl={API_ROUTES.MY_BUILDS}
      authToken={user?.accessToken}
      showCreateButton
      onBuildClick={handleBuildClick}
      cardVariant="my-builds"
    />
  );
}