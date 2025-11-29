import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommanTable from '../../../components/table/CommonTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const shifts = [
  { id: '2f7d76b8-87a9-4dc1-822a-a39e99b314e9', name: 'Night' },
  { id: '1b0b7594-c88c-470b-a956-f8f79918fd36', name: 'Day' },
];

const getShiftName = (shiftId) => shifts.find((s) => s.id === shiftId)?.name || '-';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'busNumber', header: 'Vehicle Number' },
  { key: 'routeName', header: 'Route Name' },
  { key: 'busDriver', header: 'Vehicle Driver' },
  { key: 'shift', header: 'Shift' },
  { key: 'status', header: 'Status' },
  { key: 'createdAt', header: 'Created At' },
];

const formatVehicleRoute = (data, offset = 0) =>
  data.map((d, i) => ({
    id: offset + i + 1,
    routeID: d.id,
    busNumber: d.vehicle?.vehicle_number || d.vehicle?.vehicle_name || '-',
    vehicleID: d.vehicle_id,
    routeName: d.name || '-',
    shiftId: d.stops?.[0]?.shift_id || '-',
    shift: getShiftName(d.stops?.[0]?.shift_id || '-'),
    routeStops: d.routes || [],
    busDriver: d.vehicle?.driver
      ? `${d.vehicle.driver.first_name || ''} ${d.vehicle.driver.last_name || ''}`.trim() || '-'
      : '-',
    status:
      typeof d.status === 'string' && d.status.trim()
        ? d.status
        : d.active === 1
        ? 'Active'
        : d.active === 0
        ? 'Inactive'
        : '-',
    createdAt: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD') : '-',
    row: d,
  }));

function VehicleRoute() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const { loading } = useSelector((state) => state.vehicleRoute);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    dispatch(fetchVehicleRoutes(buildApiPayload())).then((res) => {
      const routes = res?.payload?.routes || [];
      setFilteredData(routes);
      setTotalCount(res?.payload?.pagination?.total ?? routes.length ?? 0);
    });
    // eslint-disable-next-line
  }, [dispatch, page, limit, searchQuery]);

  const handleView = (row) => {
    navigate('/management/vehicle-route/view', { state: { mode: 'view', rowData: row.row } });
  };

  const handleEdit = (row) => {
    navigate('/management/vehicle-route/edit', { state: { mode: 'edit', rowData: row.row } });
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this Vehicle Route?')) return;

    try {
      const response = await ApiService.delete(`${APIURL.VEHICLE_ROUTE}/${row.routeID}`);
      if (response.success) {
        toast.success(response.message || 'Vehicle Route deleted successfully!');
        dispatch(fetchVehicleRoutes(buildApiPayload())).then((res) => {
          const routes = res?.payload?.routes || [];
          if (routes.length === 0 && page > 0) {
            setPage(page - 1);
          }
        });
        window.location.reload();
      } else {
        toast.error(response.message || 'Failed to delete Vehicle Route');
      }
    } catch {
      toast.error('An error occurred while deleting.');
    }
  };

  const handleFormReset = () => {
    setSearchQuery('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
    setPage(0);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=vehicle_route`, formData);
      if (res.success) {
        toast.success(res.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        dispatch(fetchVehicleRoutes(buildApiPayload()));
      } else {
        toast.error(res.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed.');
    }
  };

  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await dispatch(fetchVehicleRoutes(exportPayload));
      const routes = res?.payload?.routes || [];

      if (!routes.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatVehicleRoute(routes) }),
        fileName: 'vehicle_route.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await dispatch(fetchVehicleRoutes(exportPayload));
      const routes = res?.payload?.routes || [];

      if (!routes.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatVehicleRoute(routes) }),
        fileName: 'vehicle_route.pdf',
        orientation: 'landscape',
      });
    } catch (err) {
      toast.error('Export PDF failed');
    }
  };

  const handleSample = () =>
    exportToExcel({
      columns: [
        { key: 'vehicle_id', header: 'Vehicle ID' },
        { key: 'name', header: 'Route Name' },
        { key: 'shift_id', header: 'Shift ID' },
        { key: 'status', header: 'Status' },
      ],
      rows: [{}],
      fileName: 'vehicle_route_import_sample.xlsx',
    });

  const tableData = formatVehicleRoute(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Vehicle Route (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/management/vehicle-route/create'>
            <button className='text-white bg-[#07163d] hover:bg-[#0a1a4a] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer'>
              Add Vehicle Route
            </button>
          </Link>
        </div>
      </div>

      <FilterOption
        handleFormReset={handleFormReset}
        handleFileUpload={handleFileUpload}
        setFile={setFile}
        file={file}
        handleExport={handleExport}
        handleExportPDF={handleExportPDF}
        handleSample={handleSample}
        fileInputRef={fileInputRef}
      />

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

export default VehicleRoute;
