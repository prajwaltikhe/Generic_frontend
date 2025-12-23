import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CommonSearch from '../../../components/CommonSearch';
import FilterOption from '../../../components/FilterOption';
import CommonTable from '../../../components/table/CommonTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'title', header: 'Announcement Title' },
  { key: 'sender_name', header: 'Sender Name' },
  { key: 'route_name', header: 'Vehicle Route' },
  { key: 'message', header: 'Message' },
  { key: 'created_at', header: 'Created On' },
];

function formatAnnouncement(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    announcementId: d.id,
    title: d.title || '-',
    sender_name: d.sender_name || '-',
    route_name: d.route_name || '-',
    message: d.message || '-',
    created_at: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD hh:mm A') : '-',
    raw: d,
  }));
}

function Announcement() {
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
    fetchAnnouncements();
    // eslint-disable-next-line
  }, [page, limit, searchQuery]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(APIURL.ANNOUNCEMENT, buildApiPayload());
      if (res?.success) {
        const list = Array.isArray(res.data?.announcements) ? res.data.announcements : [];
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
    fetchAnnouncements();
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
      const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=announcement`, formData);
      if (res.success) {
        toast.success(res.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        fetchAnnouncements();
      } else {
        toast.error(res.message || 'File upload failed.');
      }
    } catch {
      toast.error('Upload failed.');
    }
  };

  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await ApiService.get(APIURL.ANNOUNCEMENT, exportPayload);
      const list = Array.isArray(res.data?.announcements) ? res.data.announcements : [];
      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatAnnouncement(list) }),
        fileName: 'announcements.xlsx',
      });
      toast.success('Export to Excel successful.');
    } catch {
      toast.error('Export to Excel failed.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await ApiService.get(APIURL.ANNOUNCEMENT, exportPayload);
      const list = Array.isArray(res.data?.announcements) ? res.data.announcements : [];
      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatAnnouncement(list) }),
        fileName: 'announcements.pdf',
        orientation: 'landscape',
      });
      toast.success('Export to PDF successful.');
    } catch {
      toast.error('Export PDF failed.');
    }
  };

  const handleSample = () => {
    exportToExcel({ columns, rows: [{}], fileName: 'announcement_import_sample.xlsx' });
    toast.success('Sample Excel downloaded.');
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const response = await ApiService.delete(`${APIURL.ANNOUNCEMENT}/${row.announcementId}`);
      if (response && response.success) {
        toast.success('Announcement deleted successfully!');
        if (filteredData.length === 1 && page > 0) setPage(page - 1);
        else fetchAnnouncements();
      } else {
        toast.error(response?.message || 'Failed to delete announcement.');
      }
    } catch {
      toast.error('An error occurred while deleting announcement.');
    }
  };

  const handleEdit = (row) => {
    navigate('/management/announcement/edit', { state: row.raw });
  };
  const handleView = (row) => {
    navigate('/management/announcement/view', { state: row.raw });
  };

  const tableData = formatAnnouncement(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Announcements (Total: {totalCount})</h1>
        <div className='flex gap-x-4'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/management/announcement/create'>
            <button type='button' className='bg-[#07163d] text-white px-3 py-2 rounded-[3px] cursor-pointer'>
              Create New Announcement
            </button>
          </Link>
        </div>
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
          columns={columns}
          data={tableData}
          page={page}
          rowsPerPage={limit}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={(val) => {
            setLimit(val);
            setPage(0);
            toast.info('Rows per page changed.');
          }}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Announcement;
