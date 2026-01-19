import moment from 'moment';
import { toast } from 'react-toastify';
import { useEffect, useState, useRef, useCallback } from 'react';
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
  { key: 'status', header: 'Status', render: (_, r) => r?.status || '' },
  { key: 'latitude', header: 'Latitude', render: (_, r) => r?.latitude || '' },
  { key: 'longitude', header: 'Longitude', render: (_, r) => r?.longitude || '' },
  {
    key: 'gmap',
    header: 'G-Map',
    render: (_, r) =>
      r?.latitude && r?.longitude && r.latitude !== '-' && r.longitude !== '-' ? (
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

function formatMapHistoryRows(points = [], vehicle = {}) {
  return points.map((p, idx) => ({
    id: idx + 1,
    ...p,
    busName: vehicle.vehicle_number || '-',
    imei: vehicle.imei || '-',
    speed: p.speed ?? '-',
    latitude: p.lat ?? p.latitude ?? '-',
    longitude: p.lng ?? p.longitude ?? '-',
    date: p.timestamp_ist ?? p.date ?? null,
    status: p.status ?? '-',
  }));
}

function MapHistory() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicle_id: '', fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const company_id = localStorage.getItem('company_id');
  const { routes: vehicles } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || {});
  const { mapHistoryData } = useSelector((s) => s?.vehicleActivity || {});

  const dataFilter = useRef(filterData);

  const buildApiPayload = useCallback(() => {
    const payload = { company_id };
    const d = dataFilter.current;
    if (d.vehicle_id) payload.vehicle_id = d.vehicle_id;
    if (d.fromDate) payload.from_date = d.fromDate;
    if (d.toDate) payload.to_date = d.toDate;
    return payload;
  }, [company_id]);

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  useEffect(() => {
    if (company_id && dataFilter.current.vehicle_id) {
      setIsLoading(true);
      dispatch(fetchMapHistoryData({ ...buildApiPayload(), page: page + 1, limit }))
        .then((res) => {
          console.log(res.payload);
          if (res?.payload?.success) {
            const points = res.payload.points || [];
            const vehicle = res.payload.vehicle || {};
            setFilteredData(formatMapHistoryRows(points, vehicle));
          } else {
            setFilteredData([]);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [dispatch, company_id, page, limit, buildApiPayload]);

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
    if (!filterData.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }
    dataFilter.current = filterData;
    setIsLoading(true);
    setPage(0);
    dispatch(fetchMapHistoryData({ ...buildApiPayload(), page: 1, limit }))
      .then((res) => {
        if (res?.payload?.success) {
          const points = res.payload.points || [];
          const vehicle = res.payload.vehicle || {};
          setFilteredData(formatMapHistoryRows(points, vehicle));
          toast.success('Data fetched successfully');
        } else {
          setFilteredData([]);
          toast.error(res?.payload?.message || 'Failed to fetch data');
        }
      })
      .finally(() => setIsLoading(false));
  };

  const handleFormReset = () => {
    setFilterData({ vehicle_id: '', fromDate: '', toDate: '' });
    dataFilter.current = { vehicle_id: '', fromDate: '', toDate: '' };
    setFilteredData([]);
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
          singleVehicle={true}
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
        totalCount={mapHistoryData?.total_points || 0}
        loading={isLoading}
      />
    </div>
  );
}

export default MapHistory;