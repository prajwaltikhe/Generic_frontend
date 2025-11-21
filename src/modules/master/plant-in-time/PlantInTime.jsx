import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import FilterOptions from '../../../components/FilterOption';
import CommanTable from '../../../components/table/CommonTable';
import CommonSearch from '../../../components/CommonSearch';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'name', header: 'Vehicle Number' },
  { key: 'routeName', header: 'Route Name' },
  { key: 'dayGeneral', header: 'Day General' },
  { key: 'nightGeneral', header: 'Night General' },
  { key: 'firstGeneral', header: 'First General' },
  { key: 'secondGeneral', header: 'Second General' },
  { key: 'thirdGeneral', header: 'Third General' },
  { key: 'updatedBy', header: 'Updated By' },
  { key: 'updatedOn', header: 'Updated On' },
];

function formatPlantInTime(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    plantId: d.id,
    name: d.vehicle?.vehicle_name || '-',
    vehicle_id: d.vehicle_id,
    routeName: d.route?.name || '-',
    route_id: d.vehicle_route_id,
    dayGeneral: d.day_general_start_time || '-',
    nightGeneral: d.night_general_start_time || '-',
    firstGeneral: d.first_shift_start_time || '-',
    secondGeneral: d.second_shift_start_time || '-',
    thirdGeneral: d.third_shift_start_time || '-',
    updatedBy: 'Admin-1',
    updatedOn: d.updated_at ? dayjs(d.updated_at).format('YYYY-MM-DD') : '-',
  }));
}

function PlantInTime() {
  const companyID = localStorage.getItem('company_id');
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    company_id: companyID,
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, limit, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(APIURL.PLANTINTIME, buildApiPayload());
      if (res?.success) {
        setFilteredData(res.data || []);
        setTotalCount(res.pagination?.total ?? res.data?.length ?? 0);
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

  const handleView = (row) => {
    navigate(`/master/plant-in-time/view`, { state: { ...row, action: 'VIEW' } });
  };

  const handleEdit = (row) => {
    navigate(`/master/plant-in-time/edit`, { state: { ...row, action: 'EDIT' } });
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this Plant In Time Data?')) return;

    try {
      const response = await ApiService.delete(`${APIURL.PLANTINTIME}/${row.plantId}`);
      if (response.success) {
        toast.success('Plant in Time deleted successfully!');
        await fetchData();
        if (filteredData.length === 1 && page > 0) setPage(page - 1);
        window.location.reload();
      } else {
        toast.error('Failed to delete Plant in Time.');
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
      const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=plant_in_time`, formData);
      if (res.success) {
        toast.success(res.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        fetchData();
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
      const res = await ApiService.get(APIURL.PLANTINTIME, exportPayload);
      const data = res?.data || [];

      if (!data.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatPlantInTime(data) }),
        fileName: 'plant_in_time.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, totalCount);
      const res = await ApiService.get(APIURL.PLANTINTIME, exportPayload);
      const data = res?.data || [];

      if (!data.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatPlantInTime(data) }),
        fileName: 'plant_in_time.pdf',
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
        { key: 'vehicle_route_id', header: 'Vehicle Route ID' },
        { key: 'day_general_start_time', header: 'Day General Start Time' },
        { key: 'night_general_start_time', header: 'Night General Start Time' },
        { key: 'first_shift_start_time', header: 'First Shift Start Time' },
        { key: 'second_shift_start_time', header: 'Second Shift Start Time' },
        { key: 'third_shift_start_time', header: 'Third Shift Start Time' },
      ],
      rows: [{}],
      fileName: 'plant_in_time_import_sample.xlsx',
    });

  const tableData = formatPlantInTime(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Plant In-Time (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/master/plant-in-time/create'>
            <button
              type='button'
              className='text-white bg-[#07163d] hover:bg-[#0a1a4a] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer'>
              New Plant In-Time
            </button>
          </Link>
        </div>
      </div>

      <FilterOptions
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
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
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

export default PlantInTime;
