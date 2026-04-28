import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TextField, Typography, Checkbox, Chip } from '@mui/material';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useRef } from 'react';

function FilterOption({
  filterData,
  setFilterData,
  handleExport,
  handleExportPDF,
  handleSample,
  fileInputRef,
  handleFileUpload,
  handleFormReset,
  handleFormSubmit,
  employees = [],
  employeeIds = [],
  vehicles = [],
  routes = [],
  plants = [],
  intervals = [],
  departments = [],
  geofences = [],
  statuses = [],
  setFile,
  isDate = true,
  report = false,
  singleVehicle = false,
  compactVehicleTags = false,
  routeVehicleLoader = null,
  routeVehiclePageSize = 50,
}) {
  const toArray = (v) => (Array.isArray(v) ? v : []);
  const uniqueOptionsByValue = (options) => {
    const seen = new Set();
    return options.filter((opt) => {
      if (!opt?.value) return false;
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  };
  const selectAllOpt = { label: 'Select All', value: 'SELECT_ALL' };
  const getOptions = (arr) => [selectAllOpt, ...arr];
  const [routeVehicleRows, setRouteVehicleRows] = useState([]);
  const [routeVehiclePage, setRouteVehiclePage] = useState(1);
  const [routeVehicleSearch, setRouteVehicleSearch] = useState('');
  const [routeVehicleHasMore, setRouteVehicleHasMore] = useState(false);
  const [routeVehicleLoading, setRouteVehicleLoading] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const isLoadingMoreRef = useRef(false);

  const getDisplay = (selected, all, selectedLabelMap = {}) => {
    if (!Array.isArray(selected) || !selected.length) return [];
    if (selected.length === all.length && all.length > 0) return [selectAllOpt];
    const allByValue = new Map(all.map((o) => [o.value, o]));
    return selected.map((value) => allByValue.get(value) || { value, label: selectedLabelMap[value] || String(value) });
  };
  const handleMultiChange = (key, all) => (_, nv) => {
    const isAll = nv.some((o) => o.value === 'SELECT_ALL');
    setFilterData({
      ...filterData,
      [key]: isAll
        ? filterData[key]?.length === all.length
          ? []
          : all.map((o) => o.value)
        : nv.filter((o) => o.value !== 'SELECT_ALL').map((o) => o.value),
    });
  };

  const employeeOptions = toArray(employees).map((e) => ({
    label: `${e.first_name || ''} ${e.last_name || ''}`.trim(),
    value: e.id,
  }));
  const employeeIdOptions = toArray(employeeIds).map((e) => ({
    label: `${e.employee_id || ''}`.trim(),
    value: e.employee_id,
  }));
  const effectiveVehicles = routeVehicleLoader ? routeVehicleRows : vehicles;
  const effectiveRoutes = routeVehicleLoader ? routeVehicleRows : routes;

  const vehicleOptions = uniqueOptionsByValue(
    toArray(effectiveVehicles).map((v) => ({
      label: v?.vehicle?.vehicle_number || v?.vehicle_number,
      value: v?.vehicle_id || v?.id,
    })),
  );
  const routeOptions = uniqueOptionsByValue(toArray(effectiveRoutes).map((r) => ({ label: r.name, value: r.id })));
  const plantOptions = toArray(plants).map((p) => ({ label: p.plant_name, value: p.id }));
  const departmentOptions = toArray(departments).map((d) => ({ label: d.department_name, value: d.id }));
  const geofenceOptions = toArray(geofences).map((g) => ({ label: g.geofence_name, value: g.id }));
  const intervalOptions = toArray(intervals);
  const statusOptions = toArray(statuses);

  const selectedVehicleLabels = useMemo(
    () => Object.fromEntries(vehicleOptions.map((opt) => [opt.value, opt.label])),
    [vehicleOptions],
  );
  const selectedRouteLabels = useMemo(
    () => Object.fromEntries(routeOptions.map((opt) => [opt.value, opt.label])),
    [routeOptions],
  );

  const loadRouteVehiclePage = async ({ page, search, reset = false, fromScroll = false }) => {
    if (typeof routeVehicleLoader !== 'function') return;
    if (fromScroll) isLoadingMoreRef.current = true;
    setRouteVehicleLoading(true);
    try {
      const result = await routeVehicleLoader({ page, limit: routeVehiclePageSize, search });
      const incoming = toArray(result?.items);
      setRouteVehicleRows((prev) => {
        if (reset) return incoming;
        const merged = [...prev, ...incoming];
        const seen = new Set();
        return merged.filter((item) => {
          const key = item?.id || `${item?.name}-${item?.vehicle_id || item?.vehicle?.id}`;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setRouteVehicleHasMore(Boolean(result?.hasMore));
      setRouteVehiclePage(page);
    } finally {
      isLoadingMoreRef.current = false;
      setRouteVehicleLoading(false);
    }
  };

  useEffect(() => {
    if (!routeVehicleLoader) return;
    loadRouteVehiclePage({ page: 1, search: '', reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeVehicleLoader, routeVehiclePageSize]);

  const MultiSelect = ({
    label,
    options,
    value,
    onChange,
    compactTags = false,
    selectedLabelMap = {},
    onSearchInput,
    onListboxScroll,
    loading = false,
    open,
    onOpen,
    onClose,
  }) => (
    <Autocomplete
      multiple
      disablePortal
      fullWidth
      size='small'
      disableCloseOnSelect
      options={getOptions(options)}
      renderInput={(params) => <TextField {...params} label={label} />}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      getOptionLabel={(o) => o.label}
      value={getDisplay(value, options, selectedLabelMap)}
      onChange={onChange}
      loading={loading}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      onInputChange={(_, newInput, reason) => {
        if (reason === 'input' && typeof onSearchInput === 'function') onSearchInput(newInput);
      }}
      ListboxProps={
        onListboxScroll
          ? {
              onScroll: onListboxScroll,
            }
          : undefined
      }
      renderOption={(props, option) => (
        <li {...props} key={option.value}>
          <Checkbox
            style={{ marginRight: 8 }}
            checked={
              option.value === 'SELECT_ALL'
                ? Array.isArray(value) && value.length === options.length
                : Array.isArray(value) && value.includes(option.value)
            }
          />
          {option.label}
        </li>
      )}
      renderTags={(value, getTagProps) =>
        compactTags && value.length > 1
          ? [
              <Chip key={value[0].value} label={value[0].label} {...getTagProps({ index: 0 })} />,
              <Chip key='more' label={`+${value.length - 1}`} {...getTagProps({ index: 1 })} />,
            ]
          : value.length > 3
            ? [
                ...value
                  .slice(0, 2)
                  .map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />),
                <Chip key='more' label={`+${value.length - 2} more`} {...getTagProps({ index: 2 })} />,
              ]
            : value.map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />)
      }
    />
  );
  const SingleSelect = ({ label, options, value, onChange }) => (
    <Autocomplete
      disablePortal
      fullWidth
      size='small'
      options={options}
      renderInput={(params) => <TextField {...params} label={label} />}
      isOptionEqualToValue={(o, v) => o.value === v}
      getOptionLabel={(o) => o.label}
      onChange={(_, nv) => onChange(nv ? nv.value : '')}
      value={options.find((o) => o.value === value) || null}
    />
  );

  return (
    <div className='bg-white rounded-sm border-t-3 border-[#07163d]'>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel2-content'>
          <Typography component='span'>Filter option</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 -mt-2'>
            {employeeOptions.length > 0 &&
              (report ? (
                <MultiSelect
                  label='Select Employees'
                  options={employeeOptions}
                  value={filterData.employees || []}
                  onChange={handleMultiChange('employees', employeeOptions)}
                />
              ) : (
                <SingleSelect
                  label='Select Employee'
                  options={employeeOptions}
                  value={filterData.employee || ''}
                  onChange={(v) => setFilterData({ ...filterData, employee: v })}
                />
              ))}
            {employeeIdOptions.length > 0 &&
              (report ? (
                <MultiSelect
                  label='Select Employee IDs'
                  options={employeeIdOptions}
                  value={filterData.employee_ids || []}
                  onChange={handleMultiChange('employee_ids', employeeIdOptions)}
                />
              ) : (
                <SingleSelect
                  label='Select Employee ID'
                  options={employeeIdOptions}
                  value={filterData.employee_id || ''}
                  onChange={(v) => setFilterData({ ...filterData, employee_id: v })}
                />
              ))}
            {plantOptions.length > 0 &&
              (report ? (
                <MultiSelect
                  label='Select Plants'
                  options={plantOptions}
                  value={filterData.plants || []}
                  onChange={handleMultiChange('plants', plantOptions)}
                />
              ) : (
                <SingleSelect
                  label='Select Plant'
                  options={plantOptions}
                  value={filterData.plant || ''}
                  onChange={(v) => setFilterData({ ...filterData, plant: v })}
                />
              ))}
            {(vehicleOptions.length > 0 || !!routeVehicleLoader) &&
              (singleVehicle ? (
                <SingleSelect
                  label='Select Vehicle'
                  options={vehicleOptions}
                  value={filterData.vehicle_id || ''}
                  onChange={(v) => setFilterData({ ...filterData, vehicle_id: v })}
                />
              ) : (
                <MultiSelect
                  label='Select Vehicle Numbers'
                  options={vehicleOptions}
                  value={filterData.vehicles || []}
                  onChange={handleMultiChange('vehicles', vehicleOptions)}
                  compactTags={compactVehicleTags}
                  selectedLabelMap={selectedVehicleLabels}
                  loading={routeVehicleLoading}
                  open={routeVehicleLoader ? vehicleDropdownOpen : undefined}
                  onOpen={routeVehicleLoader ? () => setVehicleDropdownOpen(true) : undefined}
                  onClose={
                    routeVehicleLoader
                      ? (_, reason) => {
                          if (isLoadingMoreRef.current && reason === 'blur') return;
                          setVehicleDropdownOpen(false);
                        }
                      : undefined
                  }
                  onSearchInput={
                    routeVehicleLoader
                      ? (newSearch) => {
                          setVehicleDropdownOpen(true);
                          setRouteVehicleSearch(newSearch);
                          loadRouteVehiclePage({ page: 1, search: newSearch, reset: true });
                        }
                      : undefined
                  }
                  onListboxScroll={
                    routeVehicleLoader
                      ? (event) => {
                          const node = event.currentTarget;
                          const isNearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 16;
                          if (isNearBottom && routeVehicleHasMore && !routeVehicleLoading) {
                            setVehicleDropdownOpen(true);
                            loadRouteVehiclePage({
                              page: routeVehiclePage + 1,
                              search: routeVehicleSearch,
                              fromScroll: true,
                            });
                          }
                        }
                      : undefined
                  }
                />
              ))}
            {(routeOptions.length > 0 || !!routeVehicleLoader) && (
              <MultiSelect
                label='Select Vehicle Routes'
                options={routeOptions}
                value={filterData.routes || []}
                onChange={handleMultiChange('routes', routeOptions)}
                selectedLabelMap={selectedRouteLabels}
                loading={routeVehicleLoading}
                open={routeVehicleLoader ? routeDropdownOpen : undefined}
                onOpen={routeVehicleLoader ? () => setRouteDropdownOpen(true) : undefined}
                onClose={
                  routeVehicleLoader
                    ? (_, reason) => {
                        if (isLoadingMoreRef.current && reason === 'blur') return;
                        setRouteDropdownOpen(false);
                      }
                    : undefined
                }
                onSearchInput={
                  routeVehicleLoader
                    ? (newSearch) => {
                        setRouteDropdownOpen(true);
                        setRouteVehicleSearch(newSearch);
                        loadRouteVehiclePage({ page: 1, search: newSearch, reset: true });
                      }
                    : undefined
                }
                onListboxScroll={
                  routeVehicleLoader
                    ? (event) => {
                        const node = event.currentTarget;
                        const isNearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 16;
                        if (isNearBottom && routeVehicleHasMore && !routeVehicleLoading) {
                          setRouteDropdownOpen(true);
                          loadRouteVehiclePage({
                            page: routeVehiclePage + 1,
                            search: routeVehicleSearch,
                            fromScroll: true,
                          });
                        }
                      }
                    : undefined
                }
              />
            )}
            {departmentOptions.length > 0 &&
              (report ? (
                <MultiSelect
                  label='Select Departments'
                  options={departmentOptions}
                  value={filterData.departments || []}
                  onChange={handleMultiChange('departments', departmentOptions)}
                />
              ) : (
                <SingleSelect
                  label='Select Department'
                  options={departmentOptions}
                  value={filterData.department || ''}
                  onChange={(v) => setFilterData({ ...filterData, department: v })}
                />
              ))}
            {intervalOptions.length > 0 && (
              <SingleSelect
                label='Select Interval'
                options={intervalOptions}
                value={filterData.interval}
                onChange={(v) => setFilterData({ ...filterData, interval: v })}
              />
            )}
            {geofenceOptions.length > 0 && (
              <MultiSelect
                label='Select Geofences'
                options={geofenceOptions}
                value={filterData.geofences || []}
                onChange={handleMultiChange('geofences', geofenceOptions)}
              />
            )}
            {statusOptions.length > 0 && (
              <SingleSelect
                label='Select Status'
                options={statusOptions}
                value={filterData.status || ''}
                onChange={(v) => setFilterData({ ...filterData, status: v })}
              />
            )}
            {typeof handleFormSubmit === 'function' && isDate && (
              <>
                <TextField
                  label='From Date'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size='small'
                  name='fromDate'
                  value={filterData.fromDate}
                  onChange={(e) => setFilterData({ ...filterData, fromDate: e.target.value })}
                />
                <TextField
                  label='To Date'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size='small'
                  name='toDate'
                  value={filterData.toDate}
                  onChange={(e) => setFilterData({ ...filterData, toDate: e.target.value })}
                />
              </>
            )}
            {typeof handleFormReset === 'function' && typeof handleFormSubmit === 'function' && (
              <div className='flex gap-2.5'>
                <button
                  type='submit'
                  className='text-white bg-[#07163d] hover:bg-[rgb(7,22,61)] font-medium rounded-sm text-sm w-full px-5 py-2.5 cursor-pointer'
                  onClick={handleFormSubmit}>
                  Filter
                </button>
                <button
                  type='button'
                  className='text-white bg-gray-500 hover:bg-gray-600 font-medium rounded-sm text-sm w-full px-5 py-2.5 cursor-pointer'
                  onClick={handleFormReset}>
                  Reset
                </button>
              </div>
            )}
            {typeof handleExport === 'function' && typeof handleExportPDF === 'function' && (
              <div className='flex gap-2.5'>
                <button
                  type='button'
                  className='text-white bg-[#1d31a6] hover:bg-[#1d31a6] font-medium rounded-sm text-sm w-full px-5 py-2.5 cursor-pointer'
                  onClick={handleExport}>
                  Export Excel
                </button>
                <button
                  type='button'
                  className='text-white bg-red-600 hover:bg-red-700 font-medium rounded-sm text-sm w-full px-5 py-2.5 cursor-pointer'
                  onClick={handleExportPDF}>
                  Export PDF
                </button>
              </div>
            )}
            {typeof handleFileUpload === 'function' && (
              <TextField
                label='Import File Here'
                type='file'
                fullWidth
                InputLabelProps={{ shrink: true }}
                size='small'
                name='importFile'
                inputRef={fileInputRef}
                required
                onChange={(e) => setFile && setFile(e.target.files[0])}
              />
            )}
            {typeof handleFileUpload === 'function' && typeof handleSample === 'function' && (
              <div className='flex gap-2'>
                <button
                  type='button'
                  className='w-full text-white bg-gray-500 hover:bg-gray-600 font-medium rounded-sm text-sm px-5 py-1.5 cursor-pointer'
                  onClick={handleFileUpload}>
                  Import
                </button>
                <button
                  type='button'
                  className='w-full text-white bg-[#07163d] hover:bg-[#07163d] font-medium rounded-sm text-sm px-5 py-1.5 cursor-pointer'
                  onClick={handleSample}>
                  Sample Excel
                </button>
              </div>
            )}
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}

export default FilterOption;
