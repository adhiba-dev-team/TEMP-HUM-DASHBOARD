import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import { X } from 'lucide-react';
import { Modal, Box } from '@mui/material';
import { useOutletContext } from 'react-router-dom';

export default function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [devicesPerPage] = useState(6);
  const { theme } = useOutletContext();

  // Fetch devices
  useEffect(() => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => {
        setDevices(Array.isArray(data) ? data : data.devices || []);
      })
      .catch(err => console.error('Error fetching devices:', err));
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(devices.length / devicesPerPage);
  const startIndex = (currentPage - 1) * devicesPerPage;
  const currentDevices = devices.slice(startIndex, startIndex + devicesPerPage);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const [editDevice, setEditDevice] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', location: '' });

  // Activate edit mode
  const handleEdit = device => {
    setEditDevice(device);
    setEditForm({
      name: device.name || '',
      location: device.location || '',
    });
  };

  // Save update
  const handleUpdate = async id => {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: editForm.name,
        location: editForm.location,
      }),
    });

    if (res.ok) {
      alert('Device updated!');
      setEditDevice(null);
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.error || 'Update failed');
    }
  };

  return (
    <div className="min-h-fit  p-6 flex flex-col">
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-5">
          <Link to="/">
            <button className="flex items-center gap-2 px-2 py-2 bg-white  dark:bg-[#ffffff50] rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ChevronLeft className="w-4 h-4 text-slate-500  dark:text-[#ffffff]" />
            </button>
          </Link>
        </div>

        <AddDeviceModal theme={theme} />
      </div>

      {/* Device Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 flex-grow">
        {currentDevices.length > 0 ? (
          currentDevices.map((device, i) => (
            <div
              key={device.id || i}
              className="p-4 rounded-2xl hover:shadow-xl bg-white dark:bg-[#1A1A1A] transition-all duration-200 border"
            >
              {/* Device Info */}
              <div className="flex justify-between items-center">
                <h6 className="font-bold text-lg text-[#313985] dark:text-[#ffffff] ">
                  Device {device.id}
                </h6>

                <button
                  className="text-gray-600 hover:text-black"
                  onClick={() => handleEdit(device)}
                >
                  ✏️
                </button>
              </div>

              <div className="mt-3 text-[13px]">
                <p>
                  <strong>Name: </strong> {device.name || 'Not Set'}
                </p>
                <p>
                  <strong>Location: </strong> {device.location || 'N/A'}
                </p>
                <p className="text-[#0B8A42] font-semibold mt-2">● Online</p>
              </div>

              {/* Edit Section */}
              {editDevice?.id === device.id && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Device Name"
                    value={editForm.name}
                    onChange={e =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={editForm.location}
                    onChange={e =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdate(device.id)}
                      className="w-full py-2 bg-[#ED1C24] dark:bg-[#ffffff50] text-white rounded-lg font-semibold hover:bg-[#c9151b]"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => setEditDevice(null)}
                      className="w-full py-2 border dark:bg-[#ffffff]  rounded-lg text-gray-700 hover:bg-gray-100 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full flex justify-center items-center text-gray-500 h-32">
            Loading devices...
          </div>
        )}
      </div>

      {/* Pagination Section */}
      {devices.length > 0 && totalPages > 1 && (
        <Stack spacing={2} sx={{ alignItems: 'center', mt: 6 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            hidePrevButton
            hideNextButton
            sx={{
              '& .MuiPaginationItem-root.Mui-selected': {
                backgroundColor: '#FF6B70',
                color: 'white',
                fontWeight: 'bold',
                border: 'none',
                minWidth: '35px',
                height: '35px',
                fontSize: '15px',
                '&:hover': {
                  backgroundColor: '#FF6B70',
                },
              },
              [`& .MuiPaginationItem-root[aria-label="Go to page ${
                currentPage - 1
              }"]`]:
                currentPage > 1
                  ? {
                      backgroundColor: 'white',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      minWidth: '28px',
                      height: '28px',
                      fontSize: '13px',
                      margin: '0 2px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#ddd',
                      },
                    }
                  : {},
              [`& .MuiPaginationItem-root[aria-label="Go to page ${
                currentPage + 1
              }"]`]:
                currentPage < totalPages
                  ? {
                      backgroundColor: 'white',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      minWidth: '28px',
                      height: '28px',
                      fontSize: '13px',
                      margin: '0 2px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#ddd',
                      },
                    }
                  : {},
              '& .MuiPaginationItem-root': {
                backgroundColor: 'white',
                color: '#999',
                border: '1px solid #ddd',
                borderRadius: '50%',
                minWidth: '22px',
                height: '22px',
                fontSize: '11px',
                margin: '0 2px',
                fontWeight: '400',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#ddd',
                },
              },
              '& .MuiPaginationItem-page': {
                borderRadius: '50%',
              },
              '& .MuiPaginationItem-ellipsis': {
                backgroundColor: 'transparent',
                border: 'none',
                color: '#999',
                minWidth: '22px',
                height: '22px',
              },
            }}
          />
        </Stack>
      )}
    </div>
  );
}

function AddDeviceModal({ theme }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [formData, setFormData] = useState({ id: '', location: '', name: '' });
  const [availableIds, setAvailableIds] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetch('/api/devices/usb/list')
      .then(res => res.json())
      .then(data => setAvailableIds(data.devices || []));
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert('Device added successfully');
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to add device');
    }
  };

  return (
    <div>
      {/* Add Button */}
      <button
        onClick={handleOpen}
        className={`text-[14px] px-6 py-2 rounded-lg font-medium transition 
          ${
            theme === 'dark'
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-[#ED1C24] text-white hover:bg-[#c9151b]'
          }`}
      >
        Add Device
      </button>

      {/* Center Popup Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            borderRadius: '18px',
            boxShadow: 24,
            p: 4,
            animation: 'fadeSlide 0.3s ease',
            bgcolor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF',
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`absolute right-4 top-4 transition
              ${
                theme === 'dark'
                  ? 'text-white hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <X size={22} />
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-[#ED1C24] dark:text-[#ffffff] mb-2">
            Add New Device
          </h2>
          <p
            className={`text-sm text-center mb-6
              ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
            `}
          >
            Register a new Temperature & Humidity Sensor Device
          </p>

          {/* Form */}
          <form className="space-y-4">
            {/* Device ID */}
            <div>
              <label
                className={`text-sm font-medium 
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Device ID
              </label>

              <select
                className={`w-full h-[42px] px-3 rounded-lg border mt-1
                  ${
                    theme === 'dark'
                      ? 'bg-[#222] text-white border-gray-600'
                      : 'bg-gray-100 text-black border-gray-300'
                  }`}
                value={formData.id}
                onChange={e => {
                  const id = e.target.value;
                  setFormData({ ...formData, id });

                  const found = devices.find(d => d.id == id);
                  if (found) {
                    setIsEditing(true);
                    setFormData({
                      id,
                      name: found.name,
                      location: found.location,
                    });
                  } else {
                    setIsEditing(false);
                    setFormData({ id, name: '', location: '' });
                  }
                }}
              >
                <option value="">Select Device ID</option>
                {availableIds.map(id => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label
                className={`text-sm font-medium 
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Location
              </label>

              <input
                type="text"
                onChange={e =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className={`w-full h-[42px] px-3 rounded-lg border outline-none mt-1
                  ${
                    theme === 'dark'
                      ? 'bg-[#222] text-white border-gray-600 focus:ring-2 focus:ring-[#ED1C24]'
                      : 'bg-gray-100 text-black border-gray-300 focus:ring-2 focus:ring-[#ED1C24]'
                  }`}
              />
            </div>

            {/* Device Name */}
            <div>
              <label
                className={`text-sm font-medium 
                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Device Name
              </label>

              <input
                type="text"
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full h-[42px] px-3 rounded-lg border outline-none mt-1
                  ${
                    theme === 'dark'
                      ? 'bg-[#222] text-white border-gray-600 focus:ring-2 focus:ring-[#ED1C24]'
                      : 'bg-gray-100 text-black border-gray-300 focus:ring-2 focus:ring-[#ED1C24]'
                  }`}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {/* Save Button */}
              <button
                type="button"
                onClick={handleSave}
                className={`w-full py-2 rounded-lg font-medium transition
                  ${
                    theme === 'dark'
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-[#ED1C24] text-white hover:bg-[#c9151b]'
                  }`}
              >
                {isEditing ? 'Update' : 'Save'}
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={handleClose}
                className={`w-full py-2 rounded-lg font-medium border transition
                  ${
                    theme === 'dark'
                      ? 'border-gray-500 text-gray-300 hover:bg-[#333]'
                      : 'border-gray-400 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </Box>
      </Modal>
    </div>
  );
}
