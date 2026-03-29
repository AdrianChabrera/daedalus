import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </>
  );
}