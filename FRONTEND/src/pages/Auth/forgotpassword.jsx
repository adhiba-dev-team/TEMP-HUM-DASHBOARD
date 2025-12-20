import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import loginimage from '../../assets/IMAGES/loginimg.jpg';
import WhiteLogo from '../../assets/LOGOS/nyslogo.png';

function Forgotpassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', {
        email,
      });

      toast.success(res.data.message || 'OTP sent successfully!');

      // Save email temporarily for OTP verification page
      localStorage.setItem('reset_email', email);

      // Small delay to show toast before navigation
      setTimeout(() => navigate('/otp-verify'), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
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
            onSubmit={handleSendOtp}
          >
            {/* Logo + Heading CENTERED */}
            <div className="mb-8 text-center flex flex-col items-center">
              <img src={WhiteLogo} alt="Logo" className="h-[50px] mb-2" />

              <h1 className="font-inter font-bold text-[20px] text-[#ED1C24] leading-[30px] tracking-[0px] text-center">
                Temperature & Humidity <br />
                Data Logging & Monitoring System
              </h1>
            </div>

            {/* ===== Input Field ===== */}
            <div className="space-y-6 w-full px-4">
              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">
                  Email
                </label>

                <div className="relative flex items-center">
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full text-sm text-slate-900 bg-[#F7FBFF] pl-4 pr-10 py-3 rounded-md border border-slate-200 
                focus:border-blue-600 outline-none transition-all"
                    placeholder="Example@email.com"
                  />

                  {/* Email Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#bbb"
                    stroke="#bbb"
                    className="w-[18px] h-[18px] absolute right-4"
                    viewBox="0 0 682.667 682.667"
                  >
                    <defs>
                      <clipPath id="a" clipPathUnits="userSpaceOnUse">
                        <path d="M0 512h512V0H0Z"></path>
                      </clipPath>
                    </defs>
                    <g
                      clipPath="url(#a)"
                      transform="matrix(1.33 0 0 -1.33 0 682.667)"
                    >
                      <path
                        fill="none"
                        strokeMiterlimit="10"
                        strokeWidth="40"
                        d="M452 444H60c-22.091 0-40-17.909-40-40v-39.446l212.127-157.782c14.17-10.54 33.576-10.54 47.746 0L492 364.554V404c0 22.091-17.909 40-40 40Z"
                      ></path>
                      <path d="M472 274.9V107.999c0-11.027-8.972-20-20-20H60c-11.028 0-20 8.973-20 20V274.9L0 304.652V107.999c0-33.084 26.916-60 60-60h392c33.084 0 60 26.916 60 60v196.653Z"></path>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* ===== Send OTP Button ===== */}
            <div className="mt-12 w-full px-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 text-[15px] tracking-wide font-medium rounded-md text-white
              ${loading ? 'bg-gray-400 cursor-wait' : 'bg-[#F2BA00]'}
              focus:outline-none`}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
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

export default Forgotpassword;
