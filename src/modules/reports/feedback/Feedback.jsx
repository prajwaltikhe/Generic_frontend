import moment from 'moment-timezone';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchFeedbackReport } from '../../../redux/feedBackReportSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchVehicles } from '../../../redux/vehiclesSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'date', header: 'Date', render: (value) => value || '-' },
  { key: 'time', header: 'Time', render: (value) => value || '-' },
  { key: 'vehicleNumber', header: 'Vehicle Number', render: (_v, row) => row?.vehicleNumber || '-' },
  { key: 'routeDetails', header: 'Route Details', render: (_v, row) => row?.routeDetails || '-' },
  { key: 'driverName', header: 'Driver Name', render: (_v, row) => row?.driverName || '-' },
  { key: 'driverNumber', header: 'Driver Number', render: (_v, row) => row?.driverNumber || '-' },
  { key: 'employeeName', header: 'Employee Name', render: (_v, row) => row?.employeeName || '-' },
  { key: 'employeeId', header: 'Employee Id', render: (_v, row) => row?.employeeId || '-' },
  { key: 'givenScore', header: 'Given Score', render: (_v, row) => row?.givenScore ?? '-' },
  { key: 'feedback', header: 'Feedback', render: (_v, row) => row?.feedback || '-' },
];

function Feedback() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { feedbackReportData, loading, error } = useSelector((state) => state?.feedbackReport || {});
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes || {});
  const { vehicles } = useSelector((state) => state?.vehicles || {});

  useEffect(() => {
    Promise.resolve().then(() => {
      if (company_id) {
        dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
        dispatch(fetchVehicles({ limit: 150 }));
      }
    });
  }, [dispatch, company_id]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (company_id) {
        dispatch(fetchFeedbackReport({ company_id, page: page + 1, limit })).then((res) => {
          setFilteredData(Array.isArray(res?.payload?.feedbacks) ? res.payload.feedbacks : []);
        });
      }
    });
  }, [dispatch, company_id, page, limit]);

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    payload.page = page + 1;
    payload.limit = limit;
    return payload;
  };

  const tableData = Array.isArray(filteredData)
    ? filteredData.map((item) => ({
        date: item.created_at ? moment(item.created_at).format('YYYY-MM-DD') : '-',
        time: item.created_at ? moment(item.created_at).format('hh:mm:ss A') : '-',
        vehicleNumber: item.vehicle?.number || '-',
        routeDetails: item.route?.name || '-',
        driverName: item.driver ? [item.driver.first_name, item.driver.last_name].filter(Boolean).join(' ') : '-',
        driverNumber: item.driver?.phone_number || '-',
        employeeName: item.employee
          ? [item.employee.first_name, item.employee.last_name].filter(Boolean).join(' ')
          : '-',
        employeeId: item.employee?.employee_id || '-',
        givenScore: typeof item.rating === 'number' ? item.rating.toFixed(1) : '-',
        feedback: item.message || '-',
      }))
    : [];

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: tableData }),
      fileName: 'feedback_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: tableData }),
      fileName: 'feedback_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchFeedbackReport(buildApiPayload())).then((res) => {
      setFilteredData(Array.isArray(res?.payload?.feedbacks) ? res.payload.feedbacks : []);
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });
    setPage(0);
  };

  const totalCount = feedbackReportData?.pagination?.total || filteredData.length;

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Feedback Report</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={vehicles}
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

export default Feedback;
