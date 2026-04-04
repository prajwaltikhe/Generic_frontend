import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  FormLabel,
} from '@mui/material';
import { toast } from 'react-toastify';
import ApiService from '../../../services/ApiService';
import { APIURL } from '../../../constants';

const base = APIURL.SUPER_ADMIN_EMAIL_SERVICE;

export default function EmailServiceConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const [form, setForm] = useState({
    method: 'smtp',
    from_email: '',
    username: '',
    password: '',
    host: '',
    port: '587',
    smtp_auth: true,
    tls_auth: false,
    email_verification: true,
    failed_reports_announcement: true,
    post_url: '',
    post_api_key: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ApiService.get(`${base}`);
        const d = res?.data;
        if (!cancelled && d) {
          setForm((f) => ({
            ...f,
            method: d.method || 'smtp',
            from_email: d.from_email || '',
            username: d.username || '',
            password: '',
            host: d.host || '',
            port: d.port != null ? String(d.port) : '587',
            smtp_auth: d.smtp_auth !== false,
            tls_auth: d.tls_auth === true,
            email_verification: d.email_verification !== false,
            failed_reports_announcement: d.failed_reports_announcement !== false,
            post_url: d.post_url || '',
            post_api_key: '',
          }));
        }
      } catch (e) {
        if (!cancelled) toast.error(e?.message || 'Failed to load configuration');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        method: form.method,
        from_email: form.from_email,
        username: form.username,
        password: form.password || undefined,
        host: form.host,
        port: form.port === '' ? null : parseInt(form.port, 10),
        smtp_auth: form.smtp_auth,
        tls_auth: form.tls_auth,
        email_verification: form.email_verification,
        failed_reports_announcement: form.failed_reports_announcement,
        post_url: form.post_url || undefined,
        post_api_key: form.post_api_key || undefined,
      };
      const res = await ApiService.put(`${base}`, body);
      if (res?.success) {
        toast.success(res.message || 'Saved');
        set('password', '');
        set('post_api_key', '');
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testEmail?.includes('@')) {
      toast.error('Enter a valid test email');
      return;
    }
    setTesting(true);
    try {
      const res = await ApiService.post(`${base}/test`, { to: testEmail });
      if (res?.success) toast.success(res.message || 'Test sent');
      else toast.error(res?.message || 'Test failed');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Test failed');
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className='p-4'>
        <Typography>Loading…</Typography>
      </div>
    );
  }

  return (
    <div className='w-full h-full p-4 max-w-3xl mx-auto'>
      <Typography variant='h5' className='mb-2 font-bold text-[#07163d]'>
        Email service configuration
      </Typography>
      <Typography variant='body2' color='error' className='mb-3'>
        Note: To use SMTP, from email, host, port, and (if SMTP authentication is on) username and password
        are required.
      </Typography>
      <Paper elevation={2} className='p-4'>
        <form onSubmit={handleSave}>
          <FormLabel className='block mb-2'>Method</FormLabel>
          <RadioGroup
            row
            value={form.method}
            onChange={(e) => set('method', e.target.value)}
            className='mb-3'>
            <FormControlLabel value='smtp' control={<Radio size='small' />} label='SMTP' />
            <FormControlLabel value='post' control={<Radio size='small' />} label='POST (HTTP API)' />
          </RadioGroup>

          {form.method === 'smtp' ? (
            <Box className='flex flex-col gap-2'>
              <TextField
                label='From email address'
                value={form.from_email}
                onChange={(e) => set('from_email', e.target.value)}
                size='small'
                fullWidth
                required
              />
              <TextField
                label='Username'
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                size='small'
                fullWidth
              />
              <TextField
                label='Password'
                type='password'
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                size='small'
                fullWidth
                helperText='Leave blank to keep existing password'
              />
              <TextField
                label='Host'
                value={form.host}
                onChange={(e) => set('host', e.target.value)}
                size='small'
                fullWidth
                required
              />
              <TextField
                label='Outgoing port'
                value={form.port}
                onChange={(e) => set('port', e.target.value)}
                size='small'
                fullWidth
                required
              />
            </Box>
          ) : (
            <Box className='flex flex-col gap-2'>
              <TextField
                label='From email address'
                value={form.from_email}
                onChange={(e) => set('from_email', e.target.value)}
                size='small'
                fullWidth
                required
              />
              <TextField
                label='POST URL'
                value={form.post_url}
                onChange={(e) => set('post_url', e.target.value)}
                size='small'
                fullWidth
                required
                helperText='Server must accept JSON: { from, to, subject, html, text }'
              />
              <TextField
                label='API key (optional, sent as Authorization: Bearer …)'
                type='password'
                value={form.post_api_key}
                onChange={(e) => set('post_api_key', e.target.value)}
                size='small'
                fullWidth
                helperText='Leave blank to keep existing key'
              />
            </Box>
          )}

          <Box className='mt-3 flex flex-col gap-1'>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.smtp_auth}
                  onChange={(e) => set('smtp_auth', e.target.checked)}
                  size='small'
                  disabled={form.method !== 'smtp'}
                />
              }
              label='SMTP authentication'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.tls_auth}
                  onChange={(e) => set('tls_auth', e.target.checked)}
                  size='small'
                  disabled={form.method !== 'smtp'}
                />
              }
              label='TLS authentication (requireTLS)'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.email_verification}
                  onChange={(e) => set('email_verification', e.target.checked)}
                  size='small'
                />
              }
              label='Email verification'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.failed_reports_announcement}
                  onChange={(e) => set('failed_reports_announcement', e.target.checked)}
                  size='small'
                />
              }
              label='Failed reports announcement'
            />
          </Box>

          <Box className='mt-4 flex flex-wrap gap-2'>
            <Button type='submit' variant='contained' disabled={saving} sx={{ textTransform: 'none' }}>
              {saving ? 'Saving…' : 'Save configuration'}
            </Button>
          </Box>
        </form>

        <Box className='mt-6 pt-4 border-t border-gray-200'>
          <Typography variant='subtitle2' className='mb-2'>
            Test configuration
          </Typography>
          <div className='flex flex-wrap gap-2 items-center'>
            <TextField
              label='Send test to'
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              size='small'
              sx={{ minWidth: 260 }}
            />
            <Button variant='outlined' onClick={handleTest} disabled={testing} sx={{ textTransform: 'none' }}>
              {testing ? 'Sending…' : 'Test configuration'}
            </Button>
          </div>
        </Box>
      </Paper>
    </div>
  );
}
