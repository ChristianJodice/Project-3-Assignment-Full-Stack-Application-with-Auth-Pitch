import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import EquipmentList from "./pages/EquipmentList.jsx";
import EquipmentDetail from "./pages/EquipmentDetail.jsx";
import MyCheckouts from "./pages/MyCheckouts.jsx";
import CustodianEquipment from "./pages/CustodianEquipment.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="equipment"
          element={
            <PrivateRoute>
              <EquipmentList />
            </PrivateRoute>
          }
        />
        <Route
          path="equipment/:id"
          element={
            <PrivateRoute>
              <EquipmentDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="my-checkouts"
          element={
            <PrivateRoute>
              <MyCheckouts />
            </PrivateRoute>
          }
        />
        <Route
          path="custodian"
          element={
            <PrivateRoute custodianOnly>
              <CustodianEquipment />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
