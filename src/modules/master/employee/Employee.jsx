import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import IModal from '../../../components/modal/Modal';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import CommonSearch from '../../../components/CommonSearch';
import FilterOption from '../../../components/FilterOption';
import { fetchEmployees, deleteEmployee, changeEmployeeStatus, uploadEmployeeData } from '../../../redux/employeeSlice';
import CommonTable from '../../../components/table/CommonTable';
import { fetchDepartments } from '../../../redux/departmentSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const columns = [
  { key: 'srNo', header: 'Sr No', render: (_, row, idx) => row.id || idx + 1 },
  {
    key: 'employeeName',
    header: 'Employee Name',
    render: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '-',
  },
  { key: 'employee_id', header: 'Employee ID', render: (_, row) => row.employee_id || '-' },
  { key: 'punch_id', header: 'Punch ID', render: (_, row) => row.punch_id || '-' },
  { key: 'email', header: 'Email', render: (_, row) => row.email || '-' },
  { key: 'phone_number', header: 'Phone Number', render: (_, row) => row.phone_number || '-' },
  { key: 'plant', header: 'Plant', render: (_, row) => row.plant_name || row.plant || '-' },
  { key: 'department', header: 'Department', render: (_, row) => row.department_name || row.department || '-' },
  {
    key: 'doj',
    header: 'Date of Joining',
    render: (_, row) => (row.date_of_joining ? dayjs(row.date_of_joining).format('YYYY-MM-DD') : '-'),
  },
  {
    key: 'dob',
    header: 'Date of Birth',
    render: (_, row) => (row.date_of_birth ? dayjs(row.date_of_birth).format('YYYY-MM-DD') : '-'),
  },
  { key: 'gender', header: 'Gender', render: (_, row) => row.gender || '-' },
  { key: 'vehicle_route_id', header: 'Vehicle Route ID', render: (_, row) => row.vehicle_route_id || '-' },
  { key: 'address', header: 'Address', render: (_, row) => row.address || '-' },
  {
    key: 'boarding_latitude',
    header: 'Boarding Latitude',
    render: (_, row) => Number(row.boarding_latitude ?? row.latitude).toFixed(7),
  },
  {
    key: 'boarding_longitude',
    header: 'Boarding Longitude',
    render: (_, row) => Number(row.boarding_longitude ?? row.longitude).toFixed(7),
  },
  { key: 'boarding_address', header: 'Boarding Address', render: (_, row) => row.boarding_address || '-' },
  {
    key: 'created_at',
    header: 'Created On',
    render: (_, row) => (row.created_at ? dayjs(row.created_at).format('YYYY-MM-DD HH:mm') : '-'),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_, row, setSelectedEmp, setIsStatusModalOpen) => (
      <button
        onClick={() => {
          setSelectedEmp(row);
          setIsStatusModalOpen(true);
        }}
        className={`text-white px-2 py-1 rounded text-sm ${
          row.active === 1 || (row.status && row.status.toString().toLowerCase() === 'active')
            ? 'bg-green-600'
            : 'bg-red-600'
        }`}>
        {row.active === 1 || (row.status && row.status.toString().toLowerCase() === 'active') ? 'Active' : 'Inactive'}
      </button>
    ),
  },
];

function formatEmp(data, offset = 0) {
  return data.map((emp, idx) => ({
    id: offset + idx + 1,
    actual_id: emp.id || '',
    first_name: emp.first_name || '',
    last_name: emp.last_name || '',
    employeeName: [emp.first_name, emp.last_name].filter(Boolean).join(' '),
    employee_id: emp.employee_id || '',
    punch_id: emp.punch_id || '',
    email: emp.email || '',
    phone_number: emp.phone_number || '',
    plant: emp.plant_name || emp.plant?.plant_name || emp.plant || '',
    department: emp.department_name || emp.department?.department_name || emp.department || '',
    date_of_joining: emp.date_of_joining ? dayjs(emp.date_of_joining).format('YYYY-MM-DD') : '',
    date_of_birth: emp.date_of_birth ? dayjs(emp.date_of_birth).format('YYYY-MM-DD') : '',
    created_at: emp.created_at ? dayjs(emp.created_at).format('YYYY-MM-DD HH:mm') : '',
    gender: emp.gender || '',
    vehicle_route_id: emp?.vehicle_route_name || emp.route?.name || '',
    address: emp.address || '',
    boarding_latitude:
      (emp.boarding_latitude ?? emp.latitude) ? Number(emp.boarding_latitude ?? emp.latitude).toFixed(7) : '',
    boarding_longitude:
      (emp.boarding_longitude ?? emp.longitude) ? Number(emp.boarding_longitude ?? emp.longitude).toFixed(7) : '',
    boarding_address: emp.boarding_address_Stop || '',
    status:
      emp.active === 1 || (typeof emp.status === 'string' && emp.status.trim().toLowerCase() === 'active')
        ? 'Active'
        : 'Inactive',
  }));
}

function Employee() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const company_id = localStorage.getItem('company_id');
  const { loading } = useSelector((s) => s.employee);
  const { departments } = useSelector((s) => s.department);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filterData, setFilterData] = useState({ company_id, department: '', employee_id: '' });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    dispatch(fetchDepartments({ limit: 10 }));
  }, [dispatch]);

  const [allEmployeeOptions, setAllEmployeeOptions] = useState([]);
  useEffect(() => {
    if (company_id)
      dispatch(fetchEmployees({ company_id, department: filterData.department, limit: 3500, page: 1 })).then((res) =>
        setAllEmployeeOptions(res?.payload?.employes || []),
      );
  }, [dispatch, company_id, filterData.department]);

  useEffect(() => {
    if (company_id) {
      dispatch(fetchEmployees(buildApiPayload())).then((res) => {
        setFilteredData(res?.payload?.employes || []);
        setTotalCount(res?.payload?.pagination?.total || res?.payload?.employes?.length || 0);
      });
    }
    // eslint-disable-next-line
  }, [dispatch, company_id, page, limit, searchQuery, filterData.department, filterData.employee_id]);

  const buildApiPayload = (customLimit) => {
    const payload = {
      company_id,
      department: filterData.department || undefined,
      employee_id: filterData.employee_id || undefined,
      search: searchQuery?.trim() || undefined,
      page: page + 1,
      limit: customLimit !== undefined ? customLimit : limit,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return payload;
  };

  const handleView = (row) => navigate('/master/employee/view', { state: { mode: 'view', rowData: row } });
  const handleEdit = (row) => navigate('/master/employee/edit', { state: { mode: 'edit', rowData: row } });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Employee?')) return;
    dispatch(deleteEmployee(id)).then((res) => {
      if (deleteEmployee.fulfilled.match(res)) {
        toast.success(res.payload || 'Employee deleted successfully!');
        dispatch(fetchEmployees(buildApiPayload()));
      } else toast.error(res.payload || 'Failed to delete Employee');
    });
  };

  const handleStatusChange = async () => {
    if (!selectedEmp) return;
    const newStatus = selectedEmp.status === 'Active' ? 2 : 1;
    dispatch(changeEmployeeStatus({ id: selectedEmp.actual_id, status: newStatus })).then((res) => {
      if (changeEmployeeStatus.fulfilled.match(res)) {
        toast.success(res.payload || 'Status updated!');
        setIsStatusModalOpen(false);
        dispatch(fetchEmployees(buildApiPayload()));
      } else toast.error(res.payload || 'Failed to update status.');
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchEmployees({ ...buildApiPayload(), page: 1 })).then((res) => {
      setFilteredData(res?.payload?.employes || []);
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
  };

  const handleFormReset = () => {
    setFilterData({ company_id, department: '', employee_id: '' });
    setSearchQuery('');
    setPage(0);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', file);
    dispatch(uploadEmployeeData(formData)).then((res) => {
      if (uploadEmployeeData.fulfilled.match(res)) {
        toast.success(res.payload?.message || 'Upload successful');
        if (fileInputRef.current) fileInputRef.current.value = null;
        dispatch(fetchEmployees(buildApiPayload()));
      } else toast.error(res.payload || 'Upload failed');
    });
  };

  const handleExport = async () => {
    const res = await dispatch(fetchEmployees({ ...buildApiPayload(totalCount), page: 1 }));
    const allEmployees = res?.payload?.employes || [];
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: formatEmp(allEmployees) }),
      fileName: 'employee_master.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchEmployees({ ...buildApiPayload(totalCount), page: 1 }));
    const allEmployees = res?.payload?.employes || [];
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: formatEmp(allEmployees) }),
      fileName: 'employee_master.pdf',
      orientation: 'landscape',
    });
  };

  const handleSample = () =>
    exportToExcel({
      columns: [
        { key: 'first_name', header: 'First Name' },
        { key: 'last_name', header: 'Last Name' },
        { key: 'employee_id', header: 'Employee ID' },
        { key: 'punch_id', header: 'Punch ID' },
        { key: 'email', header: 'Email' },
        { key: 'phone_number', header: 'Phone Number' },
        { key: 'plant', header: 'Plant' },
        { key: 'department', header: 'Department' },
        { key: 'date_of_joining', header: 'Date of Joining' },
        { key: 'date_of_birth', header: 'Date of Birth' },
        { key: 'gender', header: 'Gender' },
        { key: 'vehicle_route_id', header: 'Vehicle Route ID' },
        { key: 'address', header: 'Address' },
        { key: 'boarding_latitude', header: 'Boarding Latitude' },
        { key: 'boarding_longitude', header: 'Boarding Longitude' },
        { key: 'boarding_address', header: 'Boarding Address' },
      ],
      rows: [{}],
      fileName: 'employee_import_sample.xlsx',
    });

  const tableData = formatEmp(filteredData, page * limit);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>Employees (Total: {totalCount})</h1>
        <div className='flex gap-2'>
          <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <Link to='/master/employee/create'>
            <button className='text-white bg-[#07163d] hover:bg-[#0a1a4a] font-medium rounded-sm text-sm px-5 py-2.5'>
              New Employee
            </button>
          </Link>
        </div>
      </div>

      {isStatusModalOpen && selectedEmp && (
        <IModal open={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)}>
          <div className='p-4'>
            <h2 className='text-xl font-semibold mb-4 text-[#07163d]'>Change Employee Status</h2>
            <p className='mb-6'>
              Change status of <strong>{selectedEmp.employeeName}</strong> from <strong>{selectedEmp.status}</strong> to{' '}
              <strong>{selectedEmp.status === 'Active' ? 'Inactive' : 'Active'}</strong>?
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
          departments={departments}
          employeeIds={allEmployeeOptions}
          isDate={false}
        />
      </form>

      {loading ? (
        <div className='flex justify-center items-center mb-4'>
          <div className='text-[#07163d] font-medium text-lg py-2'>Loading...</div>
        </div>
      ) : (
        <CommonTable
          columns={columns.map((c) =>
            c.key === 'status'
              ? { ...c, render: (_, row) => c.render(_, row, setSelectedEmp, setIsStatusModalOpen) }
              : c,
          )}
          data={tableData}
          page={page}
          rowsPerPage={limit}
          totalCount={totalCount}
          onPageChange={(pageNum) => setPage(pageNum)}
          onRowsPerPageChange={(val) => {
            setLimit(val);
            setPage(0);
          }}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.actual_id)}
          onView={handleView}
        />
      )}
    </div>
  );
}

export default Employee;
