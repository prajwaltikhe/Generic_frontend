import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../../services/ApiService';
import { APIURL } from '../../../constants';

function UserPermission() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ plants: [], departments: [], create_roles: [] });
  const [formData, setFormData] = useState({
    empId: '',
    employeeName: '',
    department: '',
    plant: '',
    userType: '',
  });
  const userTypeOptions = useMemo(
    () => (meta.create_roles || []).map((r) => ({ id: r, label: r[0].toUpperCase() + r.slice(1) })),
    [meta.create_roles]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [metaRes, listRes] = await Promise.all([
        ApiService.get(`${APIURL.PORTAL_USERS}/meta`),
        ApiService.get(`${APIURL.PORTAL_USERS}`),
      ]);
      setMeta({
        plants: metaRes?.data?.plants || [],
        departments: metaRes?.data?.departments || [],
        create_roles: metaRes?.data?.create_roles || [],
      });
      setUsers(listRes?.data?.users || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load user management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    return users.filter((row) => {
      const empMatch =
        !formData.empId.trim() ||
        String(row.employee_id || '')
          .toLowerCase()
          .includes(formData.empId.trim().toLowerCase());
      const nameMatch =
        !formData.employeeName.trim() ||
        String(row.name || '')
          .toLowerCase()
          .includes(formData.employeeName.trim().toLowerCase());
      const deptMatch = !formData.department || String(row.department_id || '') === String(formData.department);
      const plantMatch = !formData.plant || String(row.plant_id || '') === String(formData.plant);
      const typeMatch = !formData.userType || row.role === formData.userType;
      return empMatch && nameMatch && deptMatch && plantMatch && typeMatch;
    });
  }, [users, formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () =>
    setFormData({
      empId: '',
      employeeName: '',
      department: '',
      plant: '',
      userType: '',
    });

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  const toggleStatus = async (row) => {
    setSubmitting(true);
    try {
      const res = await ApiService.patch(`${APIURL.PORTAL_USERS}/${row.id}/status`, { is_active: !row.is_active });
      toast.success(res?.message || 'Status updated');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>User Management</h1>
        <button
          type='button'
          onClick={() => navigate('/master/user-permission/create')}
          className='px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer'>
          Add New User
        </button>
      </div>

      <div className='bg-white rounded-sm border-t-3 border-[#07163d] p-4 mb-4'>
        <h2 className='text-lg font-semibold text-[#07163d] mb-1'>Search Users</h2>
        <p className='text-xs text-gray-500 mb-4'>Use filters to search existing portal users.</p>
        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Emp. ID</label>
              <input
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                type='text'
                name='empId'
                value={formData.empId}
                onChange={handleChange}
                placeholder='Enter employee id'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Employee Name</label>
              <input
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                type='text'
                name='employeeName'
                value={formData.employeeName}
                onChange={handleChange}
                placeholder='Enter employee name'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Department</label>
              <select
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                name='department'
                value={formData.department}
                onChange={handleChange}>
                <option value=''>All departments</option>
                {meta.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Plant</label>
              <select
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                name='plant'
                value={formData.plant}
                onChange={handleChange}>
                <option value=''>All plants</option>
                {meta.plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>User Type</label>
              <select
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                name='userType'
                value={formData.userType}
                onChange={handleChange}>
                <option value=''>All user types</option>
                {userTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='flex items-center gap-2 mt-4'>
            <button
              type='submit'
              className='px-4 py-2 text-sm rounded bg-[#07163d] text-white hover:bg-[#0a1a4a] cursor-pointer'>
              Search
            </button>
            <button
              type='button'
              onClick={handleReset}
              className='px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className='bg-white rounded-sm border-t-3 border-[#07163d] overflow-x-auto'>
        <table className='w-full min-w-[900px] text-sm text-left text-gray-700'>
          <thead className='bg-[#d9e7f8] text-[#07163d]'>
            <tr>
              <th className='px-3 py-2 font-semibold'>Name</th>
              <th className='px-3 py-2 font-semibold'>Employee ID</th>
              <th className='px-3 py-2 font-semibold'>Plant</th>
              <th className='px-3 py-2 font-semibold'>Department</th>
              <th className='px-3 py-2 font-semibold'>User Type</th>
              <th className='px-3 py-2 font-semibold'>Status</th>
              <th className='px-3 py-2 font-semibold'>Created by</th>
              <th className='px-3 py-2 font-semibold'>Created at (IST)</th>
              <th className='px-3 py-2 font-semibold text-center'>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className='text-center py-8 text-gray-500'>
                  Loading users...
                </td>
              </tr>
            ) : filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} className='border-t border-gray-200 hover:bg-gray-50'>
                  <td className='px-3 py-2'>{row.name}</td>
                  <td className='px-3 py-2'>{row.employee_id}</td>
                  <td className='px-3 py-2'>{row.plant_name}</td>
                  <td className='px-3 py-2'>{row.department_name}</td>
                  <td className='px-3 py-2'>{row.role_label}</td>
                  <td className='px-3 py-2'>
                    <button
                      type='button'
                      disabled={submitting}
                      onClick={() => toggleStatus(row)}
                      className={`px-2 py-1 text-xs rounded cursor-pointer ${
                        row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {row.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className='px-3 py-2'>{row.created_by || '-'}</td>
                  <td className='px-3 py-2'>{row.created_at_ist || '-'}</td>
                  <td className='px-3 py-2'>
                    <div className='flex items-center justify-center gap-2'>
                      <button
                        type='button'
                        onClick={() => navigate('/master/user-permission/create', { state: { row } })}
                        className='px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'>
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className='text-center py-8 text-gray-500'>
                  No user records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserPermission;
