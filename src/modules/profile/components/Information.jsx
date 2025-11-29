import { TextField } from '@mui/material';
import { useFormik } from 'formik';

export default function Information() {
  const formik = useFormik({
    initialValues: {
      firstName: 'One',
      lastName: 'Touch',
      email: 'company@mailinator.com',
      phoneNumber: '1234567890',
      file: null,
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  return (
    <form className='mt-3' onSubmit={formik.handleSubmit}>
      <div className='grid grid-cols-2 gap-4'>
        <TextField
          label='First Name'
          size='small'
          name='firstName'
          value={formik.values.firstName}
          onChange={formik.handleChange}
          fullWidth
          sx={{ mb: 3 }}
        />
        <TextField
          label='Last Name'
          size='small'
          name='lastName'
          value={formik.values.lastName}
          onChange={formik.handleChange}
          fullWidth
          sx={{ mb: 3 }}
        />
      </div>
      <TextField
        label='Email'
        name='email'
        value={formik.values.email}
        onChange={formik.handleChange}
        fullWidth
        size='small'
        disabled
        sx={{ mb: 3 }}
      />
      <TextField
        label='Phone Number'
        name='phoneNumber'
        value={formik.values.phoneNumber}
        onChange={formik.handleChange}
        fullWidth
        size='small'
        sx={{ mb: 3 }}
      />
      <input
        type='file'
        name='file'
        className='block w-full text-sm text-gray-500'
        onChange={(e) => {
          formik.setFieldValue('file', e.currentTarget.files[0]);
        }}
      />
      <button
        type='submit'
        className='text-white bg-[#07163d] hover:bg-[#07163d] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer mt-4'>
        Update
      </button>
    </form>
  );
}
