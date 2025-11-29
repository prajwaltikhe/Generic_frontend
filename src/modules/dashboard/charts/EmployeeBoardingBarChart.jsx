import ReactApexChart from 'react-apexcharts';

const EmployeeBoardingBarChart = ({ previousData, currentData, categories, text }) => (
  <ReactApexChart
    type='bar'
    height={225}
    series={[
      { name: 'Previous', data: previousData, color: '#4285f4' },
      { name: 'Current', data: currentData, color: '#db4437' },
    ]}
    options={{
      chart: { id: 'employee-boarding-bar' },
      xaxis: { categories, title: { text: 'Week', style: { fontWeight: 400, fontSize: 14 } } },
      title: { text, align: 'left', style: { fontWeight: 400, fontSize: 14 } },
      legend: { position: 'top' },
      plotOptions: { bar: { borderRadius: 3, borderRadiusApplication: 'end', columnWidth: '50%' } },
      dataLabels: { enabled: false },
    }}
  />
);

export default EmployeeBoardingBarChart;
