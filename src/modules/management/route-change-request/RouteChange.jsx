import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import StatusDropdown from './components/statusDropdown';
import CommonSearch from '../../../components/CommonSearch';
import FilterOption from '../../../components/FilterOption';
import CommonTable from '../../../components/table/CommonTable';

const statusOptions = [
  { id: '3196ad71-4267-46dd-a962-6a07f0f77c0b', name: 'Accepted' },
  { id: 'aaf59ca8-b4ba-466f-bcaf-cf204b844efc', name: 'Pending' },
  { id: '1b13dd9a-e5ec-43d2-8676-a5811c194a25', name: 'Rejected' },
];

const getStatusLabel = (value) => statusOptions.find((opt) => opt.id === value)?.name || '';

const columns = [
  { key: 'id', header: 'Sr No' },
  {
    key: 'employee_name',
    header: 'Employee Name',
  },
  { key: 'old_vehicle_route_name', header: 'Old Vehicle Route Name' },
  { key: 'new_vehicle_route_name', header: 'New Vehicle Route Name' },
  { key: 'old_stop_address', header: 'Old Stop Address' },
  { key: 'new_stop_address', header: 'New Stop Address' },
  {
    key: 'route_change_request_status_id',
    header: 'Status',
    render: (_, row, onStatusChange) => (
      <div style={{ minWidth: 150 }}>
        <StatusDropdown
          row={{
            ...row.raw,
            statusValue: row.statusValue,
            status: row.statusName,
          }}
          onStatusChange={onStatusChange}
          statusOptions={statusOptions}
        />
      </div>
    ),
  },
  { key: 'approved_by_name', header: 'Approved By Name' },
  { key: 'created_at', header: 'Created At' },
  { key: 'approved_at', header: 'Approved At' },
];

function formatRouteChange(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    routeChangeId: d.id,
    employee_name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || '-',
    old_vehicle_route_name: d.old_vehicle_route_name || '-',
    new_vehicle_route_name: d.new_vehicle_route_name || '-',
    old_stop_address: d.old_stop_address || '-',
    new_stop_address: d.new_stop_address || '-',
    statusValue: d.route_change_request_status_id,
    statusName: getStatusLabel(d.route_change_request_status_id),
    approved_by_name: d.approved_by_name || '-',
    created_at: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD') : '-',
    approved_at: d.approved_at ? dayjs(d.approved_at).format('YYYY-MM-DD') : '-',
    raw: d,
  }));
}

function RouteChange() {
  const dispatch = useDispatch();
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
    fetchRouteChanges();
    // eslint-disable-next-line
  }, [page, limit, searchQuery]);

  const fetchRouteChanges = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(APIURL.ROUTECHANGEREQ, buildApiPayload());
      if (res?.success) {
        const list = Array.isArray(res.data?.routeChanges) ? res.data.routeChanges : [];
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

  const handleStatusUpdate = (routeChangeReqID, newStatusValue) => {
    setFilteredData((prev) =>
      prev.map((row) =>
        row.id === routeChangeReqID
          ? {
              ...row,
              route_change_request_status_id: newStatusValue,
            }
          : row
      )
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchRouteChanges();
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
      const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=route_change`, formData);
      if (res.success) {
        toast.success(res.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        fetchRouteChanges();
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
      const res = await ApiService.get(APIURL.ROUTECHANGEREQ, exportPayload);
      const list = Array.isArray(res.data?.routeChanges) ? res.data.routeChanges : [];

      if (!list.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatRouteChange(list) }),
        fileName: 'route_change_requests.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await ApiService.get(APIURL.ROUTECHANGEREQ, exportPayload);
      const list = Array.isArray(res.data?.routeChanges) ? res.data.routeChanges : [];

      if (!list.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatRouteChange(list) }),
        fileName: 'route_change_requests.pdf',
        orientation: 'landscape',
      });
    } catch (err) {
      toast.error('Export PDF failed');
    }
  };

  const handleSample = () =>
    exportToExcel({
      columns: [
        { key: 'employee_id', header: 'Employee ID' },
        { key: 'old_vehicle_route_id', header: 'Old Vehicle Route ID' },
        { key: 'new_vehicle_route_id', header: 'New Vehicle Route ID' },
        { key: 'old_stop_id', header: 'Old Stop ID' },
        { key: 'new_stop_id', header: 'New Stop ID' },
        { key: 'status_id', header: 'Status ID' },
      ],
      rows: [{}],
      fileName: 'route_change_import_sample.xlsx',
    });

  const tableData = formatRouteChange(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Route Change Request (Total: {totalCount})</h1>
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
            c.key === 'route_change_request_status_id'
              ? { ...c, render: (_, row) => c.render(_, row, handleStatusUpdate) }
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
          loading={loading}
        />
      </div>
    </div>
  );
}

export default RouteChange;
