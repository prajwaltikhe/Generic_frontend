import moment from 'moment-timezone';
import Paper from '@mui/material/Paper';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CommonSearch from '../../components/CommonSearch';
import ReportTable from '../../components/table/ReportTable';
import { fetchEmployeeOnboard } from '../../redux/employeeSlice';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { exportToExcel, buildExportRows } from '../../utils/exportUtils';

const columns = [
  { key: 'employeeName', header: 'Employee Name', render: (_v, r) => r.employeeName },
  { key: 'punchId', header: 'Punch ID', render: (_v, r) => r.punchId },
  { key: 'punchDate', header: 'Punch Date', render: (_v, r) => r.punchDate },
  { key: 'boardingIn', header: 'Boarding In', render: (_v, r) => r.boardingIn },
  { key: 'boardingOut', header: 'Boarding Out', render: (_v, r) => r.boardingOut },
];

function getEmpRow(item, idx = 0, page = 0, rowsPerPage = 0) {
  let punchDate = '-';
  let boardingIn = '-';
  let boardingOut = '-';
  if (item.boarding_in) {
    punchDate = moment(item.boarding_in).format('YYYY-MM-DD');
    boardingIn = moment(item.boarding_in).format('HH:mm:ss');
  }
  if (item.boarding_out) {
    boardingOut = moment(item.boarding_out).format('HH:mm:ss');
  }
  return {
    id: page * rowsPerPage + idx + 1,
    employeeName: item.employee_name || '-',
    punchId: item.employee_id || item.punch_id || '-',
    punchDate,
    boardingIn,
    boardingOut,
  };
}

export default function EmployeePunchDetails() {
  const { state } = useLocation();
  const selectedVehicle = state?.selectedVehicle;
  const dispatch = useDispatch();
  const companyId = localStorage.getItem('company_id');
  const { error, loading } = useSelector((s) => s.employee);

  const [page, setPage] = useState(0);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [vehicleInfo, setVehicleInfo] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = useCallback(
    async (exportAll = false) => {
      if (!selectedVehicle) return [];
      const vehicleId = selectedVehicle.id;
      const payload = {
        company_id: companyId,
        vehicles: JSON.stringify([vehicleId]),
        page: exportAll ? 1 : page + 1,
        limit: exportAll ? totalCount || rowsPerPage : rowsPerPage,
      };
      if (searchQuery.trim()) payload.search = searchQuery.trim();
      const res = await dispatch(fetchEmployeeOnboard(payload));
      const items = [].concat(res?.payload?.records || []);
      if (!exportAll) {
        setData(items.map((item, idx) => getEmpRow(item, idx, page, rowsPerPage)));
        setVehicleInfo({
          name: selectedVehicle.vehicle_name || selectedVehicle.name || '-',
          number: selectedVehicle.vehicle_number || selectedVehicle.number || '-',
          speed: selectedVehicle.speed ?? '-',
          onboarded: items.length ?? 0,
        });
        setTotalCount(res?.payload?.pagination?.total || items.length);
      }
      return items;
    },
    [selectedVehicle, companyId, page, rowsPerPage, totalCount, searchQuery, dispatch]
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [fetchData]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const items = await fetchData(true);
      if (!items) return;
      const exportRows = items.map((item, idx) => getEmpRow(item, idx));
      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: exportRows }),
        fileName: 'employee_punch_details.xlsx',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const vInfo = useMemo(
    () => [
      ['Vehicle Name', vehicleInfo.name],
      ['Vehicle Number', vehicleInfo.number],
      ['Speed', vehicleInfo.speed],
      ['Total Onboarded Employee', vehicleInfo.onboarded],
    ],
    [vehicleInfo]
  );

  return (
    <div className='w-full h-full p-2'>
      <div className='w-full bg-white rounded-lg shadow-sm border border-gray-300 my-6'>
        <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-br from-white to-gray-100 rounded-t-lg flex flex-col md:flex-row md:items-center md:justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900'>Vehicle Details</h2>
            <div className='flex flex-wrap gap-x-10 gap-y-1 text-base text-gray-800 mt-2'>
              {vInfo.map(([label, val]) => (
                <div key={label}>
                  <span className='font-semibold text-gray-700'>{label}:</span> <span>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type='button'
            className='text-white bg-gray-800 hover:bg-gray-900 font-semibold rounded px-6 py-2 min-w-[120px] mt-4 md:mt-0 shadow-sm transition duration-200 focus:outline-none'
            onClick={handleExport}
            disabled={exportLoading}>
            {exportLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', background: '#fafafa' }}>
          <div className='p-6'>
            <div className='flex flex-col sm:flex-row justify-between items-center mb-2 gap-2'>
              <h3 className='text-xl font-bold text-gray-900'>Employee Punch Details</h3>
              <div className='w-full sm:w-auto mb-2 sm:mb-0'>
                <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </div>
            </div>
            <ReportTable
              columns={columns}
              data={data}
              loading={loading || exportLoading}
              error={error}
              page={page}
              setPage={setPage}
              limit={rowsPerPage}
              setLimit={(val) => {
                setRowsPerPage(val);
                setPage(0);
              }}
              totalCount={totalCount}
              limitOptions={[10, 15, 20, 25, 30]}
            />
          </div>
        </Paper>
      </div>
    </div>
  );
}
