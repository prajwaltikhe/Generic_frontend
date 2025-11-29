import { Link } from 'react-router-dom';

function ViewViolationMap() {
  const location = '22.5726,88.3639';

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Violation Map View</h1>
        <div className='flex'>
          <Link to='/report/overspeed'>
            <button
              type='button'
              className='text-white bg-[#07163d] hover:bg-[#07163d] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
              Return
            </button>
          </Link>
        </div>
      </div>
      <div style={{ width: '100%', height: '400px' }}>
        <iframe
          title='Google Map'
          width='100%'
          height='100%'
          frameBorder='0'
          style={{ border: 0 }}
          src={`https://www.google.com/maps?q=${location}&output=embed`}
          allowFullScreen></iframe>
      </div>
    </div>
  );
}

export default ViewViolationMap;
