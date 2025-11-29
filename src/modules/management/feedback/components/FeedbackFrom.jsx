import { useState } from 'react';
import { TextField, Grid, Box, Button, Paper, Divider } from '@mui/material';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const FeedbackFrom = () => {
  const navigate = useNavigate();
  const { state: data, pathname } = useLocation();
  const isEdit = pathname.includes('/edit');
  const [action, setAction] = useState('');

  const employeeName = `${data?.employee?.first_name || ''} ${data?.employee?.last_name || ''}`.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await ApiService.put(`${APIURL.FEEDBACK}/${data.id}`, { action });
    if (res?.success) {
      alert(res.message);
      navigate('/management/feedbacks');
    }
  };

  return (
    <Paper sx={{ borderRadius: 2, borderTop: 2, borderBottom: 2, p: 3 }}>
      <Box mb={2} fontWeight={600} fontSize={20}>
        Feedback Details
      </Box>
      {isEdit && (
        <Box mb={2} fontSize={14}>
          * indicates required field
        </Box>
      )}
      <Divider sx={{ mb: 3 }} />
      <form onSubmit={isEdit ? handleSubmit : (e) => e.preventDefault()}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label='Employee Name'
              value={employeeName || '-'}
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
              margin='dense'
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label='Rating'
              value={data?.rating ?? '-'}
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
              margin='dense'
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label='Created At'
              value={data?.created_at ? new Date(data.created_at).toLocaleString() : '-'}
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
              margin='dense'
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Message'
              value={data?.message || '-'}
              fullWidth
              size='small'
              multiline
              minRows={4}
              InputProps={{ readOnly: true }}
              margin='dense'
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label={`Note (Action)${isEdit ? ' *' : ''}`}
              type='text'
              id='action'
              name='action'
              fullWidth
              size='small'
              multiline
              minRows={4}
              placeholder='Enter Action'
              value={isEdit ? action : data?.action || ''}
              onChange={isEdit ? (e) => setAction(e.target.value) : undefined}
              required={isEdit}
              InputProps={!isEdit ? { readOnly: true } : undefined}
              margin='dense'
            />
          </Grid>
          <Grid item xs={12}>
            <Box display='flex' justifyContent='flex-end' gap={2} mt={2}>
              {isEdit && (
                <Button type='submit' variant='contained'>
                  Save
                </Button>
              )}
              <Link to='/management/feedbacks' style={{ textDecoration: 'none' }}>
                <Button type='button' variant='outlined'>
                  Back
                </Button>
              </Link>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default FeedbackFrom;
