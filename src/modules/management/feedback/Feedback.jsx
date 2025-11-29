import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import FilterOption from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommonTable from '../../../components/table/CommonTable';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'employeeName', header: 'Employee Name' },
  { key: 'rating', header: 'Rating' },
  { key: 'message', header: 'Message' },
  { key: 'createdAt', header: 'Created At' },
];

function formatFeedback(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    feedbackId: d.id,
    employeeName: `${d?.employee?.first_name || ''} ${d?.employee?.last_name || ''}`.trim() || '-',
    rating: d?.rating || '-',
    message: d?.message || '-',
    createdAt: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD') : '-',
    raw: d,
  }));
}

function Feedback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const company_id = localStorage.getItem('company_id');

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterData, setFilterData] = useState({ fromDate: '', toDate: '', routes: [], vehicles: [] });
  const [filteredData, setFilteredData] = useState([]);

  const { routes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes);

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
    fetchFeedbacks();
    // eslint-disable-next-line
  }, [page, limit, searchQuery]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(APIURL.FEEDBACK, buildApiPayload());
      if (res?.success) {
        const list = Array.isArray(res.data?.feedbacks) ? res.data.feedbacks : [];
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

  const handleEdit = (row) => {
    navigate('/management/feedback/edit', { state: row.raw });
  };
  const handleView = (row) => {
    navigate('/management/feedback/view', { state: row.raw });
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const res = await ApiService.delete(`${APIURL.FEEDBACK}/${row.feedbackId}`);
      if (res.success) {
        toast.success('Feedback deleted successfully!');
        await fetchFeedbacks();
        if (filteredData.length === 1 && page > 0) setPage(page - 1);
        window.location.reload();
      } else {
        toast.error('Failed to delete this Feedback.');
      }
    } catch {
      toast.error('An error occurred while deleting.');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchFeedbacks();
  };

  const handleFormReset = () => {
    setFilterData({ fromDate: '', toDate: '', routes: [], vehicles: [] });
    setSearchQuery('');
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await ApiService.get(APIURL.FEEDBACK, exportPayload);
      const list = Array.isArray(res.data?.feedbacks) ? res.data.feedbacks : [];

      if (!list.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatFeedback(list) }),
        fileName: 'feedbacks.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, 100);
      const res = await ApiService.get(APIURL.FEEDBACK, exportPayload);
      const list = Array.isArray(res.data?.feedbacks) ? res.data.feedbacks : [];

      if (!list.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatFeedback(list) }),
        fileName: 'feedbacks.pdf',
        orientation: 'landscape',
      });
    } catch (err) {
      toast.error('Export PDF failed');
    }
  };

  const tableData = formatFeedback(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Feedbacks (Total: {totalCount})</h1>
        <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      <form onSubmit={handleFormSubmit} className='mb-4'>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
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
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={(val) => {
            setLimit(val);
            setPage(0);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Feedback;
