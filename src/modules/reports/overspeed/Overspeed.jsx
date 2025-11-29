import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OverSpeedChart from './charts/OverSpeedLineChart';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchOverSpeedReport } from '../../../redux/vehicleReportSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'vehicle_name', header: 'Vehicle Name', render: (_, r) => r?.vehicle_name || '-' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, r) => r?.vehicle_number || '-' },
  { key: 'route_number', header: 'Route Number', render: (_, r) => r?.route_number ?? '-' },
  { key: 'entry_speed', header: 'Entry Speed', render: (_, r) => r?.entry_speed ?? '-' },
  {
    key: 'entry_time',
    header: 'Entry Time',
    render: (_, r) => (r?.entry_time ? moment(r.entry_time).format('YYYY-MM-DD hh:mm:ss A') : '-'),
  },
  { key: 'exit_speed', header: 'Exit Speed', render: (_, r) => r?.exit_speed ?? '-' },
  {
    key: 'exit_time',
    header: 'Exit Time',
    render: (_, r) => (r?.exit_time ? moment(r.exit_time).format('YYYY-MM-DD hh:mm:ss A') : '-'),
  },
  { key: 'max_speed', header: 'Max Speed', render: (_, r) => r?.max_speed ?? '-' },
  { key: 'speed_duration', header: 'Speed Duration', render: (_, r) => r?.speed_duration ?? '-' },
  { key: 'max_speed_distance', header: 'Max Speed Distance', render: (_, r) => r?.max_speed_distance ?? '-' },
  {
    key: 'location',
    header: 'Location',
    render: (_, r) =>
      r?.latitude && r?.longitude ? `${Number(r.latitude).toFixed(6)}, ${Number(r.longitude).toFixed(6)}` : '-',
  },
  {
    key: 'gmap',
    header: 'Google-Map',
    render: (_, r) =>
      r?.latitude && r?.longitude ? (
        <a
          href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
          target='_blank'
          className='text-blue-700'
          rel='noopener noreferrer'>
          Google-Map
        </a>
      ) : (
        ''
      ),
  },
];

function Overspeed() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes);
  const { speedOverReportData, loading, error } = useSelector((state) => state?.vehicleReport);

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    return payload;
  };

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id) {
      dispatch(fetchOverSpeedReport({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
        setFilteredData([].concat(res?.payload?.overspeedData || []));
      });
    }
    // eslint-disable-next-line
  }, [company_id, page, limit, filterData]);

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'overspeed_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'overspeed_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchOverSpeedReport({ ...buildApiPayload(), page: 1, limit })).then((res) => {
      if (res?.payload?.status === 200) {
        toast.success(res?.payload?.message);
        setPage(0);
        setFilteredData([].concat(res?.payload?.overspeedData || []));
      } else {
        toast.error(res?.payload?.message || 'Failed to fetch report');
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });
    setPage(0);
    dispatch(fetchOverSpeedReport({ company_id, page: 1, limit })).then((res) => {
      setFilteredData([].concat(res?.payload?.overspeedData || []));
    });
  };

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Over Speed Report</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={vehicleRoutes}
          routes={vehicleRoutes}
        />
      </form>
      <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4'>
        <OverSpeedChart data={speedOverReportData?.overspeedData} />
      </div>
      <ReportTable
        columns={columns}
        data={filteredData}
        loading={loading}
        error={error}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={speedOverReportData?.pagination?.total || 0}
      />
    </div>
  );
}

export default Overspeed;
