import { useSelector, shallowEqual } from 'react-redux';
import { FaTruck, FaPause, FaParking, FaPlusCircle } from 'react-icons/fa';
import { MdSignalWifiOff } from 'react-icons/md';
import { useFetchVehicles } from '../../../hooks/useFetchVehicles';

const VEHICLE_STATUS = [
  {
    Icon: FaTruck,
    label: 'Running',
    key: 'runningDevices',
    color: 'green',
    bg: 'bg-green-100',
    textColor: 'text-green-600',
  },
  {
    Icon: FaPause,
    label: 'Idle',
    key: 'idelDevices',
    color: '#ce9a00',
    bg: 'bg-yellow-100',
    textColor: 'text-yellow-600',
  },
  {
    Icon: FaParking,
    label: 'Parked',
    key: 'parkedDevices',
    color: 'red',
    bg: 'bg-red-100',
    textColor: 'text-red-600',
  },
  {
    Icon: MdSignalWifiOff,
    label: 'Offline',
    key: 'offlineVehicleData',
    color: 'blue',
    bg: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  {
    Icon: FaPlusCircle,
    label: 'New',
    key: 'newDevices',
    color: 'gray',
    bg: 'bg-gray-100',
    textColor: 'text-gray-500',
  },
];

export default function FleetStatus() {
  useFetchVehicles();

  const status = useSelector(
    (s) => ({
      runningDevices: s.multiTrackStatus.runningDevices || [],
      idelDevices: s.multiTrackStatus.idelDevices || [],
      parkedDevices: s.multiTrackStatus.parkedDevices || [],
      offlineVehicleData: s.multiTrackStatus.offlineVehicleData || [],
      newDevices: s.multiTrackStatus.newDevices || [],
    }),
    shallowEqual,
  );

  return (
    <div className='shadow-sm rounded-sm bg-white flex flex-col p-4'>
      <div className='flex items-center justify-between'>
        <div className='font-semibold'>Status of Fleet</div>
        <span className='bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm'>
          Live
        </span>
      </div>
      <div className='grid grid-cols-3 gap-3 items-center justify-center mt-2'>
        {VEHICLE_STATUS.map(({ Icon, label, key, color, bg, textColor }) => (
          <div
            key={key}
            className='flex flex-col items-center justify-center rounded-xl bg-gray-50 py-1 gap-0.5 shadow-sm hover:shadow-md transition-shadow cursor-default'>
            <div className={`${bg} rounded-full p-2.5`}>
              <Icon className={`${textColor} text-xl`} />
            </div>
            <div className='font-bold text-xl' style={{ color }}>
              {status[key].length}
            </div>
            <div className='text-sm font-medium -mt-0.5' style={{ color }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
