import moment from 'moment';
import tabs from '../components/Tab';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import CustomTab from '../components/CustomTab';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../../components/FilterOption';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { fetchVehicleActivityData } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';

const intervalOptions = [
  { label: '5 Min', value: '5' },
  { label: '10 Min', value: '10' },
  { label: '20 Min', value: '20' },
  { label: '30 Min', value: '30' },
  { label: '1 Hour', value: '60' },
  { label: '2 Hour', value: '120' },
  { label: '4 Hour', value: '240' },
  { label: '8 Hour', value: '480' },
  { label: '16 Hour', value: '960' },
  { label: '24 Hour', value: '1440' },
];

const columns = [
  { key: 'created_at', header: 'Date & Time', render: (_, r) => moment(r?.created_at).format('YYYY-MM-DD HH:mm:ss') },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, r) => (r?.vehicle_type || '').trim() },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, r) => (r?.vehicle_number || '').trim() },
  {
    key: 'Vehicle_Route',
    header: 'Route Details',
    render: (_, r) => (r?.Vehicle_Route?.route_number || r?.Vehicle_Route?.route_name || '').trim(),
  },
  {
    key: 'vehicle_driver',
    header: 'Driver Name',
    render: (_, r) => `${r?.vehicle_driver?.first_name || ''} ${r?.vehicle_driver?.last_name || ''}`.trim(),
  },
  { key: 'driverContact', header: 'Driver Contact Number', render: (_, r) => r?.vehicle_driver?.phone_number || '' },
  { key: 'source', header: 'Source', render: (_, r) => r?.source || '' },
  { key: 'destination', header: 'Destination', render: (_, r) => r?.destination || '' },
  { key: 'employCount', header: 'Employee Count', render: (_, r) => r?.employCount || '' },
  { key: 'top_speed', header: 'Speed', render: (_, r) => r?.top_speed || '' },
  {
    key: 'start_lat_long',
    header: 'Start Lat-Long',
    render: (_, r) => `${r?.start_latitude || ''} - ${r?.start_longitude || ''}`,
  },
  {
    key: 'end_lat_long',
    header: 'End Lat-Long',
    render: (_, r) => `${r?.end_latitude || ''} - ${r?.end_longitude || ''}`,
  },
  { key: 'tripDistance', header: 'Trip Distance', render: (_, r) => r?.tripDistance || '' },
  { key: 'total_distance', header: 'Covered Distance', render: (_, r) => r?.total_distance || '' },
  { key: 'start_odometer', header: 'Start Odometer', render: (_, r) => r?.start_odometer || '' },
  { key: 'end_odometer', header: 'End Odometer', render: (_, r) => r?.end_odometer || '' },
  { key: 'total_distance_2', header: 'Total Distance', render: (_, r) => r?.total_distance || '' },
  { key: 'top_speed_2', header: 'Top Speed', render: (_, r) => r?.top_speed || '' },
  { key: 'total_running_time', header: 'Total Running Duration', render: (_, r) => r?.total_running_time || '' },
  { key: 'total_ideal_time', header: 'Total Idle Duration', render: (_, r) => r?.total_ideal_time || '' },
  { key: 'total_parked_time', header: 'Total Parked Duration', render: (_, r) => r.total_parked_time || '' },
  { key: 'parking', header: 'No. of Parking', render: (_, r) => r.parking || '' },
  { key: 'offlineDuration', header: 'Total Offline Duration', render: (_, r) => r.offlineDuration || '' },
];

function Movement() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0),
    [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');
  const { routes } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {});
  const { vehicleActivityData } = useSelector((s) => s?.vehicleActivity || {});

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.interval) payload.interval = filterData.interval;
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    return payload;
  };

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchVehicleActivityData({ company_id, page: page + 1, limit })).then(
        (res) => res?.payload?.status === 200 && setFilteredData(res?.payload?.data || [])
      );
  }, [dispatch, company_id, page, limit]);

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'movement_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'movement_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchVehicleActivityData({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
      if (res?.payload?.status === 200) {
        toast.success(res?.payload?.message);
        setFilteredData(res?.payload?.data);
      } else toast.error(res?.payload?.message);
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], interval: '', fromDate: '', toDate: '' });
  };

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Movement Report</h1>
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
        totalCount={vehicleActivityData?.pagination?.total}
      />
    </div>
  );
}

export default Movement;
