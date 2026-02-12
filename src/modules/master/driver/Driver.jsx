import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import IModal from '../../../components/modal/Modal';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDrivers, deleteDriver, changeDriverStatus, uploadDriverData } from '../../../redux/driverSlice';
import FilterOption from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommonTable from '../../../components/table/CommonTable';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'srNo', header: 'Sr No', render: (_, row) => row.id },
  { key: 'driverName', header: 'Driver Name' },
  { key: 'driverEmail', header: 'Driver Email' },
  { key: 'phoneNumber', header: 'Phone Number' },
  { key: 'dateOfBirth', header: 'Date of Birth' },
  { key: 'address', header: 'Address' },
  { key: 'punchId', header: 'Punch ID' },
  { key: 'drivingLicenceNo', header: 'Driving Licence No' },
  { key: 'drivingLicenceIssueDate', header: 'Licence Issue Date' },
  { key: 'drivingLicenceExpiryDate', header: 'Licence Expiry Date' },
  { key: 'latitude', header: 'Latitude' },
  { key: 'longitude', header: 'Longitude' },
  { key: 'createdAt', header: 'Created At' },
  {
    key: 'status',
    header: 'Status',
    render: (_, row, setSelectedDriver, setIsStatusModalOpen) => (
      <button
        onClick={() => {
          setSelectedDriver(row);
          setIsStatusModalOpen(true);
        }}
        className={`text-white px-2 py-1 rounded text-sm ${row.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}>
        {row.status}
      </button>
    ),
  },
];

function formatDriver(data, offset = 0) {
  return data.map((driver, idx) => ({
    id: offset + idx + 1,
    actual_id: driver.id || '',
    driverName: [driver.first_name, driver.last_name].filter(Boolean).join(' '),
    driverEmail: driver.email || '',
    phoneNumber: driver.phone_number || '',
    dateOfBirth: driver.date_of_birth ? dayjs(driver.date_of_birth).format('YYYY-MM-DD') : '',
    address: driver.address || '',
    punchId: driver.punch_id || '',
    drivingLicenceNo: driver.driving_licence || '',
    drivingLicenceIssueDate: driver.driving_licence_issue_date
      ? dayjs(driver.driving_licence_issue_date).format('YYYY-MM-DD')
      : '',
    drivingLicenceExpiryDate: driver.driving_licence_expire_date
      ? dayjs(driver.driving_licence_expire_date).format('YYYY-MM-DD')
      : '',
    latitude: driver.latitude !== undefined && driver.latitude !== null ? Number(driver.latitude).toFixed(7) : '',
    longitude: driver.longitude !== undefined && driver.longitude !== null ? Number(driver.longitude).toFixed(7) : '',
    createdAt: driver.created_at ? dayjs(driver.created_at).format('YYYY-MM-DD HH:mm') : '',
    status:
      driver.active === 1 || (typeof driver.status === 'string' && driver.status.trim().toLowerCase() === 'active')
        ? 'Active'
        : 'Inactive',
    profilePhoto: driver.profile_photo || driver.profilePhoto || '',
  }));
}

function Driver() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const { vehicleRoutes } = useSelector((s) => s.vehicleRoute || {});

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [file, setFile] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filterData, setFilterData] = useState({ routes: [], vehicles: [] });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    dispatch(fetchVehicleRoutes({ limit: 150 }));
  }, [dispatch]);

  const buildApiPayload = (customPage = page + 1, customLimit = limit) => ({
    ...(filterData.routes?.length && { routes: JSON.stringify(filterData.routes) }),
    ...(filterData.vehicles?.length && { vehicles: JSON.stringify(filterData.vehicles) }),
    ...(searchQuery?.trim() && { search: searchQuery.trim() }),
    page: customPage,
    limit: customLimit,
  });

  useEffect(() => {
    dispatch(fetchDrivers(buildApiPayload())).then((res) => {
      setFilteredData(res?.payload?.drivers || res?.payload?.data || []);
      setTotalCount(res?.payload?.pagination?.total ?? res?.payload?.drivers?.length ?? 0);
    });
    // eslint-disable-next-line
  }, [dispatch, page, limit, searchQuery]);

  const handleView = (row) => navigate('/master/driver/view', { state: { mode: 'view', rowData: row } });
  const handleEdit = (row) => navigate('/master/driver/edit', { state: { mode: 'edit', rowData: row } });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Driver?')) return;
    dispatch(deleteDriver(id)).then((res) => {
      if (deleteDriver.fulfilled.match(res)) {
        toast.success(res.payload || 'Driver deleted successfully!');
        dispatch(fetchDrivers(buildApiPayload()));
      } else {
        toast.error(res.payload || 'Failed to delete driver');
      }
    });
  };

  const handleStatusChange = async () => {
    if (!selectedDriver) return;
    const newStatusId = selectedDriver.status === 'Active' ? 2 : 1;
    dispatch(changeDriverStatus({ id: selectedDriver.actual_id, newStatusId })).then((res) => {
      if (changeDriverStatus.fulfilled.match(res)) {
        toast.success(res.payload || 'Status updated!');
        setIsStatusModalOpen(false);
        dispatch(fetchDrivers(buildApiPayload()));
      } else {
        toast.error(res.payload || 'Failed to update status.');
      }
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchDrivers(buildApiPayload(1, limit))).then((res) => {
      setFilteredData(res?.payload?.drivers || res?.payload?.data || []);
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
  };

  const handleFormReset = () => {
    setFilterData({ routes: [], vehicles: [] });
    setSearchQuery('');
    setPage(0);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', file);

    dispatch(uploadDriverData(formData)).then((res) => {
      if (uploadDriverData.fulfilled.match(res)) {
        toast.success(res.payload?.message || 'Upload successful');
        if (fileInputRef.current) fileInputRef.current.value = null;
        dispatch(fetchDrivers(buildApiPayload()));
      } else {
        toast.error(res.payload || 'Upload failed');
      }
    });
  };

  const handleExport = async () => {
    try {
      const exportPayload = buildApiPayload(1, totalCount);
      const res = await dispatch(fetchDrivers(exportPayload));
      const drivers = res?.payload?.drivers || res?.payload?.data || [];
      exportToExcel({
        columns,
        rows: buildExportRows({ columns, data: formatDriver(drivers) }),
        fileName: 'driver_master.xlsx',
      });
    } catch {
      toast.error('Export failed');
    }
  };

  const handleExportPDF = async () => {
    try {
      const exportPayload = buildApiPayload(1, totalCount);
      const res = await dispatch(fetchDrivers(exportPayload));
      const drivers = res?.payload?.drivers || res?.payload?.data || [];
      exportToPDF({
        columns,
        rows: buildExportRows({ columns, data: formatDriver(drivers) }),
        fileName: 'driver_master.pdf',
        orientation: 'landscape',
      });
    } catch {
      toast.error('Export PDF failed');
    }
  };

  const handleSample = () =>
    exportToExcel({
      columns: [
        { key: 'first_name', header: 'First Name' },
        { key: 'last_name', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone_number', header: 'Phone Number' },
        { key: 'date_of_birth', header: 'Date of Birth' },
        { key: 'address', header: 'Address' },
        { key: 'punch_id', header: 'Punch ID' },
        { key: 'driving_licence', header: 'Driving Licence No' },
        { key: 'driving_licence_issue_date', header: 'Licence Issue Date' },
        { key: 'driving_licence_expire_date', header: 'Licence Expiry Date' },
        { key: 'latitude', header: 'Latitude' },
        { key: 'longitude', header: 'Longitude' },
      ],
      rows: [{}],
      fileName: 'driver_import_sample.xlsx',
    });

  const tableData = formatDriver(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Drivers (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/master/driver/create'>
            <button className='text-white bg-[#07163d] hover:bg-[#0a1a4a] font-medium rounded-sm text-sm px-5 py-2.5'>
              New Driver
            </button>
          </Link>
        </div>
      </div>

      {isStatusModalOpen && selectedDriver && (
        <IModal open={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
          <div className='p-4'>
            <h2 className='text-xl font-semibold mb-4 text-[#07163d]'>Change Driver Status</h2>
            <p className='mb-6'>
              Change status of <strong>{selectedDriver.driverName}</strong> from{' '}
              <strong>{selectedDriver.status}</strong> to{' '}
              <strong>{selectedDriver.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
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
          isDate={false}
        />
      </form>

      <CommonTable
        columns={columns.map((c) =>
          c.key === 'status'
            ? { ...c, render: (_, row) => c.render(_, row, setSelectedDriver, setIsStatusModalOpen) }
            : c,
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
      />
    </div>
  );
}

export default Driver;
