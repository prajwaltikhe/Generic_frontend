import moment from 'moment-timezone';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchPlants } from '../../../redux/plantSlice';
import { fetchDepartments } from '../../../redux/departmentSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchEmployeeOnboard, fetchAllEmployeeDetails } from '../../../redux/employeeSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'date', header: 'Date', render: (_v, r) => (r.date ? moment(r.date).format('YYYY-MM-DD') : '-') },
  {
    key: 'boarding_in',
    header: 'Boarding In',
    render: (_v, r) => (r.boarding_in ? moment(r.boarding_in).format('HH:mm:ss') : '-'),
  },
  {
    key: 'boarding_out',
    header: 'Boarding Out',
    render: (_v, r) => (r.boarding_out ? moment(r.boarding_out).format('HH:mm:ss') : '-'),
  },
  { key: 'employee_name', header: 'Employee Name', render: (_v, r) => (r.employee_name ? r.employee_name : '-') },
  { key: 'employee_id', header: 'Employee ID', render: (_v, r) => (r.employee_id ? r.employee_id : '-') },
  { key: 'department', header: 'Department', render: (_v, r) => (r.department ? r.department : '-') },
  { key: 'vehicle_route_name', header: 'Vehicle Route ID', render: (_v, r) => r.vehicle_route_name || '-' },
  { key: 'source', header: 'Source', render: (_v, r) => (r.vehicle_source ? r.vehicle_source : '-') },
  { key: 'destination', header: 'Destination', render: (_v, r) => (r.destination ? r.destination : '-') },
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
  {
    key: 'nearest_location',
    header: 'Nearest Location',
    render: (_v, r) => (r.nearest_location ? r.nearest_location : '-'),
  },
  { key: 'driver_name', header: 'Driver Name', render: (_v, r) => (r.driver_name ? r.driver_name : '-') },
  {
    key: 'driver_contact',
    header: 'Driver Contact Number',
    render: (_v, r) => (r.driver_contact_number ? r.driver_contact_number : '-'),
  },
];

function EmployeeOnboard() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({
    routes: [],
    vehicles: [],
    fromDate: '',
    toDate: '',
    departments: [],
    employee_ids: [],
    plants: [],
  });
  const [filteredData, setFilteredData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const { departments } = useSelector((s) => s.department);
  const { employes: employees } = useSelector((s) => s.employee.getAllEmployeeDetails);
  const { error, loading } = useSelector((s) => s.employee);
  const { plants } = useSelector((s) => s.plant);
  const { routes } = useSelector((s) => s.vehicleRoute.vehicleRoutes);

  useEffect(() => {
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchDepartments({ limit: 10 }));
    dispatch(fetchVehicleRoutes({ limit: 150 }));
    dispatch(fetchPlants({ limit: 50 }));
    if (company_id) dispatch(fetchAllEmployeeDetails({ company_id, limit: 3500 }));
  }, [dispatch]);

  const buildApiPayload = (fetchLimit) => {
    const { fromDate, toDate, departments, employee_ids, routes, vehicles, plants } = filterData;
    const company_id = localStorage.getItem('company_id');
    const payload = { company_id };

    payload.departments = departments?.length ? JSON.stringify(departments) : undefined;
    payload.employee_ids = employee_ids?.length ? JSON.stringify(employee_ids) : undefined;
    payload.plants = plants?.length ? JSON.stringify(plants) : undefined;
    payload.routes = JSON.stringify(Array.isArray(routes) ? routes : []);
    payload.vehicles = JSON.stringify(Array.isArray(vehicles) ? vehicles : []);

    if (fromDate) payload.from_date = fromDate;
    if (toDate) payload.to_date = toDate;
    if (fetchLimit) payload.limit = fetchLimit;
    return payload;
  };

  useEffect(() => {
    dispatch(fetchEmployeeOnboard({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
      setFilteredData([].concat(res?.payload?.records || []));
      setTotalCount(res?.payload?.pagination?.total || res?.payload?.records?.length || 0);
    });
    // eslint-disable-next-line
  }, [page, limit]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchEmployeeOnboard({ ...buildApiPayload(), page: 1, limit })).then((res) => {
      setFilteredData([].concat(res?.payload?.records || []));
      setTotalCount(res?.payload?.pagination?.total || res?.payload?.records?.length || 0);
    });
  };

  const handleFormReset = () => {
    const cleared = {
      routes: [],
      vehicles: [],
      fromDate: '',
      toDate: '',
      departments: [],
      employee_ids: [],
      plants: [],
    };
    setFilterData(cleared);
    setPage(0);
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchEmployeeOnboard({ company_id, page: 1, limit })).then((res) => {
      setFilteredData([].concat(res?.payload?.records || []));
      setTotalCount(res?.payload?.pagination?.total || res?.payload?.records?.length || 0);
    });
  };

  const handleExport = async () => {
    const res = dispatch(fetchEmployeeOnboard({ ...buildApiPayload(totalCount), page: 1 }));
    const allRecords = [].concat(res?.payload?.records || []);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: allRecords }),
      fileName: 'employee_onboard_report.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = dispatch(fetchEmployeeOnboard({ ...buildApiPayload(totalCount), page: 1 }));
    const allRecords = [].concat(res?.payload?.records || []);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: allRecords }),
      fileName: 'employee_onboard_report.pdf',
      orientation: 'landscape',
    });
  };

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Employees On-Board Report (Total: {totalCount})</h1>
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
          vehicles={routes || []}
          employeeIds={employees || []}
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

export default EmployeeOnboard;
