import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchRouteViolation } from '../../../redux/geofenceSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'date', header: 'Date', render: (value) => (value ? moment(value).format('YYYY-MM-DD') : '-') },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (v) => v ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (v) => v ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (v) => v ?? '-' },
  { key: 'driver_number', header: 'Driver Number', render: (v) => v ?? '-' },
  { key: 'violation_distance', header: 'Violation Distance', render: (value) => (value ? `${value} km` : '-') },
];

function RouteViolation() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const company_id = localStorage.getItem('company_id');
  const { loading, error } = useSelector((state) => state?.geofence);
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes || {});

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    return payload;
  };

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchRouteViolation({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
        if (res?.payload?.success) {
          setFilteredData(res?.payload?.data || []);
          setTotalCount(res?.payload?.pagination?.total || 0);
        }
      });
    // eslint-disable-next-line
  }, [dispatch, company_id, page, limit]);

  const formatData = (items) =>
    items.map((item, i) => ({
      id: item.id || item._id || item.vehicle_id || i + 1,
      vehicle_id: item.vehicle_id || item.id || item._id,
      date: item.date ?? '-',
      vehicle_number: item.vehicle_number ?? '-',
      route_details: item.route_details ?? item.route_name ?? '-',
      driver_name: item.driver_name ?? '-',
      driver_number: item.driver_number ?? item.driver_phone ?? '-',
      violation_distance: item.violation_distance ?? '-',
    }));

  const data = formatData(filteredData);

  const handleViewDetails = (row) => {
    const params = new URLSearchParams();
    if (filterData.fromDate) params.set('from_date', filterData.fromDate);
    if (filterData.toDate) params.set('to_date', filterData.toDate);
    navigate(`/report/route-violation/details/${row.vehicle_id}?${params.toString()}`);
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

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data }),
      fileName: 'route_violation_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data }),
      fileName: 'route_violation_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchRouteViolation({ ...buildApiPayload(), page: 1, limit })).then((res) => {
      if (res?.payload?.success) {
        toast.success('Data fetched successfully');
        setFilteredData(res?.payload?.data || []);
        setTotalCount(res?.payload?.pagination?.total || 0);
      } else {
        toast.error('Failed to fetch data');
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });
    setPage(0);
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Route Violation Report (Total: {totalCount})</h1>
      </div>
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

export default RouteViolation;
