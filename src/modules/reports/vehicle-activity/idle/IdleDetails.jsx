import moment from 'moment';
import { IoArrowBack } from 'react-icons/io5';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import FilterOption from '../../../../components/FilterOption';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchMovementDetails } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';
import { formatDuration } from '../../../../utils/formatters';

const columns = [
  {
    key: 'date_time',
    header: 'Date & Time',
    render: (_, r) => (r?.date_time ? moment(r.date_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, r) => r?.vehicle_type ?? 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, r) => r?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, r) => r?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, r) => r?.driver_name ?? '-' },
  { key: 'driver_contact_number', header: 'Driver Contact Number', render: (_, r) => r?.driver_contact_number ?? '-' },
  {
    key: 'start_time',
    header: 'Start Time',
    render: (_, r) =>
      r?.start_time ? moment(r.start_time, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('HH:mm:ss') : '-',
  },
  {
    key: 'end_time',
    header: 'End Time',
    render: (_, r) =>
      r?.end_time ? moment(r.end_time, ['HH:mm:ss', 'HH:mm', 'YYYY-MM-DD HH:mm:ss']).format('HH:mm:ss') : '-',
  },
  { key: 'duration', header: 'Duration', render: (_, r) => formatDuration(r?.duration) },
  { key: 'lat_long', header: 'Lat-Long', render: (_, r) => r?.lat_long ?? '-' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_, r) => {
      if (!r?.gmap) return '-';
      return (
        <a href={r.gmap} target='_blank' className='text-blue-700 hover:underline' rel='noopener noreferrer'>
          Google-Map
        </a>
      );
    },
  },
];

function IdleDetails() {
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
    fromDate: searchParams.get('from_date') || moment().format('YYYY-MM-DD'),
    toDate: searchParams.get('to_date') || moment().add(1, 'days').format('YYYY-MM-DD'),
  });

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    dispatch(
      fetchMovementDetails({
        vehicle_id: id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        type: 'idle',
        page: 1,
        limit: 10000,
      }),
    ).then((res) => {
      setLoading(false);
      if (res?.payload?.success) {
        const items = res?.payload?.data || [];
        const formattedItems = (Array.isArray(items) ? items : [items]).map((item) => ({
          ...item,
          lat_long:
            item.latitude && item.longitude
              ? `${item.latitude}, ${item.longitude}`
              : item.lat_long || item.start_lat_long || '-',
        }));
        setData(formattedItems);
        setTotalCount(res?.payload?.pagination?.total || items.length || 0);
      } else {
        setData([]);
        setTotalCount(0);
      }
    });
  };

  useEffect(() => {
    fetchData();
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
    let allData = data;
    if (!allData || allData.length === 0) {
      const res = await dispatch(
        fetchMovementDetails({
          vehicle_id: id,
          from_date: filterData.fromDate,
          to_date: filterData.toDate,
          type: 'idle',
          page: 1,
          limit: totalCount || 10000,
        }),
      );
      allData = res?.payload?.data || [];
    }
    exportToExcel({
      columns,
      rows: buildExportRows({
        columns,
        data: (Array.isArray(allData) ? allData : [allData]).map((r) => ({
          ...r,
          duration: formatDuration(r.duration),
        })),
      }),
      fileName: 'idle_details.xlsx',
    });
  };

  const handleExportPDF = async () => {
    let allData = data;
    if (!allData || allData.length === 0) {
      const res = await dispatch(
        fetchMovementDetails({
          vehicle_id: id,
          from_date: filterData.fromDate,
          to_date: filterData.toDate,
          type: 'idle',
          page: 1,
          limit: totalCount || 10000,
        }),
      );
      allData = res?.payload?.data || [];
    }
    exportToPDF({
      columns,
      rows: buildExportRows({
        columns,
        data: (Array.isArray(allData) ? allData : [allData]).map((r) => ({
          ...r,
          duration: formatDuration(r.duration),
        })),
      }),
      fileName: 'idle_details.pdf',
      orientation: 'landscape',
    });
  };

  const paginatedData = data.slice(page * limit, (page + 1) * limit);

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
          <h1 className='text-2xl font-bold text-[#07163d]'>Idle Details (Total: {totalCount})</h1>
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
        data={paginatedData}
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

export default IdleDetails;
