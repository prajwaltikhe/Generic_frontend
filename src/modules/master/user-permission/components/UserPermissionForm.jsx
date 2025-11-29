import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Autocomplete, TextField } from '@mui/material';

const departments = [
  { label: 'The Shawshank Redemption', value: '1994' },
  { label: 'Department', value: '1994' },
];
const plants = [
  { label: 'The Shawshank Redemption', value: '1994' },
  { label: 'Department', value: '1994' },
];

const fields = [
  { label: 'Employee ID', name: 'employeeId', type: 'text' },
  { label: 'Name', name: 'name', type: 'text' },
  { label: 'Password', name: 'password', type: 'password' },
  { label: 'Email', name: 'email', type: 'email' },
];

export default function UserPermissionForm() {
  const rowData = useLocation().state;
  const [formValues, setFormValues] = useState({
    employeeId: '',
    name: '',
    department: '',
    plant: '',
    password: '',
    email: '',
  });

  const handleChange = (e) => setFormValues((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSelect = (key, val) => setFormValues((f) => ({ ...f, [key]: val ? val.value : '' }));

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log(rowData ? 'edit' : 'create', formValues, rowData);
  };

  return (
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>Operator Details</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={handleFormSubmit}>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            {fields.map((f) => (
              <div key={f.name}>
                <label className='block mb-2 text-sm font-medium text-gray-900'>
                  {f.label} <span className='text-red-500'>*</span>
                </label>
                <TextField
                  size='small'
                  type={f.type}
                  name={f.name}
                  id={f.name}
                  fullWidth
                  placeholder={`Enter ${f.label}`}
                  required
                  value={formValues[f.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Select Department <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={departments}
                isOptionEqualToValue={(a, b) => a.value === b}
                getOptionLabel={(o) => o.label}
                size='small'
                onChange={(_, v) => handleSelect('department', v)}
                value={departments.find((opt) => opt.value === formValues.department) || null}
                renderInput={(params) => <TextField {...params} label='Select Department' />}
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Select Plant <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={plants}
                isOptionEqualToValue={(a, b) => a.value === b}
                getOptionLabel={(o) => o.label}
                size='small'
                onChange={(_, v) => handleSelect('plant', v)}
                value={plants.find((opt) => opt.value === formValues.plant) || null}
                renderInput={(params) => <TextField {...params} label='Select Plant' />}
              />
            </div>
          </div>
          <div className='flex justify-end gap-4 mt-4'>
            <button
              type='submit'
              className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
              Save
            </button>
            <Link to='/master/user-permission'>
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
