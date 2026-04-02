import { Autocomplete, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { updateRouteChangeRequest } from '../../../../redux/routeChangeRequestSlice';

export default function StatusDropdown({ row, onStatusChange, statusOptions, disabled }) {
  const dispatch = useDispatch();
  const handleChange = async (_, newValue) => {
    if (!newValue) return;
    const action = updateRouteChangeRequest({
      id: row.id,
      payload: { route_change_request_status_id: newValue.id },
    });

    dispatch(action).then((res) => {
      if (updateRouteChangeRequest.fulfilled.match(res)) {
        toast.success('Status updated successfully');
        onStatusChange(row.route_change_request_status_id, newValue.id);
      } else {
        toast.error('Failed to update status: ' + (res.payload || 'Unknown error'));
      }
    });
  };

  return (
    <Autocomplete
      disablePortal
      disabled={disabled}
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
