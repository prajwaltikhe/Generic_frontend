import ReactApexChart from 'react-apexcharts';

const DistanceCoveredBarChart = ({ previousData, currentData, categories, text }) => (
  <ReactApexChart
    type='bar'
    height={225}
    series={[
      { name: 'Previous', data: previousData, color: '#4285f4' },
      { name: 'Current', data: currentData, color: '#db4437' },
    ]}
    options={{
      chart: { id: 'distance-covered-bar' },
      xaxis: { categories, title: { text: 'Week', style: { fontWeight: 400, fontSize: 14 } } },
      yaxis: { title: { text: 'Distance (km)' } },
      title: { text, align: 'left', style: { fontWeight: 400, fontSize: 14 } },
      legend: { position: 'top' },
      plotOptions: { bar: { borderRadius: 3, borderRadiusApplication: 'end', columnWidth: '50%' } },
      dataLabels: { enabled: false },
    }}
  />
);

export default DistanceCoveredBarChart;
