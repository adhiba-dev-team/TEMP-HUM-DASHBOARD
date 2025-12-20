import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import API from '../../services/api';

export default function SupportPage() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  //   Fetch devices from API
  useEffect(() => {
    API.get('/devices')
      .then(res => {
        const data = res.data;

        if (Array.isArray(data)) {
          setDevices(data);
        } else if (data.devices) {
          setDevices(data.devices);
        } else {
          toast.error('Failed to load devices');
        }
      })
      .catch(() => toast.error('Error fetching devices'))
      .finally(() => setFetching(false));
  }, []);

  //   Auto-fill device name when device ID is selected
  const handleDeviceChange = id => {
    setDeviceId(id);
    const selected = devices.find(d => String(d.id) === String(id));
    if (selected) {
      setDeviceName(selected.name);
    } else {
      setDeviceName('');
    }
  };

  //   Handle form submit
 const handleSubmit = async e => {
   e.preventDefault();

   if (!deviceId || !deviceName) {
     toast.error('Please select a device');
     return;
   }

   setLoading(true);

   try {
     const res = await API.post('/support/send', {
       deviceId,
       deviceName,
       description,
     });

     const data = res.data;

     if (data.success) {
       toast.success('Mail sent successfully!');
       setDeviceId('');
       setDeviceName('');
       setDescription('');
     } else {
       toast.error(data.message || 'Failed to send mail.');
     }
   } catch (err) {
     toast.error('Error sending request');
   } finally {
     setLoading(false);
   }
 };


  return (
    <div className="min-h-fit p-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-7">
        <Link to="/">
          <button className="flex items-center gap-2 px-2 py-2 bg-white  dark:bg-[#ffffff50] rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <ChevronLeft className="w-4 h-4 text-slate-500  dark:text-[#ffffff]" />
          </button>
        </Link>
      </div>

      <div className="flex flex-col items-center">
        <div className="mt-20 bg-white dark:bg-[#1A1A1A] p-10 rounded-2xl shadow-xl w-full max-w-3xl">
          <form onSubmit={handleSubmit} className="mx-auto">
            <div className="mb-10 text-center">
              <h6 className="text-[20px] text-[#ED1C24]  dark:text-[#fff]  font-semibold tracking-tight">
                Submit New Ticket
              </h6>
            </div>

            {fetching ? (
              <p className="text-gray-500 text-center">Loading devices...</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                {/* Device ID Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-[#ED1C24] dark:text-[#fff]">
                    Device ID
                  </label>
                  <div className="relative mt-2.5">
                    <select
                      value={deviceId}
                      onChange={e => handleDeviceChange(e.target.value)}
                      className="block appearance-none w-full lg:w-[330px] rounded-md bg-[#FBF7D6] dark:bg-[#ffffff50] px-4 py-2 pr-10 text-gray-900 text-base"
                    >
                      <option value="">Select Device ID</option>
                      {devices.map(dev => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name
                            ? dev.name.replace('device_', 'Device ')
                            : `Device ${dev.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Device Name (Auto-filled) */}
                <div>
                  <label className="block text-sm font-semibold text-[#ED1C24] dark:text-[#fff]">
                    Device Name
                  </label>
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={deviceName}
                      readOnly
                      placeholder="Auto-filled after selecting Device ID"
                      className="block w-full lg:w-[330px] rounded-md bg-[#FBF7D6] dark:bg-[#ffffff50]  px-3.5 py-2 text-gray-700 text-base  cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#ED1C24] dark:text-[#fff]">
                    Description
                  </label>
                  <div className="mt-2.5">
                    <textarea
                      rows={4}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="block w-full lg:w-[690px] rounded-md bg-[#FBF7D6] dark:bg-[#ffffff50]   px-3.5 py-2 text-gray-900 text-base  "
                      placeholder="Describe the issue..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                type="button"
                onClick={() => {
                  setDeviceId('');
                  setDeviceName('');
                  setDescription('');
                }}
                className="text-[14px] px-6 py-2 bg-white dark:bg-[#1A1A1A] text-[#ED1C24] dark:text-[#fff] rounded-lg font-medium border border-[#ED1C24]  dark:border-[#fff] hover:bg-[#FDF5BD]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="text-[14px] px-6 py-2 bg-[#ED1C24] text-white rounded-lg transition-colors font-medium  dark:bg-[#fff]  dark:text-[#000] "
              >
                {loading ? 'Sending...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
