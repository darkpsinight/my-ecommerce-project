import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';

const Login = () => {
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Seller Dashboard Login</h1>
        <p>Please log in through the buyer portal</p>
      </div>
    </div>
  );
};

export default Login; 