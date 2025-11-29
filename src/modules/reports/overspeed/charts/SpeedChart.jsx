import Chart from 'react-apexcharts';

const SpeedChart = ({ rowData }) => {
  if (!rowData) return null;
  const { date, maxSpeedTime, maxSpeed, vehicleNo } = rowData;

  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return new Date().toISOString();
    const datePart = dateStr.split(' ')[0];
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return new Date(`${datePart}T${hours.toString().padStart(2, '0')}:${minutes}:00`).toISOString();
  };

  const options = {
    chart: { type: 'line', zoom: { enabled: false }, background: '#f6faeb' },
    title: { text: 'Speed Over Time', align: 'center' },
    xaxis: { type: 'datetime', title: { text: 'Time' }, labels: { format: 'dd MMM' } },
    yaxis: { title: { text: 'Speed (km/h)' }, min: 60, max: 110 },
    stroke: { curve: 'straight', width: 2 },
    tooltip: { x: { format: 'dd MMM' } },
    colors: ['#007bff'],
  };

  const series = [
    { name: vehicleNo || 'Vehicle', data: [{ x: combineDateTime(date, maxSpeedTime), y: maxSpeed || 0 }] },
  ];

  return (
    <div style={{ padding: 20, background: '#FFF', borderRadius: 10 }}>
      <Chart options={options} series={series} type='line' height={300} />
      <button
        style={{
          marginTop: 10,
          backgroundColor: '#003366',
          color: '#fff',
          padding: '8px 12px',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
        onClick={() => console.log('Export to PDF')}>
        PDF
      </button>
    </div>
  );
};

export default SpeedChart;
