import { useEffect, useState } from 'react';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { useLocation, useNavigate } from 'react-router-dom';
import { Autocomplete, TextField } from '@mui/material';
import { useAuth } from '../../../../context/AuthContext';

const columns = [
  { key: 'title', header: 'Announcement Title' },
  { key: 'senderName', header: 'Sender Name' },
  { key: 'employeeName', header: 'Employee Name' },
  { key: 'message', header: 'Message' },
];

function AnnouncementForm() {
  const { user } = useAuth();
  const { state: editData, pathname } = useLocation();
  const navigate = useNavigate();
  const isView = pathname.includes('view');

  const [title, setTitle] = useState(editData?.title ?? '');
  const [message, setMessage] = useState(editData?.message ?? '');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(
    editData?.employees?.map((emp) => ({
      label: [emp.first_name, emp.last_name].filter(Boolean).join(' '),
      value: emp.id,
    })) ?? []
  );

  const senderName = editData?.senderName ?? 'Super Admin';

  useEffect(() => {
    ApiService.get(`${APIURL.EMPLOYEE}?limit=3000`)
      .then((res) => {
        if (res?.success && Array.isArray(res.data?.employes)) {
          setEmployeeOptions(
            res.data.employes.map((emp) => ({
              label: [emp.first_name, emp.last_name].filter(Boolean).join(' '),
              value: emp.id,
            }))
          );
        } else {
          alert(res?.message || 'Failed to fetch employee data');
        }
      })
      .catch(() => alert('Something went wrong while fetching employee data'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      sender_id: user,
      message,
      employee_ids: selectedEmployees.map((item) => item.value),
    };
    const apiFn = editData?.id
      ? ApiService.put(`${APIURL.ANNOUNCEMENT}/${editData.id}`, payload)
      : ApiService.post(APIURL.ANNOUNCEMENT, payload);

    const res = await apiFn;
    if (res?.success) {
      navigate('/management/announcement');
    } else {
      alert(res?.message || 'Something went wrong.');
    }
  };

  const employeeNames =
    selectedEmployees.length > 0 ? selectedEmployees.map((emp) => emp.label).join(', ') : editData?.employeeName || '-';

  return (
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>
        {editData ? (isView ? 'View Announcement' : 'Edit Announcement') : 'Send Announcement'}
      </h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={handleSubmit} autoComplete='off'>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {columns[0].header} <span className='text-red-500'>*</span>
              </label>
              <TextField
                id='title'
                name='title'
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size='small'
                placeholder='Enter Title'
                required
                disabled={isView}
                inputProps={{ maxLength: 255 }}
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {columns[1].header} <span className='text-red-500'>*</span>
              </label>
              <TextField id='senderName' name='senderName' fullWidth value={senderName} size='small' disabled />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {columns[2].header} <span className='text-red-500'>*</span>
              </label>
              {isView ? (
                <TextField value={employeeNames} fullWidth size='small' disabled />
              ) : (
                <Autocomplete
                  multiple
                  disablePortal
                  options={employeeOptions}
                  isOptionEqualToValue={(o, v) => o.value === v.value}
                  getOptionLabel={(option) => option.label}
                  size='small'
                  renderInput={(params) => <TextField {...params} label='Select Employee' required />}
                  onChange={(_, val) => setSelectedEmployees(val)}
                  value={selectedEmployees}
                />
              )}
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {columns[3].header} <span className='text-red-500'>*</span>
              </label>
              {isView ? (
                <TextField value={message} fullWidth size='small' multiline rows={4} disabled />
              ) : (
                <TextField
                  id='message'
                  name='message'
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  size='small'
                  placeholder='Write your messages here...'
                  multiline
                  minRows={4}
                  required
                  inputProps={{ maxLength: 1000 }}
                />
              )}
            </div>
          </div>
          <div className='flex justify-end gap-4 mt-8'>
            {!isView && (
              <button
                type='submit'
                className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                Save
              </button>
            )}
            <button
              type='button'
              className='text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'
              onClick={() => navigate('/management/announcements')}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AnnouncementForm;
