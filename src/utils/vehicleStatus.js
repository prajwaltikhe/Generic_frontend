const ONE_HOUR = 3600000;

export const processVehicles = (vehicles) => {
  const result = {
    devices: [],
    runningDevices: [],
    idelDevices: [],
    parkedDevices: [],
    offlineVehicleData: [],
    newDevices: [],
  };

  if (!Array.isArray(vehicles)) return result;

  const now = Date.now();

  result.devices = vehicles.filter(Boolean).map((v) => {
    const io = Array.isArray(v.ioElements) ? v.ioElements : [];
    const getVal = (id) => io.find((i) => i.id === id)?.value ?? 0;

    const ign = getVal(239) === 1;
    const mov = getVal(240) === 1;
    const bat = getVal(68) > 0;
    const pwr = getVal(66) > 0;

    const speedVal = Number(v.speed);
    const speed = isNaN(speedVal) ? 0 : speedVal;

    const tsDate = v.timestamp ? new Date(v.timestamp) : null;
    const savedDate = !!tsDate && !isNaN(tsDate.getTime());
    const lat = +v.latitude || 0;
    const lng = +v.longitude || 0;

    const isNew = !savedDate;
    const isOffline = savedDate && now - tsDate.getTime() > ONE_HOUR;

    let status, color;
    if (isNew) {
      status = 'New';
      color = 'gray';
    } else if (isOffline) {
      status = 'Offline';
      color = 'rgb(0,0,255)';
    } else if (speed > 0) {
      status = 'Running';
      color = 'rgb(0,128,0)';
    } else if (ign) {
      status = 'Idle';
      color = 'rgb(255,255,0)';
    } else {
      status = 'Parked';
      color = 'rgb(255,0,0)';
    }

    const device = {
      id: v.id ?? '-',
      imei_number: v.imei_number ?? '-',
      vehicle_name: v.vehicle_name ?? '-',
      vehicle_number: v.vehicle_number ?? '-',
      route_name: v.routes?.[0]?.name ?? '-',
      today_distance: v.todayDistance?.distanceKm != null ? `${v.todayDistance?.distanceKm.toFixed(2)} km` : '-',
      seats: v.seats ?? '-',
      assigned_seats: v.AssignedSeats ?? '-',
      onboarded_employee: v.EmployeeOnboardCount ?? '-',
      speed: v.speed != null && !isNaN(speedVal) ? `${speedVal} km/h` : '-',
      driver_name:
        v.driver?.first_name || v.driver?.last_name
          ? `${v.driver?.first_name ?? ''} ${v.driver?.last_name ?? ''}`.trim()
          : '-',
      driver_number: v.driver?.phone_number ?? '-',
      address: v.address ?? '-',
      timestamp: savedDate ? tsDate.toISOString() : '',
      speed_limit: v.speed_limit ?? speed,
      lat,
      lng,
      hasGPS: lat !== 0 && lng !== 0,
      hasIgnition: ign,
      hasBattery: bat,
      hasExternalPower: pwr,
      movement: mov,
      color,
      isOffline,
      status,
    };

    if (status === 'Running') result.runningDevices.push(device);
    else if (status === 'Idle') result.idelDevices.push(device);
    else if (status === 'Parked') result.parkedDevices.push(device);
    else if (status === 'Offline') result.offlineVehicleData.push(device);
    else if (status === 'New') result.newDevices.push(device);

    return device;
  });

  return result;
};

export const intervalOptions = [
  { label: '5 Min', value: '5' },
  { label: '10 Min', value: '10' },
  { label: '20 Min', value: '20' },
  { label: '30 Min', value: '30' },
  { label: '1 Hour', value: '60' },
  { label: '2 Hour', value: '120' },
  { label: '4 Hour', value: '240' },
  { label: '8 Hour', value: '480' },
  { label: '16 Hour', value: '960' },
  { label: '24 Hour', value: '1440' },
];