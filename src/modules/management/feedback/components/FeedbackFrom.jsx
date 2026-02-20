import { useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { useDispatch } from 'react-redux';
import { updateFeedbackReport } from '../../../../redux/feedBackReportSlice';
import { TextField, Grid, Box, Button, Paper, Divider } from '@mui/material';

const FeedbackFrom = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state: data, pathname } = useLocation();
  const isEdit = pathname.includes('/edit');
  const [action, setAction] = useState('');

  const employeeName = `${data?.employee?.first_name || ''} ${data?.employee?.last_name || ''}`.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateFeedbackReport({ id: data.id, payload: { action } })).then((res) => {
      if (updateFeedbackReport.fulfilled.match(res)) {
        toast.success('Feedback updated successfully!');
        navigate('/management/feedbacks');
      } else {
        toast.error(res.payload || 'Something went wrong.');
      }
    });
  };

  return (
    <Paper sx={{ borderRadius: 2, borderTop: 2, borderBottom: 2, p: 3 }}>
      <Box display='flex' alignItems='center' gap={2} mb={2}>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
          <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
          Back
        </button>
        <Box fontWeight={600} fontSize={20}>
          Feedback Details
        </Box>
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
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default FeedbackFrom;
