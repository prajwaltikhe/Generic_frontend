import SpeedChart from './charts/SpeedChart';
import ReportTable from '../../../components/table/ReportTable';
import { useLocation, Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import moment from 'moment';

const columns = [
  { key: 'date', header: 'Date time' },
  { key: 'vehicleNo', header: 'Vehicle Number' },
  { key: 'routeNo', header: 'Route Number' },
  { key: 'routeName', header: 'Route Name' },
  { key: 'distance', header: 'Distance (in km)' },
  { key: 'tripDistance', header: 'Trip Distance (in km)' },
  { key: 'maxSpeedOfVehicle', header: 'Max Speed of Vehicle' },
  { key: 'maxSpeed', header: 'Max Speed' },
  { key: 'maxSpeedDistance', header: 'Max Speed Distance (in km)' },
  {
    key: 'maxSpeedTime',
    header: 'Max Speed Time',
    render: (_, row) =>
      row?.maxSpeedTime
        ? moment(row.maxSpeedTime, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('HH:mm:ss')
        : '-',
  },
  {
    key: 'maxSpeedLatLong',
    header: 'Max Speed Lat-Long',
    render: (_, row) =>
      row?.maxSpeedLatitude && row?.maxSpeedLongitude
        ? `${parseFloat(row.maxSpeedLatitude).toFixed(6)}, ${parseFloat(row.maxSpeedLongitude).toFixed(6)}`
        : row?.maxSpeedLatLong || '-',
  },
  {
    key: 'maxSpeedGmap',
    header: 'Max Speed Google-Map',
    render: () => (
      <a className='text-blue-700' href='/report/overspeed/view-violation-map'>
        Google-Map
      </a>
    ),
  },
  { key: 'driverName', header: 'Driver Name' },
];

function ViewOverspeed() {
  const { state } = useLocation();
  const row = state || {};
  const data = [row];

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex items-center gap-4'>
          <Link
            to='/report/overspeed'
            className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
            <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
            Back
          </Link>
          <h1 className='text-2xl font-bold text-[#07163d]'>Over Speed Time</h1>
        </div>
        <button
          type='button'
          className='text-white bg-[#1d31a6] hover:bg-[#1d31a6] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center cursor-pointer'>
          Export
        </button>
      </div>
      <SpeedChart rowData={row} />
      <ReportTable columns={columns} data={data} />
    </div>
  );
}

export default ViewOverspeed;
