import React, { useEffect, useState } from 'react';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import API from '../../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import { PieChart } from '@mui/x-charts/PieChart';
import MultiDateRangePicker from './InlineDatePicker';

export default function DeviceDetails() {
  const [deviceMeta, setDeviceMeta] = useState(null); // today + deviceId
  const [loading, setLoading] = useState(true);

  const [selectedDates, setSelectedDates] = useState([]); // array of YYYY-MM-DD
  const [rangeSummary, setRangeSummary] = useState(null); // { days, avgTemp, avgHum }
  const [rangeLoading, setRangeLoading] = useState(false);

  // Fetch "today" info once
  useEffect(() => {
    const fetchToday = async () => {
      try {
        const res = await API.get('/devices/1');;
      const json = res.data;

        setDeviceMeta(json); // { status, deviceId, today }
      } catch (err) {
        console.error('Device Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchToday();
  }, []);

  // Auto-load today's data when entering the page
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    setSelectedDates([today]); // update UI
    handleRangeSelect([today]); // fetch API for today
  }, []);

  // Handle calendar OK -> fetch range analytics
  const handleRangeSelect = async dates => {
    setSelectedDates(dates);

    if (!dates || !dates.length) {
      setRangeSummary(null);
      return;
    }

    const from = dates[0];
    const to = dates[dates.length - 1];

    try {
      setRangeLoading(true);
      const res = await API.get(`/devices/1?view=range&from=${from}&to=${to}`);
     const json = res.data;

      // expects: { data: [...], summary: { days, avgTemp, avgHum } }
      setRangeSummary(json.summary || null);
    } catch (e) {
      console.error('Range fetch error:', e);
      setRangeSummary(null);
    } finally {
      setRangeLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!deviceMeta) return <div className="p-4">No device found</div>;

  const deviceId = deviceMeta.deviceId;
  const daysCount = rangeSummary?.days ?? selectedDates.length ?? 0;
  const temp = rangeSummary?.avgTemp ?? null;
  const hum = rangeSummary?.avgHum ?? null;

  return (
    <>
      <div className="w-full min-h-fit p-2 sm:p-6 lg:p-6">
        {/* ===== Top Header ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7 gap-4 sm:gap-0">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link to="/List">
              <button className="flex items-center gap-2 px-2 py-2 bg-white dark:bg-[#ffffff50] rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-[#ffffff]" />
              </button>
            </Link>
            <h1 className="font-inter font-semibold text-[20px] text-[#ED1C24] dark:text-[#ffffff]">
              Device {deviceId}
            </h1>
          </div>

          {/* Send Report Button */}
          <Link to="/settings">
            <button className="text-[14px] px-6 py-2 bg-[#ED1C24] dark:bg-[#ffffff] dark:text-[#000] text-white rounded-lg hover:bg-[#5951A495] transition-colors font-medium">
              Send Report
            </button>
          </Link>
        </div>

        {/* ===== MAIN CONTENT GRID ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-auto">
          {/* CALENDAR */}
          <Calender onRangeSelect={handleRangeSelect} />

          {/* TWO CARDS */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 lg:row-span-2 grid grid-rows-2 gap-6">
            {/* TEMP CARD */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl h-full min-h-[161px] flex flex-col justify-center shadow-md">
              <div className="flex flex-col justify-between p-6">
                <h6 className="text-sm text-[#ED1C24] dark:text-[#ffffff]">
                  Avg Temperature ({daysCount || 0} Days)
                </h6>

                <div className="flex items-center justify-between w-full mt-7">
                  <h3 className="font-inter font-semibold text-[24px]">
                    {rangeLoading
                      ? '...'
                      : temp != null
                      ? `${temp.toFixed(2)}°C`
                      : '--'}
                  </h3>
                  <TrendingUp className="text-green-500 h-6 w-4" />
                </div>
              </div>
            </div>

            {/* HUMIDITY CARD */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl h-full min-h-[161px] flex flex-col justify-center shadow-md">
              <div className="flex flex-col justify-between p-6">
                <h6 className="text-sm text-[#ED1C24] dark:text-[#ffffff]">
                  Avg Humidity ({daysCount || 0} Days)
                </h6>

                <div className="flex items-center justify-between w-full mt-7">
                  <h3 className="font-inter font-semibold text-[24px]">
                    {rangeLoading
                      ? '...'
                      : hum != null
                      ? `${hum.toFixed(2)}%`
                      : '--'}
                  </h3>
                  <TrendingUp className="text-green-500 h-6 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Remaining components */}
          <DeviceInfo />
          <Thisweek />
          <Graph />
          <Circlechart />
        </div>
      </div>
    </>
  );
}

const Calender = ({ onRangeSelect }) => (
  <div className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 lg:row-span-2">
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl h-full shadow-md flex items-center justify-center">
      <div className="w-full h-full">
        <MultiDateRangePicker onRangeSelect={onRangeSelect} />
      </div>
    </div>
  </div>
);

function Thisweek() {
  const [activeTab, setActiveTab] = useState('today');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

 const fetchData = async () => {
   try {
     const [hourRes, weekRes, monthRes] = await Promise.all([
       API.get('/devices/1?view=hourly'),
       API.get('/devices/1?view=weekly'),
       API.get('/devices/1?view=monthly'),
     ]);

     setData({
       hours: hourRes.data.hourlyBreakdown ?? [],
       week: weekRes.data.weeklyBreakdown ?? [],
       months: monthRes.data.monthlyBreakdown ?? [],
     });
   } catch (err) {
     console.error('Analytics Fetch Error:', err);
   }
 };


  if (!data) return <p className="p-4">Loading...</p>;

  const { hours, week, months } = data;

  // TODAY – fixed 12 slots (2 hours each)
  const twoHourSlots = Array.from({ length: 12 }, (_, i) => {
    const start = i * 2;
    const end = start + 2;
    const match = hours.find(
      h => parseInt(h.hour) >= start && parseInt(h.hour) < end
    );

    return {
      time: `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(
        2,
        '0'
      )}:00`,
      temp: match?.avgTemp ?? '—',
      hum: match?.avgHum ?? '—',
    };
  });

  // WEEK – always 7 days (Mon → Sun)
  const fullWeek = (() => {
    const today = new Date();
    const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
    const monday = new Date(today.setDate(today.getDate() + diff));
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const match = week.find(w => w.date === iso);

      days.push({
        date: iso,
        temp: match?.avgTemp ?? '—',
        hum: match?.avgHum ?? '—',
      });
    }

    return days;
  })();

  // MONTH – show all 12 months, match by YYYY-MM
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const currentYear = new Date().getFullYear();

  const fullMonth = monthNames.map((name, i) => {
    const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;

    const match = months.find(m => m.month === monthKey);

    return {
      month: name,
      temp: match?.avgTemp ?? '—',
      hum: match?.avgHum ?? '—',
    };
  });

  const renderRows = () => {
    if (activeTab === 'today') {
      return twoHourSlots.map((row, i) => (
        <Row key={i} label={row.time} temp={row.temp} hum={row.hum} />
      ));
    }
    if (activeTab === 'week') {
      return fullWeek.map((row, i) => (
        <Row key={i} label={row.date} temp={row.temp} hum={row.hum} />
      ));
    }
    return fullMonth.map((row, i) => (
      <Row key={i} label={row.month} temp={row.temp} hum={row.hum} />
    ));
  };

  return (
    <div className="col-span-12 lg:col-span-3 row-span-3">
      <div className="w-full h-full bg-white dark:bg-[#1A1A1A] rounded-[22px] shadow-md p-5">
        {/* Tabs */}
        <Tabs active={activeTab} setActiveTab={setActiveTab} />

        {/* Header */}
        <Header active={activeTab} />

        {/* Body */}
        <div style={{ maxHeight: '520px' }} className="overflow-y-auto">
          {renderRows()}
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, temp, hum }) => (
  <div className="grid grid-cols-3 gap-3 py-2 text-xs font-semibold">
    <div>{label}</div>
    <div className="text-center">{temp === '—' ? '—' : `${temp}°C`}</div>
    <div className="text-right">{hum === '—' ? '—' : `${hum}%`}</div>
  </div>
);

const Tabs = ({ active, setActiveTab }) => (
  <div className="grid grid-cols-3 text-xs font-medium text-gray-700 mb-4 border-b pb-3">
    {['week', 'today', 'month'].map(tab => (
      <div
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`cursor-pointer text-center pb-2 relative ${
          active === tab ? 'text-red-600  dark:text-[#ffffff]' : 'text-gray-500'
        }`}
      >
        {tab === 'week' && 'This Week'}
        {tab === 'today' && 'Today'}
        {tab === 'month' && 'This Month'}

        {active === tab && (
          <div className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-red-600 dark:bg-[#ffffff] rounded-full"></div>
        )}
      </div>
    ))}
  </div>
);

const Header = ({ active }) => (
  <div className="grid grid-cols-3 gap-3 mb-3 border-b pb-3 text-xs font-medium text-gray-600 dark:text-[#ffffff]">
    <div>
      {active === 'today' ? 'Time' : active === 'week' ? 'Date' : 'Month'}
    </div>
    <div className="text-center">Temp</div>
    <div className="text-right">Hum</div>
  </div>
);

const Graph = () => {
  const [activeTab, setActiveTab] = useState('24hours');
  const [graphData, setGraphData] = useState({ hourly: [], weekly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const [hourRes, weekRes] = await Promise.all([
          API.get('/devices/1?view=hourly'),
          API.get('/devices/1?view=weekly'),
        ]);

        setGraphData({
          hourly: hourRes.data.hourlyBreakdown ?? [],
          weekly: weekRes.data.weeklyBreakdown ?? [],
        });
      } catch (err) {
        console.error('Graph Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  if (loading) return <p className="p-4">Loading graph...</p>;

  // ===============================
  // HOURLY GRAPH DATA
  // ===============================
  const graph24 = graphData.hourly.map(h => ({
    day: h.hour,
    value: h.avgTemp ?? 0,
    humidity: h.avgHum ?? 0,
  }));

  // ===============================
  // WEEKLY → ALWAYS SHOW 7 DAYS
  // ===============================
  // ===============================
  // WEEKLY → ALWAYS SUN → SAT (Current Week)
  // ===============================
  const buildFullWeekGraph = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 6 = Sat
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day); // Move to Sunday

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const week = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];

      week.push({
        rawDate: dateStr,
        day: weekDays[i], // LABEL: Sun → Sat
        value: 0,
        humidity: 0,
      });
    }

    // Insert backend values if exist
    week.forEach(item => {
      const match = graphData.weekly.find(w => w.date === item.rawDate);
      if (match) {
        item.value = match.avgTemp ?? 0;
        item.humidity = match.avgHum ?? 0;
      }
    });

    return week;
  };

  const graphWeek = buildFullWeekGraph();

  return (
    <div className="col-span-12 lg:col-span-5 row-span-1">
      <div className="w-full h-full min-h-[320px] bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-md">
        <div className="h-full p-5">
          {/* Title + Tabs */}
          <div className="flex flex-wrap items-center gap-4 mb-4 border-b">
            <button className="pb-3 px-1 font-medium text-[#ED1C24] text-[14px] dark:text-[#ffffff]">
              Temperature & Humidity Trends
            </button>

            <div className="flex gap-3 ml-auto">
              <button
                onClick={() => setActiveTab('24hours')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${
                  activeTab === '24hours'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                24 Hours
              </button>

              <button
                onClick={() => setActiveTab('thisweek')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${
                  activeTab === 'thisweek'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full border-2 border-current"></span>
                This Week
              </button>
            </div>
          </div>

          {/* GRAPH */}
          <div className="w-full" style={{ height: 'calc(100% - 70px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeTab === '24hours' ? graph24 : graphWeek}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue24" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D0CCF4" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#D0CCF4" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient
                    id="colorValueWeek"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient
                    id="colorHumidity"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#5951A466" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#5951A466" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="0"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  dy={5}
                  tick={{ fill: '#9ca3af', fontSize: 10 }} // SMALL FONT
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }} // SMALL FONT
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />

                {/* 24 HOURS */}
                {activeTab === '24hours' && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#ED1C24"
                      strokeWidth={1}
                      fill="url(#colorValue24)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stroke="#FFC107"
                      strokeWidth={1}
                      fill="url(#colorHumidity)"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </>
                )}

                {/* WEEKLY */}
                {activeTab === 'thisweek' && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#ED1C24"
                      strokeWidth={1}
                      fill="url(#colorValueWeek)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="humidity"
                      stroke="#FFC107"
                      strokeWidth={1}
                      fill="url(#colorHumidity)"
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const Circlechart = () => {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevice();
  }, []);

  const fetchDevice = async () => {
    try {
      const res = await API.get('/devices/1');
      const json = res.data; // ✅
      setToday(json.today);
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!today) return <p>No Data</p>;

  const temperature = today.temperature || 0;
  const humidity = today.humidity || 0;

  const pieChartData = [
    { id: 1, value: temperature, color: '#ED1C24' },
    { id: 2, value: humidity, color: '#FFC107' },
  ];

  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-1">
      <div className="w-full h-full min-h-[292px] bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[14px] text-[#ED1C24] dark:text-[#ffffff]">
            Temperature & Humidity
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 mt-4">
          <div className="flex flex-col justify-center space-y-4 mt-4 sm:mt-7">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#ED1C24] rounded-full"></div>
              <div className="text-xs text-slate-500 dark:text-[#ffffff]">
                Temperature: <b>{temperature}°C</b>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[#FFC107] rounded-full"></div>
              <div className="text-xs text-slate-500 dark:text-[#ffffff]">
                Humidity: <b>{humidity}%</b>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative">
            <PieChart
              width={200}
              height={200}
              series={[
                {
                  innerRadius: 45,
                  outerRadius: 95,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  data: pieChartData,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DeviceInfo = () => {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await API.get('/devices/1');
        const json = res.data; // ✅

        setDevice({
          id: json.deviceId,
          temperature: json.today.temperature,
          humidity: json.today.humidity,
          battery: json.today.battery,
          lastUpdate: json.today.timestamp,
        });
      } catch (err) {
        console.error('Device fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!device) return <div className="p-4">No device found</div>;

  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-1 lg:row-span-2">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl h-full min-h-[340px] p-5 shadow-md">
        <h3 className="text-lg font-semibold mb-2">Device Information</h3>

        <div className="space-y-6 mt-5">
          <div className="flex text-sm text-gray-600 gap-2 dark:text-[#ffffff]">
            <span className="font-medium">Device ID:</span>
            <span>{device.id}</span>
          </div>

          <div className="flex text-sm text-gray-600 gap-2 dark:text-[#ffffff]">
            <span className="font-medium">Temperature:</span>
            <span>{device.temperature}°C</span>
          </div>

          <div className="flex text-sm text-gray-600 gap-2 dark:text-[#ffffff]">
            <span className="font-medium">Humidity:</span>
            <span>{device.humidity}%</span>
          </div>

          <div className="flex text-sm text-gray-600 gap-2 dark:text-[#ffffff]">
            <span className="font-medium">Battery:</span>
            <span>{device.battery}</span>
          </div>

          <div className="flex text-sm text-gray-600 gap-2 dark:text-[#ffffff]">
            <span className="font-medium">Last Update:</span>
            <span>{device.lastUpdate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
