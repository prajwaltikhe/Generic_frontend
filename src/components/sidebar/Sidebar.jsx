import './Sidebar.css';
import logo from '../../assets/logo.png';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';
import { isSuperAdminFromStorage } from '../../utils/superAdmin';
import { ArrowRight } from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import { Link, useNavigate } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const sidebarLinks = [
  { to: '/dashboard', icon: <DashboardIcon style={{ fontSize: '3rem' }} />, label: 'Dashboard' },
  { to: '/multitrack', icon: <LocationOnIcon style={{ fontSize: '3rem' }} />, label: 'Multi Track' },
];

const reportsSubMenus = [
  {
    title: 'Vehicle Activity',
    icon: <ArrowRight style={{ fontSize: '20px' }} />,
    items: [
      { to: '/report/movement', label: 'Movement' },
      { to: '/report/parked', label: 'Parked' },
      { to: '/report/idle', label: 'Idle' },
      { to: '/report/offline', label: 'Offline' },
      { to: '/report/new-device', label: 'New Device' },
      { to: '/report/map-history', label: 'Map History' },
    ],
  },
  {
    title: 'Geo-fence',
    icon: <ArrowRight style={{ fontSize: '20px' }} />,
    items: [
      { to: '/report/geofence-entry-exit', label: 'Geo-fence Entry Exit' },
      { to: '/report/route-violation', label: 'Route Violation' },
    ],
  },
];

const reportsLinks = [
  { to: '/report/overspeed', label: 'Over Speed' },
  { to: '/report/employees-on-board', label: 'Employees On Board' },
  { to: '/report/destination-arrival-female', label: 'Destination Arrival-Female' },
  { to: '/report/punch-timelog', label: 'Punch Timelog' },
  { to: '/report/vehicle-arrival-time/2f7d76b8-87a9-4dc1-822a-a39e99b314e9', label: 'Vehicle Arrival Time' },
  { to: '/report/seat-occupancy', label: 'Seat Occupancy' },
  { to: '/report/emergency-alert', label: 'Emergency Alert' },
  { to: '/report/feedback', label: 'Feedback' },
];

const settingsSubMenus = [
  {
    title: 'Master',
    icon: <ArrowRight style={{ fontSize: '20px' }} />,
    style: { top: '-82px' },
    items: [
      { to: '/master/employee', label: 'Employees' },
      { to: '/master/user-permission', label: 'User Management' },
      { to: '/master/vehicle', label: 'Vehicles' },
      { to: '/master/driver', label: 'Drivers' },
      { to: '/master/departments', label: 'Departments' },
      { to: '/master/plants', label: 'Plants' },
      { to: '/master/plant-in-time', label: 'Plant In Time' },
    ],
  },
  {
    title: 'Management',
    icon: <ArrowRight style={{ fontSize: '20px' }} />,
    style: { top: '-82px' },
    items: [
      { to: '/management/geofence', label: 'Geofences' },
      { to: '/management/vehicle-route', label: 'Vehicle Routes' },
      { to: '/management/feedbacks', label: 'Feedbacks' },
      { to: '/management/route-change-request', label: 'Route Change Request' },
      { to: '/management/emergency-alerts', label: 'Emergency alerts' },
      { to: '/management/announcements', label: 'Announcements' },
    ],
  },
];

function Sidebar() {
  return (
    <div className='sidebar w-25 h-screen bg-[#07163d]'>
      <div className='w-full p-4 rounded-3xl overflow-hidden'>
        <img src={logo} alt='samsung logo' className='object-contain rounded-xl' />
      </div>
      <div className='flex flex-col justify-between responsive-height'>
        <ul>
          {sidebarLinks.map(({ to, icon, label }) => (
            <li className='sidebar-item hoverable' key={to}>
              <Link to={to} className='hover:no-underline'>
                <div className='nav-link'>
                  <div className='flex flex-col items-center'>
                    {icon}
                    <span className='text-xs mt-1'>{label}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li className='sidebar-item hoverable'>
            <div className='nav-link'>
              <div className='flex flex-col items-center'>
                <InsertDriveFileIcon style={{ fontSize: '3rem' }} />
                <span className='text-xs mt-1'>Reports</span>
              </div>
            </div>
            <ReportsSubMenu />
          </li>
          <li className='sidebar-item hoverable'>
            <div className='nav-link'>
              <div className='flex flex-col items-center'>
                <SettingsIcon style={{ fontSize: '3rem' }} />
                <span className='text-xs mt-1'>Settings</span>
              </div>
            </div>
            <SettingsSubMenu />
          </li>
        </ul>
        <ul>
          <li className='sidebar-item hoverable'>
            <div className='nav-link'>
              <div className='flex flex-col items-center'>
                <PersonIcon style={{ fontSize: '3rem' }} />
              </div>
            </div>
            <ProfileSubMenu />
          </li>
        </ul>
      </div>
    </div>
  );
}

const ReportsSubMenu = () => (
  <ul className='sub-menu'>
    {reportsSubMenus.map(({ title, icon, items }) => (
      <li className='sub-menu-item' key={title}>
        <div className='nav-link vehicle-activity-link'>
          {title} {icon}
        </div>
        <ul className='nested-sub-menu'>
          {items.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className='nav-link'>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </li>
    ))}
    {reportsLinks.map(({ to, label }) => (
      <li className='sub-menu-item' key={to}>
        <Link to={to} className='nav-link'>
          {label}
        </Link>
      </li>
    ))}
  </ul>
);

const ProfileSubMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };
  return (
    <ul className='sub-menu settings-sub-menu'>
      <li className='sub-menu-item'>
        <Link to='/profile' className='nav-link'>
          Profile Update
        </Link>
      </li>
      <li className='sub-menu-item' onClick={handleLogout}>
        <Link className='nav-link'>Logout</Link>
      </li>
    </ul>
  );
};

const SettingsSubMenu = () => {
  const showSuperAdmin = isSuperAdminFromStorage();
  return (
    <ul className='sub-menu settings-sub-menu'>
      {settingsSubMenus.map(({ title, icon, style, items }) => {
        const list =
          title === 'Management' && showSuperAdmin
            ? [
                ...items,
                {
                  to: '/management/email-sms-configuration',
                  label: 'EMAIL/SMS configuration',
                },
                {
                  to: '/management/ip-whitelisting',
                  label: 'IP Whitelisting',
                },
              ]
            : items;
        return (
          <li className='sub-menu-item' key={title}>
            <div className='nav-link vehicle-activity-link'>
              {title} {icon}
            </div>
            <ul className='nested-sub-menu' style={style}>
              {list.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className='nav-link'>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
};

export default Sidebar;
