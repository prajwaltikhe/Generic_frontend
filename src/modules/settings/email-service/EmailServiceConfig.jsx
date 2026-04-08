import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import ApiService from '../../../services/ApiService';
import { APIURL } from '../../../constants';
import { isSuperAdminFromStorage } from '../../../utils/superAdmin';

const emailBase = APIURL.SUPER_ADMIN_EMAIL_SERVICE;
const smsBase = APIURL.SUPER_ADMIN_SMS_SERVICE;

function EmailServiceConfigPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [activeChannel, setActiveChannel] = useState('email');

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const [smsSaving, setSmsSaving] = useState(false);
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsTestPhone, setSmsTestPhone] = useState('');
  const [smsTestMsg, setSmsTestMsg] = useState('Test message');
  const [smsTestAdvancedOpen, setSmsTestAdvancedOpen] = useState(false);
  const [smsTestTempid, setSmsTestTempid] = useState('');
  const [smsTestTmid, setSmsTestTmid] = useState('');
  const [smsTestEntityid, setSmsTestEntityid] = useState('');
  const [smsTestSource, setSmsTestSource] = useState('');
  const [smsTestType, setSmsTestType] = useState('');
  const [smsTestDlr, setSmsTestDlr] = useState('');

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

  const [smsForm, setSmsForm] = useState({
    gateway_name: 'custom',
    gateway_type: 'GET',
    gateway_url: '',
    sms_http_username: '',
    sms_http_password: '',
    default_tempid: '',
    default_tmid: '',
    default_entityid: '',
    default_source: '',
    default_type: '',
    default_dlr: '',
    monthly_sms_limit: '',
    daily_sms_limit: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSms = (k, v) => setSmsForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [emailRes, smsRes] = await Promise.allSettled([
          ApiService.get(`${emailBase}`),
          ApiService.get(`${smsBase}`),
        ]);

        if (cancelled) return;

        if (emailRes.status === 'rejected' && smsRes.status === 'rejected') {
          throw emailRes.reason || smsRes.reason;
        }

        const ed = emailRes.status === 'fulfilled' ? emailRes.value?.data : null;
        const sd = smsRes.status === 'fulfilled' ? smsRes.value?.data : null;

        const ac = ed?.active_channel || sd?.active_channel || 'email';
        setActiveChannel(ac);

        if (ed) {
          setForm((f) => ({
            ...f,
            method: ed.method || 'smtp',
            from_email: ed.from_email || '',
            username: ed.username || '',
            password: '',
            host: ed.host || '',
            port: ed.port != null ? String(ed.port) : '587',
            smtp_auth: ed.smtp_auth !== false,
            tls_auth: ed.tls_auth === true,
            email_verification: ed.email_verification !== false,
            failed_reports_announcement: ed.failed_reports_announcement !== false,
            post_url: ed.post_url || '',
            post_api_key: '',
          }));
        }

        if (sd) {
          setSmsForm((f) => ({
            ...f,
            gateway_name: sd.gateway_name || 'custom',
            gateway_type: sd.gateway_type === 'POST' ? 'POST' : 'GET',
            gateway_url: sd.gateway_url || '',
            sms_http_username: sd.sms_http_username || '',
            sms_http_password: '',
            default_tempid: sd.default_tempid || '',
            default_tmid: sd.default_tmid || '',
            default_entityid: sd.default_entityid || '',
            default_source: sd.default_source || '',
            default_type: sd.default_type || '',
            default_dlr: sd.default_dlr || '',
            monthly_sms_limit: sd.monthly_sms_limit != null ? String(sd.monthly_sms_limit) : '',
            daily_sms_limit: sd.daily_sms_limit != null ? String(sd.daily_sms_limit) : '',
          }));
        }

        if (emailRes.status === 'rejected') {
          toast.error(emailRes.reason?.message || 'Failed to load email configuration');
        }
        if (smsRes.status === 'rejected') {
          toast.error(smsRes.reason?.message || 'Failed to load SMS configuration');
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
        active_channel: activeChannel,
      };
      const res = await ApiService.put(`${emailBase}`, body);
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

  const handleSaveSms = async (e) => {
    e.preventDefault();
    setSmsSaving(true);
    try {
      const body = {
        gateway_name: smsForm.gateway_name,
        gateway_type: smsForm.gateway_type,
        gateway_url: smsForm.gateway_url,
        sms_http_username: smsForm.sms_http_username,
        sms_http_password: smsForm.sms_http_password || undefined,
        default_tempid: smsForm.default_tempid,
        default_tmid: smsForm.default_tmid,
        default_entityid: smsForm.default_entityid,
        default_source: smsForm.default_source,
        default_type: smsForm.default_type,
        default_dlr: smsForm.default_dlr,
        monthly_sms_limit: smsForm.monthly_sms_limit === '' ? null : smsForm.monthly_sms_limit,
        daily_sms_limit: smsForm.daily_sms_limit === '' ? null : smsForm.daily_sms_limit,
        active_channel: activeChannel,
      };
      const res = await ApiService.put(`${smsBase}`, body);
      if (res?.success) {
        toast.success(res.message || 'Saved');
        setSms('sms_http_password', '');
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Save failed');
    }
    setSmsSaving(false);
  };

  const handleTest = async () => {
    if (!testEmail?.includes('@')) {
      toast.error('Enter a valid test email');
      return;
    }
    setTesting(true);
    try {
      const res = await ApiService.post(`${emailBase}/test`, { to: testEmail });
      if (res?.success) toast.success(res.message || 'Test sent');
      else toast.error(res?.message || 'Test failed');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Test failed');
    }
    setTesting(false);
  };

  const handleSmsTest = async () => {
    if (!smsTestPhone?.trim()) {
      toast.error('Enter a mobile number for the SMS test');
      return;
    }
    if (!smsTestMsg?.trim()) {
      toast.error('Enter a test message');
      return;
    }
    setSmsTesting(true);
    try {
      const body = { to: smsTestPhone.trim(), msg: smsTestMsg };
      const addIf = (k, v) => {
        if (v != null && String(v).trim() !== '') body[k] = String(v).trim();
      };
      addIf('tempid', smsTestTempid);
      addIf('tmid', smsTestTmid);
      addIf('entityid', smsTestEntityid);
      addIf('source', smsTestSource);
      addIf('type', smsTestType);
      addIf('dlr', smsTestDlr);
      const res = await ApiService.post(`${smsBase}/test`, body);
      if (res?.success) toast.success(res.message || 'Test request sent');
      else toast.error(res?.message || 'Test failed');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Test failed');
    }
    setSmsTesting(false);
  };

  if (loading) {
    return (
      <div className='p-4'>
        <Typography>Loading…</Typography>
      </div>
    );
  }

  return (
    <div className='w-full h-screen mb-2 p-4 max-w-3xl mx-auto flex flex-col gap-4'>
      <Typography variant='h5' className='mb-2 font-bold text-[#07163d]'>
        EMAIL/SMS configuration
      </Typography>
      <Typography variant='body2' color='text.secondary' className='mb-3'>
        Choose which channel is active for one-time passwords and other notifications. Only one of Email or SMS
        can be active at a time.
      </Typography>
      
      <Paper elevation={2} className='p-4 !mb-2'>
        <FormLabel className='block mb-2'>Active notification channel</FormLabel>
        <RadioGroup
          row
          value={activeChannel}
          onChange={(e) => setActiveChannel(e.target.value)}
          className='mb-4'>
          <FormControlLabel value='email' control={<Radio size='small' />} label='Email' />
          <FormControlLabel value='sms' control={<Radio size='small' />} label='SMS' />
        </RadioGroup>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label='Email' sx={{ textTransform: 'none' }} />
          <Tab label='SMS' sx={{ textTransform: 'none' }} />
        </Tabs>

        {tab === 0 && (
          <>
            <Typography variant='body2' color='error' className='mb-3'>
              Note: To use SMTP, from email, host, port, and (if SMTP authentication is on) username and password
              are required.
            </Typography>
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
          </>
        )}

        {tab === 1 && (
          <>
            <Typography variant='body2' color='error' className='mb-3'>
              Custom gateway URL must include (#to) and (#msg). For Route Mobile DLT, add (#tempid), (#tmid),
              (#entityid), (#source), (#type), (#dlr) as in your provider template. You can omit
              username/password from the URL if you save them below (or use (#smsuser) and (#smspass) in the URL).
            </Typography>
            <form onSubmit={handleSaveSms} className='mt-2'>
              <FormControl fullWidth size='small' className='mb-3'>
                <InputLabel id='sms-gateway-label'>SMS Gateway</InputLabel>
                <Select
                  labelId='sms-gateway-label'
                  label='SMS Gateway'
                  value={smsForm.gateway_name}
                  onChange={(e) => setSms('gateway_name', e.target.value)}>
                  <MenuItem value='custom'>Custom</MenuItem>
                </Select>
              </FormControl>

              <FormLabel className='block mb-2'>Gateway Type</FormLabel>
              <RadioGroup
                row
                value={smsForm.gateway_type}
                onChange={(e) => setSms('gateway_type', e.target.value)}
                className='mb-3'>
                <FormControlLabel value='GET' control={<Radio size='small' />} label='GET' />
                <FormControlLabel value='POST' control={<Radio size='small' />} label='POST' />
              </RadioGroup>

              <TextField
                label='SMS Gateway URL'
                value={smsForm.gateway_url}
                onChange={(e) => setSms('gateway_url', e.target.value)}
                size='small'
                fullWidth
                required
                multiline
                minRows={3}
                className='mb-2'
              />
              <Typography variant='body2' color='text.secondary' className='mb-1'>
                Example (credentials stored below):{' '}
                <code className='text-xs break-all'>
                  https://sms6.rmlconnect.net:8443/bulksms/bulksms?type=(#type)&amp;dlr=(#dlr)&amp;destination=(#to)&amp;source=(#source)&amp;message=(#msg)&amp;entityid=(#entityid)&amp;tempid=(#tempid)&amp;tmid=(#tmid)
                </code>
              </Typography>
              <Typography variant='body2' color='text.secondary' className='mb-3'>
                Placeholders: (#to) mobile · (#msg) text · (#tempid) DLT template ID from your client · (#tmid) ·
                (#entityid) · (#source) · (#type) · (#dlr) · optional (#smsuser) (#smspass)
              </Typography>

              <Typography variant='subtitle2' className='mb-2 mt-2'>
                Gateway HTTP credentials (optional)
              </Typography>
              <Box className='flex flex-col gap-2 mb-4'>
                <TextField
                  label='Gateway username'
                  value={smsForm.sms_http_username}
                  onChange={(e) => setSms('sms_http_username', e.target.value)}
                  size='small'
                  fullWidth
                  autoComplete='off'
                />
                <TextField
                  label='Gateway password'
                  value={smsForm.sms_http_password}
                  onChange={(e) => setSms('sms_http_password', e.target.value)}
                  size='small'
                  fullWidth
                  type='password'
                  autoComplete='new-password'
                  placeholder='Leave blank to keep existing'
                />
              </Box>

              <Typography variant='subtitle2' className='mb-2'>
                DLT defaults (login OTP and sends use these when the URL includes matching placeholders)
              </Typography>
              <Typography variant='body2' color='text.secondary' className='mb-2'>
                Set the template ID your operator gave you as Template ID (Route Mobile tempid). Leave fields empty
                if not used in your gateway URL.
              </Typography>
              <Box className='flex flex-col gap-2 mb-4'>
                <TextField
                  label='Template ID (tempid)'
                  value={smsForm.default_tempid}
                  onChange={(e) => setSms('default_tempid', e.target.value)}
                  size='small'
                  fullWidth
                />
                <TextField
                  label='TMID (default)'
                  value={smsForm.default_tmid}
                  onChange={(e) => setSms('default_tmid', e.target.value)}
                  size='small'
                  fullWidth
                />
                <TextField
                  label='Entity ID (default)'
                  value={smsForm.default_entityid}
                  onChange={(e) => setSms('default_entityid', e.target.value)}
                  size='small'
                  fullWidth
                />
                <TextField
                  label='Source / sender (default)'
                  value={smsForm.default_source}
                  onChange={(e) => setSms('default_source', e.target.value)}
                  size='small'
                  fullWidth
                />
                <TextField
                  label='Type (default, e.g. 0)'
                  value={smsForm.default_type}
                  onChange={(e) => setSms('default_type', e.target.value)}
                  size='small'
                  fullWidth
                />
                <TextField
                  label='DLR (default, e.g. 1)'
                  value={smsForm.default_dlr}
                  onChange={(e) => setSms('default_dlr', e.target.value)}
                  size='small'
                  fullWidth
                />
              </Box>

              <Box className='flex flex-col gap-2 mb-4 mt-3'>
                <TextField
                  label='Monthly SMS Limit'
                  value={smsForm.monthly_sms_limit}
                  onChange={(e) => setSms('monthly_sms_limit', e.target.value)}
                  size='small'
                  fullWidth
                  type='number'
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label='Daily SMS Limit'
                  value={smsForm.daily_sms_limit}
                  onChange={(e) => setSms('daily_sms_limit', e.target.value)}
                  size='small'
                  fullWidth
                  type='number'
                  inputProps={{ min: 0 }}
                />
              </Box>

              <Box className='mt-4 flex flex-wrap gap-2'>
                <Button type='submit' variant='contained' disabled={smsSaving} sx={{ textTransform: 'none' }}>
                  {smsSaving ? 'Saving…' : 'Save configuration'}
                </Button>
              </Box>
            </form>

            <Box className='mt-6 pt-4 border-t border-gray-200'>
              <Typography variant='subtitle2' className='mb-2'>
                Test configuration
              </Typography>
              <Typography variant='body2' color='text.secondary' className='mb-2 max-w-lg'>
                Uses saved gateway URL, credentials, and DLT defaults. Enter only the destination number and message;
                open advanced overrides if you need to try different DLT values for one send.
              </Typography>
              <div className='flex flex-col gap-2 max-w-lg mt-3'>
                <TextField
                  label='Send test to (mobile)'
                  value={smsTestPhone}
                  onChange={(e) => setSmsTestPhone(e.target.value)}
                  size='small'
                  fullWidth
                />
                <TextField
                  label='Message'
                  value={smsTestMsg}
                  onChange={(e) => setSmsTestMsg(e.target.value)}
                  size='small'
                  fullWidth
                />
                <Button
                  variant='text'
                  size='small'
                  onClick={() => setSmsTestAdvancedOpen((o) => !o)}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>
                  {smsTestAdvancedOpen ? 'Hide' : 'Show'} DLT overrides for this test only
                </Button>
                <Collapse in={smsTestAdvancedOpen}>
                  <Box className='flex flex-col gap-2 border border-gray-200 rounded p-2 mb-2'>
                    <TextField
                      label='Template ID override'
                      value={smsTestTempid}
                      onChange={(e) => setSmsTestTempid(e.target.value)}
                      size='small'
                      fullWidth
                    />
                    <TextField
                      label='TMID override'
                      value={smsTestTmid}
                      onChange={(e) => setSmsTestTmid(e.target.value)}
                      size='small'
                      fullWidth
                    />
                    <TextField
                      label='Entity ID override'
                      value={smsTestEntityid}
                      onChange={(e) => setSmsTestEntityid(e.target.value)}
                      size='small'
                      fullWidth
                    />
                    <TextField
                      label='Source override'
                      value={smsTestSource}
                      onChange={(e) => setSmsTestSource(e.target.value)}
                      size='small'
                      fullWidth
                    />
                    <TextField
                      label='Type override'
                      value={smsTestType}
                      onChange={(e) => setSmsTestType(e.target.value)}
                      size='small'
                      fullWidth
                    />
                    <TextField
                      label='DLR override'
                      value={smsTestDlr}
                      onChange={(e) => setSmsTestDlr(e.target.value)}
                      size='small'
                      fullWidth
                    />
                  </Box>
                </Collapse>
                <Button
                  variant='outlined'
                  onClick={handleSmsTest}
                  disabled={smsTesting}
                  sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>
                  {smsTesting ? 'Sending…' : 'Test configuration'}
                </Button>
              </div>
            </Box>
          </>
        )}
      </Paper>
    </div>
  );
}

export default function EmailServiceConfig() {
  if (!isSuperAdminFromStorage()) {
    return <Navigate to='/dashboard' replace />;
  }
  return <EmailServiceConfigPage />;
}
