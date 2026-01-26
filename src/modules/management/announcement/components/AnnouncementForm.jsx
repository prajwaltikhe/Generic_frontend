import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';
import { createAnnouncement, updateAnnouncement } from '../../../../redux/announcementSlice';
import { Autocomplete, TextField, Checkbox, Chip, ListItemText } from '@mui/material';

const cols = ['Announcement Title', 'Sender Name', 'Vehicle Route', 'Message'];
const SELECT_ALL_VALUE = '__all__';

export default function AnnouncementForm() {
  const { state: ed, pathname } = useLocation();
  const nav = useNavigate();
  const disp = useDispatch();
  const isView = pathname.includes('view');
  const isCreate = !ed?.id && !isView;
  const routes = useSelector((s) => s?.vehicleRoute?.vehicleRoutes?.routes || []);
  const [title, setTitle] = useState(ed?.title || '');
  const [msg, setMsg] = useState(ed?.message || '');
  const [routeOpts, setRouteOpts] = useState([]);
  const [routeValue, setRouteValue] = useState(
    ed?.id && ed?.vehicle_route_id && ed?.route_name ? { label: ed.route_name, value: ed.vehicle_route_id } : [],
  );
  const sender = ed?.sender_name || 'Super Admin';

  useEffect(() => {
    if (!routes.length) disp(fetchVehicleRoutes({ limit: 100 }));
  }, [routes.length, disp]);
  useEffect(() => {
    setRouteOpts(routes.map((r) => ({ label: r.name, value: r.id })));
    if (ed?.id && ed?.vehicle_route_id && ed?.route_name)
      setRouteValue({ label: ed.route_name, value: ed.vehicle_route_id });
    else if (!ed?.id) setRouteValue([]);
  }, [routes, ed]);

  const handleRouteChange = (_, nv) => {
    if (!isCreate) return setRouteValue(nv);
    if (nv?.[nv.length - 1]?.value === SELECT_ALL_VALUE)
      setRouteValue(routeValue.length === routeOpts.length ? [] : routeOpts);
    else setRouteValue(nv?.length === routeOpts.length ? routeOpts : nv);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (ed?.id ? !routeValue?.value : !routeValue.length) {
      toast.error(`Please select ${ed?.id ? 'a vehicle route' : 'at least one vehicle route'}.`);
      return;
    }
    const payload = ed?.id
      ? { title, message: msg, vehicle_route_id: routeValue.value }
      : {
          title,
          message: msg,
          vehicle_route_ids:
            routeValue.length === routeOpts.length ? routeOpts.map((r) => r.value) : routeValue.map((r) => r.value),
        };
    const action = ed?.id
      ? updateAnnouncement({
          id: ed.id,
          data: payload,
        })
      : createAnnouncement(payload);

    disp(action).then((res) => {
      // Check if the action was fulfilled (success)
      if (createAnnouncement.fulfilled.match(res) || updateAnnouncement.fulfilled.match(res)) {
        toast.success(`Announcement ${ed?.id ? 'updated' : 'created'} successfully!`);
        nav('/management/announcements');
      } else {
        // payload is the error message from rejectWithValue
        toast.error(res.payload || 'Something went wrong.');
      }
    });
  };

  const viewRoute =
    ed?.id || isView
      ? routeValue?.label || ed?.route_name || '-'
      : Array.isArray(routeValue) && routeValue.length
        ? routeValue.map((r) => r.label).join(', ')
        : '-';

  const selectableOpts = isCreate ? [{ label: 'Select All', value: SELECT_ALL_VALUE }, ...routeOpts] : routeOpts;
  const getCreateValue = () =>
    Array.isArray(routeValue) && routeValue.length === routeOpts.length
      ? routeOpts
      : routeOpts.filter((opt) => routeValue.find((sel) => sel.value === opt.value));

  return (
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>{ed ? (isView ? 'View' : 'Edit') : 'Send'} Announcement</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={onSubmit} autoComplete='off'>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {cols[0]} <span className='text-red-500'>*</span>
              </label>
              <TextField
                fullWidth
                value={title}
                required
                disabled={isView}
                size='small'
                placeholder='Enter Title'
                inputProps={{ maxLength: 255 }}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {cols[1]} <span className='text-red-500'>*</span>
              </label>
              <TextField fullWidth value={sender} size='small' disabled />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {cols[2]} <span className='text-red-500'>*</span>
              </label>
              {isView ? (
                <TextField value={viewRoute} fullWidth size='small' disabled />
              ) : ed?.id ? (
                <Autocomplete
                  disablePortal
                  fullWidth
                  size='small'
                  options={routeOpts}
                  value={routeOpts.find((opt) => opt.value === routeValue?.value) || routeValue || null}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                  getOptionLabel={(o) => o?.label || ''}
                  onChange={(_, nv) => setRouteValue(nv)}
                  renderInput={(params) => <TextField {...params} label='Select Vehicle Route' required />}
                />
              ) : (
                <Autocomplete
                  multiple
                  fullWidth
                  disablePortal
                  size='small'
                  options={selectableOpts}
                  value={getCreateValue()}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                  getOptionLabel={(o) => o?.label || ''}
                  filterSelectedOptions
                  onChange={handleRouteChange}
                  renderInput={(params) => <TextField {...params} label='Select Vehicle Routes' />}
                  renderTags={(val, getTagProps) =>
                    val.length > 5
                      ? [
                          ...val
                            .slice(0, 4)
                            .map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />),
                          <Chip key='more' label={`+${val.length - 4} more`} {...getTagProps({ index: 4 })} />,
                        ]
                      : val.map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />)
                  }
                  renderOption={(props, option) =>
                    option.value === SELECT_ALL_VALUE ? (
                      <li {...props} key={option.value}>
                        <Checkbox
                          style={{ marginRight: 8 }}
                          checked={Array.isArray(routeValue) && routeValue.length === routeOpts.length}
                          indeterminate={
                            Array.isArray(routeValue) && routeValue.length > 0 && routeValue.length < routeOpts.length
                          }
                          tabIndex={0}
                        />
                        <ListItemText primary={option.label} />
                      </li>
                    ) : (
                      <li {...props} key={option.value}>
                        <Checkbox
                          style={{ marginRight: 8 }}
                          checked={Array.isArray(routeValue) && routeValue.some((v) => v.value === option.value)}
                          tabIndex={-1}
                        />
                        {option.label}
                      </li>
                    )
                  }
                />
              )}
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                {cols[3]} <span className='text-red-500'>*</span>
              </label>
              <TextField
                value={msg}
                fullWidth
                size='small'
                multiline
                minRows={4}
                required
                inputProps={{ maxLength: 1000 }}
                disabled={isView}
                onChange={(e) => setMsg(e.target.value)}
                placeholder='Write your messages here...'
              />
            </div>
          </div>
          <div className='flex justify-end gap-4 mt-8'>
            {!isView && (
              <button
                type='submit'
                className='text-white bg-[#07163d] hover:bg-[#07163d]/90 font-medium rounded-md text-sm px-5 py-2.5 cursor-pointer'>
                Save
              </button>
            )}
            <button
              type='button'
              className='text-white bg-gray-500 hover:bg-gray-500/90 font-medium rounded-md text-sm px-5 py-2.5 cursor-pointer'
              onClick={() => nav('/management/announcements')}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
