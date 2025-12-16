import { Route, Routes } from 'react-router-dom';
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
import GeofencViolation from '../modules/reports/geofence/GeofencViolation';
import DestinationArrivalFemale from '../modules/reports/destination-arrival-female/DestinationArrivalFemale';
import Movement from '../modules/reports/vehicle-activity/movement/Movement';
import Parked from '../modules/reports/vehicle-activity/parked/Parked';
import Idle from '../modules/reports/vehicle-activity/idle/Idle';
import NewDevice from '../modules/reports/vehicle-activity/new-device/NewDevice';
import Offline from '../modules/reports/vehicle-activity/offline/Offline';
import MapHistory from '../modules/reports/vehicle-activity/map-history/MapHistory';
// import Consolidated from '../modules/reports/vehicle-activity/consolidated/Consolidated';
import EmployeeOnboard from '../modules/reports/employee-onboard/EmployeeOnboard';
import Multitrack from '../modules/multitrack/Multitrack';
import Overspeed from '../modules/reports/overspeed/Overspeed';
import ViewOverspeed from '../modules/reports/overspeed/ViewOverspeed';
import ViewViolationMap from '../modules/reports/overspeed/ViewViolationMap';
import PunchTimelog from '../modules/reports/punch-timelog/PunchTimelog';
import VehicalArrivalTime from '../modules/reports/vehical-arrival-time/VehicalArrivalTime';
// import Stopage from '../modules/reports/vehical-arrival-time/Stopage';
import Profile from '../modules/profile/Profile';
import EmployeePunchDetails from '../modules/multitrack/EmployeePunchDetails';
import Playback from '../modules/multitrack/Playback';
import RouteStopPoint from '../modules/management/route-stop-point/RouteStopPoint';
import RouteStopPointForm from '../modules/management/route-stop-point/RouteStopPointForm';

function DynamicRoute() {
  return (
    <Routes>
      <Route path='/dashboard' element={<Dashboard />} />
      <Route path='/profile' element={<Profile />} />
      <Route path='/multitrack' element={<Multitrack />} />
      <Route path='/bus-multi-track/punch' element={<EmployeePunchDetails />} />
      <Route path='/playback' element={<Playback />} />
      <Route path='/report'>
        <Route path='movement' element={<Movement />} />
        <Route path='parked' element={<Parked />} />
        <Route path='idle' element={<Idle />} />
        <Route path='offline' element={<Offline />} />
        <Route path='new-device' element={<NewDevice />} />
        <Route path='map-history' element={<MapHistory />} />
        {/* <Route path='consolidated' element={<Consolidated />} /> */}
        <Route path='geofence-entry-exit' element={<GeofencEntryExit />} />
        <Route path='route-violation' element={<GeofencViolation />} />
        <Route path='overspeed' element={<Overspeed />} />
        <Route path='overspeed/view' element={<ViewOverspeed />} />
        <Route path='overspeed/view-violation-map' element={<ViewViolationMap />} />
        <Route path='employees-on-board' element={<EmployeeOnboard />} />
        <Route path='destination-arrival-female' element={<DestinationArrivalFemale />} />
        <Route path='feedback' element={<FeedbackReport />} />
        <Route path='seat-occupancy' element={<SeatOccupancyReport />} />
        <Route path='emergency-alert' element={<EmergencyAlertReport />} />

        <Route path='punch-timelog' element={<PunchTimelog />} />
        <Route path='vehicle-arrival-time/1' element={<VehicalArrivalTime />} />
        <Route path='vehicle-arrival-time/2' element={<VehicalArrivalTime />} />
        <Route path='vehicle-arrival-time/3' element={<VehicalArrivalTime />} />
        <Route path='vehicle-arrival-time/4' element={<VehicalArrivalTime />} />
        <Route path='vehicle-arrival-time/5' element={<VehicalArrivalTime />} />
        {/* <Route path='stoppage-report' element={<Stopage />} />3 */}
      </Route>
      <Route path='/master'>
        <Route path='plants' element={<Plant />} />
        <Route path='departments' element={<Department />} />
        <Route path='user-permission' element={<UserPermission />} />
        <Route path='user-permission/create' element={<UserPermissionForm />} />
        <Route path='plant-in-time' element={<PlantInTime />} />
        <Route path='plant-in-time/create' element={<PlantInTimeForm />} />
        <Route path='plant-in-time/view' element={<PlantInTimeForm />} />
        <Route path='plant-in-time/edit' element={<PlantInTimeForm />} />
        <Route path='employee' element={<Employee />} />
        <Route path='employee/create' element={<EmployeeForm />} />
        <Route path='employee/edit' element={<EmployeeForm />} />
        <Route path='employee/view' element={<EmployeeForm />} />
        <Route path='vehicle' element={<Vehicle />} />
        <Route path='vehicle/create' element={<VehicleForm />} />
        <Route path='vehicle/edit' element={<VehicleForm />} />
        <Route path='vehicle/view' element={<VehicleForm />} />
        <Route path='driver' element={<Driver />} />
        <Route path='driver/create' element={<DriverForm />} />
        <Route path='driver/edit' element={<DriverForm />} />
        <Route path='driver/view' element={<DriverForm />} />

        <Route path='*' element={<div>404</div>} />
      </Route>
      <Route path='/management'>
        <Route path='announcements' element={<Announcement />} />
        <Route path='announcement/create' element={<AnnouncementForm />} />
        <Route path='announcement/view' element={<AnnouncementForm />} />
        <Route path='announcement/edit' element={<AnnouncementForm />} />
        <Route path='emergency-alerts' element={<EmergencyAlert />} />
        <Route path='emergency-alert/edit' element={<EmergencyAlertForm />} />
        <Route path='route-change-request' element={<RouteChange />} />
        <Route path='feedbacks' element={<Feedback />} />
        <Route path='feedback/edit' element={<FeedbackFrom />} />
        <Route path='feedback/view' element={<FeedbackFrom />} />
        <Route path='vehicle-route' element={<VehicleRoute />} />
        <Route path='vehicle-route/create' element={<VehicleRouteForm />} />
        <Route path='vehicle-route/view' element={<VehicleRouteForm />} />
        <Route path='vehicle-route/edit' element={<VehicleRouteForm />} />
        <Route path='vehicle-stop-point' element={<RouteStopPoint />} />
        <Route path='vehicle-stop-point/create' element={<RouteStopPointForm />} />
        <Route path='geofence' element={<Geofence />} />
        <Route path='geofence/create' element={<GeofenceCreate />} />
        <Route path='geofence/view' element={<GeofenceCreate />} />
        <Route path='geofence/edit' element={<GeofenceCreate />} />
      </Route>
    </Routes>
  );
}

export default DynamicRoute;
