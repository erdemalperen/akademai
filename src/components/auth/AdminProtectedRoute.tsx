import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { tokenService } from "../../lib/api/apiClient";

interface AdminProtectedRouteProps {
  children: ReactNode;
  role?: string; 
}


const AdminProtectedRoute = ({ children, role }: AdminProtectedRouteProps) => {
  const location = useLocation(); 

  
  const token = localStorage.getItem("jwt_token") || tokenService.getToken(); 
  
  if (!token) {
    console.log("[AdminProtectedRoute] Token bulunamadı. Giriş sayfasına yönlendiriliyor.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  
  try {
    const user = tokenService.getUser();
    
    if (!user) {
      
      console.log("[AdminProtectedRoute] Kullanıcı bilgisi bulunamadı. Giriş sayfasına yönlendiriliyor.");
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    
    if (role && user.role !== role) {
      console.warn(`[AdminProtectedRoute] Yetkisiz erişim girişimi. Bu sayfa ${role} rolünü gerektiriyor. Kullanıcı rolü: ${user.role}. Ana dashboarda yönlendiriliyor.`);
      return <Navigate to="/dashboard" replace />;
    }
    
    
    
    if (!role && (user.role !== "ADMIN_SENIOR" && user.role !== "ADMIN_JUNIOR")) {
      console.warn(`[AdminProtectedRoute] Yetkisiz erişim girişimi (genel admin). Kullanıcı rolü: ${user.role}. Ana dashboarda yönlendiriliyor.`);
      return <Navigate to="/dashboard" replace />;
    }
    
    
    console.log(`[AdminProtectedRoute] Kullanıcı yetkili: ${user.role}, İstenen rol: ${role || 'Belirtilmemiş'}`);
    return <>{children}</>;
  } catch (error) {
    console.error("[AdminProtectedRoute] Kullanıcı rolü kontrolü sırasında hata:", error);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default AdminProtectedRoute;
