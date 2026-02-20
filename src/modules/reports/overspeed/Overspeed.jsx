import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import OverSpeedChart from './charts/OverSpeedLineChart';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchVehicles } from '../../../redux/vehiclesSlice';
import { fetchOverSpeedReport } from '../../../redux/vehicleReportSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import { formatDuration } from '../../../utils/formatters';

const columns = [
  {
    key: 'date_time',
    header: 'Date & Time',
    render: (_, r) => (r?.date_time ? moment(r.date_time).format('YYYY-MM-DD hh:mm:ss A') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, r) => r?.vehicle_type || 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, r) => r?.vehicle_number || '-' },
  { key: 'route_details', header: 'Route Details', render: (_, r) => r?.route_details || '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, r) => r?.driver_name || '-' },
  { key: 'driver_contact_number', header: 'Driver Contact Number', render: (_, r) => r?.driver_contact_number || '-' },
  { key: 'max_speed', header: 'Max Speed', render: (_, r) => r?.max_speed ?? '-' },
  { key: 'no_of_over_speed', header: 'No of Over Speed', render: (_, r) => r?.no_of_over_speed ?? '-' },
  {
    key: 'max_over_speed_duration',
    header: 'Max Over Speed Duration',
    render: (_, r) => formatDuration(r?.max_over_speed_duration),
  },
  {
    key: 'max_overspeed_lat_long',
    header: 'Max Over Speed Lat-Long',
    render: (_, r) => {
      if (!r?.max_overspeed_lat_long) return '-';
      const parts = r.max_overspeed_lat_long.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return `${parts[0].toFixed(6)}, ${parts[1].toFixed(6)}`;
      }
      return r.max_overspeed_lat_long;
    },
  },
  { key: 'nearest_location', header: 'Nearest Location', render: (_, r) => r?.nearest_location ?? '-' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_, r) => {
      if (!r?.max_overspeed_lat_long) return '-';
      const parts = r.max_overspeed_lat_long.split(',');
      if (parts.length < 2) return '-';
      return (
        <a
          href={`https://maps.google.com/?q=${parts[0]},${parts[1]}`}
          target='_blank'
          className='text-blue-700 hover:underline'
          rel='noopener noreferrer'>
          Google-Map
        </a>
      );
    },
  },
  { key: 'trip_distance', header: 'Trip Distance', render: (_, r) => r?.trip_distance ?? '-' },
  {
    key: 'trip_distance_covered',
    header: 'Trip Distance Covered',
    render: (_, r) => r?.trip_distance_covered ?? r?.covered_distance ?? '-',
  },
  { key: 'start_odometer', header: 'Start Odometer', render: (_, r) => r?.start_odometer ?? '-' },
  { key: 'end_odometer', header: 'End Odometer', render: (_, r) => r?.end_odometer ?? '-' },
  { key: 'total_distance', header: 'Total Distance', render: (_, r) => r?.total_distance ?? '-' },
];

function Overspeed() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes);
  const { vehicles } = useSelector((state) => state?.vehicles || {});
  const { speedOverReportData, loading, error } = useSelector((state) => state?.vehicleReport);

  const buildApiPayload = (customLimit) => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    if (customLimit !== undefined) payload.limit = customLimit;
    return payload;
  };

  useEffect(() => {
    if (company_id) {
      dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
      dispatch(fetchVehicles({ limit: 150 }));
    }
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id) {
      dispatch(fetchOverSpeedReport({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
        setFilteredData([].concat(res?.payload?.overspeedData || []));
        setTotalCount(res?.payload?.pagination?.total || 0);
      });
    }
    // eslint-disable-next-line
  }, [company_id, page, limit]);

  const formatData = (items) =>
    items.map((item, i) => ({
      id: item.id || item._id || item.vehicle_id || i + 1,
      vehicle_id: item.vehicle_id || item.id || item._id,
      ...item,
      max_over_speed_duration: formatDuration(item.max_over_speed_duration),
    }));

  const data = formatData(filteredData);

  const handleViewDetails = (row) => {
    const params = new URLSearchParams();
    params.set('company_id', company_id);
    if (filterData.fromDate) params.set('from_date', filterData.fromDate);
    if (filterData.toDate) params.set('to_date', filterData.toDate);
    navigate(`/report/overspeed/details/${row.vehicle_id}?${params.toString()}`);
  };

  const actionColumn = {
    key: 'actions',
    header: 'Actions',
    render: (_, row) => (
      <button
        type='button'
        onClick={() => handleViewDetails(row)}
        className='text-white bg-[#1d31a6] hover:bg-[#161f6a] focus:outline-none font-medium rounded-sm text-xs px-3 py-1.5 cursor-pointer'>
        View Details
      </button>
    ),
  };

  const tableColumns = [...columns, actionColumn];

  const handleExport = async () => {
    const res = await dispatch(fetchOverSpeedReport({ ...buildApiPayload(totalCount), page: 1 }));
    const allData = res?.payload?.overspeedData || [];
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: formatData(allData) }),
      fileName: 'overspeed_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchOverSpeedReport({ ...buildApiPayload(totalCount), page: 1 }));
    const allData = res?.payload?.overspeedData || [];
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: formatData(allData) }),
      fileName: 'overspeed_report.pdf',
      orientation: 'landscape',
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchOverSpeedReport({ ...buildApiPayload(), page: 1, limit })).then((res) => {
      if (res?.payload) {
        toast.success(res?.payload?.message);
        setFilteredData(res?.payload?.overspeedData || []);
        setTotalCount(res?.payload?.pagination?.total || 0);
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
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Over Speed Report (Total: {totalCount})</h1>
      </div>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={vehicles}
          routes={vehicleRoutes}
        />
      </form>
      <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4'>
        <OverSpeedChart data={speedOverReportData?.overspeedData} />
      </div>
      <ReportTable
        columns={tableColumns}
        data={data}
        loading={loading}
        error={error}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={totalCount}
      />
    </div>
  );
}

export default Overspeed;
