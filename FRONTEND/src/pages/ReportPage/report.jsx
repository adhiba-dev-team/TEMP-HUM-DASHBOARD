import { ChevronLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../../services/api';

export default function Reportpage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/report/list');
        const reportList = res.data?.data || [];

        if (!reportList.length) {
          setReports([]);
          return;
        }

        reportList.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setReports(reportList);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Pagination: Show 10 per page
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentReports = reports.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const goToPage = page => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="min-h-fit ps-6 pe-6">
      <div className="flex mb-7 justify-between items-center">
        <Link to="/">
          <button className="flex items-center gap-2 px-2 py-2 bg-white  dark:bg-[#ffffff50]  rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <ChevronLeft className="w-4 h-4 text-slate-500  dark:text-[#ffffff]" />
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0D0D0DD9] rounded-[5px] shadow-sm overflow-hidden">
        <div className="bg-[#ED1C24] dark:bg-[#ffffff30] text-white m-7 rounded-lg">
          <div className="grid grid-cols-7 gap-4 px-6 py-3 font-bold text-[14px]">
            <div>Report</div>
            <div>Report ID</div>
            <div>Device</div>
            <div>Created</div>
            <div>Status</div>
            <div>Format</div>
            <div>Download</div>
          </div>
        </div>

        {/* Body */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 m-7">
          {loading ? (
            <p className="text-center text-gray-500 text-sm">Loading...</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-gray-500 text-sm">
              No reports found
            </p>
          ) : (
            currentReports.map(report => {
              const parseFormat = format => {
                try {
                  const obj = JSON.parse(format);
                  return { excel: !!obj.excel, pdf: !!obj.pdf };
                } catch {
                  return {
                    excel: format?.toLowerCase().includes('excel'),
                    pdf: format?.toLowerCase().includes('pdf'),
                  };
                }
              };

              const { excel: hasExcel, pdf: hasPdf } = parseFormat(
                report.format
              );

              const displayName = () => {
                const lower = report.name.toLowerCase();
                if (lower.includes('daily')) return 'Daily Report';
                if (lower.includes('week')) return 'Weekly Report';
                if (lower.includes('month')) return 'Monthly Report';
                return `Report #${report.id}`;
              };

              return (
                <div
                  key={report.id}
                  className="grid grid-cols-7 gap-4 px-6 py-3 hover:bg-indigo-50/50  hover:bg-[#ffffff15] transition-colors items-center"
                >
                  {/* Better Report Name */}
                  <div className="font-bold text-[#202224] text-[14px] dark:text-[#ffffff]">
                    {displayName()}
                  </div>

                  <div className="text-[#202224] text-[14px] dark:text-[#ffffff]">
                    {report.id}
                  </div>

                  <div className="text-[#202224] text-[14px] dark:text-[#ffffff]">
                    D{String(report.id).padStart(2, '0')}
                  </div>

                  <div className="text-[#202224] text-[14px] dark:text-[#ffffff]">
                    {new Date(report.created_at).toLocaleString()}
                  </div>

                  <div>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                      Completed
                    </span>
                  </div>

                  <div className="text-[#202224] text-[14px] dark:text-[#ffffff]">
                    {hasExcel && hasPdf
                      ? 'Excel + PDF'
                      : hasExcel
                      ? 'Excel'
                      : hasPdf
                      ? 'PDF'
                      : '-'}
                  </div>

                  {/* Fixed Download Links */}
                  <div className="flex gap-2">
                    {hasPdf && (
                      <a
                        href={`/api/report/download/${report.name}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5 text-red-600  dark:text-[#ffffff] " />
                      </a>
                    )}
                    {hasExcel && (
                      <a
                        href={`/api/report/download/${report.name}.xlsx`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg transition-colors"
                      >
                        <Download className="w-5 h-5 text-green-600 dark:text-[#ffffff] " />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 mb-6 gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1
                    ? 'bg-[#ED1C24] text-white'
                    : 'hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
