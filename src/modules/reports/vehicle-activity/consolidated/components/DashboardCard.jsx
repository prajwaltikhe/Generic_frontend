import { Paper, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from 'react-router-dom';

const DashboardCard = ({ title, value, color }) => {
  return (
    <Paper
      className='p-4 flex flex-col justify-between w-full h-18 rounded-lg shadow-md'
      style={{ backgroundColor: color }}>
      <div className='flex items-center gap-3'>
        <Typography variant='h4' className='text-white font-bold flex-shrink-0'>
          {value}
        </Typography>
        <div className='flex flex-col justify-center'>
          <Typography variant='body2' className='text-white font-medium'>
            {title}
          </Typography>
          <div className='flex items-center gap-1 mt-1'>
            <Link
              className='text-[13px] text-white underline hover:text-blue-200'
              to='/master/vehicle'
              style={{ textDecoration: 'underline' }}>
              More Info
            </Link>
            <ArrowForwardIcon sx={{ fontSize: '15px' }} className='text-white' />
          </div>
        </div>
      </div>
    </Paper>
  );
};

export default DashboardCard;
