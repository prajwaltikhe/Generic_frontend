import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from '../modules/dashboard/Dashboard';
import Plant from '../modules/master/plant/Plant';
import Department from '../modules/master/department/Department';
import UserPermission from '../modules/master/user-permission/UserPermission';
import UserPermissionForm from '../modules/master/user-permission/components/UserPermissionForm';
import PlantInTime from '../modules/master/plant-in-time/PlantInTime';
import PlantInTimeForm from '../modules/master/plant-in-time/components/PlantInTimeForm';
import Employee from '../modules/master/employee/Employee';
import EmployeeForm from '../modules/master/employee/components/EmployeeForm';
import Vehicle from '../modules/master/vehicle/Vehicle';
import VehicleForm from '../modules/master/vehicle/components/VehicleForm';
import Driver from '../modules/master/driver/Driver';
import DriverForm from '../modules/master/driver/components/DriverForm';
import Announcement from '../modules/management/announcement/Announcement';
import AnnouncementForm from '../modules/management/announcement/components/AnnouncementForm';
import EmergencyAlert from '../modules/management/emergency-alert/EmergencyAlert';
import EmergencyAlertForm from '../modules/management/emergency-alert/components/EmergencyAlertForm';
import RouteChange from '../modules/management/route-change-request/RouteChange';
import Feedback from '../modules/management/feedback/Feedback';
import FeedbackFrom from '../modules/management/feedback/components/FeedbackFrom';
import VehicleRoute from '../modules/management/vehicle-route/VehicleRoute';
import VehicleRouteForm from '../modules/management/vehicle-route/components/VehicleRouteForm';
import Geofence from '../modules/management/geofence/Geofence';
import GeofenceCreate from '../modules/management/geofence/GeofenceCreate';
import FeedbackReport from '../modules/reports/feedback/Feedback';
import EmergencyAlertReport from '../modules/reports/emergency-alert/EmergencyAlert';
import SeatOccupancyReport from '../modules/reports/seat-occupancy/SeatOccupancy';
import GeofencEntryExit from '../modules/reports/geofence/GeofencEntryExit';
import GeofenceReportDetails from '../modules/reports/geofence/GeofenceReportDetails';
import RouteViolation from '../modules/reports/geofence/RouteViolation';
import RouteViolationDetails from '../modules/reports/geofence/RouteViolationDetails';
import DestinationArrivalFemale from '../modules/reports/destination-arrival-female/DestinationArrivalFemale';
import Movement from '../modules/reports/vehicle-activity/movement/Movement';
import MovementDetails from '../modules/reports/vehicle-activity/movement/MovementDetails';
import Parked from '../modules/reports/vehicle-activity/parked/Parked';
import ParkedDetails from '../modules/reports/vehicle-activity/parked/ParkedDetails';
import Idle from '../modules/reports/vehicle-activity/idle/Idle';
import IdleDetails from '../modules/reports/vehicle-activity/idle/IdleDetails';
import NewDevice from '../modules/reports/vehicle-activity/new-device/NewDevice';
import Offline from '../modules/reports/vehicle-activity/offline/Offline';
import OfflineDetails from '../modules/reports/vehicle-activity/offline/OfflineDetails';
import MapHistory from '../modules/reports/vehicle-activity/map-history/MapHistory';
import EmployeeOnboard from '../modules/reports/employee-onboard/EmployeeOnboard';
import Multitrack from '../modules/multitrack/Multitrack';
import Overspeed from '../modules/reports/overspeed/Overspeed';
import OverspeedReportDetails from '../modules/reports/overspeed/OverspeedReportDetails';
import ViewOverspeed from '../modules/reports/overspeed/ViewOverspeed';
import ViewViolationMap from '../modules/reports/overspeed/ViewViolationMap';
import PunchTimelog from '../modules/reports/punch-timelog/PunchTimelog';
import VehicalArrivalTime from '../modules/reports/vehical-arrival-time/VehicalArrivalTime';
import Profile from '../modules/profile/Profile';
import EmployeePunchDetails from '../modules/multitrack/EmployeePunchDetails';
import Playback from '../modules/multitrack/Playback';
import EmailServiceConfig from '../modules/settings/email-service/EmailServiceConfig';
import IpWhitelisting from '../modules/settings/ip-whitelisting/IpWhitelisting';
import {
  canAccessDashboard,
  canAccessEmailSmsConfig,
  canAccessIpWhitelisting,
  canAccessManagement,
  canAccessMaster,
  canAccessMultitrack,
  canAccessReports,
  canManageUsers,
  getRoleFromStorage,
} from '../utils/roles';

const Guard = ({ ok, element }) => (ok ? element : <Navigate to='/dashboard' replace />);

function DynamicRoute() {
  const role = getRoleFromStorage();
  const allowDashboard = canAccessDashboard(role);
  const allowReports = canAccessReports(role);
  const allowMultitrack = canAccessMultitrack(role);
  const allowMaster = canAccessMaster(role);
  const allowManagement = canAccessManagement(role);
  const allowUserManagement = canManageUsers(role);
  const allowEmailSms = canAccessEmailSmsConfig(role);
  const allowIp = canAccessIpWhitelisting(role);
  return (
    <Routes>
      <Route path='/dashboard' element={<Guard ok={allowDashboard} element={<Dashboard />} />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/multitrack' element={<Guard ok={allowMultitrack} element={<Multitrack />} />} />
      <Route path='/bus-multi-track/punch' element={<Guard ok={allowMultitrack} element={<EmployeePunchDetails />} />} />
      <Route path='/playback' element={<Guard ok={allowMultitrack} element={<Playback />} />} />
      <Route path='/report'>
        <Route path='movement' element={<Guard ok={allowReports} element={<Movement />} />} />
        <Route path='movement/details/:id' element={<Guard ok={allowReports} element={<MovementDetails />} />} />
        <Route path='parked' element={<Guard ok={allowReports} element={<Parked />} />} />
        <Route path='parked/details/:id' element={<Guard ok={allowReports} element={<ParkedDetails />} />} />
        <Route path='idle' element={<Guard ok={allowReports} element={<Idle />} />} />
        <Route path='idle/details/:id' element={<Guard ok={allowReports} element={<IdleDetails />} />} />
        <Route path='offline' element={<Guard ok={allowReports} element={<Offline />} />} />
        <Route path='offline/details/:id' element={<Guard ok={allowReports} element={<OfflineDetails />} />} />
        <Route path='new-device' element={<Guard ok={allowReports} element={<NewDevice />} />} />
        <Route path='map-history' element={<Guard ok={allowReports} element={<MapHistory />} />} />
        <Route path='geofence-entry-exit' element={<Guard ok={allowReports} element={<GeofencEntryExit />} />} />
        <Route path='geofence-entry-exit/details/:id' element={<Guard ok={allowReports} element={<GeofenceReportDetails />} />} />
        <Route path='route-violation' element={<Guard ok={allowReports} element={<RouteViolation />} />} />
        <Route path='route-violation/details/:id' element={<Guard ok={allowReports} element={<RouteViolationDetails />} />} />
        <Route path='overspeed' element={<Guard ok={allowReports} element={<Overspeed />} />} />
        <Route path='overspeed/details/:id' element={<Guard ok={allowReports} element={<OverspeedReportDetails />} />} />
        <Route path='overspeed/view' element={<Guard ok={allowReports} element={<ViewOverspeed />} />} />
        <Route path='overspeed/view-violation-map' element={<Guard ok={allowReports} element={<ViewViolationMap />} />} />
        <Route path='employees-on-board' element={<Guard ok={allowReports} element={<EmployeeOnboard />} />} />
        <Route path='destination-arrival-female' element={<Guard ok={allowReports} element={<DestinationArrivalFemale />} />} />
        <Route path='feedback' element={<Guard ok={allowReports} element={<FeedbackReport />} />} />
        <Route path='seat-occupancy' element={<Guard ok={allowReports} element={<SeatOccupancyReport />} />} />
        <Route path='emergency-alert' element={<Guard ok={allowReports} element={<EmergencyAlertReport />} />} />

        <Route path='punch-timelog' element={<Guard ok={allowReports} element={<PunchTimelog />} />} />
        <Route path='vehicle-arrival-time/:shiftId' element={<Guard ok={allowReports} element={<VehicalArrivalTime />} />} />
      </Route>
      <Route path='/settings/super-admin/email-service' element={<Guard ok={allowEmailSms} element={<EmailServiceConfig />} />} />
      <Route path='/settings/super-admin/ip-whitelisting' element={<Guard ok={allowIp} element={<IpWhitelisting />} />} />
      <Route path='/master'>
        <Route path='plants' element={<Guard ok={allowMaster} element={<Plant />} />} />
        <Route path='departments' element={<Guard ok={allowMaster} element={<Department />} />} />
        <Route path='user-permission' element={<Guard ok={allowUserManagement} element={<UserPermission />} />} />
        <Route path='user-permission/create' element={<Guard ok={allowUserManagement} element={<UserPermissionForm />} />} />
        <Route path='plant-in-time' element={<Guard ok={allowMaster} element={<PlantInTime />} />} />
        <Route path='plant-in-time/create' element={<Guard ok={allowMaster} element={<PlantInTimeForm />} />} />
        <Route path='plant-in-time/view' element={<Guard ok={allowMaster} element={<PlantInTimeForm />} />} />
        <Route path='plant-in-time/edit' element={<Guard ok={allowMaster} element={<PlantInTimeForm />} />} />
        <Route path='employee' element={<Guard ok={allowMaster} element={<Employee />} />} />
        <Route path='employee/create' element={<Guard ok={allowMaster} element={<EmployeeForm />} />} />
        <Route path='employee/edit' element={<Guard ok={allowMaster} element={<EmployeeForm />} />} />
        <Route path='employee/view' element={<Guard ok={allowMaster} element={<EmployeeForm />} />} />
        <Route path='vehicle' element={<Guard ok={allowMaster} element={<Vehicle />} />} />
        <Route path='vehicle/create' element={<Guard ok={allowMaster} element={<VehicleForm />} />} />
        <Route path='vehicle/edit' element={<Guard ok={allowMaster} element={<VehicleForm />} />} />
        <Route path='vehicle/view' element={<Guard ok={allowMaster} element={<VehicleForm />} />} />
        <Route path='driver' element={<Guard ok={allowMaster} element={<Driver />} />} />
        <Route path='driver/create' element={<Guard ok={allowMaster} element={<DriverForm />} />} />
        <Route path='driver/edit' element={<Guard ok={allowMaster} element={<DriverForm />} />} />
        <Route path='driver/view' element={<Guard ok={allowMaster} element={<DriverForm />} />} />

        <Route path='*' element={<div>404</div>} />
      </Route>
      <Route path='/management'>
        <Route path='announcements' element={<Guard ok={allowManagement} element={<Announcement />} />} />
        <Route path='announcement/create' element={<Guard ok={allowManagement} element={<AnnouncementForm />} />} />
        <Route path='announcement/view' element={<Guard ok={allowManagement} element={<AnnouncementForm />} />} />
        <Route path='announcement/edit' element={<Guard ok={allowManagement} element={<AnnouncementForm />} />} />
        <Route path='emergency-alerts' element={<Guard ok={allowManagement} element={<EmergencyAlert />} />} />
        <Route path='emergency-alert/edit' element={<Guard ok={allowManagement} element={<EmergencyAlertForm />} />} />
        <Route path='route-change-request' element={<Guard ok={allowManagement} element={<RouteChange />} />} />
        <Route path='feedbacks' element={<Guard ok={allowManagement} element={<Feedback />} />} />
        <Route path='feedback/edit' element={<Guard ok={allowManagement} element={<FeedbackFrom />} />} />
        <Route path='feedback/view' element={<Guard ok={allowManagement} element={<FeedbackFrom />} />} />
        <Route path='vehicle-route' element={<Guard ok={allowManagement} element={<VehicleRoute />} />} />
        <Route path='vehicle-route/create' element={<Guard ok={allowManagement} element={<VehicleRouteForm />} />} />
        <Route path='vehicle-route/view' element={<Guard ok={allowManagement} element={<VehicleRouteForm />} />} />
        <Route path='vehicle-route/edit' element={<Guard ok={allowManagement} element={<VehicleRouteForm />} />} />
        <Route path='geofence' element={<Guard ok={allowManagement} element={<Geofence />} />} />
        <Route path='geofence/create' element={<Guard ok={allowManagement} element={<GeofenceCreate />} />} />
        <Route path='geofence/view' element={<Guard ok={allowManagement} element={<GeofenceCreate />} />} />
        <Route path='geofence/edit' element={<Guard ok={allowManagement} element={<GeofenceCreate />} />} />
        <Route path='email-sms-configuration' element={<Guard ok={allowEmailSms} element={<EmailServiceConfig />} />} />
        <Route path='ip-whitelisting' element={<Guard ok={allowIp} element={<IpWhitelisting />} />} />
      </Route>
    </Routes>
  );
}

export default DynamicRoute;