import CommanTable from '../../../components/table/CommonTable';
import { Link, useNavigate } from 'react-router-dom';

const columns = [
  { key: 'id', header: 'Vehicle Route ID' },
  { key: 'shift', header: 'Shift' },
  { key: 'createdAt', header: 'Created At' },
];

const data = [
  { id: 1, shift: 'Shift 1', createdAt: '2020-01-01 00:00:00' },
  { id: 2, shift: 'Shift 2', createdAt: '2020-01-01 00:00:00' },
  { id: 3, shift: 'Shift 3', createdAt: '2020-01-01 00:00:00' },
];

function RouteStopPoint() {
  const navigate = useNavigate();

  const handleEdit = (row) => {
    navigate('/management/vehicle-stop-point/create', { state: row, action: 'EDIT' });
  };

  const handleDelete = (row) => {
    alert(`Deleting ${row.name}`);
    window.location.reload();
  };

  return (
    <div>
      <div className='w-full h-full p-2'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Route Stop point</h1>
          <Link to='/management/vehicle-stop-point/create'>
            <button
              type='button'
              className='text-white bg-[#07163d] hover:bg-[#07163d] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
              New Stop Points
            </button>
          </Link>
        </div>
        <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4'>
          <CommanTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}

export default RouteStopPoint;
