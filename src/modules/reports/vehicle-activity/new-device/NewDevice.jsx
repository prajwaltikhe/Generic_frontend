import moment from 'moment';
import tabs from '../components/Tab';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useEffect, useState, useCallback, useRef } from 'react';
import CustomTab from '../components/CustomTab';
import FilterOption from '../../../../components/FilterOption';
import { intervalOptions } from '../../../../utils/vehicleStatus';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleMissingInflux } from '../../../../redux/vehicleActivitySlice';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { fetchVehicles } from '../../../../redux/vehiclesSlice';
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

const initialFilter = { vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' };

export default function NewDevice() {
  const dispatch = useDispatch();
  const company_id = localStorage.getItem('company_id');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterData, setFilterData] = useState(initialFilter);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const dataFilter = useRef(initialFilter);

  useEffect(() => {
    if (!company_id) return;
    dispatch(fetchVehicleRoutes({ company_id, limit: 150 })).then((res) => {
      setRoutes(res?.payload?.routes || []);
    });
    dispatch(fetchVehicles({ limit: 150 })).then((res) => {
      setVehicles(res?.payload?.vehicles || []);
    });
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
      dispatch(fetchVehicleMissingInflux(buildApiPayload({ page: page + 1, limit })))
        .then((res) => {
          if (res?.payload?.success) {
            setFilteredData(res.payload.data || []);
            setTotalCount(res.payload?.pagination?.total || 0);
          } else {
            setFilteredData([]);
            setTotalCount(0);
          }
        })
        .finally(() => setIsLoading(false));
    });
  }, [company_id, page, limit, dispatch, buildApiPayload]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dataFilter.current = filterData;
    setPage(0);
    setIsLoading(true);
    dispatch(fetchVehicleMissingInflux(buildApiPayload({ page: 1, limit })))
      .then((res) => {
        if (res?.payload?.success) {
          setFilteredData(res.payload.data || []);
          setTotalCount(res.payload?.pagination?.total || 0);
          toast.success(res?.payload?.message || 'Data fetched successfully');
        } else {
          setFilteredData([]);
          setTotalCount(0);
          toast.error(res?.payload?.message || 'Failed to fetch data');
        }
      })
      .finally(() => setIsLoading(false));
  };

  const handleFormReset = () => {
    setFilterData(initialFilter);
    dataFilter.current = initialFilter;
    setPage(0);
  };

  const handleExport = async () => {
    const res = await dispatch(fetchVehicleMissingInflux(buildApiPayload({ page: 1, limit: totalCount || 150 })));
    const exportRows = formatNewDeviceRows(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: exportRows }),
      fileName: 'new_device_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchVehicleMissingInflux(buildApiPayload({ page: 1, limit: totalCount || 150 })));
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
          routes={routes}
          intervals={intervalOptions}
        />
      </form>
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
