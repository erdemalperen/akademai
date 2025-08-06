import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { tokenService } from "../../lib/api/apiClient";

interface ProtectedRouteProps {
  children: ReactNode;
}


const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      
      if (!tokenService.isLoggedIn()) {
        setLoading(false);
        return;
      }

      
      const user = tokenService.getUser();
      if (user && user.role) {
        setUserRole(user.role);
      }
      setLoading(false);
    } catch (error) {
      console.error("Kullanıcı bilgisi alınamadı:", error);
      setLoading(false);
    }
  }, []);

  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
  }

  
  if (!tokenService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  
  if ((userRole === "ADMIN_SENIOR" || userRole === "ADMIN_JUNIOR") && 
      (location.pathname.includes("/trainings/all"))) {
    return <Navigate to="/dashboard" replace />;
  }

  
  if (userRole === "EMPLOYEE" && 
      (location.pathname.includes("/users") || location.pathname.includes("/reports"))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
