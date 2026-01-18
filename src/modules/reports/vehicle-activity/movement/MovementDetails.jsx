import moment from 'moment';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import FilterOption from '../../../../components/FilterOption';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchMovementDetails } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';

const columns = [
  {
    key: 'date_time',
    header: 'Date & Time',
    render: (_, row) => (row?.date_time ? moment(row.date_time).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_, row) => row?.vehicle_type ?? 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_, row) => row?.vehicle_number ?? '-' },
  { key: 'route_details', header: 'Route Details', render: (_, row) => row?.route_details ?? '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_, row) => row?.driver_name ?? '-' },
  {
    key: 'driver_contact_number',
    header: 'Driver Contact Number',
    render: (_, row) => row?.driver_contact_number ?? '-',
  },
  { key: 'status', header: 'Status', render: (_, row) => row?.status ?? '-' },
  { key: 'speed', header: 'Speed', render: (_, row) => (typeof row?.speed === 'number' ? row.speed : '-') },
  { key: 'lat_long', header: 'Lat-Long', render: (_, row) => row?.lat_long ?? row?.start_lat_long ?? '-' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_, row) => {
      if (!row?.gmap) return '-';
      return (
        <a href={row.gmap} target='_blank' className='text-blue-700 hover:underline' rel='noopener noreferrer'>
          Google-Map
        </a>
      );
    },
  },
  { key: 'odometer', header: 'Odometer', render: (_, row) => row?.odometer ?? row?.start_odometer ?? '-' },
  { key: 'distance', header: 'Distance', render: (_, row) => row?.distance ?? row?.total_distance ?? '-' },
];

function MovementDetails() {
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
      fetchMovementDetails({
        vehicle_id: id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: page + 1,
        limit,
      }),
    ).then((res) => {
      setLoading(false);
      if (res?.payload?.success) {
        const items = res?.payload?.data || [];
        setData(Array.isArray(items) ? items : [items]);
        const pagination = res?.payload?.pagination;
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
      fetchMovementDetails({
        vehicle_id: id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const allData = res?.payload?.data || [];
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: Array.isArray(allData) ? allData : [allData] }),
      fileName: 'movement_details.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(
      fetchMovementDetails({
        vehicle_id: id,
        from_date: filterData.fromDate,
        to_date: filterData.toDate,
        page: 1,
        limit: totalCount,
      }),
    );
    const allData = res?.payload?.data || [];
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: Array.isArray(allData) ? allData : [allData] }),
      fileName: 'movement_details.pdf',
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
          <h1 className='text-2xl font-bold text-[#07163d]'>Movement Details (Total: {totalCount})</h1>
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

export default MovementDetails;
