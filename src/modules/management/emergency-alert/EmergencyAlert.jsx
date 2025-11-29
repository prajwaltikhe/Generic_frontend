import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import { useNavigate } from 'react-router-dom';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import CommonSearch from '../../../components/CommonSearch';
import FilterOption from '../../../components/FilterOption';
import CommonTable from '../../../components/table/CommonTable';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'date', header: 'Date' },
  { key: 'driverName', header: 'Driver Name' },
  { key: 'vehicleNo', header: 'Vehicle Number' },
  { key: 'routeName', header: 'Route Name' },
  { key: 'title', header: 'Title' },
  { key: 'message', header: 'Message' },
  { key: 'actionTaken', header: 'Action Taken' },
  {
    key: 'actions',
    header: 'Actions',
    render: (_, row, handlers) => (
      <div className='flex justify-center gap-2'>
        <button
          className='bg-[#00c0ef] p-2 text-white rounded-[3px] w-5 h-4 cursor-pointer flex justify-center items-center'
          style={{ minWidth: 24, minHeight: 24 }}
          onClick={() => handlers.handleLocation(row)}>
          <FmdGoodIcon fontSize='10px' />
        </button>
      </div>
    ),
  },
];

function formatEmergencyAlert(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    emergencyID: d.id,
    date: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD') : '-',
    driverName: d.driver?.name || '-',
    vehicleNo: d.vehicle_number || '-',
    routeName: d.route_name || '-',
    title: d.title || '-',
    message: d.message || '-',
    actionTaken: d.action_taken || '-',
    latitude: d.latitude,
    longitude: d.longitude,
    raw: d,
  }));
}

function EmergencyAlert() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const company_id = localStorage.getItem('company_id');

  const { routes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState({ fromDate: '', toDate: '', routes: [], vehicles: [] });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    company_id,
    ...(filterData.fromDate && { start: filterData.fromDate }),
    ...(filterData.toDate && { end: filterData.toDate }),
    ...(filterData.routes?.length && { routes: JSON.stringify(filterData.routes) }),
    ...(filterData.vehicles?.length && { vehicles: JSON.stringify(filterData.vehicles) }),
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line
  }, [page, limit, searchQuery]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(APIURL.EMERGENCY, buildApiPayload());
      if (res?.success) {
        const list = Array.isArray(res.data?.alerts) ? res.data.alerts : [];
        setFilteredData(list);
        setTotalCount(res.data?.pagination?.total ?? list.length ?? 0);
      } else {
        setFilteredData([]);
        setTotalCount(0);
      }
    } catch {
      setFilteredData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchAlerts();
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

    try {
      const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=emergency_alert`, formData);
      if (res.success) {
        toast.success(res.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        fetchAlerts();
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
      const res = await ApiService.get(APIURL.EMERGENCY, exportPayload);
      const list = Array.isArray(res.data?.alerts) ? res.data.alerts : [];

      if (!list.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatEmergencyAlert(list) }),
        fileName: 'emergency_alerts.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await ApiService.get(APIURL.EMERGENCY, exportPayload);
      const list = Array.isArray(res.data?.alerts) ? res.data.alerts : [];

      if (!list.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatEmergencyAlert(list) }),
        fileName: 'emergency_alerts.pdf',
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
        { key: 'route_id', header: 'Route ID' },
        { key: 'driver_id', header: 'Driver ID' },
        { key: 'title', header: 'Title' },
        { key: 'message', header: 'Message' },
        { key: 'latitude', header: 'Latitude' },
        { key: 'longitude', header: 'Longitude' },
      ],
      rows: [{}],
      fileName: 'emergency_alert_import_sample.xlsx',
    });

  const handleLocation = (row) => {
    if (row?.latitude && row?.longitude) {
      const gmapUrl = `https://www.google.com/maps?q=${row?.latitude},${row?.longitude}`;
      window.open(gmapUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Location not available');
    }
  };

  const handleEdit = (row) => {
    navigate('/management/emergency-alert/edit', { state: row });
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this Alert?')) return;
    try {
      const response = await ApiService.delete(`${APIURL.EMERGENCY}/${row.emergencyID}`);
      if (response && response.success) {
        toast.success('Alert deleted successfully!');
        if (filteredData.length === 1 && page > 0) setPage(page - 1);
        else fetchAlerts();
        window.location.reload();
      } else {
        toast.error('Failed to delete alert.');
      }
    } catch {
      toast.error('An error occurred while deleting.');
    }
  };

  const actionHandlers = {
    handleLocation,
    handleEdit,
    handleDelete,
  };

  const tableData = formatEmergencyAlert(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Emergency Alerts (Total: {totalCount})</h1>
        <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

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
          routes={routes}
          vehicles={routes}
        />
      </form>

      <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4'>
        <CommonTable
          columns={columns.map((c) =>
            c.key === 'actions' ? { ...c, render: (_, row) => c.render(_, row, actionHandlers) } : c
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
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default EmergencyAlert;
