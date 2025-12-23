import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchVehicleGeoFence } from '../../../redux/geofenceSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import FilterOption from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommanTable from '../../../components/table/CommonTable';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'busName', header: 'Vehicle Name' },
  { key: 'geofenceName', header: 'Geofence Name' },
  { key: 'geofenceType', header: 'Geofence Type' },
  { key: 'createdAt', header: 'Created At' },
];

function formatGeofence(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    geofenceID: d.id,
    busName: d.vehicle?.vehicle_name || d.vehicle?.vehicle_number || '-',
    geofenceName: d.geofence_name || '-',
    geofenceType: d.type || '-',
    createdAt: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD') : '-',
    row: d,
  }));
}

function Geofence() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const { loading } = useSelector((s) => s.geofence);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    dispatch(fetchVehicleGeoFence(buildApiPayload())).then((res) => {
      const geofences = res?.payload?.geofences || [];
      setFilteredData(geofences);
      setTotalCount(res?.payload?.pagination?.total ?? geofences.length ?? 0);
    });
    // eslint-disable-next-line
  }, [dispatch, page, limit, searchQuery]);

  const handleView = (row) => {
    navigate('/management/geofence/view', { state: { mode: 'view', rowData: row.row } });
  };

  const handleEdit = (row) => {
    navigate('/management/geofence/edit', { state: { mode: 'edit', rowData: row.row } });
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this Geo Fence?')) return;

    try {
      const res = await ApiService.delete(`${APIURL.GEOFENCE}/${row.geofenceID}`);
      if (res.success) {
        toast.success(res.message || 'Geofence deleted successfully!');
        dispatch(fetchVehicleGeoFence(buildApiPayload())).then((res) => {
          const geofences = res?.payload?.geofences || [];
          if (geofences.length === 0 && page > 0) {
            setPage(page - 1);
          }
        });
        window.location.reload();
      } else {
        toast.error(res.message || 'Failed to delete Geo Fence');
      }
    } catch {
      toast.error('An error occurred while deleting.');
    }
  };

  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, 500);
      const res = await dispatch(fetchVehicleGeoFence(exportPayload));
      const geofences = res?.payload?.geofences || [];

      if (!geofences.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatGeofence(geofences) }),
        fileName: 'geofence.xlsx',
      });
    } catch {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 500);
      const res = await dispatch(fetchVehicleGeoFence(exportPayload));
      const geofences = res?.payload?.geofences || [];

      if (!geofences.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatGeofence(geofences) }),
        fileName: 'geofence.pdf',
        orientation: 'landscape',
      });
    } catch {
      toast.error('Export PDF failed');
    }
  };

  const tableData = formatGeofence(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Geofence (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/management/geofence/create'>
            <button className='text-white bg-[#07163d] hover:bg-[#0a1a4a] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer'>
              Add Vehicle Geofence
            </button>
          </Link>
        </div>
      </div>

      <FilterOption handleExport={handleExport} handleExportPDF={handleExportPDF} />

      <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4'>
        <CommanTable
          columns={columns}
          data={tableData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          totalCount={totalCount}
          page={page}
          rowsPerPage={limit}
          onPageChange={setPage}
          onRowsPerPageChange={(val) => {
            setLimit(val);
            setPage(0);
          }}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Geofence;
