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
import { fetchVehicles } from '../../../../redux/vehiclesSlice';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { fetchVehicleActivityData } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';
import { formatDuration } from '../../../../utils/formatters';

const columns = [
  {
    key: 'date_only',
    header: 'Date',
    render: (_, row) => (row?.updated_at ? moment(row.updated_at).format('YYYY-MM-DD') : '-'),
  },
  {
    key: 'time_only',
    header: 'Time',
    render: (_, row) => (row?.updated_at ? moment(row.updated_at).format('hh:mm:ss A') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, r) => r?.vehicle_type ?? 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, r) => r?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, r) => r?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, r) => r?.driver_name ?? '-' },
  { key: 'driver_contact_number', header: 'Driver Contact Number', render: (_, r) => r?.driver_contact_number ?? '-' },
  {
    key: 'total_offline_duration',
    header: 'Total Offline Duration',
    render: (_, r) => r?.total_offline_duration ?? '-',
  },
  { key: 'max_offline_duration', header: 'Max Offline Duration', render: (_, r) => r?.max_offline_duration ?? '-' },
  { key: 'no_of_offline', header: 'No of Offline', render: (_, r) => r?.no_of_offline ?? '-' },
];

function formatOfflineRows(data, offset = 0) {
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).map((row, idx) => {
    const r = row?.report || row || {};
    return {
      id: offset + idx + 1,
      vehicle_id: r.vehicle_id || row.vehicle_id,
      updated_at: r.updated_at ?? null,
      date_only: r.updated_at ? moment(r.updated_at).format('YYYY-MM-DD') : '-',
      time_only: r.updated_at ? moment(r.updated_at).format('hh:mm:ss A') : '-',
      vehicle_type: r.vehicle_type ?? 'Bus',
      vehicle_number: r.vehicle_number ?? null,
      route_details: r.route_details ?? null,
      driver_name: r.driver_name ?? null,
      driver_contact_number: r.driver_contact_number ?? null,
      total_offline_duration: formatDuration(r.total_offline_duration),
      max_offline_duration: formatDuration(r.max_offline_duration),
      no_of_offline: r.no_of_offline ?? null,
    };
  });
}

const initialFilter = { vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' };

function Offline() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterData, setFilterData] = useState(initialFilter);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');
  const dataFilter = useRef(filterData);
  const { routes } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {});
  const { vehicles } = useSelector((s) => s?.vehicles || {});

  useEffect(() => {
    if (company_id) {
      dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
      dispatch(fetchVehicles({ limit: 150 }));
    }
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
    Promise.resolve().then(() => {
      setIsLoading(true);
      dispatch(fetchVehicleActivityData(buildApiPayload({ page: page + 1, limit }))).then((res) => {
        setIsLoading(false);
        if (res?.payload?.success) {
          const raw = res?.payload?.data;
          setFilteredData(formatOfflineRows(raw, page * limit));
          setTotal(res?.payload?.pagination?.total ?? 0);
        } else {
          setFilteredData([]);
          setTotal(0);
        }
      });
    });
  }, [company_id, page, limit, buildApiPayload, dispatch]);

  const tableData = formatOfflineRows(filteredData, page * limit);

  const handleViewDetails = (row) => {
    const params = new URLSearchParams();
    if (filterData.fromDate) params.set('from_date', filterData.fromDate);
    if (filterData.toDate) params.set('to_date', filterData.toDate);
    params.set('type', 'offline');
    navigate(`/report/offline/details/${row.vehicle_id}?${params.toString()}`);
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
  };

  const handleExport = async () => {
    const res = await dispatch(fetchVehicleActivityData({ ...buildApiPayload({ page: 1, limit: total || 150 }) }));
    const exportRows = formatOfflineRows(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'offline_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchVehicleActivityData({ ...buildApiPayload({ page: 1, limit: total || 150 }) }));
    const exportRows = formatOfflineRows(res?.payload?.data || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'offline_report.pdf',
      orientation: 'landscape',
    });
  };

  const availableRoutes = useMemo(() => {
    if (filterData.vehicles && filterData.vehicles.length > 0)
      return routes.filter((r) => filterData.vehicles.includes(r.vehicle_id));
    return routes;
  }, [filterData.vehicles, routes]);

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
          vehicles={vehicles}
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
          totalCount={total}
          loading={isLoading}
        />
      )}
    </div>
  );
}

export default Offline;
