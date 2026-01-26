import { useSelector, shallowEqual } from 'react-redux';
import movingVehicle from '../../../assets/moving_vehicle.svg';
import idleVehicle from '../../../assets/idle_vehicle.svg';
import parkedVehicle from '../../../assets/parked_vehicle.svg';
import { useFetchVehicles } from '../../../hooks/useFetchVehicles';

const VEHICLE_STATUS = [
  { img: movingVehicle, label: 'Running', key: 'runningDevices', color: '#00C48C' },
  { img: idleVehicle, label: 'Idle', key: 'idelDevices', color: '#FFC22D' },
  { img: parkedVehicle, label: 'Parked', key: 'parkedDevices', color: '#FF6B6B' },
];

export default function FleetStatus() {
  useFetchVehicles();

  const status = useSelector(
    (s) => ({
      runningDevices: s.multiTrackStatus.runningDevices || [],
      idelDevices: s.multiTrackStatus.idelDevices || [],
      parkedDevices: s.multiTrackStatus.parkedDevices || [],
    }),
    shallowEqual,
  );

  return (
    <div className='bg-white rounded-lg shadow h-full flex flex-col justify-between p-4'>
      <div className='flex items-center justify-between mb-2'>
        <div className='font-semibold'>Status of Fleet</div>
        <span className='bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm'>
          Live
        </span>
      </div>
      <div className='mb-3 mt-1 text-sm text-gray-600'>Currently there are...</div>
      <div className='flex flex-1 gap-3 items-center justify-center'>
        {VEHICLE_STATUS.map(({ img, label, key, color }) => (
          <div
            key={key}
            className='flex flex-col items-center justify-center flex-1 rounded-lg bg-gray-50 h-[85%] py-5 gap-2 mx-1 shadow hover:shadow-md transition-shadow'
            style={{ minWidth: 0 }}>
            <img src={img} alt={label} className='w-14 h-14' />
            <div className='font-extrabold text-2xl' style={{ color }}>
              {status[key].length}
            </div>
            <div className='text-sm font-semibold' style={{ color }}>
              {label} vehicles
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
