import { Navigate, Outlet, useLocation } from "react-router-dom"

export default function ProtectedRoute() {
  const location = useLocation()

  const adminToken =
    localStorage.getItem("admin_token")

  if (!adminToken) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <Outlet />
}