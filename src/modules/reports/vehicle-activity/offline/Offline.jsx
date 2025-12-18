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
  {
    key: 'start_time',
    header: 'Start Time',
    render: (_, r) => (r?.start_time ? moment(r.start_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  {
    key: 'end_time',
    header: 'End Time',
    render: (_, r) => (r?.end_time ? moment(r.end_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'duration', header: 'Duration', render: (_, r) => r?.duration ?? '-' },
  { key: 'lat_long', header: 'Lat-Long', render: (_, r) => r?.lat_long ?? '-' },
  {
    key: 'g_map',
    header: 'G-Map',
    render: (_, r) =>
      r?.lat_long ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${r.lat_long}`}
          target='_blank'
          rel='noopener noreferrer'
          style={{ color: '#007bff', textDecoration: 'underline' }}>
          View
        </a>
      ) : (
        '-'
      ),
  },
];

function formatOfflineRows(data, offset = 0) {
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).map((row, idx) => {
    const r = row?.report || row || {};
    let lat_long = r.lat_long;
    if (!lat_long && r.source && r.destination)
      lat_long = `${parseFloat(r.source).toFixed(7)} - ${parseFloat(r.destination).toFixed(7)}`;

    return {
      id: offset + idx + 1,
      updated_at: r.updated_at ?? null,
      vehicle_type: r.vehicle_type ?? 'Bus',
      vehicle_number: r.vehicle_number ?? null,
      route_details: r.route_details ?? null,
      driver_name: r.driver_name ?? null,
      driver_contact_number: r.driver_contact_number ?? null,
      start_time: r.start_time ?? null,
      end_time: r.end_time ?? null,
      duration: r.duration ?? r.total_idle_duration ?? null,
      lat_long: lat_long ?? null,
      g_map:
        lat_long && lat_long.includes(',') && !lat_long.includes('-')
          ? `https://www.google.com/maps/search/?api=1&query=${lat_long}`
          : '-',
    };
  });
}

const initialFilter = { vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' };

function Offline() {
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
    dispatch(fetchVehicleActivityData(buildApiPayload({ page: page + 1, limit }))).then((res) => {
      setIsLoading(false);
      if (res?.payload?.success) {
        setFilteredData(res.payload.data);
        setTotal(res.payload?.pagination?.total || 0);
      } else {
        setFilteredData([]);
        setTotal(0);
      }
    });
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
        setTotal(res.payload?.pagination?.total || 0);
        toast.success(res.payload.message || 'Success');
      } else {
        setFilteredData([]);
        setTotal(0);
        toast.error(res?.payload?.message || 'Failed to fetch data');
      }
    });
  };

  const handleFormReset = () => {
    setFilterData(initialFilter);
    dataFilter.current = initialFilter;
    setPage(0);
    setIsLoading(true);
    if (company_id) {
      dispatch(fetchVehicleActivityData({ company_id, page: 1, limit })).then((res) => {
        setIsLoading(false);
        if (res?.payload?.success) {
          setFilteredData(res.payload.data);
          setTotal(res.payload?.pagination?.total || 0);
        } else {
          setFilteredData([]);
          setTotal(0);
        }
      });
    } else {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const res = await dispatch(fetchVehicleActivityData({ ...buildApiPayload({ page: 1, limit: total || 100 }) }));
    const exportRows = formatOfflineRows(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'offline_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchVehicleActivityData({ ...buildApiPayload({ page: 1, limit: total || 100 }) }));
    const exportRows = formatOfflineRows(res?.payload?.data || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'offline_report.pdf',
      orientation: 'landscape',
    });
  };

  const tableData = formatOfflineRows(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Offline Report (Total: {total})</h1>
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
          routes={routes}
          intervals={intervalOptions}
        />
      </form>
      {isLoading ? (
        <div className='flex justify-center items-center mb-4'>
          <div className='text-[#07163d] font-medium text-lg py-2'>Loading...</div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

export default Offline;
