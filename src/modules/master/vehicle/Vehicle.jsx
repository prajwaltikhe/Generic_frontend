import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchVehicles } from '../../../redux/vehiclesSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import IModal from '../../../components/modal/Modal';
import FilterOption from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommonTable from '../../../components/table/CommonTable';
import FmdGoodIcon from '@mui/icons-material/FmdGood';

const columns = [
  { key: 'srNo', header: 'Sr No', render: (_, row) => row.id },
  { key: 'vehicleName', header: 'Vehicle Name' },
  { key: 'vehicleNumber', header: 'Vehicle Number' },
  { key: 'simNumber', header: 'SIM Number' },
  { key: 'imeiNumber', header: 'IMEI Number' },
  { key: 'speedLimit', header: 'Speed Limit' },
  { key: 'seatCount', header: 'Seat Count' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'driverName', header: 'Driver Name' },
  { key: 'driverEmail', header: 'Driver Email' },
  { key: 'driverPhoneNumber', header: 'Driver Phone' },
  { key: 'routeNumber', header: 'Route Number' },
  { key: 'routeName', header: 'Route Name' },
  {
    key: 'status',
    header: 'Status',
    render: (_, row, setSelectedVehicle, setIsStatusModalOpen) => (
      <button
        onClick={() => {
          setSelectedVehicle(row);
          setIsStatusModalOpen(true);
        }}
        className={`text-white px-2 py-1 rounded text-sm ${row.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}>
        {row.status}
      </button>
    ),
  },
];

function formatVehicle(data, offset = 0) {
  return data.map((v, idx) => ({
    id: offset + idx + 1,
    actual_id: v.id,
    vehicleName: v.vehicle_name || '',
    vehicleNumber: v.vehicle_number || '',
    simNumber: v.sim_number || '',
    imeiNumber: v.imei_number || '',
    speedLimit: v.speed_limit || '',
    seatCount: v.seats || '',
    createdAt: v.created_at ? dayjs(v.created_at).format('YYYY-MM-DD') : '',
    driverName: `${v.driver?.first_name || ''} ${v.driver?.last_name || ''}`.trim() || '-',
    driverEmail: v.driver?.email || '-',
    driverPhoneNumber: v.driver?.phone_number || '-',
    routeNumber: Array.isArray(v.routes) && v.routes[0]?.route_number ? v.routes[0].route_number : '-',
    routeName: Array.isArray(v.routes) && v.routes[0]?.route_name ? v.routes[0].route_name : '-',
    status: v.vehicle_status_id === 1 ? 'Active' : 'Inactive',
  }));
}

function Vehicle() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const { vehicleRoutes } = useSelector((s) => s.vehicleRoute || {});

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filterData, setFilterData] = useState({ fromDate: '', toDate: '', routes: [], vehicles: [] });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    dispatch(fetchVehicleRoutes({ limit: 100 }));
  }, [dispatch]);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    ...(filterData.fromDate && { fromDate: filterData.fromDate }),
    ...(filterData.toDate && { toDate: filterData.toDate }),
    ...(filterData.routes?.length && { routes: JSON.stringify(filterData.routes) }),
    ...(filterData.vehicles?.length && { vehicles: JSON.stringify(filterData.vehicles) }),
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    dispatch(fetchVehicles(buildApiPayload())).then((res) => {
      setFilteredData(res?.payload?.vehicles || []);
      setTotalCount(res?.payload?.pagination?.total ?? res?.payload?.vehicles?.length ?? 0);
    });
    // eslint-disable-next-line
  }, [dispatch, page, limit, searchQuery]);

  const handleView = (row) => navigate('/master/vehicle/view', { state: { ...row, action: 'VIEW' } });
  const handleEdit = (row) => navigate('/master/vehicle/edit', { state: { ...row, action: 'EDIT' } });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Vehicle?')) return;
    try {
      const res = await ApiService.delete(`${APIURL.VEHICLE}/${id}`);
      if (res.success) {
        toast.success('Vehicle deleted successfully!');
        dispatch(fetchVehicles(buildApiPayload()));
      } else {
        toast.error(res.message || 'Failed to delete vehicle');
      }
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedVehicle) return;
    try {
      const newStatusId = selectedVehicle.status === 'Active' ? 2 : 1;
      const res = await ApiService.put(`${APIURL.VEHICLE}/${selectedVehicle.actual_id}`, {
        vehicle_status_id: newStatusId,
      });
      if (res.success) {
        toast.success('Status updated!');
        setIsStatusModalOpen(false);
        dispatch(fetchVehicles(buildApiPayload()));
      } else {
        toast.error('Failed to update status.');
      }
    } catch {
      toast.error('Status update failed.');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchVehicles(buildApiPayload(1, limit))).then((res) => {
      setFilteredData(res?.payload?.vehicles || []);
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
  };

  const handleFormReset = () => {
    setFilterData({ fromDate: '', toDate: '', routes: [], vehicles: [] });
    setSearchQuery('');
    setPage(0);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', file);
    const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=vehicle`, formData);
    if (res.success) {
      toast.success(res.message);
      if (fileInputRef.current) fileInputRef.current.value = null;
      dispatch(fetchVehicles(buildApiPayload()));
    } else {
      toast.error(res.message || 'Upload failed');
    }
  };

  // Export only the first 100 vehicles, properly formatted, using fetchVehicles
  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await dispatch(fetchVehicles(exportPayload));
      const vehicles = res?.payload?.vehicles || [];
      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatVehicle(vehicles) }),
        fileName: 'vehicle_master.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  // Export only the first 100 vehicles to PDF, properly formatted, using fetchVehicles
  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await dispatch(fetchVehicles(exportPayload));
      const vehicles = res?.payload?.vehicles || [];
      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatVehicle(vehicles) }),
        fileName: 'vehicle_master.pdf',
        orientation: 'landscape',
      });
    } catch (err) {
      toast.error('Export PDF failed');
    }
  };

  // Export a sample Excel file for vehicle import template
  const handleSample = () =>
    exportToExcel({
      columns: [
        { key: 'vehicle_name', header: 'Vehicle Name' },
        { key: 'vehicle_number', header: 'Vehicle Number' },
        { key: 'sim_number', header: 'SIM Number' },
        { key: 'imei_number', header: 'IMEI Number' },
        { key: 'speed_limit', header: 'Speed Limit' },
        { key: 'seats', header: 'Seat Count' },
        { key: 'driver_first_name', header: 'Driver First Name' },
        { key: 'driver_last_name', header: 'Driver Last Name' },
        { key: 'driver_email', header: 'Driver Email' },
        { key: 'driver_phone_number', header: 'Driver Phone' },
        { key: 'route_number', header: 'Route Number' },
        { key: 'route_name', header: 'Route Name' },
      ],
      rows: [{}],
      fileName: 'vehicle_import_sample.xlsx',
    });

  const tableData = formatVehicle(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Vehicles (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/master/vehicle/create'>
            <button className='text-white bg-[#07163d] hover:bg-[#0a1a4a] font-medium rounded-sm text-sm px-5 py-2.5'>
              New Vehicle
            </button>
          </Link>
        </div>
      </div>

      {isStatusModalOpen && selectedVehicle && (
        <IModal open={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
          <div className='p-4'>
            <h2 className='text-xl font-semibold mb-4 text-[#07163d]'>Change Vehicle Status</h2>
            <p className='mb-6'>
              Change status of <strong>{selectedVehicle.vehicleName}</strong> from{' '}
              <strong>{selectedVehicle.status}</strong> to{' '}
              <strong>{selectedVehicle.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
            </p>
            <div className='flex justify-end gap-3'>
              <button
                className='px-4 py-2 rounded bg-gray-300 text-[#07163d]'
                onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </button>
              <button className='px-4 py-2 rounded bg-[#07163d] text-white' onClick={handleStatusChange}>
                Confirm
              </button>
            </div>
          </div>
        </IModal>
      )}

      <form onSubmit={handleFormSubmit} className='mb-4'>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleSample={handleSample}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          handleFileUpload={handleFileUpload}
          fileInputRef={fileInputRef}
          setFile={setFile}
          routes={vehicleRoutes?.routes}
          vehicles={vehicleRoutes?.routes}
        />
      </form>

      <CommonTable
        columns={columns.map((c) =>
          c.key === 'status'
            ? { ...c, render: (_, row) => c.render(_, row, setSelectedVehicle, setIsStatusModalOpen) }
            : c
        )}
        data={tableData}
        page={page}
        rowsPerPage={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={(val) => {
          setLimit(val);
          setPage(0);
        }}
        onEdit={handleEdit}
        onDelete={(row) => handleDelete(row.actual_id)}
        onView={handleView}
        extraActions={(row) => (
          <Link to={`/live-tracking/${row.actual_id}`}>
            <button className='bg-[#00c0ef] p-2 text-white rounded-[3px] w-5 h-4 cursor-pointer flex justify-center items-center'>
              <FmdGoodIcon fontSize='10px' />
            </button>
          </Link>
        )}
      />
    </div>
  );
}

export default Vehicle;
