import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
import { fetchDepartments } from '../../../redux/departmentSlice';
import { fetchEmployees } from '../../../redux/employeeSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';
import IModal from '../../../components/modal/Modal';
import FilterOption from '../../../components/FilterOption';
import CommonSearch from '../../../components/CommonSearch';
import CommonTable from '../../../components/table/CommonTable';

const columns = [
  { key: 'srNo', header: 'Sr No', render: (_, row) => row.id },
  { key: 'employeeName', header: 'Employee Name' },
  { key: 'employee_id', header: 'Employee ID' },
  { key: 'punch_id', header: 'Punch ID' },
  { key: 'email', header: 'Email' },
  { key: 'phone_number', header: 'Phone Number' },
  { key: 'plant', header: 'Plant' },
  { key: 'department', header: 'Department' },
  { key: 'doj', header: 'Date of Joining' },
  { key: 'dob', header: 'Date of Birth' },
  { key: 'gender', header: 'Gender' },
  { key: 'vehicle_route_id', header: 'Vehicle Route ID' },
  { key: 'address', header: 'Address' },
  { key: 'boarding_latitude', header: 'Boarding Latitude' },
  { key: 'boarding_longitude', header: 'Boarding Longitude' },
  { key: 'boarding_address', header: 'Boarding Address' },
  { key: 'created_at', header: 'Created On' },
  {
    key: 'status',
    header: 'Status',
    render: (_, row, setSelectedEmp, setIsStatusModalOpen) => (
      <button
        onClick={() => {
          setSelectedEmp(row);
          setIsStatusModalOpen(true);
        }}
        className={`text-white px-2 py-1 rounded text-sm ${row.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}>
        {row.status}
      </button>
    ),
  },
];

function formatEmp(data, offset = 0) {
  return data.map((emp, idx) => ({
    id: offset + idx + 1,
    actual_id: emp.id || emp.actual_id || '',
    first_name: emp.first_name || '',
    last_name: emp.last_name || '',
    employeeName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
    employee_id: emp.employee_id || '',
    punch_id: emp.punch_id || '',
    email: emp.email || '',
    phone_number: emp.phone_number || '',
    plant: emp.plant_name || (typeof emp.plant === 'string' ? emp.plant : ''),
    department: emp.department_name || (typeof emp.department === 'string' ? emp.department : ''),
    doj: emp.date_of_joining ? dayjs(emp.date_of_joining).format('YYYY-MM-DD') : '',
    dob: emp.date_of_birth ? dayjs(emp.date_of_birth).format('YYYY-MM-DD') : '',
    created_at: emp.created_at ? dayjs(emp.created_at).format('YYYY-MM-DD HH:mm') : '',
    gender: emp.gender || '',
    vehicle_route_id: emp.vehicle_route_id || '',
    address: emp.address || '',
    boarding_latitude: emp.boarding_latitude || '',
    boarding_longitude: emp.boarding_longitude || '',
    boarding_address: emp.boarding_address || '',
    status: emp.active === 1 || emp.status === 'Active' ? 'Active' : 'Inactive',
  }));
}

function Employee() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const company_id = localStorage.getItem('company_id');
  const { employees } = useSelector((s) => s.employee);
  const { departments } = useSelector((s) => s.department);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filterData, setFilterData] = useState({ company_id, fromDate: '', toDate: '', department: '', employee: '' });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    dispatch(fetchDepartments({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    if (company_id) {
      dispatch(fetchEmployees(buildApiPayload())).then((res) => {
        setFilteredData(res?.payload?.employes || []);
        setTotalCount(res?.payload?.pagination?.total || res?.payload?.employes?.length || 0);
      });
    }
    // eslint-disable-next-line
  }, [dispatch, company_id, page, limit, searchQuery]);

  const buildApiPayload = (customLimit) => {
    const payload = {
      company_id,
      department: filterData.department || undefined,
      employee: filterData.employee || undefined,
      from_date: filterData.fromDate || undefined,
      to_date: filterData.toDate || undefined,
      search: searchQuery?.trim() || undefined,
      page: 1,
      limit: customLimit !== undefined ? customLimit : limit,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    return payload;
  };

  const handleView = (row) => navigate('/master/employee/view', { state: { mode: 'view', rowData: row } });
  const handleEdit = (row) => navigate('/master/employee/edit', { state: { mode: 'edit', rowData: row } });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Employee?')) return;
    try {
      const res = await ApiService.delete(`${APIURL.EMPLOYEE}/${id}`);
      if (res.success) {
        toast.success('Employee deleted successfully!');
        dispatch(fetchEmployees(buildApiPayload()));
      } else toast.error(res.message || 'Failed to delete Employee');
    } catch {
      toast.error('Delete failed.');
    }
  };

  const handleStatusChange = async () => {
    if (!selectedEmp) return;
    try {
      const newStatus = selectedEmp.status === 'Active' ? 2 : 1;
      const res = await ApiService.put(`${APIURL.EMPLOYEE}/${selectedEmp.actual_id}`, { active: newStatus });
      if (res.success) {
        toast.success('Status updated!');
        setIsStatusModalOpen(false);
        dispatch(fetchEmployees(buildApiPayload()));
      } else toast.error('Failed to update status.');
    } catch {
      toast.error('Status update failed.');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    dispatch(fetchEmployees(buildApiPayload())).then((res) => {
      setFilteredData(res?.payload?.employes || []);
      setTotalCount(res?.payload?.pagination?.total || 0);
    });
  };

  const handleFormReset = () => {
    setFilterData({ company_id, fromDate: '', toDate: '', department: '', employee: '' });
    setSearchQuery('');
    setPage(0);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    const formData = new FormData();
    formData.append('file', file);
    const res = await ApiService.postFormData(`${APIURL.UPLOAD}?folder=employee`, formData);
    if (res.success) {
      toast.success(res.message);
      if (fileInputRef.current) fileInputRef.current.value = null;
      dispatch(fetchEmployees(buildApiPayload()));
    } else toast.error(res.message || 'Upload failed');
  };

  // Use fetchEmployees for export, with limit 2000, and keep code short
  const handleExport = async () => {
    const res = await dispatch(fetchEmployees(buildApiPayload(2000)));
    const allEmployees = res?.payload?.employes || [];
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: formatEmp(allEmployees) }),
      fileName: 'employee_master.xlsx',
    });
  };

  const handleExportPDF = async () => {
    const res = await dispatch(fetchEmployees(buildApiPayload(2000)));
    const allEmployees = res?.payload?.employes || [];
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: formatEmp(allEmployees) }),
      fileName: 'employee_master.pdf',
      orientation: 'landscape',
    });
  };

  // handleSample function similar to Vehicle.jsx
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
        <h1 className='text-2xl font-bold text-[#07163d]'>Employee (Total: {totalCount})</h1>
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
          employees={employees?.employes}
        />
      </form>

      <CommonTable
        columns={columns.map((c) =>
          c.key === 'status' ? { ...c, render: (_, row) => c.render(_, row, setSelectedEmp, setIsStatusModalOpen) } : c
        )}
        data={tableData}
        page={page}
        rowsPerPage={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={(val) => {
          setLimit(val);
          setPage(1);
        }}
        onEdit={handleEdit}
        onDelete={(row) => handleDelete(row.actual_id)}
        onView={handleView}
      />
    </div>
  );
}

export default Employee;
