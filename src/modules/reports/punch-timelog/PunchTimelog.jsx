import moment from 'moment-timezone';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlants } from '../../../redux/plantSlice';
import { useEffect, useState, useCallback } from 'react';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchDepartments } from '../../../redux/departmentSlice';
import { fetchPuchLogReport } from '../../../redux/punchInOutSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchVehicles } from '../../../redux/vehiclesSlice';
import { fetchAllEmployeeDetails } from '../../../redux/employeeSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'punch_date', header: 'Date', render: (_v, r) => r.punch_date || '-' },
  { key: 'punch_time_only', header: 'Time', render: (_v, r) => r.punch_time_only || '-' },
  { key: 'punch_status', header: 'Punch Status', render: (v) => (v === true ? 'IN' : v === false ? 'OUT' : '-') },
  {
    key: 'employee_name',
    header: 'Employee Name',
    render: (_v, r) => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-',
  },
  { key: 'employee_id', header: 'Employee ID', render: (_v, r) => r.emp_code || '-' },
  { key: 'punch_id', header: 'RFID Tag', render: (_v, r) => r.punch_id || '-' },
  { key: 'department_name', header: 'Department', render: (_v, r) => r.department_name || '-' },
  { key: 'plant_name', header: 'Plant', render: (_v, r) => r.plant_name || '-' },
  { key: 'vehicle_route_name', header: 'Vehicle Route ID', render: (_v, r) => r.vehicle_route_name || '-' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_v, r) =>
      r.latitude && r.longitude ? (
        <a
          href={`https://maps.google.com/?q=${parseFloat(r.latitude)},${parseFloat(r.longitude)}`}
          target='_blank'
          className='text-blue-700'
          rel='noopener noreferrer'>
          G-Map
        </a>
      ) : (
        '-'
      ),
  },
];

function PunchTimelog() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({
    routes: [],
    vehicles: [],
    fromDate: '',
    toDate: '',
    departments: [],
    employees: [],
    plants: [],
  });
  const [filteredData, setFilteredData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const { departments } = useSelector((s) => s.department);
  const { employes: employees } = useSelector((s) => s.employee.getAllEmployeeDetails);
  const { routes } = useSelector((s) => s.vehicleRoute?.vehicleRoutes || {});
  const { vehicles } = useSelector((s) => s.vehicles || {});
  const { plants } = useSelector((s) => s.plant);
  const { error, loading } = useSelector((s) => s.punchInOut);

  useEffect(() => {
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchDepartments({ limit: 10 }));
    dispatch(fetchVehicleRoutes({ limit: 150 }));
    dispatch(fetchVehicles({ limit: 150 }));
    dispatch(fetchPlants({ limit: 50 }));
    if (company_id) dispatch(fetchAllEmployeeDetails({ company_id, limit: 3500 }));
  }, [dispatch]);

  const buildApiPayload = useCallback(
    (fetchLimit) => {
      const {
        fromDate,
        toDate,
        departments,
        employees: selectedEmployees,
        routes,
        vehicles: selectedVehicles,
        plants,
      } = filterData;
      const company_id = localStorage.getItem('company_id');
      const payload = { company_id };

      if (departments?.length) payload.departments = JSON.stringify(departments);
      if (selectedEmployees?.length === employees?.length && selectedEmployees?.length > 0) {
        payload.employees = 'all';
      } else if (selectedEmployees?.length) {
        payload.employees = JSON.stringify(selectedEmployees);
      }
      if (plants?.length) payload.plants = JSON.stringify(plants);
      payload.routes = JSON.stringify(Array.isArray(routes) ? routes : []);
      payload.vehicles =
        selectedVehicles?.length === vehicles?.length && selectedVehicles?.length > 0
          ? 'all'
          : JSON.stringify(Array.isArray(selectedVehicles) ? selectedVehicles : []);

      if (fromDate) payload.from_date = fromDate;
      if (toDate) payload.to_date = toDate;
      if (fetchLimit) payload.limit = fetchLimit;
      return payload;
    },
    [filterData, employees?.length, vehicles?.length],
  );

  const formatRecords = useCallback((records) => {
    return (records || []).map((item) => ({
      ...item,
      punch_date: item.punch_time ? moment(item.punch_time).format('YYYY-MM-DD') : '-',
      punch_time_only: item.punch_time ? moment(item.punch_time).format('hh:mm:ss A') : '-',
    }));
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      dispatch(fetchPuchLogReport({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
        setFilteredData(formatRecords(res?.payload?.data || []));
        setTotalCount(res?.payload?.pagination?.total || res?.payload?.data?.length || 0);
      });
    });
    // eslint-disable-next-line
  }, [page, limit, formatRecords]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchPuchLogReport({ ...buildApiPayload(), page: 1, limit })).then((res) => {
      setFilteredData(formatRecords(res?.payload?.data || []));
      setTotalCount(res?.payload?.pagination?.total || res?.payload?.data?.length || 0);
    });
  };

  const handleFormReset = () => {
    const cleared = { routes: [], vehicles: [], fromDate: '', toDate: '', departments: [], employees: [], plants: [] };
    setFilterData(cleared);
    setPage(0);
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchPuchLogReport({ company_id, page: 1, limit })).then((res) => {
      setFilteredData(formatRecords(res?.payload?.data || []));
      setTotalCount(res?.payload?.pagination?.total || res?.payload?.data?.length || 0);
    });
  };

  const handleExport = async () => {
    const res = await dispatch(fetchPuchLogReport({ ...buildApiPayload(totalCount), page: 1 }));
    const allRecords = formatRecords(res?.payload?.data || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: allRecords }),
      fileName: 'punch_timelog_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchPuchLogReport({ ...buildApiPayload(totalCount), page: 1 }));
    const allRecords = formatRecords(res?.payload?.data || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: allRecords }),
      fileName: 'punch_timelog_report.pdf',
      orientation: 'landscape',
    });
  };

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Punch Timelog Report (Total: {totalCount})</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          routes={routes}
          departments={departments || []}
          vehicles={vehicles || []}
          employees={employees || []}
          plants={plants || []}
          report={true}
        />
      </form>
      <ReportTable
        columns={columns}
        data={filteredData}
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

export default PunchTimelog;
