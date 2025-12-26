import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchRouteViolation } from '../../../redux/geofenceSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  {
    key: 'date',
    header: 'Date',
    render: (value) => (value ? moment(value).format('YYYY-MM-DD') : '-'),
  },
  { key: 'vehicle_number', header: 'Vehicle Number' },
  { key: 'route_details', header: 'Route Details' },
  {
    key: 'driver_name',
    header: 'Driver Name',
  },
  {
    key: 'driver_number',
    header: 'Driver Number',
  },
  {
    key: 'violation_distance',
    header: 'Violation Distance',
    render: (value) => (value ? `${value} km` : '-'),
  },
];

function RouteViolation() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { loading, error } = useSelector((state) => state?.geofence);
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes || {});

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    return payload;
  };

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchRouteViolation({ company_id, page: page + 1, limit })).then((res) => {
        if (res?.payload?.success) {
          setFilteredData(res?.payload?.data || []);
        }
      });
  }, [dispatch, company_id, page, limit]);

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'route_violation_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'route_violation_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchRouteViolation({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
      if (res?.payload?.success) {
        toast.success('Data fetched successfully');
        setFilteredData(res?.payload?.data || []);
      } else {
        toast.error('Failed to fetch data');
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  };

  const totalCount = filteredData.length; // API response structure doesn't seem to have total count yet, or it's implicitly all data? Assuming all data for now or pagination needs fix if API supports it.

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Route Violation Report</h1>
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

export default RouteViolation;
