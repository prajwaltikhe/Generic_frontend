import L from 'leaflet';
import moment from 'moment';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import FilterOption from '../../../../components/FilterOption';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { fetchMapHistoryData } from '../../../../redux/vehicleActivitySlice';
import { MapContainer, TileLayer, Popup, useMap } from 'react-leaflet';
import { ScaleControl, ZoomControl, Polyline, CircleMarker } from 'react-leaflet';
import { exportToExcel, exportToPDF, buildExportRows } from '../../../../utils/exportUtils';

const DEFAULT_CENTER = [20.5937, 78.9629];
const LIMIT = 100000;
const MAX_CIRCLE_MARKERS = 200;

const STATUS_COLORS = {
  Running: { cls: 'bg-green-100 text-green-700', color: '#22c55e' },
  Idle: { cls: 'bg-yellow-100 text-yellow-700', color: '#facc15' },
  Parked: { cls: 'bg-red-100 text-red-700', color: '#ef4444' },
  Offline: { cls: 'bg-blue-100 text-blue-700', color: '#2563eb' },
  New: { cls: 'bg-gray-100 text-gray-700', color: '#6b7280' },
  Unknown: { cls: 'bg-gray-100 text-gray-700', color: '#6b7280' },
};

const POLYLINE_OPTIONS = {
  color: '#3b82f6',
  weight: 4,
  opacity: 0.8,
  lineCap: 'round',
  lineJoin: 'round',
};

const CIRCLE_MARKER_OPTIONS = {
  color: '#3b82f6',
  fillColor: '#60a5fa',
  fillOpacity: 0.9,
  weight: 2,
};

const COLUMNS = [
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
  { key: 'date', header: 'Date', render: (_, r) => (r?.date ? moment(r.date).format('YYYY-MM-DD HH:mm:ss') : '') },
];

const getCls = (status) => STATUS_COLORS[status?.trim?.()]?.cls || STATUS_COLORS.Unknown.cls;

const formatMapHistoryRows = (points = [], vehicle = {}) =>
  points.map((p, idx) => ({
    id: idx + 1,
    busName: vehicle.vehicle_number || '-',
    imei: vehicle.imei || '-',
    speed: p.speed ?? '-',
    latitude: p.lat ?? p.latitude ?? '-',
    longitude: p.lng ?? p.longitude ?? '-',
    date: p.timestamp_ist ?? p.date ?? null,
    status: p.status ?? '-',
  }));

const isValidPoint = (p) => p.latitude && p.longitude && p.latitude !== '-' && p.longitude !== '-';

const PointPopup = memo(({ point, header }) => (
  <div className='min-w-[220px] max-w-[280px]'>
    {header && (
      <div
        className={`flex items-center gap-2 mb-2 pb-2 border-b -mx-3 -mt-3 px-3 pt-3 rounded-t ${header.borderCls} ${header.bgCls}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${header.iconBgCls}`}>{header.icon}</div>
        <div className={`font-bold ${header.textCls}`}>{header.label}</div>
      </div>
    )}
    <div className={`flex items-center justify-between ${header ? 'mb-2' : 'mb-2 pb-2 border-b border-gray-200'}`}>
      <div className='font-bold text-base text-gray-800'>{point.busName}</div>
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCls(point.status)}`}>
        {point.status}
      </span>
    </div>
    <div className='space-y-1.5 text-sm'>
      <div className='flex justify-between'>
        <span className='text-gray-500'>IMEI:</span>
        <span className='font-medium text-gray-700'>{point.imei}</span>
      </div>
      <div className='flex justify-between'>
        <span className='text-gray-500'>Speed:</span>
        <span className='font-medium text-gray-700'>{point.speed}</span>
      </div>
      <div className='flex justify-between'>
        <span className='text-gray-500'>Latitude:</span>
        <span className='font-medium text-gray-700'>{point.latitude}</span>
      </div>
      <div className='flex justify-between'>
        <span className='text-gray-500'>Longitude:</span>
        <span className='font-medium text-gray-700'>{point.longitude}</span>
      </div>
      <div className='flex justify-between'>
        <span className='text-gray-500'>Date:</span>
        <span className='font-medium text-gray-700'>
          {point.date ? moment(point.date).format('YYYY-MM-DD HH:mm:ss') : '-'}
        </span>
      </div>
      <div className='pt-2 mt-2 border-t border-gray-200'>
        <a
          href={`https://maps.google.com/?q=${point.latitude},${point.longitude}`}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm'>
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z'
              clipRule='evenodd'
            />
          </svg>
          Open in Google Maps
        </a>
      </div>
    </div>
  </div>
));
PointPopup.displayName = 'PointPopup';

const MapBounds = memo(({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points?.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [parseFloat(p.latitude), parseFloat(p.longitude)]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [map, points]);
  return null;
});
MapBounds.displayName = 'MapBounds';

const Legend = memo(({ count }) => (
  <div className='absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-4 py-3 border border-gray-200'>
    <div className='flex items-center gap-3'>
      <div className='flex items-center gap-2'>
        <div className='w-5 h-1.5 bg-blue-500 rounded-full' />
        <span className='text-sm text-gray-600'>Route Path</span>
      </div>
      <div className='text-sm font-semibold text-gray-800'>
        <span className='text-blue-600'>{count.toLocaleString()}</span> points
      </div>
    </div>
  </div>
));
Legend.displayName = 'Legend';

const LoadingOverlay = memo(() => (
  <div className='absolute inset-0 bg-white/70 z-[1000] flex items-center justify-center'>
    <div className='flex flex-col items-center gap-3'>
      <div className='w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin' />
      <span className='text-sm text-gray-600 font-medium'>Loading map data...</span>
    </div>
  </div>
));
LoadingOverlay.displayName = 'LoadingOverlay';

const EmptyState = memo(() => (
  <div className='absolute inset-0 bg-gray-50 z-[500] flex items-center justify-center'>
    <div className='text-center'>
      <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center'>
        <FaMapMarkerAlt className='text-gray-400' size={32} />
      </div>
      <p className='text-gray-500 font-medium'>No map data available</p>
      <p className='text-gray-400 text-sm mt-1'>Select a vehicle and date range to view history</p>
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

function MapHistory() {
  const dispatch = useDispatch();
  const [filterData, setFilterData] = useState({ vehicle_id: '', fromDate: '', toDate: '' });
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const company_id = localStorage.getItem('company_id');
  const vehicles = useSelector((s) => s?.vehicleRoute?.vehicleRoutes?.routes || []);
  const dataFilter = useRef(filterData);

  useEffect(() => {
    if (company_id) dispatch(fetchVehicleRoutes({ company_id, limit: 150 }));
  }, [dispatch, company_id]);

  const validMapPoints = useMemo(() => filteredData.filter(isValidPoint), [filteredData]);

  const mapCenter = useMemo(() => {
    if (validMapPoints.length > 0) {
      const lat = parseFloat(validMapPoints[0].latitude);
      const lng = parseFloat(validMapPoints[0].longitude);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return DEFAULT_CENTER;
  }, [validMapPoints]);

  const polylinePositions = useMemo(
    () => validMapPoints.map((p) => [parseFloat(p.latitude), parseFloat(p.longitude)]),
    [validMapPoints],
  );

  const displayPoints = useMemo(() => {
    if (validMapPoints.length <= MAX_CIRCLE_MARKERS) return validMapPoints;
    const step = Math.ceil(validMapPoints.length / MAX_CIRCLE_MARKERS);
    return validMapPoints.filter((_, i) => i % step === 0);
  }, [validMapPoints]);

  const fetchData = useCallback(async () => {
    if (!dataFilter.current.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        company_id,
        vehicle_id: dataFilter.current.vehicle_id,
        ...(dataFilter.current.fromDate && { from_date: dataFilter.current.fromDate }),
        ...(dataFilter.current.toDate && { to_date: dataFilter.current.toDate }),
        page: 1,
        limit: LIMIT,
      };
      const res = await dispatch(fetchMapHistoryData(payload));
      if (res?.payload?.success) {
        setFilteredData(formatMapHistoryRows(res.payload.points || [], res.payload.vehicle || {}));
        toast.success('Data fetched successfully');
      } else {
        setFilteredData([]);
        toast.error(res?.payload?.message || 'Failed to fetch data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, company_id]);

  const handleFormSubmit = useCallback(
    (e) => {
      e.preventDefault();
      dataFilter.current = filterData;
      fetchData();
    },
    [filterData, fetchData],
  );

  const handleFormReset = useCallback(() => {
    setFilterData({ vehicle_id: '', fromDate: '', toDate: '' });
    dataFilter.current = { vehicle_id: '', fromDate: '', toDate: '' };
    setFilteredData([]);
  }, []);

  const handleExport = useCallback(
    () =>
      exportToExcel({
        columns: COLUMNS,
        rows: buildExportRows({ columns: COLUMNS, data: filteredData }),
        fileName: 'map_history_report.xlsx',
      }),
    [filteredData],
  );

  const handleExportPDF = useCallback(
    () =>
      exportToPDF({
        columns: COLUMNS,
        rows: buildExportRows({ columns: COLUMNS, data: filteredData }),
        fileName: 'map_history_report.pdf',
        orientation: 'landscape',
      }),
    [filteredData],
  );

  return (
    <div className='w-full h-full p-2 flex flex-col'>
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
          singleVehicle
        />
      </form>

      <div
        className='flex-1 mt-4 rounded-xl overflow-hidden shadow-lg border border-gray-200 relative'
        style={{ minHeight: '500px' }}>
        {isLoading && <LoadingOverlay />}
        {!isLoading && validMapPoints.length === 0 && <EmptyState />}

        <MapContainer
          center={mapCenter}
          zoom={5}
          minZoom={3}
          maxZoom={18}
          className='w-full h-full'
          zoomControl={false}
          scrollWheelZoom
          style={{ background: '#e5e7eb', height: '100%', width: '100%' }}>
          <ZoomControl position='bottomright' />
          <ScaleControl position='bottomleft' />
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapBounds points={validMapPoints} />

          {polylinePositions.length > 1 && <Polyline positions={polylinePositions} pathOptions={POLYLINE_OPTIONS} />}

          {displayPoints.map((point, idx) => (
            <CircleMarker
              key={`circle-${point.id}-${idx}`}
              center={[parseFloat(point.latitude), parseFloat(point.longitude)]}
              radius={6}
              pathOptions={CIRCLE_MARKER_OPTIONS}>
              <Popup>
                <PointPopup point={point} />
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {validMapPoints.length > 0 && <Legend count={validMapPoints.length} />}
      </div>
    </div>
  );
}

export default MapHistory;
