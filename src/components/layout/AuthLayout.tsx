import { Outlet } from "react-router-dom";
import akademaiLogo from "../../assets/akademai.png";


const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-center mb-8">
          <img src={akademaiLogo} alt="Akademai" className="h-16 w-auto" />
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
