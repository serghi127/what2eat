import ProtectedRoute from './components/ProtectedRoute';
import MainApp from './components/MainApp';

export default function Home() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  );
}
