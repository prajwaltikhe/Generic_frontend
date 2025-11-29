import moment from 'moment-timezone';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useCallback } from 'react';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import { fetchVehicleGeoFence, vehicleGeofenceReport } from '../../../redux/geofenceSlice';

const columns = [
  { key: 'created_at', header: 'Date', render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '-') },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_v, r) => r.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_v, r) => r.route_name ?? '-' },
  {
    key: 'driver_name',
    header: 'Driver Name',
    render: (_v, r) => [r.driver_first_name, r.driver_last_name].filter(Boolean).join(' ').trim() || '-',
  },
  { key: 'driver_number', header: 'Driver Number', render: (_v, r) => r.driver_phone ?? '-' },
  { key: 'geofence_name', header: 'Geofence Name', render: (_v, r) => r.geofence_name ?? '-' },
  { key: 'geofence_type', header: 'Geofence Type', render: (_v, r) => r.geofence_type ?? '-' },
  { key: 'no_of_visit', header: 'No. Of Visit', render: (_v, r) => r.no_of_visit ?? '-' },
];

function GeofencEntryExit() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ geofences: [], routes: [], fromDate: '', toDate: '' });

  const company_id = localStorage.getItem('company_id');

  const { GeoFenceVehicleReport, loading, error, vehicleGeoFence } = useSelector((s) => s.geofence);
  const { routes } = useSelector((s) => s.vehicleRoute?.vehicleRoutes || {});

  const apiPayload = useCallback(() => {
    const p = { company_id };
    if (filterData.geofences?.length) p.geofences = JSON.stringify(filterData.geofences);
    if (filterData.routes?.length) p.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) p.from_date = filterData.fromDate;
    if (filterData.toDate) p.to_date = filterData.toDate;
    return p;
  }, [company_id, filterData]);

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
    if (company_id) dispatch(fetchVehicleGeoFence({ company_id, limit: 500 }));
  }, [company_id, dispatch]);

  useEffect(() => {
    dispatch(vehicleGeofenceReport({ ...apiPayload(), page: page + 1, limit }));
  }, [page, limit, apiPayload, dispatch]);

  const rawData = GeoFenceVehicleReport?.reports || [];
  const totalCount = GeoFenceVehicleReport?.pagination?.total ?? rawData.length;

  const data = rawData.map((item, i) => ({
    id: item.id || item._id || i + 1,
    created_at: item.created_at ?? '-',
    vehicle_number: item.vehicle_number ?? '-',
    route_name: item.route_name ?? '-',
    driver_first_name: item.driver_first_name ?? '',
    driver_last_name: item.driver_last_name ?? '',
    driver_phone: item.driver_phone ?? '-',
    geofence_name: item.geofence_name ?? '-',
    geofence_type: item.geofence_type ?? '-',
    no_of_visit: item.no_of_visit ?? '-',
  }));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(vehicleGeofenceReport({ ...apiPayload(), page: 1, limit }));
  };

  const handleFormReset = () => {
    setFilterData({ geofences: [], routes: [], fromDate: '', toDate: '' });
    setPage(0);
    dispatch(vehicleGeofenceReport({ company_id, page: 1, limit }));
  };

  const handleExport = () => {
    exportToExcel({ columns, rows: buildExportRows({ columns, data }), fileName: 'geofence_entry_exit_report.xlsx' });
  };

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data }),
      fileName: 'geofence_entry_exit_report.pdf',
      orientation: 'landscape',
    });

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>GeoFence Entry-Exit Report (Total: {totalCount})</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          geofences={vehicleGeoFence?.geofences || []}
          routes={routes}
          report={true}
        />
      </form>
      <ReportTable
        columns={columns}
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

export default GeofencEntryExit;
