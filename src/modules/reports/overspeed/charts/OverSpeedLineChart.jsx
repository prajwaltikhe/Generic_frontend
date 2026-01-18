import moment from 'moment';
import Chart from 'react-apexcharts';

const OverSpeedChart = ({ data }) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  const vehicleMap = {};

  rawData.forEach((item) => {
    const v = item?.vehicle_number;
    const time = item?.date_time;
    if (time) (vehicleMap[v] = vehicleMap[v] || []).push({ x: moment(time).toDate(), y: item?.max_speed || 0 });
  });
  const keys = Object.keys(vehicleMap);
  const series = keys.map((v, i) => ({
    name: v,
    data: vehicleMap[v].sort((a, b) => a.x - b.x),
    color: `hsl(210,70%,${60 + ((i * 20) % 30)}%)`,
  }));

  const allDates = rawData
    .map((i) => i?.date_time)
    .filter(Boolean)
    .map((d) => new Date(d));
  const minDate = allDates.length ? Math.min(...allDates) : undefined;
  const maxDate = allDates.length ? Math.max(...allDates) : undefined;
  const options = {
    chart: { type: 'line', zoom: { enabled: true }, toolbar: { show: true } },
    title: { text: 'Overspeed Events by Vehicle', align: 'center', style: { fontSize: 20, fontWeight: 'bold' } },
    xaxis: {
      type: 'datetime',
      title: { text: 'Time' },
      min: minDate,
      max: maxDate,
      labels: { datetimeFormatter: { year: 'yyyy', month: "MMM 'yy", day: 'dd MMM', hour: 'HH:mm' } },
      tooltip: { enabled: true },
    },
    yaxis: { title: { text: 'Speed (km/h)' }, min: 0, labels: { formatter: (val) => Math.round(val) } },
    markers: { size: 6, hover: { size: 8 } },
    stroke: { curve: 'smooth', width: 3 },
    tooltip: { x: { format: 'dd MMM yyyy HH:mm' }, y: { formatter: (val) => `${val} km/h` } },
    grid: { borderColor: '#e7e7e7', row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
  };
  return (
    <div className='pt-2 px-1'>
      <Chart options={options} series={series} type='line' height={250} />
    </div>
  );
};

export default OverSpeedChart;
