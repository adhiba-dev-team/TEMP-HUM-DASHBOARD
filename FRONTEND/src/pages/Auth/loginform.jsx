import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import loginimage from '../../assets/IMAGES/loginimg.jpg';
import { Eye, EyeOff } from 'lucide-react';
import WhiteLogo from '../../assets/LOGOS/nyslogo.png';

function Loginform() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
     const res = await API.post('/auth/login', {
       email,
       password,
     });


      if (!res.data.token) throw new Error('No token received from server.');

      const token = res.data.token;
      const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hrs

      //   Store with correct key
      localStorage.setItem('authToken', token);
      localStorage.setItem('token_expiry', expiry);
      localStorage.setItem('login_event', Date.now());

      //   Success toast
      toast.success('Login successful');

      // Small delay to show toast, then navigate
      setTimeout(() => navigate('/Overview', { replace: true }), 1000);
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.error || 'Invalid email or password';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:h-screen flex items-center justify-center p-4 bg-[#F5F8FE]">
      <div className="max-w-8xl p-4 lg:p-5 rounded-md">
        <div className="grid md:grid-cols-2 items-center gap-y-8">
          {/* ===== Left Side (Form) ===== */}
          <form
            className="max-w-md mx-auto w-full flex flex-col items-center"
            onSubmit={handleLogin}
          >
            {/* Logo + Heading CENTERED */}
            <div className="mb-8 text-center flex flex-col items-center">
              <img src={WhiteLogo} alt="Logo" className="h-[50px] mb-2" />

              <h1 className="font-inter font-bold text-[20px] text-[#ED1C24] leading-[30px] tracking-[0px] text-center">
                Temperature & Humidity <br />
                Data Logging & Monitoring System
              </h1>
            </div>

            {/* Form Fields — same width */}
            <div className="space-y-6 w-full px-4">
              {/* Email */}
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                  placeholder="Example@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={show ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm text-center -mt-3">
                  {error}
                </p>
              )}

              {/* Forgot Password */}
              <div className="flex justify-between text-sm">
                <div></div>
                <Link
                  to="/forgot-password"
                  className="text-[#ED1C24] font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* ===== Submit Button ===== */}
            <div className="mt-12 w-full px-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 text-[15px] tracking-wide font-medium rounded-md text-white
              ${loading ? 'bg-gray-400 cursor-wait' : 'bg-[#F2BA00]'}
              focus:outline-none`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <p className="text-sm mt-6 text-center text-slate-600">
                Don’t have an account?
                <Link
                  to="/signup"
                  className="text-[#ED1C24] font-medium tracking-wide hover:underline ml-1"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* ===== Right Image ===== */}
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

export default Loginform;
