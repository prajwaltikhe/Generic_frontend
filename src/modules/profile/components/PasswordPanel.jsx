import { TextField } from '@mui/material';

export default function PasswordPanel() {
  return (
    <div className='mt-4'>
      {['Current', 'New', 'Confirm'].map((label, i) => (
        <TextField
          key={label}
          label={`${label} Password`}
          name={label === 'Current' ? 'currentPassword' : label === 'New' ? 'newPassword' : 'confirmPassword'}
          type='password'
          fullWidth
          size='small'
          variant='outlined'
          sx={i < 2 ? { mb: 3 } : undefined}
        />
      ))}
      <button
        type='submit'
        className='text-white bg-[#07163d] hover:bg-[#07163d] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer mt-4'>
        Update
      </button>
    </div>
  );
}
