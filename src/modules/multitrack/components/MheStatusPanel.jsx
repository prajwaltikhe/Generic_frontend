import moment from 'moment-timezone';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ArrowRightIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowLeftIcon from '@mui/icons-material/ArrowBackIosNew';

const statusColorMap = {
  Running: '#008000',
  Idle: '#FFC107',
  Parked: '#FF0000',
  Offline: '#000DFF',
  New: '#808080',
  Unknown: '#000000',
};

const renderValue = (v) => {
  if (v == null || (typeof v === 'string' && v.trim() === '')) return '-';
  if (typeof v === 'number' || (typeof v === 'string' && !isNaN(v))) return Number(v);
  if (Array.isArray(v)) return v.length ? v.join(', ') : '-';
  if (typeof v === 'object') {
    if (v.first_name && v.last_name) return `${v.first_name} ${v.last_name}`;
    if (v.name) return v.name;
    try {
      let s = JSON.stringify(v);
      return s.length > 60 ? s.slice(0, 57) + '...' : s;
    } catch {
      return '-';
    }
  }
  return v;
};

const Btn = ({ children }) => (
  <button className='bg-linear-to-r from-[#1d31a6] to-[#3b5998] px-3 py-2 text-white rounded-lg text-xs font-semibold shadow hover:from-[#3b5998] hover:to-[#1d31a6] transition-all duration-150 cursor-pointer'>
    {children}
  </button>
);

const MheStatusPanel = ({ onCollapsePanel, onExpandPanel, isShowPanel, vehicle }) => {
  const [dt] = useState(() => moment().tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm'));

  const status = vehicle?.status ?? 'Unknown';
  const fields = [
    ['Vehicle Number', 'vehicle_number'],
    ['Route Name', 'route_name'],
    ['Today Distance', 'today_distance'],
    ['Total Seats', 'seats'],
    ['Assigned Seats', 'assigned_seats'],
    ['Onboarded Employee', 'onboarded_employee'],
    ['Speed', 'speed'],
    ['Driver Name', 'driver_name'],
    ['Driver Number', 'driver_number'],
  ];

  return (
    <>
      {isShowPanel && (
        <div className='fixed top-2/5 z-100000 -translate-y-1/2 transition-all duration-300 left-[calc(100vw-360px)]'>
          <button
            className='h-10 w-10 bg-linear-to-br from-[#1d31a6] to-[#3b5998] cursor-pointer text-white flex items-center justify-center rounded-full shadow-lg border border-white'
            onClick={onCollapsePanel}
            title='Hide panel (map selection unchanged)'
            type='button'>
            <ArrowRightIcon fontSize='small' />
          </button>
        </div>
      )}
      {!isShowPanel && vehicle && (
        <div className='fixed top-2/5 z-100000 -translate-y-1/2 transition-all duration-300 right-0'>
          <button
            className='h-10 w-10 bg-linear-to-br from-[#1d31a6] to-[#3b5998] cursor-pointer text-white flex items-center justify-center rounded-l-full shadow-lg border border-white pr-1'
            onClick={onExpandPanel}
            title='Show vehicle details'
            type='button'>
            <ArrowLeftIcon fontSize='small' />
          </button>
        </div>
      )}
      <div
        className={`fixed transition-all top-0 ${
          isShowPanel ? 'right-0' : 'right-[-340px]'
        } w-[340px] rounded-xl bg-white z-99999 shadow-2xl border border-gray-200 flex flex-col overflow-hidden`}
        style={{ transition: 'right 0.3s', minHeight: 0, maxHeight: 'calc(100vh - 5rem)' }}>
        <div className='flex flex-col items-center bg-linear-to-r from-[#1d31a6] to-[#3b5998] py-4 px-4 border-b border-gray-200'>
          <p className='font-bold text-lg text-white mb-1 truncate w-full text-center'>
            {renderValue(vehicle?.vehicle_name)}
          </p>
          <div className='flex justify-between items-center w-full gap-2 mt-1'>
            <span
              className='px-3 py-1 rounded-full text-xs font-semibold shadow text-center tracking-wider min-w-[60px] text-white'
              style={{ backgroundColor: statusColorMap[status] || '#000' }}>
              {status}
            </span>
            <span className='bg-white text-[#1d31a6] px-3 py-1 rounded-full text-xs font-semibold shadow border border-[#1d31a6]'>
              {dt}
            </span>
          </div>
        </div>
        <div className='flex-1 py-4 px-4 bg-gray-50 overflow-y-auto'>
          <div className='grid gap-3'>
            {fields.map(([label, key]) => (
              <div
                key={label}
                className='flex justify-between items-center bg-white rounded-md px-3 py-2 shadow-sm border border-gray-100'>
                <span className='text-gray-500 font-medium text-xs'>{label}</span>
                <span className='text-gray-900 font-semibold text-xs'>
                  {renderValue(typeof key === 'function' ? key(vehicle) : vehicle?.[key])}
                </span>
              </div>
            ))}
          </div>
          <div className='mt-6 grid grid-cols-3 gap-2'>
            <Link
              to={`/report/${status === 'New' ? 'new-device' : status === 'Running' ? 'movement' : status || ''}/details/${vehicle?.id}`}>
              <Btn>Reports</Btn>
            </Link>
            <Link to='/management/vehicle-route/view' state={{ rowData: { route_name: vehicle?.route_name } }}>
              <Btn>Route Detail</Btn>
            </Link>
            <Link to='/playback' state={{ selectedVehicle: vehicle }}>
              <Btn>Playback</Btn>
            </Link>
          </div>
          <div className='mt-3'>
            <Link to='/bus-multi-track/punch' state={{ selectedVehicle: vehicle }} className='block w-full'>
              <button className='w-full bg-[#1d31a6] text-white py-2.5 rounded-lg text-xs font-bold shadow-md hover:bg-[#3b5998] transition-all uppercase tracking-wide cursor-pointer'>
                Employee Punch Report
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default MheStatusPanel;
