import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { DashboardLayout } from './components/layout/Layout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { JobsPage } from './pages/Jobs';
import { LiveMapPage } from './pages/LiveMap';
import { TechniciansPage } from './pages/Technicians';
import { InventoryPage } from './pages/Inventory';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { JobDetailPage } from './pages/JobDetail';
import { NewJobPage } from './pages/NewJob';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="new-job" element={<NewJobPage />} />
            <Route path="map" element={<LiveMapPage />} />
            <Route path="technicians" element={<TechniciansPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;