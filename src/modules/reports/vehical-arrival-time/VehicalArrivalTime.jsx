import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CustomTab from '../vehicle-activity/components/CustomTab';
import ReportTable from '../../../components/table/ReportTable';
import FilterOption from '../../../components/FilterOption';
import { fetchVehicleArrivalData } from '../../../redux/vehicleReportSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const tabs = [
  { name: 'First Shift', path: '/report/vehicle-arrival-time/1' },
  { name: 'Second Shift', path: '/report/vehicle-arrival-time/2' },
  { name: 'Third Shift', path: '/report/vehicle-arrival-time/3' },
];

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'On Time', value: 'on_time' },
  { label: 'Late Arrival', value: 'late' },
];

const columns = [
  {
    key: 'date',
    header: 'Date',
    render: (value) => (value ? moment(value).format('YYYY-MM-DD') : '-'),
  },
  {
    key: 'vehicle_number',
    header: 'Vehicle Number',
    render: (_v, row) => row?.vehicle?.vehicle_number || '-',
  },
  {
    key: 'route_details',
    header: 'Route Details',
    render: (_v, row) => row?.route_details || row?.vehicle_route?.name || '-',
  },
  {
    key: 'driver_name',
    header: 'Driver Name',
    render: (_v, row) => {
      const driver = row?.vehicle?.vehicle_driver || row?.vehicle_route?.vehicle?.vehicle_driver || {};
      const first = driver?.first_name || driver?.name || '';
      const last = driver?.last_name || '';
      return `${first} ${last}`.trim() || '-';
    },
  },
  {
    key: 'driver_number',
    header: 'Driver Number',
    render: (_v, row) => {
      const driver = row?.vehicle?.vehicle_driver || row?.vehicle_route?.vehicle?.vehicle_driver || {};
      return driver?.phone_number || '-';
    },
  },
  {
    key: 'target_arrival_time',
    header: 'Target Arrival Time',
    render: (_v, row) => {
      const stops = row?.vehicle_route?.Vehicle_Route_Stops?.[0] || {};
      return stops.shifts?.start_time ? moment(stops.shifts.start_time, 'HH:mm:ss').format('HH:mm') : '-';
    },
  },
  {
    key: 'actual_arrival_time',
    header: 'Actual Arrival Time',
    render: (_v, row) => {
      const stops = row?.vehicle_route?.Vehicle_Route_Stops?.[0] || {};
      return stops.shifts?.end_time ? moment(stops.shifts.end_time, 'HH:mm:ss').format('HH:mm') : '-';
    },
  },
  {
    key: 'lat_long',
    header: 'Lat-Long',
    render: (_v, row) => {
      const stops = row?.vehicle_route?.Vehicle_Route_Stops?.[0] || {};
      const lat = stops.latitude;
      const lng = stops.longitude;
      return lat && lng ? `${lat}, ${lng}` : '-';
    },
  },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_v, row) => {
      const stops = row?.vehicle_route?.Vehicle_Route_Stops?.[0] || {};
      const lat = stops.latitude;
      const lng = stops.longitude;
      return lat && lng ? (
        <a
          href={`https://maps.google.com/?q=${lat},${lng}`}
          target='_blank'
          rel='noopener noreferrer'
          style={{ color: '#2563eb', textDecoration: 'underline' }}>
          View
        </a>
      ) : (
        '-'
      );
    },
  },
];

function VehicalArrivalTime() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '', status: 'all' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { VehicleArrivalTimeReport, loading, error } = useSelector((state) => state?.vehicleReport);
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes || {});

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchVehicleArrivalData({ company_id, page: page + 1, limit })).then((res) => {
        if (res?.payload?.status === 200) {
          setFilteredData(Array.isArray(res?.payload?.data) ? res.payload.data : []);
        }
      });
  }, [dispatch, company_id, page, limit]);

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    if (filterData.status && filterData.status !== 'all') payload.status = filterData.status;
    payload.page = page + 1;
    payload.limit = limit;
    return payload;
  };

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'vehicle_arrival_time_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'vehicle_arrival_time_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchVehicleArrivalData(buildApiPayload())).then((res) => {
      if (res?.payload?.status === 200) {
        toast.success(res?.payload?.message);
        setFilteredData(Array.isArray(res?.payload?.data) ? res.payload.data : []);
      } else {
        toast.error(res?.payload?.message);
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '', status: 'all' });
  };

  const totalCount = VehicleArrivalTimeReport?.pagination?.total || filteredData.length;

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Vehical Arrival Time Report</h1>
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
          statuses={statusOptions}
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

export default VehicalArrivalTime;
