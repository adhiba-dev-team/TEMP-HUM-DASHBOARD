// utils/downloadFile.js
import API from '../services/api';

export async function downloadFile(filename) {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(
      `${API.defaults.baseURL}/report/download/${filename}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('Authorization failed or file not found');
  }
}
