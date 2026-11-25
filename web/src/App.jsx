import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import RequireAuth from './components/RequireAuth.jsx';
import Landing from './pages/landing/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const Inventory = lazy(() => import('./pages/admin/Inventory.jsx'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement.jsx'));
const StockAnalysis = lazy(() => import('./pages/admin/StockAnalysis.jsx'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement.jsx'));
const Attendance = lazy(() => import('./pages/admin/Attendance.jsx'));
const TargetTracking = lazy(() => import('./pages/admin/TargetTracking.jsx'));
const Settings = lazy(() => import('./pages/admin/Settings.jsx'));
const Billing = lazy(() => import('./pages/admin/Billing.jsx'));
const Branches = lazy(() => import('./pages/admin/Branches.jsx'));
const Registrations = lazy(() => import('./pages/admin/Registrations.jsx'));
const Orders = lazy(() => import('./pages/orders/Orders.jsx'));
const MRDashboard = lazy(() => import('./pages/mr/MRDashboard.jsx'));
const CatalogDashboard = lazy(() => import('./pages/catalog/CatalogDashboard.jsx'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard.jsx'));

const guard = (role, el) => <RequireAuth role={role}>{el}</RequireAuth>;

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={guard('admin', <AdminDashboard />)} />
        <Route path="/admin/inventory" element={guard('admin', <Inventory />)} />
        <Route path="/admin/products" element={guard('admin', <ProductManagement />)} />
        <Route path="/admin/stock" element={guard('admin', <StockAnalysis />)} />
        <Route path="/admin/users" element={guard('admin', <UserManagement />)} />
        <Route path="/admin/attendance" element={guard('admin', <Attendance />)} />
        <Route path="/admin/targets" element={guard('admin', <TargetTracking />)} />
        <Route path="/admin/settings" element={guard('admin', <Settings />)} />
        <Route path="/admin/billing" element={guard('admin', <Billing />)} />
        <Route path="/admin/branches" element={guard('admin', <Branches />)} />
        <Route path="/admin/registrations" element={guard('admin', <Registrations />)} />
        <Route path="/admin/orders" element={guard('admin', <Orders />)} />

        <Route path="/mr" element={guard('mr', <MRDashboard />)} />
        <Route path="/doctor" element={guard('doctor', <CatalogDashboard portal="doctor" />)} />
        <Route path="/pharmacy" element={guard('pharmacy', <CatalogDashboard portal="pharmacy" />)} />
        <Route path="/employee" element={guard('employee', <EmployeeDashboard />)} />
        {/* Employees share the order desk and inventory pages with admin. */}
        <Route path="/employee/orders" element={guard('employee', <Orders />)} />
        <Route path="/employee/inventory" element={guard('employee', <Inventory />)} />
        <Route path="/employee/products" element={guard('employee', <ProductManagement />)} />
        <Route path="/employee/stock" element={guard('employee', <StockAnalysis />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
