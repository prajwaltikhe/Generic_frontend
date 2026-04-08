import { useMemo, useState } from 'react';

const initialForm = {
  empId: '',
  employeeName: '',
  department: '',
  password: '',
  active: 'Yes',
  userType: 'Operator',
};

const userTypeOptions = ['Admin', 'Operator', 'Display'];

const staticRows = [
  {
    id: 1,
    name: 'Alex Martin',
    genId: '1234567',
    plant: 'Plant A',
    department: 'Production',
    userType: 'Operator',
    approvedBy: 'System Admin',
    approvedOn: '2026-04-07',
  },
  {
    id: 2,
    name: 'Sara Lee',
    genId: '8877441',
    plant: 'Plant B',
    department: 'Logistics',
    userType: 'Display',
    approvedBy: 'Plant Manager',
    approvedOn: '2026-04-05',
  },
];

function UserPermission() {
  const [formData, setFormData] = useState(initialForm);

  const filteredRows = useMemo(() => {
    return staticRows.filter((row) => {
      const empMatch =
        !formData.empId.trim() || row.genId.toLowerCase().includes(formData.empId.trim().toLowerCase());
      const nameMatch =
        !formData.employeeName.trim() ||
        row.name.toLowerCase().includes(formData.employeeName.trim().toLowerCase());
      const deptMatch =
        !formData.department.trim() ||
        row.department.toLowerCase().includes(formData.department.trim().toLowerCase());
      const typeMatch = !formData.userType || row.userType === formData.userType;
      return empMatch && nameMatch && deptMatch && typeMatch;
    });
  }, [formData.department, formData.empId, formData.employeeName, formData.userType]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setFormData(initialForm);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold text-[#07163d] mb-4'>User Management</h1>

      <div className='bg-white rounded-sm border-t-3 border-[#07163d] p-4 mb-4'>
        <h2 className='text-lg font-semibold text-[#07163d] mb-4'>User Permission</h2>
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
              <input
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                type='text'
                name='department'
                value={formData.department}
                onChange={handleChange}
                placeholder='Enter department'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
              <input
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter password'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Active</label>
              <select
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                name='active'
                value={formData.active}
                onChange={handleChange}>
                <option value='Yes'>Yes</option>
                <option value='No'>No</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>User Type</label>
              <select
                className='w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#07163d]'
                name='userType'
                value={formData.userType}
                onChange={handleChange}>
                {userTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
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
            <button
              type='button'
              className='px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer'>
              Add New
            </button>
          </div>
        </form>
      </div>

      <div className='bg-white rounded-sm border-t-3 border-[#07163d] overflow-x-auto'>
        <table className='w-full min-w-[900px] text-sm text-left text-gray-700'>
          <thead className='bg-[#d9e7f8] text-[#07163d]'>
            <tr>
              <th className='px-3 py-2 font-semibold'>Name</th>
              <th className='px-3 py-2 font-semibold'>Gen.ID</th>
              <th className='px-3 py-2 font-semibold'>Plant</th>
              <th className='px-3 py-2 font-semibold'>Department</th>
              <th className='px-3 py-2 font-semibold'>User Type</th>
              <th className='px-3 py-2 font-semibold'>Approved by</th>
              <th className='px-3 py-2 font-semibold'>Approved on</th>
              <th className='px-3 py-2 font-semibold text-center'>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.id} className='border-t border-gray-200 hover:bg-gray-50'>
                  <td className='px-3 py-2'>{row.name}</td>
                  <td className='px-3 py-2'>{row.genId}</td>
                  <td className='px-3 py-2'>{row.plant}</td>
                  <td className='px-3 py-2'>{row.department}</td>
                  <td className='px-3 py-2'>{row.userType}</td>
                  <td className='px-3 py-2'>{row.approvedBy}</td>
                  <td className='px-3 py-2'>{row.approvedOn}</td>
                  <td className='px-3 py-2'>
                    <div className='flex items-center justify-center gap-2'>
                      <button
                        type='button'
                        className='px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'>
                        Edit
                      </button>
                      <button
                        type='button'
                        className='px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 cursor-pointer'>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className='text-center py-8 text-gray-500'>
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
