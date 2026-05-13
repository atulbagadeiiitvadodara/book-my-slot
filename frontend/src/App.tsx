import AppRouter from './routes/AppRouter';
import { useAuth } from './hooks/useAuth';

export default function App() {
  useAuth();
  return <AppRouter />;
}
