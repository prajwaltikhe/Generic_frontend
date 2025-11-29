import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';

function CommonSearch({ searchQuery = '', setSearchQuery }) {
  const [value, setValue] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(value), 500);
    return () => clearTimeout(t);
  }, [value, setSearchQuery]);

  return (
    <div className='flex justify-end bg-white'>
      <TextField
        label='Search'
        variant='outlined'
        size='small'
        sx={{ width: 300 }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export default CommonSearch;
