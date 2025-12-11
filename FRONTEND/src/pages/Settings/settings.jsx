import { useEffect, useState } from 'react';
import { ChevronLeft, NotebookPen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import img1 from '../../assets/IMAGES/Settings/sett-img-1.png';
import img2 from '../../assets/IMAGES/Settings/sett-img-2.png';
import img4 from '../../assets/IMAGES/Settings/sett-img-4.png';
import dayjs from 'dayjs';
import API from '../../services/api';

function CustomTabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <div className="mt-8">{children}</div>}
    </div>
  );
}

export default function Settingspage({ setTheme }) {
  const [value, setValue] = useState(0);

  // THEME STATE
  const [theme, setThemeState] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    setThemeState(localStorage.getItem('theme') || 'light');
  }, []);

  // APPLY THEME ON LOAD
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleChange = newValue => {
    setValue(newValue);
  };

  const tabs = [
    { label: 'Device Controls', id: 0 },
    { label: 'Dashboard Options', id: 1 },
    { label: 'Theme & Display', id: 2 },
    { label: 'Schedule & Automation', id: 3 },
  ];

  const [toggles, setToggles] = useState({
    barChart: true,
    graph: true,
    pieChart: true,
    singleDevice: true,
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('dashboardOptions'));
    if (saved) {
      setToggles(prev => ({ ...prev, ...saved }));
    }
  }, []);

  const dashboardCards = [
    { id: 'barChart', img: img4, title: 'Bar Chart' },
    { id: 'pieChart', img: img2, title: 'Pie Chart' },
    { id: 'singleDevice', img: img1, title: 'Single Device Info' },
  ];

  const handleToggle = id => {
    setToggles(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('dashboardOptions', JSON.stringify(updated));
      toast.success(`${id} ${updated[id] ? 'Enabled' : 'Disabled'}`);
      return updated;
    });
  };

  const [openModal, setOpenModal] = useState(null);
  const [activeType, setActiveType] = useState(null);

  useEffect(() => {
    const last = localStorage.getItem('lastScheduledType');
    if (last) setActiveType(last);
  }, []);

  const [activeSchedule, setActiveSchedule] = useState(null);

  useEffect(() => {
    fetchActiveSchedule();
  }, []);

  const fetchActiveSchedule = async () => {
    try {
      const res = await axios.get('/api/report/schedule/latest');
      if (res.data?.data) {
        setActiveSchedule(res.data.data);
        setActiveType(res.data.data.type);
      } else {
        setActiveSchedule(null);
        setActiveType(null);
      }
    } catch (err) {
      console.error('Error fetching active schedule:', err);
    }
  };

  const handleCancelSchedule = async () => {
    if (!activeSchedule?.type) return;
    try {
      await axios.delete(`/api/report/schedule/${activeSchedule.type}`);
      toast.success(`${activeSchedule.type} schedule canceled`);
      setActiveSchedule(null);
      setActiveType(null);
    } catch (err) {
      toast.error('Failed to cancel schedule', err);
    }
  };

  return (
    <>
      <div className="min-h-fit p-6 transition">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-2 px-2 py-2 bg-white  dark:bg-[#ffffff50] rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ChevronLeft className="w-4 h-4 text-slate-500  dark:text-[#ffffff]" />
            </button>
          </div>
        </div>

        <div
          className="
  w-full rounded-sm shadow-sm p-10 transition
  bg-white dark:bg-[#0D0D0DD9] 
  text-black
"
        >
          {/* Tabs Header */}
          <div className="mb-4">
            <ul
              className="flex flex-wrap gap-4 text-sm font-medium text-center"
              role="tablist"
            >
              {tabs.map(tab => (
                <li key={tab.id} role="presentation">
                  <button
                    onClick={() => handleChange(tab.id)}
                    className={`inline-block h-[40px] w-[180px] font-medium rounded-lg transition-colors 
    ${
      value === tab.id
        ? 'bg-[#ED1C24] text-white dark:text-black dark:bg-white'
        : 'text-[#000] hover:bg-[#f3f3f3] dark:text-white dark:hover:bg-[#333]'
    }
  `}
                    type="button"
                    role="tab"
                    aria-controls={`tabpanel-${tab.id}`}
                    aria-selected={value === tab.id}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Panels */}
          <CustomTabPanel value={value} index={0}>
            <Devicecontrol />
          </CustomTabPanel>

          <CustomTabPanel value={value} index={1}>
            <div>
              <h6 className="text-[16px] font-bold text-[#000] dark:text-[#ffffff]  ml-1">
                Dashboard Options
              </h6>

              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-7">
                {dashboardCards.map(card => (
                  <div
                    key={card.id}
                    className="
  p-4 border rounded-2xl hover:shadow-xl flex flex-col items-center 
  bg-white dark:bg-[#1A1A1A] dark:bg-[#1A1A1A] 
  transition-shadow duration-200"
                  >
                    <img
                      src={card.img}
                      alt={card.title}
                      className="w-full h-[150px] object-cover rounded-lg"
                    />
                    <div className="mt-3 flex flex-col items-center">
                      <h6 className="text-[14px] text-[#202224] dark:text-white font-medium mb-2">
                        {card.title}
                      </h6>
                      <ToggleSwitch
                        deviceId={card.id}
                        isOn={toggles[card.id]}
                        onChange={() => handleToggle(card.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CustomTabPanel>

          <CustomTabPanel value={value} index={2}>
            <div>
              <h6 className="text-[16px] font-bold text-[#000]  dark:text-[#ffffff]  ml-1">
                Dark Mode / Light Mode
              </h6>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-7">
              {/* LIGHT MODE CARD */}
              <div
                onClick={() => setTheme('light')}
                className={`
      cursor-pointer p-4 border rounded-2xl transition 
      bg-white dark:bg-[#1A1A1A] dark:bg-[#1A1A1A] 
      hover:shadow-xl 
      ${
        theme === 'light'
          ? 'border-[#ED1C24]  dark:border-[#ffffff50]  shadow-lg'
          : 'border-gray-300 dark:border-gray-600'
      }
    `}
              >
                <img
                  src="src/assets/IMAGES/Settings/2.jpg"
                  className="w-full h-[150px] object-cover rounded-lg"
                />

                <h6 className="mt-4 text-[14px] text-[#202224] dark:text-white font-medium">
                  Light Mode
                </h6>
              </div>

              {/* DARK MODE CARD */}
              <div
                onClick={() => setTheme('dark')}
                className={`
    cursor-pointer p-4 border rounded-2xl transition 
    bg-white dark:bg-[#1A1A1A] dark:bg-[#1A1A1A] 
    hover:shadow-xl 
    ${
      theme === 'dark'
        ? 'border-[#fff] shadow-lg'
        : 'border-gray-300 dark:border-[#ffffff]'
    }
  `}
              >
                <img
                  src="src/assets/IMAGES/Settings/sett-img-5.jpg"
                  className="w-full h-[150px] object-cover rounded-lg"
                />

                <h6 className="mt-4 text-[14px] text-[#202224] dark:text-white font-medium">
                  Dark Mode
                </h6>
              </div>
            </div>
          </CustomTabPanel>

          <CustomTabPanel value={value} index={3}>
            <div className="mt-7 flex flex-col gap-6">
              <div className="flex gap-4">
                {['daily', 'weekly', 'monthly'].map(type => (
                  // <button
                  //   key={type}
                  //   onClick={() => setOpenModal(type)}
                  //   className={`text-[14px] px-6 py-2 rounded-lg transition-colors font-medium ${
                  //     activeType === type
                  //       ? 'bg-[#ED1C24] text-white'
                  //       : 'bg-[#fff] text-[#000] border border-[#ED1C24]'
                  //   }`}
                  // >
                  //   {type.charAt(0).toUpperCase() + type.slice(1)}
                  // </button>
                  <button
                    key={type}
                    onClick={() => setOpenModal(type)}
                    className={`
    text-[14px] px-6 py-2 rounded-lg transition-colors font-medium
    border
    ${
      activeType === type
        ? `
          bg-[#ED1C24] text-white
          dark:bg-white dark:text-black dark:border-white
        `
        : `
          bg-[#fff] text-[#000] border-[#ED1C24]
          dark:bg-transparent dark:text-white dark:border-white dark:hover:bg-[#333]
        `
    }
  `}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Active Schedule Display */}
              {activeSchedule ? (
                <div className="border rounded-lg p-4 bg-white dark:bg-[#1A1A1A] shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#ED1C24] dark:text-[#ffffff] text-[15px]">
                      Active Schedule:{' '}
                      <span className="capitalize">{activeSchedule.type}</span>
                    </p>
                    <p className="text-[14px] text-gray-600 dark:text-[#ffffff50] ">
                      Time: {activeSchedule.time}
                    </p>
                    <p className="text-[14px] text-gray-600 dark:text-[#ffffff50] ">
                      Format: {activeSchedule.formats?.excel ? 'Excel' : ''}{' '}
                      {activeSchedule.formats?.pdf ? '/ PDF' : ''}
                    </p>
                  </div>
                  <button
                    onClick={handleCancelSchedule}
                    className="px-4 py-2 text-sm bg-red-500  dark:bg-[#ffffff]  text-white dark:text-[#000] rounded hover:bg-red-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No active auto-schedule set.
                </p>
              )}

              {openModal && (
                <ReportScheduleModal
                  type={openModal}
                  onClose={() => setOpenModal(null)}
                  onScheduled={type => {
                    setActiveType(type);
                    fetchActiveSchedule();
                  }}
                />
              )}
            </div>
          </CustomTabPanel>
        </div>
      </div>
    </>
  );
}

function ToggleSwitch({ deviceId, isOn, onChange }) {
  return (
    <label className="flex cursor-pointer select-none items-center">
      <div className="relative">
        <input
          type="checkbox"
          checked={isOn}
          onChange={() => onChange(deviceId)}
          className="sr-only"
        />
        <div
          className={`block h-[32px] w-[64px] rounded-full transition-colors duration-300 ${
            isOn ? 'bg-[#DEAF11]' : 'bg-[#BBC0C7]'
          }`}
        >
          <span
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold transition-opacity duration-300 ${
              isOn ? 'text-white opacity-100' : 'text-gray-400 opacity-0'
            }`}
          >
            On
          </span>
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold transition-opacity duration-300 ${
              !isOn ? 'text-gray-600 opacity-100' : 'text-white opacity-0'
            }`}
          >
            Off
          </span>
        </div>
        <div
          className={`dot absolute top-1 h-[24px] w-[24px] rounded-full bg-white dark:bg-[#1A1A1A] shadow-md transition-transform duration-300 ${
            isOn ? 'translate-x-[2.3rem]' : 'translate-x-1'
          }`}
        ></div>
      </div>
    </label>
  );
}

function Devicecontrol() {
  const [devices, setDevices] = useState([]); // fetched from API
  const [deviceStates, setDeviceStates] = useState({}); // toggle ON/OFF

  //   Fetch devices from API
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await fetch('/api/devices');
        const data = await res.json();
        if (data.status === 'success') {
          setDevices(data.devices);

          // load from localStorage or default all ON
          const saved = JSON.parse(localStorage.getItem('deviceStates')) || {};
          const initial = {};
          data.devices.forEach(d => {
            initial[d.id] = saved[d.id] ?? true;
          });
          setDeviceStates(initial);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };
    fetchDevices();
  }, []);

  //   Toggle handler
  const handleToggle = deviceId => {
    setDeviceStates(prev => {
      const updated = { ...prev, [deviceId]: !prev[deviceId] };
      localStorage.setItem('deviceStates', JSON.stringify(updated));
      return updated;
    });

    toast.success(
      `Device ${deviceId} ${!deviceStates[deviceId] ? 'enabled' : 'disabled'}`
    );
  };

  //   Filter to show only devices fetched
  const visibleDevices = devices.length > 0 ? devices : [];

  return (
    <div className="min-h-fit">
      {/* Tab content for Device Controls */}
      <div className="rounded-lg p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-3 border-b border-gray-200 pb-3">
          {[...Array(1)].map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-3 text-[#000] dark:text-[#ffffff]  text-[14px] font-semibold"
            >
              <span>Device ID</span>
              <span>Enable / Disable</span>
            </div>
          ))}
        </div>

        {/* Device List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 3 }).map((_, colIndex) => {
            // Divide devices into columns (6 per column)
            const columnDevices = visibleDevices.slice(
              colIndex * 6,
              (colIndex + 1) * 6
            );

            return (
              <div key={colIndex} className="space-y-4">
                {columnDevices.map(device => (
                  <div
                    key={device.id}
                    className="flex justify-between items-center border-b border-gray-100 pb-2 px-3"
                  >
                    <span className="text-gray-800 font-medium text-[15px] dark:text-[#ffffff] ">
                      {device.name}
                    </span>
                    <ToggleSwitch
                      deviceId={device.id}
                      isOn={deviceStates[device.id]}
                      onChange={handleToggle}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ReportScheduleModal({ type, onClose, onScheduled }) {
  const [time, setTime] = useState(dayjs().format('HH:mm'));
  const [day, setDay] = useState('Monday');
  const [monthDay, setMonthDay] = useState(1);
  const [formats, setFormats] = useState({
    excel: true,
    pdf: false,
  });
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = key => {
    setFormats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendReport = async () => {
    if (!formats.excel && !formats.pdf) {
      toast.error('Please select at least one format (Excel or PDF)');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        scheduleType: type,
        time,
        day,
        monthDay,
        formats,
      };

      await axios.post('/api/report/schedule', payload);

      toast.success(`  ${type} report scheduled successfully`);
      localStorage.setItem('lastScheduledType', type); // save for future
      onScheduled(type); // highlight active button
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadExisting = async () => {
      const res = await axios.get('/api/report/schedule/latest');
      const s = res.data?.data;
      if (s && s.type === type) {
        setTime(s.time);
        setFormats(s.formats || { excel: true, pdf: false });
        setMonthDay(s.monthDay || 1);
        setDay(s.day || 'Monday');
      }
    };
    loadExisting();
  }, [type]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-6 w-[420px]">
        <h2 className="text-lg font-semibold text-[#ED1C24] mb-4 text-center">
          {type.charAt(0).toUpperCase() + type.slice(1)} Report Schedule
        </h2>

        {/* Weekly */}
        {type === 'weekly' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Select Day:
            </label>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            >
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
              ].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Monthly */}
        {type === 'monthly' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">
              Day of Month:
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={monthDay}
              onChange={e => setMonthDay(e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
        )}

        {/* Time */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            Select Time:
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        {/* Formats */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2">
            Report Format:
          </label>
          <div className="flex gap-5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formats.excel}
                onChange={() => handleCheckboxChange('excel')}
              />
              <span className="text-sm">Excel (.xlsx)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formats.pdf}
                onChange={() => handleCheckboxChange('pdf')}
              />
              <span className="text-sm">PDF</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSendReport}
            className="px-4 py-2 text-sm bg-[#ED1C24] text-white rounded hover:bg-[#c3171b] disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
