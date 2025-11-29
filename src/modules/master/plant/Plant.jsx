import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchPlants, fetchPlantById, deletePlant } from '../../../redux/plantSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import IModal from '../../../components/modal/Modal';
import FilterOptions from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommanTable from '../../../components/table/CommonTable';
import PlantForm from './components/PlantForm';

const columns = [
  { key: 'id', header: 'Sr No' },
  { key: 'name', header: 'Plant Name' },
  { key: 'createdAt', header: 'Created At' },
];

function formatPlant(data, offset = 0) {
  return data.map((d, idx) => ({
    id: offset + idx + 1,
    plantID: d.id,
    name: d.plant_name || '-',
    createdAt: d.created_at ? dayjs(d.created_at).format('YYYY-MM-DD') : '-',
  }));
}

function Plant() {
  const dispatch = useDispatch();
  const fileInputRef = useRef();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  const { loading } = useSelector((state) => state.plant);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    dispatch(fetchPlants(buildApiPayload())).then((res) => {
      setFilteredData(res?.payload?.plants || []);
      setTotalCount(res?.payload?.pagination?.total ?? res?.payload?.plants?.length ?? 0);
    });
    // eslint-disable-next-line
  }, [dispatch, page, limit, searchQuery]);

  const handleEdit = (row) => {
    dispatch(fetchPlantById(row.plantID));
    setIsModalOpen(true);
    setSelectedRow(row);
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Are you sure you want to delete this Plant?')) return;

    try {
      const res = await dispatch(deletePlant(row.plantID));
      if (res.meta.requestStatus === 'fulfilled') {
        toast.success('Plant deleted successfully!');
        dispatch(fetchPlants(buildApiPayload()))
          .unwrap()
          .then((data) => {
            if (data.plants.length === 0 && page > 0) setPage(page - 1);
          });
        window.location.reload();
      } else {
        toast.error('Failed to delete plant');
      }
    } catch (err) {
      toast.error('Delete failed.');
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
      const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=plant`, formData);
      if (res.success) {
        toast.success(res.message || 'File uploaded successfully!');
        if (fileInputRef.current) fileInputRef.current.value = null;
        setFile(null);
        dispatch(fetchPlants(buildApiPayload()));
      } else {
        toast.error(res.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed.');
    }
  };

  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, totalCount);
      const res = await dispatch(fetchPlants(exportPayload));
      const plants = res?.payload?.plants || [];

      if (!plants.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatPlant(plants) }),
        fileName: 'plants.xlsx',
      });
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, totalCount);
      const res = await dispatch(fetchPlants(exportPayload));
      const plants = res?.payload?.plants || [];

      if (!plants.length) {
        toast.error('No data available to export.');
        return;
      }

      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatPlant(plants) }),
        fileName: 'plants.pdf',
        orientation: 'landscape',
      });
    } catch (err) {
      toast.error('Export PDF failed');
    }
  };

  const handleSample = () =>
    exportToExcel({
      columns: [{ key: 'plant_name', header: 'Plant Name' }],
      rows: [{}],
      fileName: 'plant_import_sample.xlsx',
    });

  const tableData = formatPlant(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <IModal
        toggleModal={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRow(null);
        }}>
        <PlantForm
          action={selectedRow ? 'EDIT' : 'CREATE'}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRow(null);
          }}
          fetchData={() => dispatch(fetchPlants(buildApiPayload()))}
          data={selectedRow}
        />
      </IModal>

      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Plants (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <button
            onClick={() => {
              setIsModalOpen(true);
              setSelectedRow(null);
            }}
            type='button'
            className='text-white bg-[#07163d] hover:bg-[#0a1a4a] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center cursor-pointer'>
            New Plant
          </button>
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

export default Plant;
