import moment from 'moment';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../../components/FilterOption';
import ReportTable from '../../../../components/table/ReportTable';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { fetchMapHistoryData } from '../../../../redux/vehicleActivitySlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';

const columns = [
  { key: 'busName', header: 'Bus Name', render: (_, r) => r?.busName || r?.vehicle_number || '' },
  { key: 'imei', header: 'IMEI', render: (_, r) => r?.imei || '' },
  { key: 'speed', header: 'Speed', render: (_, r) => r?.speed || '' },
  { key: 'latitude', header: 'Latitude', render: (_, r) => r?.latitude || '' },
  { key: 'longitude', header: 'Longitude', render: (_, r) => r?.longitude || '' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_, r) =>
      r?.latitude && r?.longitude ? (
        <a
          href={`https://maps.google.com/?q=${r.latitude},${r.longitude}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-700 underline'>
          G-Map
        </a>
      ) : (
        '-'
      ),
  },
  {
    key: 'date',
    header: 'Date',
    render: (_, r) => (r?.date ? moment(r.date).format('YYYY-MM-DD HH:mm:ss') : ''),
  },
];

function MapHistory() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const company_id = localStorage.getItem('company_id');
  const { routes: vehicles } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {});
  const { mapHistoryData } = useSelector((s) => s?.mapHistory || {});

  const buildApiPayload = () => {
    const payload = { company_id };
    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    return payload;
  };

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchMapHistoryData({ company_id, page: page + 1, limit })).then(
        (res) => res?.payload?.status === 200 && setFilteredData(res?.payload?.data || [])
      );
  }, [dispatch, company_id, page, limit]);

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'map_history_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'map_history_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchMapHistoryData({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
      if (res?.payload?.status === 200) {
        toast.success(res?.payload?.message);
        setFilteredData(res?.payload?.data);
      } else toast.error(res?.payload?.message);
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], fromDate: '', toDate: '' });
  };

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Map History</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={vehicles}
        />
      </form>
      <ReportTable
        columns={columns}
        data={filteredData}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={mapHistoryData?.pagination?.total}
      />
    </div>
  );
}

export default MapHistory;
