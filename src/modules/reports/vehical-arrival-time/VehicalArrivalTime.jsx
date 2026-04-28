import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../components/FilterOption';
import ReportTable from '../../../components/table/ReportTable';
import CustomTab from '../vehicle-activity/components/CustomTab';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchVehicleRoutes } from '../../../redux/vehicleRouteSlice';
import { fetchAllVehicles } from '../../../redux/vehiclesSlice';
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
  const { allVehicles } = useSelector((state) => state?.vehicles || []);

  // Read status from URL query parameter on component mount
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl && statusOptions.some((opt) => opt.value === statusFromUrl)) {
      Promise.resolve().then(() => {
        setFilterData((prev) => ({ ...prev, status: statusFromUrl }));
      });
    }
  }, [searchParams]);

  const tabs = useMemo(
    () => shifts.map((shift) => ({ name: shift.name, path: `/report/vehicle-arrival-time/${shift.id}` })),
    [],
  );

  const currentPathId = location.pathname.split('/').pop();

  const columns = useMemo(() => {
    const isNightShift = currentPathId === '2f7d76b8-87a9-4dc1-822a-a39e99b314e9';
    return [
      { key: 'date_only', header: 'Date', render: (_v, r) => r.date_only || '-' },
      { key: 'time_only', header: 'Time', render: (_v, r) => r.time_only || '-' },
      { key: 'vehicle_number', header: 'Vehicle Number', render: (_v, row) => row?.vehicle_number || '-' },
      { key: 'route_name', header: 'Route Details', render: (_v, row) => row?.route_name || '-' },
      { key: 'driver_name', header: 'Driver Name', render: (_v, row) => row?.driver_name || '-' },
      { key: 'driver_number', header: 'Driver Number', render: (_v, row) => row?.driver_number || '-' },
      ...(isNightShift ? [] : [
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
      ]),
      {
        key: 'lat_long_formatted',
        header: 'Lat-Long',
        render: (_v, row) => row?.lat_long_formatted || '-',
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
  }, [currentPathId]);

  useEffect(() => {
    if (company_id) {
      dispatch(fetchAllVehicles({ limit: 1000 }));
    }
  }, [dispatch, company_id]);

  const loadRouteVehicleOptions = useCallback(async ({ page: optionPage = 1, limit: optionLimit = 50, search = '' }) => {
    const res = await dispatch(
      fetchVehicleRoutes({
        page: optionPage,
        limit: optionLimit,
        ...(company_id && { company_id }),
        ...(search?.trim() && { search: search.trim() }),
      }),
    );
    const routes = res?.payload?.routes || [];
    const pagination = res?.payload?.pagination;
    return {
      items: routes,
      hasMore: pagination ? pagination.hasNextPage : false,
    };
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

  const formatRecords = useCallback((records) => {
    return (records || []).map((r) => {
      let lat_long_formatted = '-';
      if (r?.lat_long) {
        const val = r.lat_long.replace('{', '').replace('}', '');
        const parts = val.split(',');
        if (parts.length === 2) lat_long_formatted = `${parts[1]}, ${parts[0]}`;
        else lat_long_formatted = val;
      }

      return {
        ...r,
        date_only: r.date ? moment(r.date).format('YYYY-MM-DD') : '-',
        time_only: r.date ? moment(r.date).format('hh:mm:ss A') : '-',
        lat_long_formatted,
      };
    });
  }, []);

  useEffect(() => {
    if (company_id)
      dispatch(fetchVehicleArrivalData({ ...buildApiPayload(), page: page + 1, limit })).then((res) => {
        if (res?.payload?.success) setFilteredData(formatRecords(res?.payload?.data || []));
      });
  }, [dispatch, company_id, page, limit, buildApiPayload, formatRecords]);

const handleExport = async () => {
  const res = await dispatch( fetchVehicleArrivalData({ ...buildApiPayload(), page: 1, limit: totalCount || 1000, }));

  if (res?.payload?.success) {
    const allData = formatRecords(res.payload.data || []);

    exportToExcel({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'vehicle_arrival_time_report.xlsx',
    });
  }
};

  const handleExportPDF = async () => {
  const res = await dispatch(
    fetchVehicleArrivalData({ ...buildApiPayload(), page: 1, limit: totalCount || 1000, })
  );

  if (res?.payload?.success) {
    const allData = formatRecords(res.payload.data || []);

    exportToPDF({
      columns,
      rows: buildExportRows({ columns, data: allData }),
      fileName: 'vehicle_arrival_time_report.pdf',
      orientation: 'landscape',
    });
  }
};
  const handleFormSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchVehicleArrivalData(buildApiPayload())).then((res) => {
      if (res?.payload?.success) {
        toast.success(res?.payload?.message);
        setFilteredData(formatRecords(res?.payload?.data || []));
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
          vehicles={allVehicles}
          routeVehicleLoader={loadRouteVehicleOptions}
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
