import { useEffect, useState } from 'react';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { state: editData, pathname } = useLocation();

  const isView = pathname.includes('view');
  const [title, setTitle] = useState(editData?.title || '');
  const [mssg, setMssg] = useState(editData?.message || '');
  const [empData, setEmpData] = useState([]);
  const [selectedValue, setSelectedValue] = useState(
    editData?.employees
      ? editData.employees.map((emp) => ({
          label: `${emp.first_name} ${emp.last_name}`,
          value: emp.id,
        }))
      : []
  );
  const senderName = editData?.senderName || user?.name || '';

  useEffect(() => {
    ApiService.get(APIURL.EMPLOYEE)
      .then((res) =>
        res.success ? setEmpData(res.data.employes) : alert(res.message || 'Failed to fetch employee data')
      )
      .catch(() => alert('Something went wrong while fetching employee data'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      sender_id: user?.id || user,
      message: mssg,
      employee_ids: selectedValue.map((item) => item.value),
    };
    const res = editData?.id
      ? await ApiService.put(`${APIURL.ANNOUNCEMENT}/${editData.id}`, payload)
      : await ApiService.post(APIURL.ANNOUNCEMENT, payload);
    res.success ? navigate('/management/announcement') : alert(res.message || 'Something went wrong.');
  };

  const employeeNames =
    selectedValue.length > 0 ? selectedValue.map((emp) => emp.label).join(', ') : editData?.employeeName || '-';

  return (
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>{editData ? 'Edit Announcement' : 'Send Announcement'}</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={handleSubmit}>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            {/* Announcement Title */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {columns[0].header} <span className='text-red-500'>*</span>
              </label>
              <TextField
                type='text'
                id='title'
                name='title'
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size='small'
                placeholder='Enter Title'
                required
                disabled={!!editData && isView}
              />
            </div>
            {/* Sender Name */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>{columns[1].header}</label>
              <TextField
                type='text'
                id='senderName'
                name='senderName'
                fullWidth
                value={senderName}
                size='small'
                disabled
              />
            </div>
            {/* Employee Name */}
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
                  options={empData.map((item) => ({
                    label: `${item.first_name} ${item.last_name}`,
                    value: item.id,
                  }))}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  getOptionLabel={(option) => option.label}
                  size='small'
                  renderInput={(params) => <TextField {...params} label='Select User' />}
                  onChange={(_, val) => setSelectedValue(val)}
                  value={selectedValue}
                />
              )}
            </div>
            {/* Message */}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {columns[3].header} <span className='text-red-500'>*</span>
              </label>
              {isView ? (
                <TextField value={mssg} fullWidth size='small' multiline rows={4} disabled />
              ) : (
                <textarea
                  id='message'
                  rows='4'
                  className='block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Write your messages here...'
                  value={mssg}
                  onChange={(e) => setMssg(e.target.value)}
                  required
                />
              )}
            </div>
          </div>
          {/* Actions at the end */}
          <div className='flex justify-end gap-4 mt-8'>
            {!isView && (
              <button
                type='submit'
                className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                Save
              </button>
            )}
            <Link to='/management/announcements'>
              <button
                type='button'
                className='text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                Back
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AnnouncementForm;
