import { Autocomplete, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { ApiService } from '../../../../services';
import { APIURL } from '../../../../constants';

export default function StatusDropdown({ row, onStatusChange, statusOptions }) {
  const handleChange = async (_, newValue) => {
    if (!newValue) return;
    try {
      const res = await ApiService.put(`${APIURL.ROUTECHANGEREQ}/${row.route_change_request_status_id}`, {
        route_change_request_status_id: newValue.id,
      });
      res.success
        ? (toast.success('Status updated successfully'),
          onStatusChange(row.route_change_request_status_id, newValue.id))
        : toast.error('Failed to update status: ' + (res.message || 'Unknown error'));
    } catch {
      toast.error('Error updating status');
    }
  };

  return (
    <Autocomplete
      disablePortal
      options={statusOptions}
      isOptionEqualToValue={(option, value) => option.id === value}
      getOptionLabel={(option) => option.name}
      size='small'
      renderInput={(params) => <TextField {...params} label='Select Status' />}
      onChange={handleChange}
      value={statusOptions?.find((opt) => opt.id === row.statusValue) || null}
    />
  );
}
