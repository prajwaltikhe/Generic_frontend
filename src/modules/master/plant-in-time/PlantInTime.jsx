import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPlantInTime, deletePlantInTime, uploadPlantInTimeData } from '../../../redux/plantInTimeSlice';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import CommonSearch from '../../../components/CommonSearch';
import FilterOptions from '../../../components/FilterOption';
import CommanTable from '../../../components/table/CommonTable';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'name', header: 'Vehicle Number' },
  { key: 'routeName', header: 'Route Name' },
  { key: 'dayGeneral', header: 'Day General' },
  { key: 'nightGeneral', header: 'Night General' },
  { key: 'firstShift', header: 'First Shift' },
  { key: 'secondShift', header: 'Second Shift' },
  { key: 'thirdShift', header: 'Third Shift' },
  { key: 'updatedBy', header: 'Updated By' },
  { key: 'updatedOn', header: 'Updated On' },
];

function formatPlantInTime(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    plantId: d.id,
    name: d.vehicle?.vehicle_number || '-',
    vehicle_id: d.vehicle_id,
    routeName: d.route?.name || '-',
    route_id: d.vehicle_route_id,
    dayGeneral:
      d.day_general_start_time && d.day_general_end_time
        ? `${d.day_general_start_time} - ${d.day_general_end_time}`
        : '-',
    nightGeneral:
      d.night_general_start_time && d.night_general_end_time
        ? `${d.night_general_start_time} - ${d.night_general_end_time}`
        : '-',
    firstShift:
      d.first_shift_start_time && d.first_shift_end_time
        ? `${d.first_shift_start_time} - ${d.first_shift_end_time}`
        : '-',
    secondShift:
      d.second_shift_start_time && d.second_shift_end_time
        ? `${d.second_shift_start_time} - ${d.second_shift_end_time}`
        : '-',
    thirdShift:
      d.third_shift_start_time && d.third_shift_end_time
        ? `${d.third_shift_start_time} - ${d.third_shift_end_time}`
        : '-',
    updatedBy: 'Admin-1',
    updatedOn: d.updated_at ? dayjs(d.updated_at).format('YYYY-MM-DD') : '-',
  }));
}

function PlantInTime() {
  const dispatch = useDispatch();
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
  const [filterData, setFilterData] = useState({ routes: [], vehicles: [] });

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    company_id: companyID,
    ...(filterData.routes?.length && { routes: JSON.stringify(filterData.routes) }),
    ...(filterData.vehicles?.length && { vehicles: JSON.stringify(filterData.vehicles) }),
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, limit, searchQuery, filterData]);

  const fetchData = async () => {
    setLoading(true);
    dispatch(fetchPlantInTime(buildApiPayload())).then((res) => {
      if (fetchPlantInTime.fulfilled.match(res)) {
        const list = res.payload?.plantInTime || res.payload || [];
        setFilteredData(Array.isArray(list) ? list : []);
        setTotalCount(res.payload?.pagination?.total ?? res.payload?.pagination?.total ?? list.length ?? 0);
      } else {
        setFilteredData([]);
        setTotalCount(0);
      }
      setLoading(false);
    });
  };

  const handleView = (row) => {
    navigate(`/master/plant-in-time/view`, { state: { ...row, action: 'VIEW' } });
  };

  const handleEdit = (row) => {
    navigate(`/master/plant-in-time/edit`, { state: { ...row, action: 'EDIT' } });
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this Plant In Time Data?')) return;

    dispatch(deletePlantInTime(row.plantId)).then((res) => {
      if (deletePlantInTime.fulfilled.match(res)) {
        toast.success('Plant in Time deleted successfully!');
        fetchData();
        if (filteredData.length === 1 && page > 0) setPage(page - 1);
      } else {
        toast.error(res.payload || 'Failed to delete Plant in Time.');
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ routes: [], vehicles: [] });
    setSearchQuery('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
    setPage(0);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
  };

  const loadRouteVehicleOptions = useCallback(async ({ page: optionPage = 1, limit: optionLimit = 50, search = '' }) => {
    const res = await dispatch(
      fetchVehicleRoutes({
        page: optionPage,
        limit: optionLimit,
        ...(search?.trim() && { search: search.trim() }),
      }),
    );
    const routes = res?.payload?.routes || [];
    const pagination = res?.payload?.pagination;
    return {
      items: routes,
      hasMore: pagination ? pagination.hasNextPage : false,
    };
  }, [dispatch]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');

    const formData = new FormData();
    formData.append('file', file);

    dispatch(uploadPlantInTimeData(formData)).then((res) => {
      if (uploadPlantInTimeData.fulfilled.match(res)) {
        toast.success(res.payload?.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        fetchData();
      } else {
        toast.error(res.payload || 'Upload failed');
      }
    });
  };

  const handleExport = async () => {
    const exportPayload = buildApiPayload(1, 100);
    dispatch(fetchPlantInTime(exportPayload)).then((res) => {
      if (fetchPlantInTime.fulfilled.match(res)) {
        const data = res.payload?.plantInTime || res.payload || [];
        if (!data.length) {
          toast.error('No data available to export.');
          return;
        }
        exportToExcel({
          columns,
          rows: buildExportRows({ columns, data: formatPlantInTime(data) }),
          fileName: 'plant_in_time.xlsx',
        });
      }
    });
  };

  const handleExportPDF = async () => {
    const exportPayload = buildApiPayload(1, 100);
    dispatch(fetchPlantInTime(exportPayload)).then((res) => {
      if (fetchPlantInTime.fulfilled.match(res)) {
        const data = res.payload?.plantInTime || res.payload || [];
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
      }
    });
  };

  const handleSample = () =>
    exportToExcel({
      columns: [
        { key: 'vehicle_id', header: 'Vehicle ID' },
        { key: 'vehicle_route_id', header: 'Vehicle Route ID' },
        { key: 'day_general_start_time', header: 'Day General Start Time' },
        { key: 'day_general_end_time', header: 'Day General End Time' },
        { key: 'night_general_start_time', header: 'Night General Start Time' },
        { key: 'night_general_end_time', header: 'Night General End Time' },
        { key: 'first_shift_start_time', header: 'First Shift Start Time' },
        { key: 'first_shift_end_time', header: 'First Shift End Time' },
        { key: 'second_shift_start_time', header: 'Second Shift Start Time' },
        { key: 'second_shift_end_time', header: 'Second Shift End Time' },
        { key: 'third_shift_start_time', header: 'Third Shift Start Time' },
        { key: 'third_shift_end_time', header: 'Third Shift End Time' },
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

      <form onSubmit={handleFormSubmit}>
        <FilterOptions
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormSubmit={handleFormSubmit}
          handleFormReset={handleFormReset}
          handleFileUpload={handleFileUpload}
          setFile={setFile}
          file={file}
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleSample={handleSample}
          fileInputRef={fileInputRef}
          routeVehicleLoader={loadRouteVehicleOptions}
          isDate={false}
          compactVehicleTags
        />
      </form>

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
