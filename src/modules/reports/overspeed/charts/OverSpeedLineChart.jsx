import moment from 'moment-timezone';
import Chart from 'react-apexcharts';

const OverSpeedChart = ({ data }) => {
  const rawData = Array.isArray(data) ? data : data?.data || [];
  const dailyCountMap = {};

  rawData.forEach((item) => {
    if (!item?.date_time) return;
    const dateKey = moment.tz(item.date_time, 'Asia/Kolkata').format('YYYY-MM-DD');
    dailyCountMap[dateKey] = (dailyCountMap[dateKey] || 0) + 1;
  });

  const sortedDates = Object.keys(dailyCountMap).sort((a, b) => moment(a).valueOf() - moment(b).valueOf());
  const series = [
    {
      name: 'Overspeed Events',
      data: sortedDates.map((date) => ({ x: date, y: dailyCountMap[date] })),
      color: '#1d4ed8',
    },
  ];

  const options = {
    chart: { type: 'line', zoom: { enabled: false }, toolbar: { show: true } },
    title: { text: 'Overspeed Events by Date', align: 'center', style: { fontSize: 20, fontWeight: 'bold' } },
    xaxis: {
      type: 'category',
      title: { text: 'Date' },
      categories: sortedDates,
      labels: {
        formatter: (val) => moment(val).format('DD MMM YYYY'),
      },
    },
    yaxis: {
      title: { text: 'Count' },
      min: 0,
      forceNiceScale: true,
      labels: { formatter: (val) => Math.round(val) },
    },
    markers: { size: 6, hover: { size: 8 } },
    stroke: { curve: 'smooth', width: 3 },
    tooltip: {
      x: {
        formatter: (val) => moment(val).format('DD MMM YYYY'),
      },
      y: { formatter: (val) => `${Math.round(val)} events` },
    },
    grid: { borderColor: '#e7e7e7', row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } },
  };
  return (
    <div className='pt-2 px-1'>
      <Chart options={options} series={series} type='line' height={250} />
    </div>
  );
};

export default OverSpeedChart;
