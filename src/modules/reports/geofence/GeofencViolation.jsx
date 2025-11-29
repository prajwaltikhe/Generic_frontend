import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchGeoToGeoFence } from '../../../redux/geofenceSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  {
    key: 'created_at',
    header: 'Date',
    render: (value) => (value ? moment(value).format('YYYY-MM-DD hh:mm:ss A') : '-'),
  },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (v, row) => row?.vehicle?.vehicle_number || '-' },
  { key: 'route_details', header: 'Route Details', render: (v, row) => row?.route_details || '-' },
  {
    key: 'driver_name',
    header: 'Driver Name',
    render: (_v, row) => {
      const first = row?.vehicle?.vehicle_driver?.first_name || '';
      const last = row?.vehicle?.vehicle_driver?.last_name || '';
      return `${first} ${last}`.trim() || '-';
    },
  },
  {
    key: 'driver_number',
    header: 'Driver Number',
    render: (_v, row) => row?.vehicle?.vehicle_driver?.phone_number || '-',
  },
  {
    key: 'entry_time',
    header: 'Violation Start Time',
    render: (value) => (value ? moment(value).format('YYYY-MM-DD hh:mm:ss A') : '-'),
  },
  {
    key: 'entry_lat_long',
    header: 'Lat-Long',
    render: (_v, row) =>
      row?.entry_latitude && row?.entry_longitude ? `${row.entry_latitude}, ${row.entry_longitude}` : '-',
  },
  {
    key: 'entry_gmap',
    header: 'G-Map',
    render: (_v, row) =>
      row?.entry_latitude && row?.entry_longitude ? (
        <a
          href={`https://maps.google.com/?q=${row.entry_latitude},${row.entry_longitude}`}
          target='_blank'
          rel='noopener noreferrer'
          style={{ color: '#2563eb', textDecoration: 'underline' }}>
          View
        </a>
      ) : (
        '-'
      ),
  },
  {
    key: 'exit_time',
    header: 'Violation End Time',
    render: (value) => (value ? moment(value).format('YYYY-MM-DD hh:mm:ss A') : '-'),
  },
  {
    key: 'exit_lat_long',
    header: 'Lat-Long',
    render: (_v, row) =>
      row?.exit_latitude && row?.exit_longitude ? `${row.exit_latitude}, ${row.exit_longitude}` : '-',
  },
  {
    key: 'exit_gmap',
    header: 'G-Map',
    render: (_v, row) =>
      row?.exit_latitude && row?.exit_longitude ? (
        <a
          href={`https://maps.google.com/?q=${row.exit_latitude},${row.exit_longitude}`}
          target='_blank'
          rel='noopener noreferrer'
          style={{ color: '#2563eb', textDecoration: 'underline' }}>
          View
        </a>
      ) : (
        '-'
      ),
  },
  {
    key: 'violation_distance',
    header: 'Violation Distance',
    render: (v, row) =>
      row?.total_trip_distance !== undefined && row?.total_trip_distance !== null ? row.total_trip_distance : '-',
  },
];

function GeofencViolation() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { GeoToGeoReportData, loading, error } = useSelector((state) => state?.geofence);
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
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchGeoToGeoFence({ company_id, page: page + 1, limit })).then((res) => {
        if (res?.payload?.status === 200) {
          setFilteredData(
            res?.payload?.data?.tripCount?.res && Array.isArray(res.payload.data.tripCount.res)
              ? res.payload.data.tripCount.res
              : []
          );
        }
      });
  }, [dispatch, company_id, page, limit]);

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'geofence_violation_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'geofence_violation_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchGeoToGeoFence({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
      if (res?.payload?.status === 200) {
        toast.success(res?.payload?.message);
        setFilteredData(
          res?.payload?.data?.tripCount?.res && Array.isArray(res.payload.data.tripCount.res)
            ? res.payload.data.tripCount.res
            : []
        );
      } else toast.error(res?.payload?.message);
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  };

  const totalCount = GeoToGeoReportData?.data?.tripCount?.total || filteredData.length;

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Geo-fence Violation Report</h1>
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
        columns={columns}
        data={filteredData}
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

export default GeofencViolation;
