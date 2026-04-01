import moment from 'moment-timezone';
import { IoArrowBack } from 'react-icons/io5';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchRouteViolationDetails } from '../../../redux/geofenceSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'date', header: 'Date', render: (value) => (value ? moment(value).format('YYYY-MM-DD') : '-') },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (v) => v ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (v) => v ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (v) => v ?? '-' },
  { key: 'driver_number', header: 'Driver Number', render: (v) => v ?? '-' },
  {
    key: 'violation_start_date',
    header: 'Start Date',
    render: (_, row) => (row?.violation_start_date ? row.violation_start_date : '-'),
  },
  {
    key: 'violation_start_time_only',
    header: 'Start Time',
    render: (_, row) => (row?.violation_start_time_only ? row.violation_start_time_only : '-'),
  },
  { key: 'violation_start_lat_long', header: 'Violation Start Lat-Long', render: (v) => v ?? '-' },
  {
    key: 'violation_start_gmap',
    header: 'Violation Start G-Map',
    render: (_, row) => {
      if (!row?.start_gmap_url) return '-';
      return (
        <a
          href={row.start_gmap_url}
          target='_blank'
          className='text-blue-700 hover:underline'
          rel='noopener noreferrer'>
          Google-Map
        </a>
      );
    },
  },
  {
    key: 'violation_end_date',
    header: 'End Date',
    render: (_, row) => (row?.violation_end_date ? row.violation_end_date : '-'),
  },
  {
    key: 'violation_end_time_only',
    header: 'End Time',
    render: (_, row) => (row?.violation_end_time_only ? row.violation_end_time_only : '-'),
  },
  { key: 'violation_end_lat_long', header: 'Violation End Lat-Long', render: (v) => v ?? '-' },
  {
    key: 'violation_end_gmap',
    header: 'Violation End G-Map',
    render: (_, row) => {
      if (!row?.end_gmap_url) return '-';
      return (
        <a href={row.end_gmap_url} target='_blank' className='text-blue-700 hover:underline' rel='noopener noreferrer'>
          Google-Map
        </a>
      );
    },
  },
  { key: 'violation_distance', header: 'Violation Distance', render: (value) => (value ? `${value} km` : '-') },
];

function RouteViolationDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState({
    fromDate: searchParams.get('from_date') || '',
    toDate: searchParams.get('to_date') || '',
  });

  const formatData = (items) =>
    items.map((item, i) => ({
      id: item.id || i + 1,
      date: item.date ?? '-',
      vehicle_number: item.vehicle_number ?? '-',
      route_details: item.route_details ?? item.route_name ?? '-',
      driver_name: item.driver_name ?? '-',
      driver_number: item.driver_number ?? item.driver_phone ?? '-',
      violation_start_date: item.violation_start_time
        ? moment(item.violation_start_time, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('YYYY-MM-DD')
        : '-',
      violation_start_time_only: item.violation_start_time
        ? moment(item.violation_start_time, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('hh:mm:ss A')
        : '-',
      violation_start_time: item.violation_start_time ?? item.start_time ?? '-',
      violation_start_lat_long:
        item.violation_start_lat && item.violation_start_long
          ? `${item.violation_start_lat}, ${item.violation_start_long}`
          : '-',
      start_gmap_url: item.start_gmap_url,
      violation_end_date: item.violation_end_time
        ? moment(item.violation_end_time, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('YYYY-MM-DD')
        : '-',
      violation_end_time_only: item.violation_end_time
        ? moment(item.violation_end_time, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('hh:mm:ss A')
        : '-',
      violation_end_time: item.violation_end_time ?? item.end_time ?? '-',
      violation_end_lat_long:
        item.violation_end_lat && item.violation_end_long
          ? `${item.violation_end_lat}, ${item.violation_end_long}`
          : '-',
      end_gmap_url: item.end_gmap_url,
      violation_distance: item.violation_distance ?? '-',
    }));

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    dispatch(
      fetchRouteViolationDetails({
        id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: page + 1,
        limit,
      }),
    ).then((res) => {
      setLoading(false);
      if (res?.payload?.success) {
        const responseData = res?.payload?.data || [];
        // Handle if responseData is array (direct structure) or object with data/pagination
        const items = Array.isArray(responseData) ? responseData : responseData.data || [];
        setData(formatData(items));
        const pagination = res?.payload?.pagination || responseData.pagination;
        setTotalCount(pagination?.total || items.length || 0);
      } else {
        setData([]);
        setTotalCount(0);
      }
    });
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
    // eslint-disable-next-line
  }, [id]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    const params = new URLSearchParams(searchParams);
    params.set('from_date', filterData.fromDate);
    params.set('to_date', filterData.toDate);
    setSearchParams(params);
    fetchData();
    toast.success('Filter applied');
  };

  const handleFormReset = () => {
    setFilterData({ fromDate: '', toDate: '' });
    setPage(0);
  };

  const handleExport = async () => {
    const res = await dispatch(
      fetchRouteViolationDetails({
        id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const responseData = res?.payload?.data || [];
    const items = Array.isArray(responseData) ? responseData : responseData.data || [];
    const allData = formatData(items);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'route_violation_details.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(
      fetchRouteViolationDetails({
        id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const responseData = res?.payload?.data || [];
    const items = Array.isArray(responseData) ? responseData : responseData.data || [];
    const allData = formatData(items);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'route_violation_details.pdf',
      orientation: 'landscape',
    });
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
            <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
            Back
          </button>
          <h1 className='text-2xl font-bold text-[#07163d]'>Route Violation Details (Total: {totalCount})</h1>
        </div>
      </div>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          detailsPage={true}
        />
      </form>
      <ReportTable
        columns={columns}
        data={data}
        loading={loading}
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

export default RouteViolationDetails;
