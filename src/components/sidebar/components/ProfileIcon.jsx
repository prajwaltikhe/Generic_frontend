import { Link } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';

function ProfileIcon({ isProfileMenuOpen }) {
  return (
    <div className='relative group'>
      <PersonIcon className='cursor-pointer text-[2.5rem]' />
      {isProfileMenuOpen && (
        <div className='absolute bg-[#1d31a6] shadow-lg z-50 min-w-[160px] top-[-1.2rem] left-[5.5rem] text-[14px] py-[5px]'>
          <div className='flex flex-col p-3 gap-2'>
            <Link to='/profile' className='text-[16px]'>
              Profile Update
            </Link>
            <Link to='/user/profile' className='text-[16px]'>
              Logout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileIcon;
