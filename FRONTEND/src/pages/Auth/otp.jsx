import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';
import loginimage from '../../assets/IMAGES/loginimg.jpg';
import WhiteLogo from '../../assets/LOGOS/nyslogo.png';

function Otp() {
  const navigate = useNavigate();
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']); 
  const [loading, setLoading] = useState(false);
  const email = localStorage.getItem('reset_email');

  const handleChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const newDigits = [...otpDigits];
      newDigits[index] = value;
      setOtpDigits(newDigits);

      // Auto move to next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }

      // Move back when deleting
      if (!value && index > 0) {
        document.getElementById(`otp-${index - 1}`).focus();
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const otp = otpDigits.join('');

    if (otp.length < 6) {
      toast.error('Enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
     const res = await API.post('/auth/verify-otp', {
       email,
       otp,
     });


toast.success(res.data?.message || 'OTP verified successfully');

      // Save OTP for reset password API
      localStorage.setItem('reset_otp', otp);

      setTimeout(() => navigate('/reset-password'), 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:h-screen flex items-center justify-center p-4 bg-[#F5F8FE]">
      <div className="max-w-8xl p-4 lg:p-5 rounded-md">
        <div className="grid md:grid-cols-2 items-center gap-y-8">
          {/* ===== Left: OTP Form ===== */}
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

            {/* OTP Sent Message */}
            <div className="mb-6 text-center px-4">
              <h6 className="font-inter font-bold text-[16px] text-slate-900 tracking-[0px]">
                OTP sent to{' '}
                <span className="text-[#554DA8]">
                  {email
                    ? email.replace(/(.{3}).+(@.*)/, '$1***$2')
                    : 'your email'}
                </span>
              </h6>
            </div>

            {/* OTP Inputs */}
            <div className="w-full px-4 mb-8">
              <div className="flex items-center justify-between gap-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    className="w-12 h-12 text-center text-lg font-semibold
                text-slate-900 bg-white border border-slate-200
                rounded-md focus:outline-none focus:border-blue-600 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="w-full px-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-4 text-[15px] tracking-wide font-medium rounded-md text-white
              ${loading ? 'bg-gray-400 cursor-wait' : 'bg-[#F2BA00]'}
              focus:outline-none`}
              >
                {loading ? 'Verifying OTP...' : 'Submit'}
              </button>
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

export default Otp;
