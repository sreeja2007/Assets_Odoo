import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">
          The page you are looking for does not exist or you do not have permission to view it.
        </p>
        <div className="mt-6">
          <Button 
            variant="primary" 
            onClick={handleReturn}
            className="w-full !bg-blue-600 hover:!bg-blue-700 text-white py-2"
          >
            {currentUser ? 'Return to Dashboard' : 'Go to Login'}
          </Button>
        </div>
      </div>
    </div>
  );
}
