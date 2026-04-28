import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckBox } from '@mui/icons-material';
import ArrowLeftIcon from '@mui/icons-material/ArrowBackIos';
import ArrowRightIcon from '@mui/icons-material/ArrowForwardIos';
import ISearch, { LateSvg, OnTimeSvg, TotalSvg } from './ISearch';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { FaBatteryFull, FaBolt, FaKey, FaWifi } from 'react-icons/fa';
import { setActiveTab, setIsTrackShow, fetchEnrichedVehicles } from '../../../redux/multiTrackSlice';

const statusTabs = [
  { label: 'Running', bg: '#00800026', color: 'green' },
  { label: 'Idle', bg: '#FFC10726', color: '#ce9a00' },
  { label: 'Parked', bg: '#FF000026', color: 'red' },
  { label: 'Offline', bg: '#000DFF26', color: 'blue' },
  { label: 'New', bg: '#ececec', color: 'gray' },
  { label: 'All', bg: '#d9d9d9', color: 'black' },
];

const iconStatus = [
  { Icon: FaWifi, key: (d) => (d.lat ? d.lat !== 0 : null) },
  { Icon: FaKey, key: (d) => (d.lat ? d.hasIgnition : null) },
  { Icon: FaBatteryFull, key: (d) => (d.lat ? d.hasBattery : null) },
  { Icon: FaBolt, key: (d) => (d.lat ? d.hasExternalPower : null) },
];

const selectState = (s) => ({
  devices: s.multiTrackStatus.devices,
  newDevices: s.multiTrackStatus.newDevices,
  running: s.multiTrackStatus.runningDevices,
  parked: s.multiTrackStatus.parkedDevices,
  idle: s.multiTrackStatus.idelDevices,
  activeTab: s.multiTrackStatus.activeTab,
  offline: s.multiTrackStatus.offlineVehicleData,
  isTrackShow: s.multiTrackStatus.isTrackShow,
  weekChart: s.multiTrackStatus.weekChart,
  isProcessed: s.multiTrackStatus.isProcessed,
  isRefreshing: s.multiTrackStatus.isRefreshing,
});

const StatCard = ({ icon, label, value, bg, color, onClick }) => (
  <div
    className={`flex flex-row w-1/3 items-center gap-2 shadow-sm ${
      onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
    }`}
    style={{ background: bg }}
    onClick={onClick}>
    <div className='pl-2'>{icon}</div>
    <div>
      <p className='text-sm' style={{ color }}>
        {label}
      </p>
      <p className='text-sm' style={{ color }}>
        {value}
      </p>
    </div>
  </div>
);

const TrackingPanel = ({ handleRightPanel, selectedVehicleId, onClearMapSelection }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { devices, newDevices, running, parked, idle, activeTab, offline, isTrackShow, isProcessed, isRefreshing } = useSelector(
    selectState,
    shallowEqual,
  );

  const handleRefresh = () => {
    dispatch(fetchEnrichedVehicles());
  };

  const cleaned = useMemo(
    () => ({
      Running: running || [],
      Idle: idle || [],
      Parked: parked || [],
      Offline: offline || [],
      New: newDevices || [],
      All: devices || [],
    }),
    [devices, newDevices, running, parked, idle, offline],
  );
  const totalVehicles = cleaned.All.length;

  const tabCounts = useMemo(
    () => Object.fromEntries(statusTabs.map((t) => [t.label, cleaned[t.label]?.length || 0])),
    [cleaned],
  );

  const filtered = useMemo(() => cleaned[activeTab] || [], [cleaned, activeTab]);

  const shownDevices = useMemo(() => {
    if (!search.trim()) return filtered;
    const q = search.toLowerCase().trim();
    return filtered.filter((d) => {
      const name = (d.vehicle_name || '').toLowerCase();
      const num = (d.vehicle_number || '').toLowerCase();
      const route = (d.route_name || '').toLowerCase();
      return name.includes(q) || num.includes(q) || route.includes(q);
    });
  }, [search, filtered]);

  const defaultShiftId = '2f7d76b8-87a9-4dc1-822a-a39e99b314e9';

  const handleOnTimeClick = () => {
    navigate(`/report/vehicle-arrival-time/${defaultShiftId}?status=ON_TIME`);
  };

  const handleLateClick = () => {
    navigate(`/report/vehicle-arrival-time/${defaultShiftId}?status=LATE`);
  };

  return (
    <div
      className={`absolute transition-all top-0 left-0 rounded-md bg-white h-full p-3 z-99999 w-[452px] flex flex-col ${
        isTrackShow ? '-translate-x-[452px]' : ''
      }`}
      style={{ minHeight: 0 }}>
      <div
        className='absolute top-10 -right-5 h-14 bg-[#FFF] cursor-pointer rounded-tr-lg rounded-br-lg text-4xl flex items-center justify-center'
        onClick={() => dispatch(setIsTrackShow(!isTrackShow))}>
        {isTrackShow ? <ArrowRightIcon /> : <ArrowLeftIcon />}
      </div>
      <div className='w-full rounded-sm overflow-hidden mb-2 flex justify-between items-center relative'>
        <StatCard icon={<TotalSvg />} label='Total' value={totalVehicles} bg='#e7e5e6' />
        <StatCard
          icon={<OnTimeSvg />}
          label='On time'
          value='-'
          bg='#00800026'
          color='#0e7c13'
          onClick={handleOnTimeClick}
        />
        <StatCard icon={<LateSvg />} label='Late' value='-' bg='#FF000026' color='#d70b0b' onClick={handleLateClick} />
      </div>
      <div className='border border-[#1d31a6] rounded-md flex flex-col flex-1 min-h-0 relative'>
        <div className='flex'>
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                dispatch(setActiveTab(tab.label));
                setSearch('');
              }}
              className={`flex-1 flex flex-col items-center cursor-pointer p-1 h-13 rounded-tr-md transition-all duration-200 ${
                activeTab === tab.label ? 'border-b-4' : ''
              }`}
              style={{
                background: tab.bg,
                borderColor: activeTab === tab.label ? tab.color : 'transparent',
                borderBottomWidth: activeTab === tab.label ? 3 : 0,
              }}>
              <span style={{ color: tab.color }}>{tabCounts[tab.label]}</span>
              <span style={{ color: tab.color, fontSize: 11 }}>{tab.label === 'New' ? 'New Device' : tab.label}</span>
            </button>
          ))}
        </div>
        <div className='p-2 border-b border-gray-300'>
          <ISearch onChange={(e) => setSearch(e.target.value)} value={search} onRefresh={handleRefresh} />
          {selectedVehicleId && onClearMapSelection && (
            <button
              type='button'
              onClick={onClearMapSelection}
              className='mt-2 w-full text-center text-xs py-1.5 rounded border border-[#1d31a6] text-[#1d31a6] hover:bg-[#1d31a6] hover:text-white transition-colors'>
              Clear selected vehicle (map and side panel)
            </button>
          )}
          {isRefreshing && isProcessed && (
            <div className='text-[11px] text-gray-500 mt-1'>Refreshing vehicle data...</div>
          )}
        </div>
        <div className='mhe-list p-2 flex-1 min-h-0 overflow-y-auto'>
          {!isProcessed ? (
            <div className='space-y-4 pt-2'>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className='flex items-center gap-3 animate-pulse px-2'>
                  <div className='w-5 h-5 bg-gray-200 rounded'></div>
                  <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                  </div>
                  <div className='flex gap-2'>
                    <div className='w-6 h-6 bg-gray-200 rounded-full'></div>
                    <div className='w-6 h-6 bg-gray-200 rounded-full'></div>
                    <div className='w-6 h-6 bg-gray-200 rounded-full'></div>
                  </div>
                </div>
              ))}
            </div>
          ) : shownDevices.length === 0 ? (
            <div className='flex items-center justify-center p-4 text-gray-500 text-sm'>No vehicles found</div>
          ) : (
            shownDevices.map((device) => (
              <div
                key={device.id}
                className='flex items-center border-b border-gray-200 py-1 last:border-none cursor-pointer hover:bg-gray-50 transition-colors'
                onClick={() => handleRightPanel(device)}>
                <CheckBox fontSize='small' sx={{ marginRight: '10px' }} />
                <div className='h-2 w-2 rounded-full mr-4' style={{ background: device.color }} />
                <div className='flex-1'>
                  <div className='text-sm font-medium'>{device.vehicle_name}</div>
                  {device.timestamp && (
                    <div className='text-gray-500 text-[10px] leading-tight'>
                      {new Date(device.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
                <span className='w-12 text-center text-[11px] font-semibold text-gray-700'>{device.speed}</span>
                {iconStatus.map(({ Icon, key }, i) => {
                  const status = key(device);
                  const cls =
                    status == null
                      ? 'text-gray-400 text-[14px]'
                      : status
                        ? 'text-green-600 text-[14px]'
                        : 'text-red-400 text-[14px]';
                  return (
                    <span key={i} className='w-6 text-center'>
                      <Icon className={cls} />
                    </span>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingPanel;
