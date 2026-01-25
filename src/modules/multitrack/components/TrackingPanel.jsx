import moment from 'moment';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { useNavigate } from 'react-router-dom';
import { CheckBox } from '@mui/icons-material';
import { useState, useMemo, useEffect } from 'react';
import ArrowLeftIcon from '@mui/icons-material/ArrowBackIos';
import ArrowRightIcon from '@mui/icons-material/ArrowForwardIos';
import ISearch, { LateSvg, OnTimeSvg, TotalSvg } from './ISearch';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { FaBatteryFull, FaBolt, FaKey, FaWifi } from 'react-icons/fa';
import { setActiveTab, setIsTrackShow } from '../../../redux/multiTrackSlice';

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

const TrackingPanel = ({ handleRightPanel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { devices, newDevices, running, parked, idle, activeTab, offline, isTrackShow } = useSelector(
    selectState,
    shallowEqual,
  );

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

  const tabCounts = useMemo(
    () => Object.fromEntries(statusTabs.map((t) => [t.label, cleaned[t.label]?.length || 0])),
    [cleaned],
  );

  const filtered = useMemo(() => cleaned[activeTab] || [], [cleaned, activeTab]);

  const shownDevices = useMemo(
    () => (!search ? filtered : filtered.filter((d) => d.vehicle_name?.toLowerCase().includes(search.toLowerCase()))),
    [search, filtered],
  );

  const defaultShiftId = '2f7d76b8-87a9-4dc1-822a-a39e99b314e9';

  const [arrivalStats, setArrivalStats] = useState({ onTime: 0, late: 0 });

  useEffect(() => {
    const fetchArrivalStats = async () => {
      try {
        const res = await ApiService.get(APIURL.LATEARRIVAL);
        if (res?.success && Array.isArray(res.data?.weekChart)) {
          const today = moment().format('ddd');
          const todayData = res.data.weekChart.find((d) => d.day === today);
          const lateCount = todayData?.current || 0;
          setArrivalStats((prev) => ({ ...prev, late: lateCount }));
        }
      } catch (err) {
        console.error('Error fetching arrival stats:', err);
      }
    };
    fetchArrivalStats();
  }, []);

  const totalVehicles = cleaned.All.length;
  const onTimeCount = Math.max(0, totalVehicles - arrivalStats.late);

  const handleOnTimeClick = () => {
    navigate(`/report/vehicle-arrival-time/${defaultShiftId}?status=ON_TIME`);
  };

  const handleLateClick = () => {
    navigate(`/report/vehicle-arrival-time/${defaultShiftId}?status=LATE`);
  };

  return (
    <div
      className={`absolute transition-all top-0 left-0 rounded-md bg-white h-full p-3 z-[99999] w-[452px] flex flex-col ${
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
          value={onTimeCount}
          bg='#00800026'
          color='#0e7c13'
          onClick={handleOnTimeClick}
        />
        <StatCard
          icon={<LateSvg />}
          label='Late'
          value={arrivalStats.late}
          bg='#FF000026'
          color='#d70b0b'
          onClick={handleLateClick}
        />
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
        <div className='p-1 border-b border-gray-300'>
          <ISearch onChange={(e) => setSearch(e.target.value)} value={search} />
        </div>
        <div className='mhe-list p-2 mt-2 flex-1 min-h-0 overflow-y-auto'>
          {shownDevices.map((device) => (
            <div
              key={device.id}
              className='flex items-center border-b border-gray-200 py-1 last:border-none cursor-pointer'>
              <CheckBox fontSize='small' sx={{ marginRight: '10px' }} />
              <div className='h-2 w-2 rounded-full mr-4' style={{ background: device.color }} />
              <div className='flex-1'>
                <div className='text-sm' onClick={() => handleRightPanel(device)}>
                  {device.vehicle_name}
                </div>
                {device.timestamp && (
                  <div className='text-gray-500 text-xs'>{new Date(device.timestamp).toLocaleString()}</div>
                )}
              </div>
              <span className='w-8 text-center text-sm'>{device.speed}</span>
              {iconStatus.map(({ Icon, key }, i) => {
                const status = key(device);
                const cls =
                  status == null
                    ? 'text-gray-400 text-[15px]'
                    : status
                      ? 'text-green-600 text-[15px]'
                      : 'text-red-400 text-[15px]';
                return (
                  <span key={i} className='w-8 text-center'>
                    <Icon className={cls} />
                  </span>
                );
              })}
              <span className='ml-4 text-sm text-gray-600'>{device.address}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackingPanel;
