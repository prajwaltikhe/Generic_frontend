import SpeedChart from './charts/SpeedChart';
import ReportTable from '../../../components/table/ReportTable';
import { useLocation, Link } from 'react-router-dom';

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
  { key: 'maxSpeedTime', header: 'Max Speed Time' },
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
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Over Speed Time</h1>
        <div className='flex'>
          <Link to='/report/overspeed'>
            <button
              type='button'
              className='text-white bg-[#07163d] hover:bg-[#07163d] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
              Back
            </button>
          </Link>
          <button
            type='button'
            className='text-white bg-[#1d31a6] hover:bg-[#1d31a6] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
            Export
          </button>
        </div>
      </div>
      <SpeedChart rowData={row} />
      <ReportTable columns={columns} data={data} />
    </div>
  );
}

export default ViewOverspeed;
