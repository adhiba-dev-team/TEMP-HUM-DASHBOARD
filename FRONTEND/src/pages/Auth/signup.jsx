import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../services/api';
import loginimage from '../../assets/IMAGES/loginimg.jpg';
import { Eye, EyeOff } from 'lucide-react';
import WhiteLogo from '../../assets/LOGOS/nyslogo.png';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    try {
      setLoading(true);
      const res = await API.post('/auth/signup', {
        name: formData.name, //   include name
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Signup successful! Redirecting...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      toast.error(err.response?.data?.error || 'Signup failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:h-screen flex items-center justify-center p-4 bg-[#F5F8FE]">
      <div className="max-w-8xl p-4 lg:p-5 rounded-md">
        <div className="grid md:grid-cols-2 items-center gap-y-8">
          {/* Left image */}
          <div className="w-full h-full">
            <img
              src={loginimage}
              className="w-full h-full object-cover rounded-[22px]"
              alt="login img"
            />
          </div>

          {/* Signup Form */}
          <form
            className="max-w-md mx-auto w-full flex flex-col items-center"
            onSubmit={handleSubmit}
          >
            {/* Logo + Heading CENTERED */}
            <div className="mb-8 text-center flex flex-col items-center">
              <img src={WhiteLogo} alt="Logo" className="h-[50px] mb-2" />

              <h1 className="font-inter font-bold text-[20px] text-[#ED1C24] leading-[30px] tracking-[0px] text-center">
                Temperature & Humidity <br />
                Data Logging & Monitoring System
              </h1>
            </div>

            {/* INPUTS — aligned same width */}
            <div className="space-y-6 w-full px-4">
              {/* Name */}
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                    placeholder="Enter password"
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
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 focus:border-blue-600 outline-none transition-all"
                    placeholder="Re-enter password"
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

            {/* BUTTON — hover disabled */}
            <div className="mt-12 w-full px-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 text-[15px] tracking-wide font-medium rounded-md text-white 
            bg-[#F2BA00] 
            cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Signing up...' : 'Sign up'}
              </button>

              <p className="text-sm mt-6 text-center text-slate-600">
                Already have an account?
                <span
                  onClick={() => navigate('/login')}
                  className="text-[#ED1C24] font-medium tracking-wide hover:underline ml-1 cursor-pointer"
                >
                  Sign in
                </span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
