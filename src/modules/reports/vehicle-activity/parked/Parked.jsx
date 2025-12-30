import moment from 'moment';
import tabs from '../components/Tab';
import { toast } from 'react-toastify';
import CustomTab from '../components/CustomTab';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../../components/FilterOption';
import { intervalOptions } from '../../../../utils/vehicleStatus';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  { key: 'total_parked_duration', header: 'Total Parked Duration', render: (_, r) => r?.total_parked_duration ?? '-' },
  { key: 'max_parked_duration', header: 'Max Parked Duration', render: (_, r) => r?.max_parked_duration ?? '-' },
  {
    key: 'no_of_parking',
    header: 'No of Parking',
    render: (_, r) => (typeof r?.no_of_parking === 'number' ? r.no_of_parking : r?.no_of_parking ?? '-'),
  },
];

function formatParkedRows(data, offset = 0) {
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).map((row, idx) => {
    const r = row?.report || row || {};
    return {
      id: offset + idx + 1,
      updated_at: r.updated_at ?? null,
      vehicle_type: r.vehicle_type ?? 'Bus',
      vehicle_number: r.vehicle_number ?? null,
      route_details: r.route_details ?? null,
      driver_name: r.driver_name ?? null,
      driver_contact_number: r.driver_contact_number ?? null,
      total_parked_duration: r.total_parked_duration ?? '0h 0m 0s',
      max_parked_duration: r.max_parked_duration ?? '0h 0m 0s',
      no_of_parking: typeof r.no_of_parking === 'number' ? r.no_of_parking : 0,
    };
  });
}

const initialFilter = { vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' };

function Parked() {
  const dispatch = useDispatch();
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
        setTotalCount(res.payload?.pagination?.total || 0);
      } else {
        setFilteredData([]);
        setTotalCount(0);
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
        setTotalCount(res.payload?.pagination?.total || 0);
        toast.success(res.payload.message || 'Success');
      } else {
        setFilteredData([]);
        setTotalCount(0);
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
          setTotalCount(res.payload?.pagination?.total || 0);
        } else {
          setFilteredData([]);
          setTotalCount(0);
        }
      });
    } else {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const res = await dispatch(fetchVehicleActivityData({ ...buildApiPayload({ page: 1, limit: totalCount || 100 }) }));
    const exportRows = formatParkedRows(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'parked_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchVehicleActivityData({ ...buildApiPayload({ page: 1, limit: totalCount || 100 }) }));
    const exportRows = formatParkedRows(res?.payload?.data || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'parked_report.pdf',
      orientation: 'landscape',
    });
  };

  const tableData = formatParkedRows(filteredData, page * limit);

  const availableRoutes = useMemo(() => {
    if (filterData.vehicles && filterData.vehicles.length > 0)
      return routes.filter((r) => filterData.vehicles.includes(r.vehicle_id));
    return routes;
  }, [filterData.vehicles, routes]);

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Parked Report (Total: {totalCount})</h1>
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
          columns={columns}
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

export default Parked;