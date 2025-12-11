import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import loginimage from '../../assets/IMAGES/loginimg.jpg';
import { Eye, EyeOff } from 'lucide-react'; // 👁️ Eye icons
import WhiteLogo from '../../assets/LOGOS/nyslogo.png';
import axios from 'axios';


function Newpassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // 👁️ states for toggling visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const email = localStorage.getItem('reset_email');
  const otp = localStorage.getItem('reset_otp');

  const handleReset = async e => {
    e.preventDefault();

    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword: password,
      });

      toast.success('Password reset successful');

      // Clear stored values
      localStorage.removeItem('reset_email');
      localStorage.removeItem('reset_otp');

      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:h-screen flex items-center justify-center p-4 bg-[#F5F8FE]">
      <div className="max-w-8xl p-4 lg:p-5 rounded-md">
        <div className="grid md:grid-cols-2 items-center gap-y-8">
          {/* ===== Left: Form ===== */}
          <form
            className="max-w-md mx-auto w-full flex flex-col items-center"
            onSubmit={handleReset}
          >
            {/* Logo + Heading CENTERED */}
            <div className="mb-8 text-center flex flex-col items-center">
              <img src={WhiteLogo} alt="Logo" className="h-[50px] mb-2" />

              <h1 className="font-inter font-bold text-[20px] text-[#ED1C24] leading-[30px] tracking-[0px] text-center">
                Temperature & Humidity <br />
                Data Logging & Monitoring System
              </h1>
            </div>

            {/* ===== Input Fields ===== */}
            <div className="space-y-6 w-full px-4">
              {/* New Password */}
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    name="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* ===== Button ===== */}
            <div className="mt-12 w-full px-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 text-[15px] tracking-wide font-medium rounded-md text-white
              ${loading ? 'bg-gray-400 cursor-wait' : 'bg-[#F2BA00]'}
              focus:outline-none`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>

          {/* ===== Right: Image ===== */}
          <div className="w-full h-full">
            <img
              src={loginimage}
              className="w-full h-full object-cover rounded-[22px]"
              alt="login img"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Newpassword;
