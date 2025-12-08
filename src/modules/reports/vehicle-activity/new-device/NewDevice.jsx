import moment from 'moment';
import tabs from '../components/Tab';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import CustomTab from '../components/CustomTab';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleMissingInflux } from '../../../../redux/vehicleActivitySlice';

const columns = [
  { key: 'vehicle_type', header: 'Vehicle Type', render: (_ignored, row) => row.vehicle_type || 'Bus' },
  { key: 'vehicle_number', header: 'Vehicle Number', render: (_ignored, row) => row.vehicle_number || '-' },
  { key: 'driver_name', header: 'Driver Name', render: (_ignored, row) => row.driver_name || '-' },
  { key: 'driver_number', header: 'Driver Number', render: (_ignored, row) => row.driver_number || '-' },
  { key: 'route_details', header: 'Route Details', render: (_ignored, row) => row.route_details || '-' },
  { key: 'imei_number', header: 'IMEI Number', render: (_ignored, row) => row.imei_number || '-' },
  { key: 'sim_number', header: 'Sim Number', render: (_ignored, row) => row.sim_number || '-' },
  {
    key: 'installation_date',
    header: 'Installation Date',
    render: (_, row) => (row.installation_date ? moment(row.installation_date).format('DD-MM-YYYY hh:mm A') : '-'),
  },
  { key: 'reason', header: 'Reason', render: (_ignored, row) => row.reason || '-' },
];

function NewDevice() {
  const company_id = localStorage.getItem('company_id');
  const dispatch = useDispatch();

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(15);
  const [vehicleData, setVehicleData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (company_id) {
        setLoading(true);
        const response = await dispatch(fetchVehicleMissingInflux({ company_id, page: page, limit }));
        console.log(response);
        if (response?.payload?.success) {
          setVehicleData(response.payload?.data || []);
          setTotalCount(response.payload?.total || 0);
        } else {
          setVehicleData([]);
          setTotalCount(0);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, company_id, page, limit]);

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>New Device Report</h1>
      </div>
      <ReportTable
        columns={columns}
        data={vehicleData}
        loading={loading}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[5, 10, 20]}
        totalCount={totalCount}
      />
    </div>
  );
}

export default NewDevice;