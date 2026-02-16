import moment from 'moment-timezone';
import { IoArrowBack } from 'react-icons/io5';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchOverspeedReportDetails } from '../../../redux/vehicleReportSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import { formatDuration } from '../../../utils/formatters';

const columns = [
  {
    key: 'date_time',
    header: 'Date & Time',
    render: (_, row) => (row?.date_time ? moment(row.date_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: () => 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, row) => row?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, row) => row?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, row) => row?.driver_name ?? '-' },
  {
    key: 'driver_contact_number',
    header: 'Driver Contact Number',
    render: (_, row) => row?.driver_contact_number ?? '-',
  },
  { key: 'max_speed', header: 'Over Speed', render: (_, row) => row?.max_speed ?? '-' },
  {
    key: 'over_speed_duration',
    header: 'Over Speed Duration',
    render: (_, row) => formatDuration(row?.over_speed_duration),
  },
  {
    key: 'max_speed_lat_long',
    header: 'Max Over Speed Lat-Long',
    render: (_, row) => row?.max_speed_lat_long ?? '-',
  },
  { key: 'start_lat_long', header: 'Start Lat-Long', render: (_, row) => row?.start_lat_long ?? '-' },
  { key: 'end_lat_long', header: 'End Lat-Long', render: (_, row) => row?.end_lat_long ?? '-' },
  { key: 'nearest_location', header: 'Nearest Location', render: (_, row) => row?.nearest_location ?? '-' },
  {
    key: 'start_gmap',
    header: 'G-Map',
    render: (_, row) => {
      if (!row?.start_gmap_url || row.start_gmap_url.includes('null')) return '-';
      return (
        <a
          href={row.start_gmap_url}
          target='_blank'
          className='text-blue-700 hover:underline'
          rel='noopener noreferrer'>
          View
        </a>
      );
    },
  },
  { key: 'start_odometer', header: 'Start Odometer', render: (_, row) => row?.start_odometer ?? '-' },
  { key: 'end_odometer', header: 'End Odometer', render: (_, row) => row?.end_odometer ?? '-' },
  { key: 'trip_distance', header: 'Distance', render: (_, row) => row?.trip_distance ?? '-' },
];

function OverspeedReportDetails() {
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

  const company_id = searchParams.get('company_id') || localStorage.getItem('company_id');

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    dispatch(
      fetchOverspeedReportDetails({
        id,
        company_id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: page + 1,
        limit,
      }),
    ).then((res) => {
      setLoading(false);
      if (res?.payload?.success) {
        // Handle nested data structure: res.payload.data.data contains the records
        const responseData = res?.payload?.data;
        const items = responseData?.data || res?.payload?.overspeedData || [];
        const formattedItems = (Array.isArray(items) ? items : [items]).map((item) => ({
          ...item,
          start_lat_long:
            item.start_latitude && item.start_longitude
              ? `${parseFloat(item.start_latitude).toFixed(6)}, ${parseFloat(item.start_longitude).toFixed(6)}`
              : item.start_lat_long || '-',
          end_lat_long:
            item.end_latitude && item.end_longitude
              ? `${parseFloat(item.end_latitude).toFixed(6)}, ${parseFloat(item.end_longitude).toFixed(6)}`
              : item.end_lat_long || '-',
          max_speed_lat_long:
            item.max_speed_latitude && item.max_speed_longitude
              ? `${parseFloat(item.max_speed_latitude).toFixed(6)}, ${parseFloat(item.max_speed_longitude).toFixed(6)}`
              : item.max_speed_lat_long || '-',
        }));
        setData(formattedItems);
        // Pagination from data.pagination or root level pagination
        const pagination = responseData?.pagination || res?.payload?.pagination;
        setTotalCount(pagination?.total || items.length || 0);
      } else {
        setData([]);
        setTotalCount(0);
      }
    });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [id, page, limit]);

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
      fetchOverspeedReportDetails({
        id,
        company_id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const responseData = res?.payload?.data;
    const allData = responseData?.data || res?.payload?.overspeedData || [];
    exportToExcel({
      columns,
      rows: buildExportRows({
        columns,
        data: (Array.isArray(allData) ? allData : [allData]).map((r) => ({
          ...r,
          over_speed_duration: formatDuration(r.over_speed_duration),
        })),
      }),
      fileName: 'overspeed_details.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(
      fetchOverspeedReportDetails({
        id,
        company_id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const responseData = res?.payload?.data;
    const allData = responseData?.data || res?.payload?.overspeedData || [];
    exportToPDF({
      columns,
      rows: buildExportRows({
        columns,
        data: (Array.isArray(allData) ? allData : [allData]).map((r) => ({
          ...r,
          over_speed_duration: formatDuration(r.over_speed_duration),
        })),
      }),
      fileName: 'overspeed_details.pdf',
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
          <h1 className='text-2xl font-bold text-[#07163d]'>Over Speed Details (Total: {totalCount})</h1>
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

export default OverspeedReportDetails;
