import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import ApiService from '../../../services/ApiService';
import { APIURL } from '../../../constants';
import { isSuperAdminFromStorage } from '../../../utils/superAdmin';

const baseUrl = APIURL.SUPER_ADMIN_IP_WHITELIST;

function defaultForm() {
  return {
    id: null,
    ip_address: '',
    description: '',
    status: 'active',
  };
}

function IpWhitelistingPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm());

  const load = async () => {
    try {
      const res = await ApiService.get(baseUrl, {
        page: page + 1,
        pageSize,
        search,
      });
      const data = res?.data || {};
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotal(Number(data?.total || 0));
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load whitelist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, pageSize, search]);

  const onOpenCreate = () => {
    setForm(defaultForm());
    setOpen(true);
  };

  const onOpenEdit = (row) => {
    setForm({
      id: row.id,
      ip_address: row.ip_address || '',
      description: row.description || '',
      status: row.status === 'inactive' ? 'inactive' : 'active',
    });
    setOpen(true);
  };

  const onSave = async () => {
    if (!form.ip_address?.trim()) {
      toast.error('IP address is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ip_address: form.ip_address.trim(),
        description: form.description || '',
        status: form.status,
      };
      const res = form.id
        ? await ApiService.put(`${baseUrl}/${form.id}`, payload)
        : await ApiService.post(baseUrl, payload);
      if (res?.success) {
        toast.success(res.message || 'Saved');
        setOpen(false);
        await load();
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    const ok = window.confirm(`Delete whitelisted IP ${row.ip_address}?`);
    if (!ok) return;
    try {
      const res = await ApiService.delete(`${baseUrl}/${row.id}`);
      if (res?.success) {
        toast.success(res.message || 'Deleted');
        await load();
      } else {
        toast.error(res?.message || 'Delete failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Delete failed');
    }
  };

  const onToggleStatus = async (row) => {
    try {
      const res = await ApiService.patch(`${baseUrl}/${row.id}/status`, { status: row.status });
      if (res?.success) {
        toast.success(res.message || 'Status updated');
        await load();
      } else {
        toast.error(res?.message || 'Status update failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Status update failed');
    }
  };

  const onSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  return (
    <div className='w-full h-screen mb-2 p-4 max-w-5xl mx-auto flex flex-col gap-4'>
      <Typography variant='h5' className='mb-2 font-bold text-[#07163d]'>
        IP Whitelisting
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Allow login only from approved IPv4 addresses.
      </Typography>

      <Paper elevation={2} className='p-4'>
        <Box className='flex flex-wrap gap-2 justify-between mb-3'>
          <Box className='flex gap-2'>
            <TextField
              size='small'
              label='Search IP / description / status'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch();
              }}
            />
            <Button variant='outlined' onClick={onSearch} sx={{ textTransform: 'none' }}>
              Search
            </Button>
          </Box>
          <Button variant='contained' onClick={onOpenCreate} sx={{ textTransform: 'none' }}>
            Add IP
          </Button>
        </Box>

        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell width='70'>No</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align='center'>
                    No whitelisted IP found
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{page * pageSize + index + 1}</TableCell>
                  <TableCell>{row.ip_address}</TableCell>
                  <TableCell>{row.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={row.status === 'inactive' ? 'Inactive' : 'Active'}
                      color={row.status === 'inactive' ? 'default' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box className='flex gap-2'>
                      <Button
                        size='small'
                        variant='contained'
                        color={row.status === 'active' ? 'warning' : 'success'}
                        onClick={() => onToggleStatus(row)}
                        sx={{ textTransform: 'none' }}>
                        {row.status === 'active' ? 'Set Inactive' : 'Set Active'}
                      </Button>
                      <Button size='small' variant='outlined' onClick={() => onOpenEdit(row)} sx={{ textTransform: 'none' }}>
                        Edit
                      </Button>
                      <Button
                        size='small'
                        color='error'
                        variant='outlined'
                        onClick={() => onDelete(row)}
                        sx={{ textTransform: 'none' }}>
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component='div'
          count={total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPage(0);
            setPageSize(parseInt(e.target.value, 10));
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{form.id ? 'Edit IP' : 'Add IP'}</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-3 mt-1'>
            <TextField
              label='IPv4 Address'
              placeholder='103.81.106.248'
              value={form.ip_address}
              onChange={(e) => setForm((f) => ({ ...f, ip_address: e.target.value }))}
              size='small'
              fullWidth
            />
            <TextField
              label='Description'
              placeholder='Office public IP / VPN gateway'
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              size='small'
              fullWidth
            />
            <TextField
              select
              SelectProps={{ native: true }}
              label='Status'
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              size='small'
              fullWidth>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={onSave} variant='contained' disabled={saving} sx={{ textTransform: 'none' }}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default function IpWhitelisting() {
  if (!isSuperAdminFromStorage()) {
    return <Navigate to='/dashboard' replace />;
  }
  return <IpWhitelistingPage />;
}
