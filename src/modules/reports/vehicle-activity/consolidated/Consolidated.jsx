import React from 'react';
import DashboardCard from './components/DashboardCard';
import { Grid } from '@mui/material';
import ReportTable from '../../../../components/table/ReportTable';

const columns = [
  { key: 'routeName', header: 'Route Name' },
  { key: 'routeNo', header: 'Route No' },
  { key: 'vehicleNo', header: 'Vehicle No' },
  { key: 'imei', header: 'IMEI' },
  { key: 'lastCommunicate', header: 'Last Communicate' },
  { key: 'km', header: 'KM' },
  { key: 'speed', header: 'Speed' },
  { key: 'stutus', header: 'Status' },
  { key: 'gmap', header: 'G-Map', render: (data) => <a href={data}>G-Map</a> },
];

const data = [];

function Consolidated() {
  const cards = [
    { title: 'Total Bus', value: 11, color: '#1D4ED8' },
    { title: 'Online Bus', value: 6, color: '#E11D48' },
    { title: 'Moving Bus', value: 1, color: '#059669' },
    { title: 'Idle Bus', value: 1, color: '#F59E0B' },
    { title: 'Parked Bus', value: 4, color: '#DC2626' },
    { title: 'Offline', value: 2, color: '#6B7280' },
    { title: 'Total KMs', value: '217.00', color: '#06B6D4' },
    { title: 'New Device', value: 3, color: '#881337' },
  ];
  return (
    <>
      <div className='w-full h-full p-2'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Consolidated Report</h1>
        </div>
        <div className='bg-white rounded-sm border-t-3 border-[#07163d]'>
          <Grid container spacing={2} className='p-4'>
            {cards.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <DashboardCard {...card} />
              </Grid>
            ))}
          </Grid>
        </div>
        <ReportTable columns={columns} data={data} />
      </div>
    </>
  );
}

export default Consolidated;
