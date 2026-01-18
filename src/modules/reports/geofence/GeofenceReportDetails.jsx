import moment from 'moment-timezone';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import { fetchGeofenceReportDetails } from '../../../redux/geofenceSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const parsePosition = (position) => {
  if (!position) return null;
  const match = position.match(/\{([^,]+),([^}]+)\}/);
  if (match) {
    const lng = match[1].trim();
    const lat = match[2].trim();
    return { lat, lng, display: `${lat}, ${lng}` };
  }
  return null;
};

const columns = [
  {
    key: 'date',
    header: 'Date',
    render: (_, row) => (row?.date ? moment(row.date).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, row) => row?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, row) => row?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, row) => row?.driver_name ?? '-' },
  { key: 'driver_number', header: 'Driver Number', render: (_, row) => row?.driver_number ?? '-' },
  { key: 'geofence_name', header: 'Geofence Name', render: (_, row) => row?.geofence_name ?? '-' },
  { key: 'geofence_type', header: 'Geofence Type', render: (_, row) => row?.geofence_type ?? '-' },
  {
    key: 'fence_entry_time',
    header: 'Fence Entry Time',
    render: (_, row) => (row?.fence_entry_time ? moment(row.fence_entry_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  {
    key: 'entry_position_gmap',
    header: 'Entry Position G-Map',
    render: (_, row) => {
      const pos = row?.entry_position_parsed;
      if (!pos) return '-';
      return (
        <a
          href={`https://maps.google.com/?q=${pos.lat},${pos.lng}`}
          target='_blank'
          className='text-blue-700 hover:underline'
          rel='noopener noreferrer'>
          View
        </a>
      );
    },
  },
  {
    key: 'fence_exit_time',
    header: 'Fence Exit Time',
    render: (_, row) => (row?.fence_exit_time ? moment(row.fence_exit_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  {
    key: 'exit_position_gmap',
    header: 'Exit Position G-Map',
    render: (_, row) => {
      const pos = row?.exit_position_parsed;
      if (!pos) return '-';
      return (
        <a
          href={`https://maps.google.com/?q=${pos.lat},${pos.lng}`}
          target='_blank'
          className='text-blue-700 hover:underline'
          rel='noopener noreferrer'>
          View
        </a>
      );
    },
  },
];

function GeofenceReportDetails() {
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

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    dispatch(
      fetchGeofenceReportDetails({
        id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: page + 1,
        limit,
      }),
    ).then((res) => {
      setLoading(false);
      if (res?.payload?.success) {
        // Handle nested data structure: res.payload.data.reports contains the records
        const responseData = res?.payload?.data;
        const items = responseData?.reports || res?.payload?.reports || [];
        setData(formatData(Array.isArray(items) ? items : [items]));
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

  const formatData = (items) =>
    items.map((item, i) => ({
      id: item.id || item._id || i + 1,
      date: item.date ?? null,
      vehicle_number: item.vehicle_number ?? '-',
      route_details: item.route_name ?? item.route_details ?? '-',
      driver_name:
        [item.driver_first_name, item.driver_last_name].filter(Boolean).join(' ').trim() || item.driver_name || '-',
      driver_number: item.driver_phone ?? item.driver_number ?? '-',
      geofence_name: item.geofence_name ?? '-',
      geofence_type: item.geofence_type ?? '-',
      fence_entry_time: item.entry_time ?? item.fence_entry_time ?? null,
      entry_position_parsed: parsePosition(item.entry_position),
      fence_exit_time: item.exit_time ?? item.fence_exit_time ?? null,
      exit_position_parsed: parsePosition(item.exit_position),
      duration_in_fence: item.duration_in_fence ?? '-',
    }));

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
      fetchGeofenceReportDetails({
        id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const responseData = res?.payload?.data;
    const allItems = responseData?.reports || res?.payload?.reports || [];
    const allData = formatData(allItems);
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'geofence_entry_exit_details.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(
      fetchGeofenceReportDetails({
        id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const responseData = res?.payload?.data;
    const allItems = responseData?.reports || res?.payload?.reports || [];
    const allData = formatData(allItems);
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'geofence_entry_exit_details.pdf',
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
            className='text-gray-600 hover:text-gray-800 font-medium text-sm flex items-center gap-1'>
            ← Back
          </button>
          <h1 className='text-2xl font-bold text-[#07163d]'>GeoFence Entry-Exit Details (Total: {totalCount})</h1>
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

export default GeofenceReportDetails;
