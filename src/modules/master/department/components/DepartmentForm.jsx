import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, updateDepartment } from '../../../../redux/departmentSlice';

const DepartmentForm = ({ action, onClose, data, fetchData }) => {
  const dispatch = useDispatch();
  const { selectedDepartment } = useSelector((state) => state.department);

  const [formValues, setFormValues] = useState({ name: '', file: null });

  useEffect(() => {
    if (action === 'EDIT' && selectedDepartment) {
      setFormValues({ name: selectedDepartment.department_name || '', file: null });
    } else {
      setFormValues({ name: '', file: null });
    }
  }, [action, selectedDepartment]);

  const handleInputChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'file') {
      setFormValues({ ...formValues, file: files[0] });
    } else {
      setFormValues({ ...formValues, [name]: value });
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    let payload = {
      department_name: formValues.name,
    };
    try {
      if (action === 'CREATE') {
        await dispatch(createDepartment(payload)).unwrap();
      } else if (action === 'EDIT' && selectedDepartment?.id) {
        await dispatch(updateDepartment({ id: selectedDepartment?.id, payload })).unwrap();
      }
      await fetchData();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      alert('An unexpected error occurred.');
    }
  };

  return (
    <>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>{data ? 'Details' : 'New'} Department</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <form className='py-3 px-5' onSubmit={handleFormSubmit} encType='multipart/form-data'>
        <div className='mb-4'>
          <label htmlFor='name' className='block text-gray-700 font-bold mb-2'>
            Department Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='name'
            className='w-full p-2 border border-gray-300 rounded-sm'
            placeholder='Enter department name'
            name='name'
            value={formValues.name || data?.name || ''}
            onChange={handleInputChange}
          />
        </div>

        <div className='flex justify-end'>
          <button
            type='submit'
            className='text-white bg-[#07163d] hover:bg-[#07163d] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
            Save
          </button>
          <button
            type='button'
            onClick={onClose}
            className='text-white bg-gray-500 focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
            Close
          </button>
        </div>
      </form>
    </>
  );
};

export default DepartmentForm;
