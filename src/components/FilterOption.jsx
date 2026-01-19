import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TextField, Typography, Checkbox, Chip } from '@mui/material';
import { Accordion, AccordionDetails, AccordionSummary, Autocomplete } from '@mui/material';

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
}) {
  const toArray = (v) => (Array.isArray(v) ? v : []);
  const selectAllOpt = { label: 'Select All', value: 'SELECT_ALL' };
  const getOptions = (arr) => [selectAllOpt, ...arr];
  const getDisplay = (selected, all) =>
    !Array.isArray(selected) || !selected.length
      ? []
      : selected.length === all.length
        ? [selectAllOpt]
        : all.filter((o) => selected.includes(o.value));
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
  const vehicleOptions = toArray(vehicles).map((v) => ({ label: v?.vehicle?.vehicle_number, value: v.vehicle_id }));
  const routeOptions = toArray(routes).map((r) => ({ label: r.name, value: r.id }));
  const plantOptions = toArray(plants).map((p) => ({ label: p.plant_name, value: p.id }));
  const departmentOptions = toArray(departments).map((d) => ({ label: d.department_name, value: d.id }));
  const geofenceOptions = toArray(geofences).map((g) => ({ label: g.geofence_name, value: g.id }));
  const intervalOptions = toArray(intervals);
  const statusOptions = toArray(statuses);

  const MultiSelect = ({ label, options, value, onChange }) => (
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
      value={getDisplay(value, options)}
      onChange={onChange}
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
        value.length > 3
          ? [
              ...value.slice(0, 2).map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />),
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
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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
            {vehicleOptions.length > 0 &&
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
                />
              ))}
            {routeOptions.length > 0 && (
              <MultiSelect
                label='Select Vehicle Routes'
                options={routeOptions}
                value={filterData.routes || []}
                onChange={handleMultiChange('routes', routeOptions)}
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
                  className='text-white bg-[#07163d] hover:bg-[rgb(7,22,61)] font-medium rounded-sm text-sm w-40 px-5 py-2.5 cursor-pointer'
                  onClick={handleFormSubmit}>
                  Filter
                </button>
                <button
                  type='button'
                  className='text-white bg-gray-500 hover:bg-gray-600 font-medium rounded-sm text-sm w-40 px-5 py-2.5 cursor-pointer'
                  onClick={handleFormReset}>
                  Reset
                </button>
              </div>
            )}
            {typeof handleExport === 'function' && typeof handleExportPDF === 'function' && (
              <div className='flex gap-2.5'>
                <button
                  type='button'
                  className='text-white bg-[#1d31a6] hover:bg-[#1d31a6] font-medium rounded-sm text-sm w-40 px-5 py-2.5 cursor-pointer'
                  onClick={handleExport}>
                  Export Excel
                </button>
                <button
                  type='button'
                  className='text-white bg-red-600 hover:bg-red-700 font-medium rounded-sm text-sm w-40 px-5 py-2.5 cursor-pointer'
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
                  className='w-40 text-white bg-gray-500 hover:bg-gray-600 font-medium rounded-sm text-sm px-5 py-1.5 cursor-pointer'
                  onClick={handleFileUpload}>
                  Import
                </button>
                <button
                  type='button'
                  className='w-40 text-white bg-[#07163d] hover:bg-[#07163d] font-medium rounded-sm text-sm px-5 py-1.5 cursor-pointer'
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