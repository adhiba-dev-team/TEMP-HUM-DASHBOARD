import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import temp1 from '../../assets/IMAGES/20-temp.png';
import temp2 from '../../assets/IMAGES/cloud-10.png';
import temp3 from '../../assets/IMAGES/cloud-30.png';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts';
import { PieChart } from '@mui/x-charts/PieChart';
import API from '../../services/api';
import { Toaster } from 'react-hot-toast';
import dayjs from 'dayjs';
import useDeviceSocket from '../../hooks/useDeviceSocket';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('24hours');
  const [filter, setFilter] = useState('monthly');
  const [pieChartData, setPieChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allAverages, setAllAverages] = useState(null);
  const [monthlyBarData, setMonthlyBarData] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [weekLoading] = useState(false);
  const [deviceData, setDeviceData] = useState(null);
  const [graph24, setGraph24] = useState([]);
  const [graphWeek, setGraphWeek] = useState([]);
  const [deviceList, setDeviceList] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [loadingDevice, setLoadingDevice] = useState(false);

  const cardsPerView = 2;
  const maxIndex = Math.max(0, devices.length - cardsPerView);

  // Fetch devices list and last reading per device (for carousel cards)
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoadingDevices(true);

        const listRes = await API.get('/devices');
        const deviceListRes = listRes.data?.devices || [];

        setDeviceList(deviceListRes);

        if (deviceListRes.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(deviceListRes[0].id);
        }

        const results = await Promise.allSettled(
          deviceListRes.map(async d => {
            try {
              const res = await API.get(`/devices/${d.id}`);
              const today = res.data?.today;
if (!today) {
  return {
    id: d.id,
    name: d.name.replace('device_', 'Device '),
    temp: null,
    humidity: null,
    bgColor: temp2,
  };
}



              return {
                id: d.id,
                name: d.name.replace('device_', 'Device '),
                temp: today.temperature ?? null,
                humidity: today.humidity ?? null,
                bgColor:
                  today.temperature < 25
                    ? temp2
                    : today.temperature < 30
                    ? temp1
                    : temp3,
              };
            } catch {
              return null;
            }
          })
        );

        const finalList = results
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);

        const savedStates =
          JSON.parse(localStorage.getItem('deviceStates')) || {};

        const filteredDevices = finalList.filter(
          d => savedStates[d.id] !== false
        );

       setDevices(prev => {
         const map = new Map(prev.map(d => [d.id, d]));
         filteredDevices.forEach(d => map.set(d.id, d));
         return Array.from(map.values());
       });

      } catch (err) {
        console.error('Error loading devices:', err);
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, []);

  const handlePrev = () => setCurrentIndex(prev => Math.max(0, prev - 1));
  const handleNext = () =>
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));

  // Fetch average data once (populates pie, monthly bar and base data)
  const fetchAverageData = async () => {
    setLoading(true);

    try {
      const res = await API.get('/analytics/average');
      const api = res.data || {};

      // Store overall averages
      const avg = api.average || {};
      setAllAverages(avg);

      // PIE CHART
      const selected = avg[filter] || avg.monthly || avg.daily;
      if (selected) {
        setPieChartData([
          { id: 0, value: selected.avgTemp ?? 0, color: '#ED1C24' },
          { id: 1, value: selected.avgHum ?? 0, color: '#FFC107' },
        ]);
      }

      // 24 HOURS GRAPH
      const hourly = api.hourlyBreakdown || [];
      setGraph24(
        hourly.map(h => ({
          day: h.hour,
          value: h.avgTemp ?? 0,
          humidity: h.avgHum ?? 0,
        }))
      );

      // WEEK GRAPH
      const weekly = api.weeklyBreakdown || [];
      setGraphWeek(
        weekly.map(w => ({
          day: dayjs(w.date).format('ddd'),
          value: w.avgTemp ?? 0,
          humidity: w.avgHum ?? 0,
        }))
      );

      // WEEK LIST — RIGHT SIDE
      setWeekData(
        weekly.map(w => ({
          date: dayjs(w.date).format('DD-MM-YY'),
          temp: w.avgTemp !== null ? `${w.avgTemp}°C` : '--',
          humidity: w.avgHum !== null ? `${w.avgHum}%` : '--',
        }))
      );

      // BAR CHART (THIS MONTH)
      setMonthlyBarData([
        {
          name: dayjs().format('MMMM'),
          temperature: avg.monthly?.avgTemp ?? 0,
          humidity: avg.monthly?.avgHum ?? 0,
        },
      ]);
    } catch (err) {
      console.error('Error fetching averages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAverageData();
  }, []); // ← this is correct

  // --- REAL-TIME LIVE DEVICE UPDATES FROM SOCKET.IO ---
useDeviceSocket(payload => {
  const { deviceId, temperature, humidity } = payload;

  setDevices(prev => {
    // ✅ update ONLY if device already exists
    if (!prev.some(d => d.id === deviceId)) {
      return prev; // ignore unknown device
    }

    return prev.map(d =>
      d.id === deviceId
        ? {
            ...d,
            temp: temperature,
            humidity,
            bgColor:
              temperature < 25 ? temp2 : temperature < 30 ? temp1 : temp3,
          }
        : d
    );
  });
});


  // update pie when filter changes
  useEffect(() => {
    if (!allAverages) return;
    const selected =
      allAverages[filter] || allAverages.monthly || allAverages.daily;
    if (!selected) return;
    setPieChartData([
      { id: 0, value: selected.avgTemp ?? 0, color: '#ED1C24' },
      { id: 1, value: selected.avgHum ?? 0, color: '#FFC107' },
    ]);
  }, [filter, allAverages]);

  // Load device list for single device selector
  // useEffect(() => {
  //   const fetchDeviceList = async () => {
  //     try {
  //       const res = await API.get('/devices');
  //       const list = res.data?.devices || [];
  //       setDeviceList(list);
  //       if (list.length > 0 && !selectedDeviceId) {
  //         setSelectedDeviceId(list[0].id);
  //       }
  //     } catch (err) {
  //       console.error('Failed to load device list', err);
  //     }
  //   };

  //   fetchDeviceList();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // Load single device data when selectedDeviceId changes

  useEffect(() => {
    if (!selectedDeviceId) return;

    const loadDevice = async () => {
      try {
        setLoadingDevice(true);

        const res = await API.get(`/devices/${selectedDeviceId}`);

        // 🔥 Updated for NEW API structure
        const today = res.data?.today;

        if (!today) {
          setDeviceData(null);
          return;
        }

        setDeviceData({
          temperature: today.temperature,
          humidity: today.humidity,
          battery: today.battery ?? 'N/A',
          lastRead: today.timestamp
            ? new Date(today.timestamp).toLocaleTimeString()
            : '—',
          status:
            today.temperature < 20
              ? 'Low Temp'
              : today.temperature < 30
              ? 'Normal'
              : 'High Temp',
        });
      } catch (err) {
        console.error('Failed to fetch device data:', err);
        setDeviceData(null);
      } finally {
        setLoadingDevice(false);
      }
    };

    loadDevice();
  }, [selectedDeviceId]);

  // dashboard options (persisted)
  const [dashboardOptions, setDashboardOptions] = useState({
    graph: true,
    barChart: true,
    pieChart: true,
    singleDevice: true,
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('dashboardOptions'));
    if (saved) setDashboardOptions(prev => ({ ...prev, ...saved }));
  }, []);

  /* inside your component */
  const sliderRef = useRef(null);
  const firstCardRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(0);

  /* measure slide width whenever devices change or window resizes */
  useEffect(() => {
    function calc() {
      const first = firstCardRef.current;
      const track = sliderRef.current;
      if (!first || !track) return;

      const cardRect = first.getBoundingClientRect();
      // compute gap from computed style on track (flex gap)
      const cs = window.getComputedStyle(track);
      const gap = parseFloat(cs.gap || cs.columnGap || 0);
      setSlideWidth(Math.round(cardRect.width + (isNaN(gap) ? 0 : gap)));
    }

    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [devices]);

  return (
    <>
      <Toaster position="top-right" />

      {/* Top Section */}
      <div className="max-w-[1450px] mx-auto flex flex-col xl:flex-row gap-6 sm:p-2">
        {/* Carousel */}
        <div className="w-full xl:w-[1100px]">
          <div className="inner-content relative w-full">
            {/* Left Button (inside the section but offset from cards using viewport padding) */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#1A1A1A] dark:bg-black shadow-lg flex items-center justify-center transition-all
              ${
                currentIndex === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#D0CCF4] cursor-pointer'
              }`}
              style={{ pointerEvents: 'auto' }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>

            {/* Slider Viewport - give horizontal padding so cards never sit under arrows */}
            <div className="overflow-hidden w-full px-16">
              {' '}
              {/* <-- px-12 reserves space for arrows */}
              <div
                ref={sliderRef}
                className="flex transition-transform duration-300 ease-out gap-4 sm:gap-6 items-stretch"
                style={{
                  transform: `translateX(-${currentIndex * slideWidth}px)`,
                }}
              >
                {loadingDevices ? (
                  <p className="text-gray-500 text-sm">Loading devices...</p>
                ) : devices.length === 0 ? (
                  <p className="text-gray-500 text-sm">No devices found</p>
                ) : (
                  devices.map((device, idx) => (
                    <div
                      key={device.id}
                      ref={idx === 0 ? firstCardRef : null} // only first card gets the measuring ref
                      className="slider-card min-w-[180px] sm:min-w-[210px] lg:min-w-[240px] h-[220px] sm:h-[240px] bg-cover bg-center rounded-xl text-white p-4 sm:p-5 flex-shrink-0"
                      style={{ backgroundImage: `url(${device.bgColor})` }}
                    >
                      <div className="font-semibold text-lg">{device.name}</div>
                      <div className="text-[32px] sm:text-[36px] mt-8">
                        {device.temp ?? '--'}
                        <span className="text-base">°C</span>
                      </div>
                      <div className="text-sm mt-2">
                        Temperature: {device.temp ?? '--'}°C
                      </div>
                      <div className="text-sm mt-2">
                        Humidity: {device.humidity ?? '--'}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Button */}
            <button
              onClick={handleNext}
              disabled={currentIndex === maxIndex}
              className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#1A1A1A] dark:bg-black shadow-lg flex items-center justify-center transition-all
              ${
                currentIndex === maxIndex
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[#D0CCF4] cursor-pointer'
              }
            `}
              style={{ pointerEvents: 'auto' }}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>

          <div className="inner-content-two flex flex-col lg:flex-row gap-6 mt-6">
            <div className="w-full lg:w-4/12">
              <div className="flex flex-col sm:flex-row mb-4 gap-4">
                <div className="w-full sm:w-6/12 h-[176px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-2xl shadow-md">
                  <div className="flex flex-col items-center justify-center h-full">
                    <h6 className="text-[14px]">Today Temperature</h6>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold">
                        {deviceData?.temperature ??
                          allAverages?.daily?.avgTemp ??
                          '--'}
                        °C
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-6/12 h-[176px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-2xl shadow-md">
                  <div className="flex flex-col items-center justify-center h-full">
                    <h6 className="text-[14px]">Today Avg Humidity</h6>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold">
                        {deviceData?.humidity ??
                          allAverages?.daily?.avgHum ??
                          '--'}
                        %
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row mb-4 gap-4">
                <div className="w-full sm:w-6/12 h-[176px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-2xl shadow-md">
                  <div className="flex flex-col items-center justify-center h-full">
                    <h6 className="text-[14px]">This Week Avg</h6>

                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold">
                        {allAverages?.weekly?.avgTemp != null
                          ? `${allAverages.weekly.avgTemp}°C`
                          : '--'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold">
                        {allAverages?.weekly?.avgHum != null
                          ? `${allAverages.weekly.avgHum}%`
                          : '--'}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-6/12 h-[176px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-2xl shadow-md">
                  <div className="flex flex-col items-center justify-center h-full">
                    <h6 className="text-[14px]">This Month Avg</h6>

                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold">
                        {allAverages?.monthly?.avgTemp != null
                          ? `${allAverages.monthly.avgTemp}°C`
                          : '--'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold">
                        {allAverages?.monthly?.avgHum != null
                          ? `${allAverages.monthly.avgHum}%`
                          : '--'}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graph Section */}
            <div className="w-full lg:w-8/12 h-[368px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-2xl shadow-md">
              <div className="h-full p-5">
                {/* Title + Tabs */}
                <div className="flex flex-wrap items-center gap-4 mb-4 border-b">
                  <button className="pb-3 px-1 font-medium text-[#ED1C24] dark:text-[#ffffff]  text-[14px]">
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
                        <linearGradient
                          id="colorValue24"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#D0CCF4"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#D0CCF4"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorValueWeek"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#9ca3af"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#9ca3af"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorHumidity"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#5951A466"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#5951A466"
                            stopOpacity={0}
                          />
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
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        dy={5}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px',
                        }}
                        labelStyle={{ color: '#6b7280', fontSize: '12px' }}
                        itemStyle={{
                          color: '#1f2937',
                          fontSize: '14px',
                          fontWeight: '600',
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
                            name="Temperature"
                          />
                          <Area
                            type="monotone"
                            dataKey="humidity"
                            stroke="#FFC107"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            fill="url(#colorHumidity)"
                            dot={false}
                            name="Humidity"
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
                            name="Temperature"
                          />
                          <Area
                            type="monotone"
                            dataKey="humidity"
                            stroke="#FFC107"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            fill="url(#colorHumidity)"
                            dot={false}
                            name="Humidity"
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Weekly List */}
        <div className="w-full xl:w-[300px] h-auto xl:h-[630px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-[22px] shadow-md p-5">
          <h3 className="text-[14px] text-center font-semibold text-[#ED1C24] dark:text-[#ffffff]  mb-6">
            This Week Average
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 dark:text-[#ffffff]">
              Date
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-[#ffffff] text-center">
              Temp
            </div>
            <div className="text-xs font-medium text-gray-500 text-right dark:text-[#ffffff]">
              Hum
            </div>
          </div>

          <div
            className="space-y-3 overflow-y-auto"
            style={{ maxHeight: '540px' }}
          >
            {weekLoading ? (
              <p className="text-center text-xs text-gray-400">Loading...</p>
            ) : weekData.length ? (
              weekData.map((day, index) => (
                <div
                  key={index}
                  className="grid grid-cols-3 gap-3 py-2.5 hover:bg-[#ffffff50] rounded-lg transition-colors"
                >
                  <div className="text-xs text-gray-700 dark:text-[#ffffff]">
                    {day.date}
                  </div>
                  <div className="text-xs text-gray-900 dark:text-[#ffffff] font-medium text-center">
                    {day.temp}
                  </div>
                  <div className="text-xs text-gray-900 dark:text-[#ffffff] font-medium text-right">
                    {day.humidity}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-gray-400">
                No Data Available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="max-w-[1450px] mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:p-2">
        {/* Single Device */}
        {dashboardOptions.singleDevice && (
          <div className="w-full">
            <div className="w-full h-auto xl:h-[292px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-[22px] shadow-md p-6">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <h3 className="text-[#3F359D] dark:text-[#ffffff] font-medium text-[14px]">
                  Single Device Data
                </h3>
                <select
                  value={selectedDeviceId || ''}
                  onChange={e => setSelectedDeviceId(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {deviceList.length > 0 ? (
                    deviceList.map(dev => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name
                          ? dev.name.replace('device_', 'Device ')
                          : `Device ${dev.id}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>No active devices</option>
                  )}
                </select>
              </div>

              {loadingDevice ? (
                <div className="flex items-center justify-center h-[180px] text-sm text-gray-500">
                  Loading device data...
                </div>
              ) : deviceData ? (
                <>
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="text-6xl font-bold text-gray-900 dark:text-[#ffffff]">
                        {deviceData.temperature}
                        <span className="text-4xl align-top">°</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="flex">
                        <span className="text-[14px] text-gray-600 dark:text-[#ffffff] w-20">
                          Status
                        </span>
                        <span className="text-[14px] font-medium text-gray-900 dark:text-[#ffffff]">
                          = {deviceData.status}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-[14px] text-gray-600 dark:text-[#ffffff] w-20">
                          Battery
                        </span>
                        <span className="text-[14px] font-medium text-gray-900 dark:text-[#ffffff]">
                          = {deviceData.battery}%
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-[14px] text-gray-600 w-20 dark:text-[#ffffff]">
                          Last Read
                        </span>
                        <span className="text-[14px] font-medium text-gray-900 dark:text-[#ffffff]">
                          = {deviceData.lastRead}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-[14px] text-gray-600 w-20 dark:text-[#ffffff]">
                          Humidity
                        </span>
                        <span className="text-[14px] font-medium text-gray-900 dark:text-[#ffffff]">
                          = {deviceData.humidity}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-1">
                    <div className="text-[14px] text-[#989B9F] dark:text-[#ffffff]">
                      Temperature ={' '}
                      <span className="font-medium text-gray-900 dark:text-[#ffffff]">
                        {deviceData.temperature}°C
                      </span>
                    </div>
                    <div className="text-[14px] text-[#989B9F] dark:text-[#ffffff]">
                      Humidity ={' '}
                      <span className="font-medium text-gray-900 dark:text-[#ffffff]">
                        {deviceData.humidity}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-sm text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {dashboardOptions.barChart && (
          <div className="w-full">
            <div className="w-full h-auto xl:h-[292px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-[22px] shadow-md p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex flex-wrap justify-center items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#ED1C24] rounded-full"></div>
                    <span className="text-xs text-gray-600 dark:text-[#ffffff]">
                      Temperature
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#FFC107] rounded-full"></div>
                    <span className="text-xs text-gray-600 dark:text-[#ffffff]">
                      Humidity
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyBarData}
                    margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    />
                    <Bar dataKey="temperature" fill="#ED1C24" barSize={36} />
                    <Bar dataKey="humidity" fill="#FFC107" barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Pie Chart */}
        {dashboardOptions.pieChart && (
          <div className="w-full ">
            <div className="w-full h-auto xl:h-[292px] bg-white dark:bg-[#1A1A1A] dark:bg-black rounded-2xl p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between mb-1">
                <h3 className="font-semibold text-[14px] text-[#ED1C24] dark:text-[#ffffff]">
                  Average Temperature & <br /> Humidity
                </h3>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value.toLowerCase())}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 text-[#000]"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                <div className="flex flex-col justify-center space-y-4 mt-4 sm:mt-20">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-[#ED1C24] rounded-full"></div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-[#ffffff]">
                        Temperature
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-[#FFC107] rounded-full"></div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-[#ffffff]">
                        Humidity
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center relative">
                  {loading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : pieChartData.length > 0 ? (
                    // <PieChart
                    //   width={200}
                    //   height={200}
                    //   bgcolor="transparent"
                    //   series={[
                    //     {
                    //       innerRadius: 45,
                    //       outerRadius: 95,
                    //       paddingAngle: 2,
                    //       cornerRadius: 4,
                    //       data: pieChartData.map(item => ({
                    //         id: item.id,
                    //         value: item.value,
                    //         color: item.color,
                    //       })),
                    //     },
                    //   ]}
                    // />
                    <PieChart
                      width={200}
                      height={200}
                      series={[
                        {
                          innerRadius: 45,
                          outerRadius: 95,
                          paddingAngle: 2,
                          cornerRadius: 4,
                          strokeWidth: 0,
                          stroke: 'none',
                          data: pieChartData.map(item => ({
                            id: item.id,
                            value: item.value,
                            color: item.color,
                          })),
                        },
                      ]}
                      slotProps={{
                        legend: { hidden: true },
                        root: { sx: { backgroundColor: 'transparent' } },
                      }}
                    />
                  ) : (
                    <p className="text-sm text-slate-400">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
