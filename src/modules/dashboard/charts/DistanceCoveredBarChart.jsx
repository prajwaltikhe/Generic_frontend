import ReactApexChart from 'react-apexcharts';

const DistanceCoveredBarChart = ({ previousData, currentData, categories, text }) => (
  <ReactApexChart
    type='bar'
    height={250}
    series={[
      { name: 'Previous', data: previousData, color: '#4285f4' },
      { name: 'Current', data: currentData, color: '#db4437' },
    ]}
    options={{
      chart: { id: 'distance-covered-bar' },
      xaxis: { categories },
      yaxis: { labels: { formatter: (val) => `${(val / 1000).toFixed(0)} km` } },
      title: { text, align: 'left', style: { fontWeight: 550, fontSize: 16 } },
      legend: { position: 'top' },
      plotOptions: { bar: { borderRadius: 3, borderRadiusApplication: 'end', columnWidth: '50%' } },
      dataLabels: { enabled: false },
    }}
  />
);

export default DistanceCoveredBarChart;
