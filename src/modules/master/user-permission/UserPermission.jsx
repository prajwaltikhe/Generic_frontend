import { Link, useNavigate } from 'react-router-dom';
import CommanTable from '../../../components/table/CommonTable';

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'genID', header: 'Gen ID' },
  { key: 'department', header: 'Department' },
  { key: 'plant', header: 'Plant' },
  { key: 'approvedBy', header: 'Approved By' },
  { key: 'approvedon', header: 'Approved On' },
];

const data = [
  {
    id: 1,
    name: 'John Doe',
    genID: 123456789,
    department: 'Sales',
    plant: 'Plant A',
    approvedBy: 'John Doe',
    approvedon: '2021-01-01',
  },
  {
    id: 2,
    name: 'Jane Smith',
    genID: 987654321,
    department: 'Marketing',
    plant: 'Plant B',
    approvedBy: 'Jane Smith',
    approvedon: '2021-02-01',
  },
];

function UserPermission() {
  const navigate = useNavigate();

  const handleEdit = (row) => {
    navigate(`/master/user-permission/create`, { state: row });
  };

  const handleDelete = (row) => {
    alert(`Deleting ${row.name}`);
    window.location.reload();
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center sm:flex-row flex-col'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>User Permission Detail</h1>

        <div className='flex justify-center gap-2'>
          <Link to='/master/user-permission/create'>
            <button
              type='button'
              className='text-white bg-[#07163d] hover:bg-[#07163d] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
              Add Operator
            </button>
          </Link>
          <button
            type='button'
            className='text-white bg-[#1d31a6] hover:bg-[#1d31a6] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'
            onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
      <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4'>
        <CommanTable columns={columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

export default UserPermission;
