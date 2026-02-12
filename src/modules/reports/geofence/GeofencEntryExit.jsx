import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import { fetchVehicleGeoFence, vehicleGeofenceReport } from '../../../redux/geofenceSlice';

const columns = [
  { key: 'date', header: 'Date', render: (v) => v || '-' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (v) => v ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (v) => v ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (v) => v ?? '-' },
  { key: 'driver_number', header: 'Driver Number', render: (v) => v ?? '-' },
  { key: 'geofence_name', header: 'Geofence Name', render: (v) => v ?? '-' },
  { key: 'geofence_type', header: 'Geofence Type', render: (v) => v ?? '-' },
  { key: 'no_of_visit', header: 'No. Of Visit', render: (v) => v ?? '-' },
];

const initialFilter = { geofences: [], routes: [], fromDate: '', toDate: '' };

function GeofencEntryExit() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState(initialFilter);

  const company_id = localStorage.getItem('company_id');
  const dataFilter = useRef(filterData);

  const { GeoFenceVehicleReport, loading, error, vehicleGeoFence } = useSelector((s) => s.geofence);
  const { routes } = useSelector((s) => s.vehicleRoute?.vehicleRoutes || {});

  const buildApiPayload = useCallback(
    (overrides = {}) => {
      const d = dataFilter.current;
      return {
        company_id,
        ...(d.geofences?.length && { geofences: JSON.stringify(d.geofences) }),
        ...(d.routes?.length && { routes: JSON.stringify(d.routes) }),
        ...(d.fromDate && { from_date: d.fromDate }),
        ...(d.toDate && { to_date: d.toDate }),
        ...overrides,
      };
    },
    [company_id],
  );

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
    if (company_id) dispatch(fetchVehicleGeoFence({ company_id, limit: 500 }));
  }, [company_id, dispatch]);

  useEffect(() => {
    dispatch(vehicleGeofenceReport(buildApiPayload({ page: page + 1, limit })));
  }, [page, limit, buildApiPayload, dispatch]);

  const rawData = GeoFenceVehicleReport?.reports || [];
  const totalCount = GeoFenceVehicleReport?.pagination?.total ?? rawData.length;

  const formatData = (items) =>
    items.map((item, i) => ({
      id: item.id || item._id || item.vehicle_id || i + 1,
      vehicle_id: item.vehicle_id || item.id || item._id,
      date: item.date ?? '-',
      vehicle_number: item.vehicle_number ?? '-',
      route_details: item.route_name ?? '-',
      driver_name: [item.driver_first_name, item.driver_last_name].filter(Boolean).join(' ').trim() || '-',
      driver_number: item.driver_phone ?? '-',
      geofence_name: item.geofence_name ?? '-',
      geofence_type: item.geofence_type ?? '-',
      no_of_visit: item.no_of_visit ?? '-',
    }));

  const data = formatData(rawData);

  const handleViewDetails = (row) => {
    const params = new URLSearchParams();
    if (filterData.fromDate) params.set('from_date', filterData.fromDate);
    if (filterData.toDate) params.set('to_date', filterData.toDate);
    navigate(`/report/geofence-entry-exit/details/${row.vehicle_id}?${params.toString()}`);
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
    dispatch(vehicleGeofenceReport(buildApiPayload({ page: 1, limit })));
  };

  const handleFormReset = () => {
    setFilterData(initialFilter);
    dataFilter.current = initialFilter;
    setPage(0);
    dispatch(vehicleGeofenceReport({ company_id, page: 1, limit }));
  };

  const handleExport = async () => {
    const res = await dispatch(vehicleGeofenceReport(buildApiPayload({ page: 1, limit: totalCount || 150 })));
    const exportData = formatData(res?.payload?.reports || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: exportData }),
      fileName: 'geofence_entry_exit_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(vehicleGeofenceReport(buildApiPayload({ page: 1, limit: totalCount || 150 })));
    const exportData = formatData(res?.payload?.reports || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: exportData }),
      fileName: 'geofence_entry_exit_report.pdf',
      orientation: 'landscape',
    });
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>GeoFence Entry-Exit Report (Total: {totalCount})</h1>
      </div>
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

export default GeofencEntryExit;
