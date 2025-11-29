import { useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import Information from './components/Information';
import PasswordPanel from './components/PasswordPanel';

export default function Profile() {
  const [tab, setTab] = useState(0);
  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Profile</h1>
      <div className='p-4 bg-white'>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label='Information' />
          <Tab label='Password' />
        </Tabs>
        <div className='p-4'>{tab ? <PasswordPanel /> : <Information />}</div>
      </div>
    </div>
  );
}
