import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchSeatOccupancyReport } from '../../../redux/vehicleReportSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'date', header: 'Date', render: (v) => (v ? moment(v).format('YYYY-MM-DD') : '-') },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (v) => v || '-' },
  { key: 'route_detail', header: 'Route Detail', render: (v) => v || '-' },
  { key: 'driver_name', header: 'Driver Name', render: (v) => v || '-' },
  { key: 'driver_number', header: 'Driver Number', render: (v) => v || '-' },
  { key: 'total_seats', header: 'Total Seats', render: (v) => (v != null ? v : '-') },
  { key: 'occupied', header: 'Occupied', render: (v) => v ?? '-' },
  {
    key: 'occupancy_rate',
    header: 'Occupancy Rate',
    render: (v) => (v ? `${v}${typeof v === 'number' ? '%' : ''}` : '-'),
  },
];

function SeatOccupancy() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { seatOccupancyReportData, loading, error } = useSelector((state) => state?.vehicleReport);
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes || {});

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id) {
      dispatch(fetchSeatOccupancyReport({ company_id, page: page + 1, limit })).then((res) => {
        if (res?.payload?.success)
          setFilteredData(Array.isArray(res.payload.data?.reports) ? res.payload.data.reports : []);
      });
    }
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

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'seat_occupancy_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'seat_occupancy_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchSeatOccupancyReport(buildApiPayload())).then((res) => {
      if (res?.payload?.success) {
        toast.success(res?.payload?.message);
        setFilteredData(Array.isArray(res?.payload?.data?.reports) ? res.payload.data.reports : []);
      } else {
        toast.error(res?.payload?.message);
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '' });
  };

  const tableData = Array.isArray(filteredData)
    ? filteredData.map((item) => ({ ...item, date: item.date ? moment(item.date).format('YYYY-MM-DD') : '-' }))
    : [];

  const totalCount =
    seatOccupancyReportData?.payload?.data?.pagination?.total ||
    seatOccupancyReportData?.data?.pagination?.total ||
    seatOccupancyReportData?.pagination?.total ||
    (seatOccupancyReportData && seatOccupancyReportData.pagination && seatOccupancyReportData.pagination.total) ||
    filteredData.length;

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Seat Occupancy Report</h1>
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

export default SeatOccupancy;
