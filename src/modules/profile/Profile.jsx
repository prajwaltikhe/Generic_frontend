import { useEffect, useMemo, useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import Information from './components/Information';
import PasswordPanel from './components/PasswordPanel';
import { getRoleFromStorage } from '../../utils/roles';
import { toast } from 'react-toastify';
import ApiService from '../../services/ApiService';
import { APIURL } from '../../constants';
import { useSearchParams } from 'react-router-dom';

export default function Profile() {
  const role = getRoleFromStorage();
  const isSuperAdmin = role === 'superadmin';
  const showPasswordTab = true;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ApiService.get(`${APIURL.PORTAL_USERS}/me`);
        if (!mounted) return;
        setProfile(res?.data?.user || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('tab') === 'password' && showPasswordTab) {
      setTab(1);
    }
  }, [searchParams, showPasswordTab]);

  const currentTab = useMemo(() => {
    if (!showPasswordTab && tab > 0) return 0;
    return tab;
  }, [showPasswordTab, tab]);

  const handleSaveInfo = async (payload) => {
    setSavingInfo(true);
    try {
      const res = await ApiService.put(`${APIURL.PORTAL_USERS}/me`, payload);
      setProfile(res?.data?.user || profile);
      toast.success(res?.message || 'Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update profile');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (password) => {
    setSavingPassword(true);
    try {
      const res = await ApiService.put(`${APIURL.PORTAL_USERS}/me/password`, { password });
      toast.success(res?.message || 'Password updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className='w-full h-full p-2'>
      <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Profile</h1>
      <div className='p-4 bg-white'>
        <Tabs value={currentTab} onChange={(_, v) => setTab(v)}>
          <Tab label='Information' />
          {showPasswordTab ? <Tab label='Password' /> : null}
        </Tabs>
        <div className='p-4'>
          {currentTab === 0 ? (
            <Information role={role} profile={profile} loading={loading} saving={savingInfo} onSave={handleSaveInfo} />
          ) : (
            <PasswordPanel
              variant={isSuperAdmin ? 'superadmin' : 'otp'}
              saving={savingPassword}
              onSave={handleSavePassword}
            />
          )}
        </div>
      </div>
    </div>
  );
}
