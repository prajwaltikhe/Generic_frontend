import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Tab, Tabs, Box } from '@mui/material';

const tabData = [
  { label: 'Emergency Alerts', link: '/management/emergency-alerts' },
  { label: 'Geofence Violations', link: '/management/emergency-alerts' },
];

export default function NotificationPanel() {
  const [value, setValue] = useState(0);

  return (
    <div className='sub-menu notification-sub-menu'>
      <AppBar elevation={0} sx={{ bgcolor: 'transparent' }} color='default' position='static'>
        <Tabs
          value={value}
          onChange={(_, v) => setValue(v)}
          indicatorColor='secondary'
          textColor='inherit'
          variant='fullWidth'
          aria-label='Notification Tabs'>
          {tabData.map((tab, i) => (
            <Tab
              key={tab.label}
              sx={{ bgcolor: value === i ? '#1d31a6' : '#07163d', color: '#FFF' }}
              label={tab.label}
            />
          ))}
        </Tabs>
      </AppBar>
      <Box sx={{ p: 3, display: value === 0 ? 'block' : 'none' }} className='text-black'>
        <div className='text-end'>
          <Link to={tabData[0].link}>
            <button className='text-white'>View All</button>
          </Link>
        </div>
      </Box>
      <Box sx={{ p: 3, display: value === 1 ? 'block' : 'none' }}>
        <div className='text-end'>
          <Link to={tabData[1].link}>
            <button className='text-white'>View All</button>
          </Link>
        </div>
      </Box>
    </div>
  );
}
