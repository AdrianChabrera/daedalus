import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/general/Layout';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import HomeScreen from './screens/home/HomeScreen';  
import ProtectedRoute from './components/general/ProtectedRoute';
import ProfileScreen from './screens/profile/ProfileScreen';
import ComponentsScreen from './screens/pc_components/PcComponentsScreen';
import ComponentDetailsScreen from './screens/pc_components/PcComponentDetailsScreen';
import CreateBuildScreen from './screens/builds/CreateBuildScreen';
import MyBuildsScreen from './screens/builds/MyBuildsScreen';
import PublicBuildsScreen from './screens/builds/PublicBuildsScreen';
import EditBuildScreen from './screens/builds/EditBuildScreen';
import BuildDetailsScreen from './screens/builds/BuildDetailsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login"    element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/components" element={<ComponentsScreen />} />
            <Route path="/components/:type/:id" element={<ComponentDetailsScreen />} />
            <Route path="/builds/new" element={<CreateBuildScreen />} />
            <Route
              path="/builds/my-builds"
              element={
                <ProtectedRoute>
                  <MyBuildsScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/builds/:id/edit"
              element={
                <ProtectedRoute>
                  <EditBuildScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/builds/:id" element={<BuildDetailsScreen />} />
            <Route path="/builds" element={<PublicBuildsScreen />} />
            <Route path="/" element={<HomeScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}