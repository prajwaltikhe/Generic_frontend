import moment from 'moment';
import tabs from '../components/Tab';
import { toast } from 'react-toastify';
import CustomTab from '../components/CustomTab';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FilterOption from '../../../../components/FilterOption';
import { intervalOptions } from '../../../../utils/vehicleStatus';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { fetchVehicleActivityData } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';
import { formatDuration } from '../../../../utils/formatters';

const formatCoords = (coords) => {
  if (!coords) return '-';
  const parts = coords.toString().split(',');
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }
  return coords;
};

const columns = [
  {
    key: 'updated_at',
    header: 'Date & Time',
    render: (_, row) => (row?.updated_at ? moment(row.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, row) => row?.vehicle_type ?? 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, row) => row?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, row) => row?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, row) => row?.driver_name ?? '-' },
  {
    key: 'driver_contact_number',
    header: 'Driver Contact Number',
    render: (_, row) => row?.driver_contact_number ?? '-',
  },
  { key: 'source', header: 'Source', render: (_, row) => formatCoords(row?.source) },
  { key: 'destination', header: 'Destination', render: (_, row) => formatCoords(row?.destination) },
  {
    key: 'employee_count',
    header: 'Employee Count',
    render: (_, row) => (typeof row?.employee_count === 'number' ? row.employee_count : '-'),
  },
  { key: 'speed', header: 'Speed', render: (_, row) => (typeof row?.speed === 'number' ? row.speed : '-') },
  { key: 'start_lat_long', header: 'Start Lat-Long', render: (_, row) => formatCoords(row?.start_lat_long) },
  { key: 'end_lat_long', header: 'End Lat-Long', render: (_, row) => formatCoords(row?.end_lat_long) },
  { key: 'trip_distance', header: 'Trip Distance', render: (_, row) => row?.trip_distance ?? '-' },
  { key: 'covered_distance', header: 'Covered Distance', render: (_, row) => row?.covered_distance ?? '-' },
  { key: 'start_odometer', header: 'Start Odometer', render: (_, row) => row?.start_odometer ?? '-' },
  { key: 'end_odometer', header: 'End Odometer', render: (_, row) => row?.end_odometer ?? '-' },
  { key: 'total_distance', header: 'Total Distance', render: (_, row) => row?.total_distance ?? '-' },
  { key: 'top_speed', header: 'Top Speed', render: (_, row) => row?.top_speed ?? '-' },
  {
    key: 'total_running_duration',
    header: 'Total Running Duration',
    render: (_, row) => row?.total_running_duration ?? '-',
  },
  { key: 'total_idle_duration', header: 'Total Idle Duration', render: (_, row) => row?.total_idle_duration ?? '-' },
  {
    key: 'total_parked_duration',
    header: 'Total Parked Duration',
    render: (_, row) => row?.total_parked_duration ?? '-',
  },
  { key: 'no_of_parking', header: 'No. Of Parking', render: (_, row) => row?.no_of_parking ?? '-' },
  {
    key: 'total_offline_duration',
    header: 'Total Offline Duration',
    render: (_, row) => row?.total_offline_duration ?? '-',
  },
];

function formatMovementRows(data, offset = 0) {
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).map((row, idx) => {
    const r = row?.report || row || {};
    return {
      id: offset + idx + 1,
      vehicle_id: r.vehicle_id || row.vehicle_id,
      updated_at: r.updated_at ?? null,
      vehicle_type: r.vehicle_type ?? 'Bus',
      vehicle_number: r.vehicle_number ?? null,
      route_details: r.route_details ?? null,
      driver_name: r.driver_name ?? null,
      driver_contact_number: r.driver_contact_number ?? null,
      source: r.source ?? null,
      destination: r.destination ?? null,
      employee_count: typeof r.employee_count === 'number' ? r.employee_count : 0,
      speed: typeof r.speed === 'number' ? r.speed : 0,
      start_lat_long: r.start_lat_long ?? null,
      end_lat_long: r.end_lat_long ?? null,
      trip_distance: r.trip_distance ?? 0,
      covered_distance: r.covered_distance ?? 0,
      start_odometer: r.start_odometer ?? null,
      end_odometer: r.end_odometer ?? null,
      total_distance: r.total_distance ?? 0,
      top_speed: r.top_speed ?? 0,
      total_running_duration: formatDuration(r.total_running_duration),
      total_idle_duration: formatDuration(r.total_idle_duration),
      total_parked_duration: formatDuration(r.total_parked_duration),
      no_of_parking: r.no_of_parking ?? 0,
      total_offline_duration: formatDuration(r.total_offline_duration),
    };
  });
}

const initialFilter = { vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' };

function Movement() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterData, setFilterData] = useState(initialFilter);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');
  const dataFilter = useRef(filterData);

  const { routes } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {});

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
  }, [dispatch, company_id]);

  const buildApiPayload = useCallback(
    (overrides = {}) => {
      const d = dataFilter.current;
      return {
        company_id,
        ...(d.vehicles?.length && { vehicles: JSON.stringify(d.vehicles) }),
        ...(d.routes?.length && { routes: JSON.stringify(d.routes) }),
        ...(d.interval && { interval: d.interval }),
        ...(d.fromDate && { from_date: d.fromDate }),
        ...(d.toDate && { to_date: d.toDate }),
        ...overrides,
      };
    },
    [company_id],
  );

  useEffect(() => {
    if (!company_id) return;
    setIsLoading(true);
    dispatch(fetchVehicleActivityData(buildApiPayload({ page: page + 1, limit })))
      .then((res) => {
        const raw = res?.payload?.data;
        setFilteredData(formatMovementRows(raw, page * limit));
        setTotalCount(res?.payload?.pagination?.total ?? 0);
      })
      .finally(() => setIsLoading(false));
  }, [company_id, page, limit, buildApiPayload, dispatch]);

  const tableData = filteredData;

  const handleViewDetails = (row) => {
    const params = new URLSearchParams();
    if (filterData.fromDate) params.set('from_date', filterData.fromDate);
    if (filterData.toDate) params.set('to_date', filterData.toDate);
    navigate(`/report/movement/details/${row.vehicle_id}?${params.toString()}`);
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

  const availableRoutes = useMemo(() => {
    if (filterData.vehicles && filterData.vehicles.length > 0)
      return routes.filter((r) => filterData.vehicles.includes(r.vehicle_id));
    return routes;
  }, [filterData.vehicles, routes]);

  const handleExport = async () => {
    setIsLoading(true);
    const res = await dispatch(fetchVehicleActivityData(buildApiPayload({ page: 1, limit: totalCount || 150 })));
    setIsLoading(false);
    const allData = formatMovementRows(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'movement_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    const res = await dispatch(fetchVehicleActivityData(buildApiPayload({ page: 1, limit: totalCount || 150 })));
    setIsLoading(false);
    const allData = formatMovementRows(res?.payload?.data || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'movement_report.pdf',
      orientation: 'landscape',
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dataFilter.current = filterData;
    setPage(0);
    setIsLoading(true);
    dispatch(fetchVehicleActivityData(buildApiPayload({ page: 1, limit })))
      .then((res) => {
        const raw = res?.payload?.data;
        setFilteredData(formatMovementRows(raw));
        setTotalCount(res?.payload?.pagination?.total ?? 0);
        if (res?.payload?.success) toast.success(res.payload.message || 'Data fetched successfully');
      })
      .finally(() => setIsLoading(false));
  };

  const handleFormReset = () => {
    setFilterData(initialFilter);
    dataFilter.current = initialFilter;
    setPage(0);
  };

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Movement Report (Total: {totalCount})</h1>
      </div>
      <form onSubmit={handleFormSubmit} className='mb-4'>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={routes}
          routes={availableRoutes}
          intervals={intervalOptions}
        />
      </form>
      {isLoading ? (
        <div className='flex justify-center items-center mb-4'>
          <div className='text-[#07163d] font-medium text-lg py-2'>Loading...</div>
        </div>
      ) : (
        <ReportTable
          columns={tableColumns}
          data={tableData}
          page={page}
          setPage={setPage}
          limit={limit}
          setLimit={setLimit}
          limitOptions={[10, 15, 20, 25, 30]}
          totalCount={totalCount}
          loading={isLoading}
        />
      )}
    </div>
  );
}

export default Movement;
