import moment from 'moment-timezone';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchEmergencyReportAlert } from '../../../redux/emergencyReportAlertSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const toStr = (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? '-' : v);

const columns = [
  { key: 'created_at', header: 'Date', render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '-') },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_v, r) => toStr(r.vehicle_number) },
  { key: 'route_name', header: 'Route Details', render: (_v, r) => toStr(r.route_name) },
  { key: 'driver_name', header: 'Driver Name', render: (_v, r) => toStr(r.driver_name) },
  { key: 'driver_number', header: 'Driver Number', render: (_v, r) => toStr(r.driver_number) },
  { key: 'employee_name', header: 'Employee Name', render: (_v, r) => toStr(r.employee_name) },
  { key: 'employee_id', header: 'Employee ID', render: (_v, r) => toStr(r.employee_id) },
  { key: 'plant_name', header: 'Plant', render: (_v, r) => toStr(r.plant_name) },
  { key: 'department_name', header: 'Department', render: (_v, r) => toStr(r.department_name) },
  { key: 'latlong', header: 'Lat-Long', render: (_v, r) => r.latlong || '-' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_v, r) =>
      r.gmap ? (
        <a href={r.gmap} target='_blank' rel='noreferrer' className='text-blue-600 underline'>
          View
        </a>
      ) : (
        '-'
      ),
  },
  { key: 'title', header: 'Issue Raised', render: (_v, r) => toStr(r.title) },
  { key: 'action_taken', header: 'Action Note', render: (_v, r) => toStr(r.action_taken) },
  { key: 'updated_at', header: 'Update Date', render: (v) => (v ? moment(v).format('YYYY-MM-DD HH:mm:ss') : '-') },
];

const getLatLng = (i) => {
  const lat = i.latitude,
    lng = i.longitude;
  if (lat && lng && lat !== 'null' && lng !== 'null' && !isNaN(+lat) && !isNaN(+lng))
    return { latlong: `${lat}, ${lng}`, gmap: `https://maps.google.com/?q=${lat},${lng}` };
  return { latlong: '', gmap: '' };
};

function getDriver(i) {
  const d = i.driver || {};
  return {
    driver_name: d.name?.trim() || '-',
    driver_number: d.number != null && String(d.number).trim() !== '' ? d.number : '-',
  };
}

function getEmployee(i) {
  const employe = i.employe,
    name = employe?.name?.trim() || '-',
    id = employe?.employee_id?.trim() || '-';
  return { employee_name: name, employee_id: id };
}

function EmergencyAlert() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0),
    [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');
  const { emergencyReportAlertData, loading, error } = useSelector((s) => s?.emergencyReportAlert || {});
  const { routes: vehicleRoutes } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {}) || {};

  useEffect(() => {
    company_id && dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    company_id &&
      dispatch(fetchEmergencyReportAlert({ company_id, page: page + 1, limit })).then((res) =>
        setFilteredData(Array.isArray(res?.payload?.data) ? res.payload.data : [])
      );
  }, [dispatch, company_id, page, limit]);

  const buildApiPayload = () => {
    const p = { company_id, page: page + 1, limit };
    filterData.vehicles?.length && (p.vehicles = JSON.stringify(filterData.vehicles));
    filterData.routes?.length && (p.routes = JSON.stringify(filterData.routes));
    filterData.fromDate && (p.start = filterData.fromDate);
    filterData.toDate && (p.end = filterData.toDate);
    return p;
  };

  const tableData = Array.isArray(filteredData)
    ? filteredData.map((i) => ({
        created_at: i.created_at,
        vehicle_number: toStr(i.vehicle_number),
        route_name: toStr(i.route_name),
        ...getDriver(i),
        ...getEmployee(i),
        plant_name: toStr(i.plant_name),
        department_name: toStr(i.department_name),
        ...getLatLng(i),
        title: toStr(i.title),
        action_taken: toStr(i.action_taken),
        updated_at: toStr(i.updated_at),
      }))
    : [];

  const totalCount = emergencyReportAlertData?.pagination?.total || tableData.length;

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: tableData }),
      fileName: 'emergency_alert_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: tableData }),
      fileName: 'emergency_alert_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchEmergencyReportAlert(buildApiPayload())).then((res) =>
      setFilteredData(Array.isArray(res?.payload?.data) ? res.payload.data : [])
    );
  };

  const handleFormReset = () => setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Emergency Alerts Report (Total: {totalCount})</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={vehicleRoutes}
          routes={vehicleRoutes}
        />
      </form>
      <ReportTable
        columns={columns}
        data={tableData}
        loading={loading}
        error={error}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={totalCount}
      />
    </div>
  );
}

export default EmergencyAlert;
