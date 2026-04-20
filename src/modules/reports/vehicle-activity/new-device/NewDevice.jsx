import moment from 'moment';
import tabs from '../components/Tab';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import CustomTab from '../components/CustomTab';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleMissingInflux } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';

const columns = [
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, row) => row?.vehicle_type ?? 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, row) => row?.vehicle_number ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, row) => row?.driver_name ?? '-' },
  { key: 'driver_number', header: 'Driver Number', render: (_, row) => row?.driver_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, row) => row?.route_details ?? '-' },
  { key: 'imei_number', header: 'IMEI Number', render: (_, row) => row?.imei_number ?? '-' },
  { key: 'sim_number', header: 'Sim Number', render: (_, row) => row?.sim_number ?? '-' },
  {
    key: 'installation_date',
    header: 'Installation Date',
    render: (_, row) => (row?.installation_date ? moment(row.installation_date).format('DD-MM-YYYY hh:mm A') : '-'),
  },
  { key: 'reason', header: 'Reason', render: (_, row) => row?.reason ?? '-' },
];

function formatNewDeviceRows(data) {
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).map((row) => ({
    vehicle_type: row?.vehicle_type ?? 'Bus',
    vehicle_number: row?.vehicle_number ?? '-',
    driver_name: row?.driver_name ?? '-',
    driver_number: row?.driver_number ?? '-',
    route_details: row?.route_details ?? '-',
    imei_number: row?.imei_number ?? '-',
    sim_number: row?.sim_number ?? '-',
    installation_date: row?.installation_date ? moment(row.installation_date).format('DD-MM-YYYY hh:mm A') : '-',
    reason: row?.reason ?? '-',
  }));
}

export default function NewDevice() {
  const dispatch = useDispatch();
  const company_id = localStorage.getItem('company_id');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!company_id) return;
    Promise.resolve().then(() => {
      setIsLoading(true);
      dispatch(fetchVehicleMissingInflux({ company_id, page: page + 1, limit })).then((res) => {
        setIsLoading(false);
        if (res?.payload?.success) {
          setFilteredData(res.payload.data);
          setTotalCount(res.payload?.pagination?.total || 0);
        } else {
          setFilteredData([]);
          setTotalCount(0);
        }
      });
    });
  }, [company_id, page, limit, dispatch]);

  const handleExport = async () => {
    const res = await dispatch(fetchVehicleMissingInflux({ company_id, page: 1, limit: totalCount || 150 }));
    const exportRows = formatNewDeviceRows(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'new_device_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchVehicleMissingInflux({ company_id, page: 1, limit: totalCount || 150 }));
    const exportRows = formatNewDeviceRows(res?.payload?.data || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'new_device_report.pdf',
      orientation: 'landscape',
    });
  };

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>
          New Device Report{typeof totalCount === 'number' ? ` (Total: ${totalCount})` : ''}
        </h1>
        <div className='flex w-fit gap-2.5'>
          <button
            className='min-w-40 text-white bg-[#1d31a6] hover:bg-[#1d31a6] font-medium rounded-sm text-sm w-full px-5 py-2.5 cursor-pointer'
            type='button'
            onClick={handleExport}>
            Export Excel
          </button>
          <button
            className='min-w-40 text-white bg-red-600 hover:bg-red-700 font-medium rounded-sm text-sm w-full px-5 py-2.5 cursor-pointer'
            type='button'
            onClick={handleExportPDF}>
            Export PDF
          </button>
        </div>
      </div>
      <ReportTable
        columns={columns}
        data={filteredData}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={totalCount}
        loading={isLoading}
      />
    </div>
  );
}
