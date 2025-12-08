import moment from 'moment';
import tabs from '../components/Tab';
import { toast } from 'react-toastify';
import CustomTab from '../components/CustomTab';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../../components/FilterOption';
import { useEffect, useState, useCallback, useRef } from 'react';
import { intervalOptions } from '../../../../utils/vehicleStatus';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { fetchVehicleActivityData } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';

const columns = [
  {
    key: 'updated_at',
    header: 'Date & Time',
    render: (_, r) => (r?.updated_at ? moment(r.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, r) => r?.vehicle_type ?? 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, r) => r?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, r) => r?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, r) => r?.driver_name ?? '-' },
  { key: 'driver_contact_number', header: 'Driver Contact Number', render: (_, r) => r?.driver_contact_number ?? '-' },
  { key: 'source', header: 'Source', render: (_, r) => r?.source ?? '-' },
  { key: 'destination', header: 'Destination', render: (_, r) => r?.destination ?? '-' },
  {
    key: 'employee_count',
    header: 'Employee Count',
    render: (_, r) => (typeof r?.employee_count === 'number' ? r.employee_count : '-'),
  },
  { key: 'speed', header: 'Speed', render: (_, r) => (typeof r?.speed === 'number' ? r.speed : '-') },
  { key: 'start_lat_long', header: 'Start Lat-Long', render: (_, r) => r?.start_lat_long ?? '-' },
  { key: 'end_lat_long', header: 'End Lat-Long', render: (_, r) => r?.end_lat_long ?? '-' },
  {
    key: 'trip_distance',
    header: 'Trip Distance',
    render: (_, r) => (typeof r?.trip_distance === 'number' ? r.trip_distance : r?.trip_distance ?? '-'),
  },
  {
    key: 'covered_distance',
    header: 'Covered Distance',
    render: (_, r) => (typeof r?.covered_distance === 'number' ? r.covered_distance : r?.covered_distance ?? '-'),
  },
  { key: 'start_odometer', header: 'Start Odometer', render: (_, r) => r?.start_odometer ?? '-' },
  { key: 'end_odometer', header: 'End Odometer', render: (_, r) => r?.end_odometer ?? '-' },
  {
    key: 'total_distance',
    header: 'Total Distance',
    render: (_, r) => (typeof r?.total_distance === 'number' ? r.total_distance : r?.total_distance ?? '-'),
  },
  {
    key: 'top_speed',
    header: 'Top Speed',
    render: (_, r) => (typeof r?.top_speed === 'number' ? r.top_speed : r?.top_speed ?? '-'),
  },
  {
    key: 'total_running_duration',
    header: 'Total Running Duration',
    render: (_, r) => r?.total_running_duration ?? '-',
  },
  { key: 'total_idle_duration', header: 'Total Idle Duration', render: (_, r) => r?.total_idle_duration ?? '-' },
  { key: 'total_parked_duration', header: 'Total Parked Duration', render: (_, r) => r?.total_parked_duration ?? '-' },
  {
    key: 'no_of_parking',
    header: 'No. of Parking',
    render: (_, r) => (typeof r?.no_of_parking === 'number' ? r.no_of_parking : r?.no_of_parking ?? '-'),
  },
  {
    key: 'total_offline_duration',
    header: 'Total Offline Duration',
    render: (_, r) => r?.total_offline_duration ?? '-',
  },
];

const mapActivityRow = (data) =>
  !data
    ? []
    : (Array.isArray(data) ? data : [data]).map((row) => {
        const r = row?.report || row || {};
        return {
          updated_at: r.updated_at ?? null,
          vehicle_type: r.vehicle_type ?? 'Bus',
          vehicle_number: r.vehicle_number ?? null,
          route_details: r.route_details ?? null,
          driver_name: r.driver_name ?? null,
          driver_contact_number: r.driver_contact_number ?? null,
          source: r.source
            ? r.source
                .split(',')
                .map((v) => {
                  const n = Number.parseFloat(v);
                  return isNaN(n) ? v : n.toFixed(7);
                })
                .join(',')
            : null,
          destination: r.destination
            ? r.destination
                .split(',')
                .map((v) => {
                  const n = Number.parseFloat(v);
                  return isNaN(n) ? v : n.toFixed(7);
                })
                .join(',')
            : null,
          employee_count:
            typeof r.employee_count === 'number'
              ? r.employee_count
              : typeof row.employee_count === 'number'
              ? row.employee_count
              : 0,
          speed: typeof r.speed === 'number' ? r.speed : 0,
          start_lat_long: r.start_lat_long ?? null,
          end_lat_long: r.end_lat_long ?? null,
          trip_distance: typeof r.trip_distance === 'number' ? r.trip_distance : 0,
          covered_distance: typeof r.covered_distance === 'number' ? r.covered_distance : 0,
          start_odometer: r.start_odometer ?? null,
          end_odometer: r.end_odometer ?? null,
          total_distance: typeof r.total_distance === 'number' ? r.total_distance : 0,
          top_speed: typeof r.top_speed === 'number' ? r.top_speed : 0,
          total_running_duration: r.total_running_duration ?? '0h 0m 0s',
          total_idle_duration: r.total_idle_duration ?? '0h 0m 0s',
          total_parked_duration: r.total_parked_duration ?? '0h 0m 0s',
          no_of_parking: typeof r.no_of_parking === 'number' ? r.no_of_parking : 0,
          total_offline_duration: r.total_offline_duration ?? '0h 0m 0s',
        };
      });

const initialFilter = { vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' };

function Idle() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterData, setFilterData] = useState(initialFilter);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');

  const dataFilter = useRef(filterData);
  const { routes } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {});

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
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
    [company_id]
  );

  useEffect(() => {
    if (!company_id) return;
    setIsLoading(true);
    dispatch(fetchVehicleActivityData(buildApiPayload({ page: page + 1, limit }))).finally(() => setIsLoading(false));
  }, [company_id, page, limit, buildApiPayload, dispatch]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dataFilter.current = filterData;
    setPage(0);
    setIsLoading(true);
    dispatch(fetchVehicleActivityData(buildApiPayload({ page: 1, limit }))).then((res) => {
      setIsLoading(false);
      if (res?.payload?.success) {
        setFilteredData(res.payload.data);
        setTotal(res.payload?.totalVehicles);
        toast.success(res.payload.message || 'Success');
      } else {
        toast.error(res?.payload?.message || 'Failed to fetch data');
      }
    });
  };

  const handleFormReset = () => {
    setFilterData(initialFilter);
    dataFilter.current = initialFilter;
    setPage(0);
    setIsLoading(true);
    company_id
      ? dispatch(fetchVehicleActivityData({ company_id, page: 1, limit })).finally(() => setIsLoading(false))
      : setIsLoading(false);
  };

  const exportConf = { columns, rows: buildExportRows({ columns, data: mapActivityRow(filteredData) }) };
  const handleExport = () => exportToExcel({ ...exportConf, fileName: 'idle_report.xlsx' });
  const handleExportPDF = () => exportToPDF({ ...exportConf, fileName: 'idle_report.pdf', orientation: 'landscape' });

  const tableData = mapActivityRow(filteredData);

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Idle Report</h1>
      </div>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={routes}
          routes={routes}
          intervals={intervalOptions}
          filteredData={tableData}
          setFilteredData={setFilteredData}
        />
      </form>
      <ReportTable
        columns={columns}
        data={tableData}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={total}
        loading={isLoading}
      />
    </div>
  );
}

export default Idle;
