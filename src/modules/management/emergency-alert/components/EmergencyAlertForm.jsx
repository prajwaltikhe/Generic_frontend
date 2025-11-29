import { useState } from 'react';
import { TextField } from '@mui/material';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function EmergencyAlertForm() {
  const navigate = useNavigate();
  const { state: data } = useLocation();
  const [action, setAction] = useState(data?.actionTaken || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await ApiService.put(
      `${APIURL.EMERGENCY}/${data.emergencyID}`,
      { action_taken: action },
      { company_id: localStorage.getItem('company_id') }
    );
    if (res.success) navigate('/management/emergency-alerts');
    else alert(res.message || 'Something went wrong.');
  };

  return (
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>Emergency Alert Details</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={handleSubmit}>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            <div>
              {[
                ['Date', data?.date],
                ['Vehicle Number', data?.vehicleNo],
                ['Route', `${data?.routeName} (Route #${data?.routeNo})`],
                ['Driver Name', data?.driverName],
                ['Location', data?.latitude && data?.longitude ? `${data.latitude}, ${data.longitude}` : 'N/A'],
                ['Title', data?.title],
              ].map(([label, value]) => (
                <div className='mb-2' key={label}>
                  <span className='font-semibold'>{label}:</span> {value}
                </div>
              ))}
              <div className='mb-2'>
                <span className='font-semibold'>Message:</span>
                <div className='mt-1 p-2 bg-gray-100 rounded'>{data?.message}</div>
              </div>
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Action Taken <span className='text-red-500'>*</span>
              </label>
              <TextField
                fullWidth
                value={action}
                onChange={(e) => setAction(e.target.value)}
                size='small'
                placeholder='Enter action taken'
                required
                multiline
                rows={4}
              />
            </div>
            <div className='flex justify-end gap-4 mt-4 items-center lg:col-span-2'>
              <button
                type='submit'
                className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                Save
              </button>
              <Link to='/management/emergency-alerts'>
                <button
                  type='button'
                  className='text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                  Back
                </button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmergencyAlertForm;
