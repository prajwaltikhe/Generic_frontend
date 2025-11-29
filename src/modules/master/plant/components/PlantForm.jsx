import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { createPlant, updatePlant } from '../../../../redux/plantSlice';

const PlantForm = ({ action, onClose, data, fetchData }) => {
  const dispatch = useDispatch();

  const { selectedPlant } = useSelector((state) => state.plant);

  const [formValues, setFormValues] = useState({ name: '' });

  useEffect(() => {
    if (action === 'EDIT' && selectedPlant) {
      setFormValues({ name: selectedPlant.plant_name });
    } else {
      setFormValues({ name: '' });
    }
  }, [action, selectedPlant]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const payload = { plant_name: formValues.name.trim() };

    try {
      if (action === 'CREATE') {
        await dispatch(createPlant(payload)).unwrap();
      } else if (action === 'EDIT') {
        await dispatch(updatePlant({ plantID: selectedPlant.id, payload })).unwrap();
      }

      setFormValues({ name: '' });
      await fetchData();
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      alert(error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>{data ? 'Details' : 'New'} Plant</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <form className='py-3 px-5' onSubmit={handleFormSubmit}>
        <div className='mb-4'>
          <label htmlFor='name' className='block text-gray-700 font-bold mb-2'>
            Plant Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='name'
            className='w-full p-2 border border-gray-300 rounded-sm'
            placeholder='Enter plant name'
            name='name'
            value={formValues.name}
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

export default PlantForm;
