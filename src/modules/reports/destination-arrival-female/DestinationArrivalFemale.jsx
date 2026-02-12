import moment from 'moment-timezone';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlants } from '../../../redux/plantSlice';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchDepartments } from '../../../redux/departmentSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import { fetchDestinationArrivalFemale, fetchAllEmployeeDetails } from '../../../redux/employeeSlice';

const toStr = (v) => (v == null || (typeof v === 'string' && v.trim() === '') ? '-' : v);

const getLatLng = (i) => {
  const lat = i.latitude,
    lng = i.longitude;
  if (lat && lng && lat !== 'null' && lng !== 'null' && !isNaN(+lat) && !isNaN(+lng))
    return { latLong: `${lat}, ${lng}`, gmap: `https://maps.google.com/?q=${lat},${lng}` };
  return { latLong: '-', gmap: '' };
};

const columns = [
  { key: 'dateTime', header: 'Date' },
  { key: 'vehicleNo', header: 'Vehicle No.' },
  { key: 'routeNo', header: 'Route Details' },
  { key: 'driverName', header: 'Driver Name' },
  { key: 'contactNumber', header: 'Driver Contact Number' },
  { key: 'employeeName', header: 'Female Employee Name' },
  { key: 'employeeId', header: 'Employee ID' },
  { key: 'plant', header: 'Plant' },
  { key: 'department', header: 'Department' },
  { key: 'latLong', header: 'Lat-Long' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_v, row) =>
      row?.gmap ? (
        <a href={row.gmap} target='_blank' className='text-blue-700 underline' rel='noopener noreferrer'>
          G-Map
        </a>
      ) : (
        '-'
      ),
  },
  { key: 'arrivalTime', header: 'Arrival Time @ Destination' },
];

function DestinationArrivalFemale() {
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
  const { routes } = useSelector((s) => s.vehicleRoute.vehicleRoutes);
  const { plants } = useSelector((s) => s.plant);

  useEffect(() => {
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchDepartments({ limit: 10 }));
    dispatch(fetchVehicleRoutes({ limit: 150 }));
    dispatch(fetchPlants({ limit: 50 }));
    if (company_id) dispatch(fetchAllEmployeeDetails({ company_id, limit: 3500 }));
  }, [dispatch]);

  const mapResponseData = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((i) => ({
      dateTime: i.arrival_time ? moment(i.arrival_time).format('YYYY-MM-DD') : '-',
      vehicleNo: toStr(i.vehicle_number),
      routeNo: toStr(i.route_name),
      driverName: toStr(i.driver_name),
      contactNumber: toStr(i.driver_phone),
      employeeName: toStr(i.female_employee_name),
      employeeId: toStr(i.employee_id),
      plant: toStr(i.plant_name),
      department: toStr(i.department_name),
      ...getLatLng(i),
      arrivalTime: i.arrival_time ? moment(i.arrival_time).format('HH:mm:ss') : '-',
    }));
  };

  const buildApiPayload = () => {
    const { fromDate, toDate, departments, employees, routes, vehicles, plants } = filterData;
    const company_id = localStorage.getItem('company_id');
    const payload = { company_id };

    payload.departments = departments?.length ? JSON.stringify(departments) : undefined;
    payload.employees = employees?.length ? JSON.stringify(employees) : undefined;
    payload.plants = plants?.length ? JSON.stringify(plants) : undefined;
    payload.routes = JSON.stringify(Array.isArray(routes) ? routes : []);
    payload.vehicles = JSON.stringify(Array.isArray(vehicles) ? vehicles : []);

    if (fromDate) payload.from_date = fromDate;
    if (toDate) payload.to_date = toDate;
    return payload;
  };

  useEffect(() => {
    dispatch(fetchDestinationArrivalFemale({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
      setFilteredData(mapResponseData(res?.payload?.arrivals));
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
    // eslint-disable-next-line
  }, [page, limit]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchDestinationArrivalFemale({ ...buildApiPayload(), page: 1, limit })).then((res) => {
      setFilteredData(mapResponseData(res?.payload?.arrivals));
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
  };

  const handleFormReset = () => {
    const cleared = {
      routes: [],
      vehicles: [],
      fromDate: '',
      toDate: '',
      departments: [],
      employees: [],
      plants: [],
    };
    setFilterData(cleared);
    setPage(0);
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchDestinationArrivalFemale({ company_id, page: 1, limit })).then((res) => {
      setFilteredData(mapResponseData(res?.payload?.arrivals));
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
  };

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'destination_arrival_female.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'destination_arrival_female.pdf',
      orientation: 'landscape',
    });

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>
        Arrival History Of Female Employees @ Destination (Total: {totalCount})
      </h1>
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
          employees={employees || []}
          plants={plants || []}
          report={true}
        />
      </form>
      <ReportTable
        columns={columns}
        data={filteredData}
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

export default DestinationArrivalFemale;
