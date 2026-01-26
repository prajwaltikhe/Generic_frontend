import ReactApexChart from 'react-apexcharts';

const EmployeeBoardingBarChart = ({ previousData, currentData, categories, text }) => (
  <ReactApexChart
    type='bar'
    height={250}
    series={[
      { name: 'Previous', data: previousData, color: '#4285f4' },
      { name: 'Current', data: currentData, color: '#db4437' },
    ]}
    options={{
      chart: { id: 'employee-boarding-bar' },
      xaxis: { categories },
      title: { text, align: 'left', style: { fontWeight: 550, fontSize: 16 } },
      legend: { position: 'top' },
      plotOptions: { bar: { borderRadius: 3, borderRadiusApplication: 'end', columnWidth: '50%' } },
      dataLabels: { enabled: false },
    }}
  />
);

export default EmployeeBoardingBarChart;
