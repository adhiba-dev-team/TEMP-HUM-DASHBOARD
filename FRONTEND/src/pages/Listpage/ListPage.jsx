import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronDown, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../services/api';

export default function ListPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch device list dynamically
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);

        //   Get all registered devices
        const res = await axios.get('/api/devices');

        // Some APIs return { devices: [...] } — handle both cases
        const deviceList = Array.isArray(res.data)
          ? res.data
          : res.data?.devices || [];

        if (!deviceList.length) {
          console.warn('No devices returned from API');
          setDevices([]);
          return;
        }

        //   Fetch latest readings for each device
        const results = await Promise.allSettled(
          deviceList.map(async device => {
            try {
              const dataRes = await axios.get(`/api/devices/${device.id}`);

              // 🔥 NEW API FORMAT
              const d = dataRes.data?.today;

              if (!d) return null;

              // Determine status and colors
              let status = 'OK';
              let statusBg = 'bg-green-50';
              let statusColor = 'text-green-600';

              if (d.temperature >= 30) {
                status = 'Alert';
                statusBg = 'bg-red-50';
                statusColor = 'text-red-600';
              } else if (d.temperature >= 25) {
                status = 'High Temp';
                statusBg = 'bg-orange-50';
                statusColor = 'text-orange-600';
              }

              return {
                id: device.id,
                location: device.name || 'Unknown',
                temp: d.temperature ?? '--',
                humidity: d.humidity ?? '--',
                battery: d.battery || 'N/A',

                lastReading: d.timestamp
                  ? new Date(d.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--',

                status,
                statusBg,
                statusColor,
              };
            } catch (err) {
              console.warn(`Skipping device ${device.id}: ${err.message}`);
              return null;
            }
          })
        );

        //   Keep successful device readings only
        const validDevices = results
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);

        setDevices(validDevices);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return (
    <div className="min-h-fit  p-6">
      {/* Filters */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-5">
          <Link to="/">
            <button className="flex items-center gap-2 px-2 py-2 bg-white dark:bg-[#ffffff50] rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-[#ffffff]" />
            </button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0D0D0DD9] rounded-[5px] shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-[#ED1C24] dark:bg-[#ffffff30] text-white m-7 rounded-lg">
          <div className="grid grid-cols-6 gap-4 px-6 py-3 font-bold text-[14px]">
            <div>Device ID</div>
            <div>Location</div>
            <div>Temp (°C)</div>
            <div>Humidity (%)</div>
            <div>Last Reading</div>
            <div>View</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 m-7">
          {loading ? (
            <p className="text-center text-gray-500 text-sm">Loading...</p>
          ) : devices.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">
              No devices found
            </p>
          ) : (
            devices.map(device => (
              <div
                key={device.id}
                className="grid grid-cols-6 gap-4 px-6 py-3 hover:bg-[#ffffff15] transition-colors items-center"
              >
                <div className="font-bold text-[#202224] dark:text-[#ffffff] text-[14px]">
                  {device.id}
                </div>
                <div className="text-[#202224] dark:text-[#ffffff] text-[14px]">
                  {device.location}
                </div>
                <div className="text-[#202224] dark:text-[#ffffff] text-[14px]">
                  {device.temp}
                </div>
                <div className="text-[#202224] dark:text-[#ffffff] text-[14px]">
                  {device.humidity}
                </div>
                <div className="text-[#202224] dark:text-[#ffffff] text-[14px]">
                  {device.lastReading}
                </div>
                <div>
                  <button
                    onClick={() => navigate(`/device/${device.id}`)}
                    className="p-2 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 text-yellow-600 dark:text-[#fff]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
