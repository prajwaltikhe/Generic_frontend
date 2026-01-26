import ReactApexChart from 'react-apexcharts';

const LateArrivalLineChart = ({ previousData, currentData, categories, text }) => (
  <ReactApexChart
    type='line'
    height={275}
    options={{
      chart: { id: 'line' },
      xaxis: { categories },
      title: { text, align: 'left', style: { fontWeight: 550, fontSize: 16 } },
      stroke: { curve: 'smooth', width: 2 },
      markers: { size: 4 },
      legend: { position: 'top' },
    }}
    series={[
      { name: 'Previous', data: previousData, color: '#4285f4' },
      { name: 'Current', data: currentData, color: '#db4437' },
    ]}
  />
);

export default LateArrivalLineChart;
