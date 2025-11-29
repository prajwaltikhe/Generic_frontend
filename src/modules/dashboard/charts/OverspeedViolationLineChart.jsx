import ReactApexChart from 'react-apexcharts';

const OverspeedViolationLineChart = ({ previousData, currentData, categories, text }) => (
  <ReactApexChart
    type='line'
    height={250}
    options={{
      chart: { id: 'overspeed-line' },
      xaxis: { categories, title: { text: 'Week', style: { fontWeight: 400, fontSize: 14 } } },
      title: { text, align: 'left', style: { fontWeight: 400, fontSize: 14 } },
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

export default OverspeedViolationLineChart;
