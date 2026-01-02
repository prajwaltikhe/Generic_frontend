import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import CustomTab from '../vehicle-activity/components/CustomTab';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchVehicleArrivalData } from '../../../redux/vehicleReportSlice';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../utils/exportUtils';

const shifts = [
  { id: '2f7d76b8-87a9-4dc1-822a-a39e99b314e9', name: 'Night General Shift' },
  { id: '1b0b7594-c88c-470b-a956-f8f79918fd36', name: 'Day General Shift' },
  { id: 'ba9c950e-26d6-469d-9743-79ef8944e59a', name: 'First Shift' },
  { id: '723349b1-747e-4852-b37c-df8fb8849c7c', name: 'Second Shift' },
  { id: '29630493-b9d8-4358-8cde-2a606e50cf3a', name: 'Third Shift' },
];

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'On Time', value: 'ON_TIME' },
  { label: 'Late Arrival', value: 'LATE' },
];

function VehicalArrivalTime() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filterData, setFilterData] = useState({ vehicles: [], routes: [], fromDate: '', toDate: '', status: 'all' });
  const [filteredData, setFilteredData] = useState([]);

  const company_id = localStorage.getItem('company_id');
  const { VehicleArrivalTimeReport, loading, error } = useSelector((state) => state?.vehicleReport);
  const { routes: vehicleRoutes } = useSelector((state) => state?.vehicleRoute?.vehicleRoutes || {});

  // Read status from URL query parameter on component mount
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && statusOptions.some((opt) => opt.value === statusFromUrl)) {
      setFilterData((prev) => ({ ...prev, status: statusFromUrl }));
    }
  }, [searchParams]);

  const tabs = useMemo(
    () => shifts.map((shift) => ({ name: shift.name, path: `/report/vehicle-arrival-time/${shift.id}` })),
    []
  );

  const currentPathId = location.pathname.split('/').pop();

  const columns = useMemo(() => {
    return [
      {
        key: 'date',
        header: 'Date',
        render: (value) => (value ? moment(value).format('YYYY-MM-DD') : '-'),
      },
      { key: 'vehicle_number', header: 'Vehicle Number', render: (_v, row) => row?.vehicle_number || '-' },
      { key: 'route_details', header: 'Route Details', render: (_v, row) => row?.route_name || '-' },
      { key: 'driver_name', header: 'Driver Name', render: (_v, row) => row?.driver_name || '-' },
      { key: 'driver_number', header: 'Driver Number', render: (_v, row) => row?.driver_number || '-' },
      {
        key: 'target_arrival_time',
        header: 'Target Arrival Time',
        render: (_v, row) => row?.target_arrival_time || '-',
      },
      {
        key: 'actual_arrival_time',
        header: 'Actual Arrival Time',
        render: (_v, row) => row?.actual_arrival_time || '-',
      },
      {
        key: 'lat_long',
        header: 'Lat-Long',
        render: (_v, row) => {
          let val = row?.lat_long;
          if (val) {
            val = val.replace('{', '').replace('}', '');
            const parts = val.split(',');
            if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
            return val;
          }
          return '-';
        },
      },
      {
        key: 'gmap',
        header: 'G-Map',
        render: (_v, row) => {
          let val = row?.lat_long;
          if (val) {
            val = val.replace('{', '').replace('}', '');
            const parts = val.split(',');
            if (parts.length === 2) {
              const lat = parts[1];
              const lng = parts[0];
              return (
                <a
                  href={`https://maps.google.com/?q=${lat},${lng}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  style={{ color: '#2563eb', textDecoration: 'underline' }}>
                  View
                </a>
              );
            }
          }
          return '-';
        },
      },
    ];
  }, []);

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 100 }));
  }, [dispatch, company_id]);

  const buildApiPayload = useCallback(() => {
    const payload = { company_id };
    if (currentPathId && shifts.some((s) => s.id === currentPathId)) payload.shift_id = currentPathId;

    if (filterData.vehicles?.length) payload.vehicles = JSON.stringify(filterData.vehicles);
    if (filterData.routes?.length) payload.routes = JSON.stringify(filterData.routes);
    if (filterData.fromDate) payload.from_date = filterData.fromDate;
    if (filterData.toDate) payload.to_date = filterData.toDate;
    if (filterData.status && filterData.status !== 'all') payload.status = filterData.status;
    return payload;
  }, [company_id, currentPathId, filterData]);

  useEffect(() => {
    if (company_id)
      dispatch(fetchVehicleArrivalData({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
        if (res?.payload?.success) setFilteredData(Array.isArray(res?.payload?.data) ? res.payload.data : []);
      });
  }, [dispatch, company_id, page, limit, buildApiPayload]);

  const handleExport = () =>
    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'vehicle_arrival_time_report.xlsx',
    });

  const handleExportPDF = () =>
    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: filteredData }),
      fileName: 'vehicle_arrival_time_report.pdf',
      orientation: 'landscape',
    });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchVehicleArrivalData(buildApiPayload())).then((res) => {
      if (res?.payload?.success) {
        toast.success(res?.payload?.message);
        setFilteredData(Array.isArray(res?.payload?.data) ? res.payload.data : []);
      } else {
        toast.error(res?.payload?.message);
      }
    });
  };

  const handleFormReset = () => {
    setFilterData({ vehicles: [], routes: [], fromDate: '', toDate: '', status: 'all' });
  };

  const totalCount = VehicleArrivalTimeReport?.pagination?.total || filteredData.length;

  return (
    <div className='w-full h-full p-2'>
      <CustomTab tabs={tabs} />
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Vehical Arrival Time Report (Total: {totalCount})</h1>
      <form onSubmit={handleFormSubmit}>
        <FilterOption
          handleExport={handleExport}
          handleExportPDF={handleExportPDF}
          handleFormSubmit={handleFormSubmit}
          filterData={filterData}
          setFilterData={setFilterData}
          handleFormReset={handleFormReset}
          vehicles={vehicleRoutes}
          routes={vehicleRoutes}
          statuses={statusOptions}
        />
      </form>
      <ReportTable
        columns={columns}
        data={filteredData}
        loading={loading}
        error={error}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        limitOptions={[10, 15, 20, 25, 30]}
        totalCount={totalCount}
      />
    </div>
  );
}

export default VehicalArrivalTime;
