import React from 'react';
import ReportTable from '../../../components/table/ReportTable';
import { Link } from 'react-router-dom';

const columns = [
  { key: 'routeName', header: 'Vehicle Type' },
  { key: 'stopPointName', header: 'Vehicle Number' },
  { key: 'expectedTime', header: 'Driver Name' },
  { key: 'actualTime', header: 'Driver Number' },
  {
    key: 'gmap',
    header: 'Google-Map',
    render: (data) => (
      <a href={data} className='text-blue-700'>
        Google-Map
      </a>
    ),
  },
];

const data = [];

function Stopage() {
  const handleExport = () => {};
  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Stoppage Report</h1>
        <div className='flex gap-3'>
          <Link to='/report/vehicle-arrival-time/1'>
            <button
              type='submit'
              className='text-white bg-[#07163d] hover:bg-[rgb(7,22,61)] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer'>
              Back
            </button>
          </Link>
          <button
            type='button'
            className='text-white bg-[#1d31a6] hover:bg-[#1d31a6] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer'
            onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
      <ReportTable columns={columns} data={data} />
    </div>
  );
}

export default Stopage;
