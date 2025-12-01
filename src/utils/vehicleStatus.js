const isOneHourOld = (d) => !!d && !isNaN((d = new Date(d))) && Date.now() - d > 3600000;

const colorOfDot = (ign, mov, time, isNew) =>
  isNew
    ? 'gray'
    : isOneHourOld(time)
    ? 'rgb(0,0,255)'
    : ign && mov
    ? 'rgb(0,128,0)'
    : ign
    ? 'rgb(255,255,0)'
    : !ign && !mov
    ? 'rgb(255,0,0)'
    : 'gray';

const getOdo = (val) => (typeof val === 'number' && !isNaN(val) ? (val / 1000).toFixed(2) + ' km' : '-');

export const processVehicles = (vehicles) => {
  const devs = (vehicles || []).filter(Boolean).map((v) => {
    const io = Array.isArray(v.ioElements) ? v.ioElements : [];
    const get = (id) => io.find((i) => i.id === id)?.value ?? 0;
    const ign = get(239) === 1,
      mov = get(240) === 1;
    const hasTs = !!v.timestamp && !isNaN(new Date(v.timestamp));
    const hasLat = v.latitude != null && +v.latitude !== 0;
    const hasLng = v.longitude != null && +v.longitude !== 0;
    const isNew = !hasTs || !hasLat || !hasLng;
    const localTime = hasTs ? new Date(v.timestamp).toISOString() : '';
    const name =
      v.driver?.first_name || v.driver?.last_name
        ? `${v.driver?.first_name ?? ''} ${v.driver?.last_name ?? ''}`.trim()
        : '-';
    const route = v.routes?.[0]?.name ?? '-';
    const status = isNew
      ? 'New'
      : isOneHourOld(localTime)
      ? 'Offline'
      : ign && mov
      ? 'Running'
      : ign
      ? 'Idle'
      : !ign && !mov
      ? 'Parked'
      : 'Unknown';
    const speedStr = v.speed != null && !isNaN(Number(v.speed)) ? `${Number(v.speed)} km/h` : '-';

    const todayVal = io.find((e) => e.propertyName === 'tripOdometer')?.value;

    return {
      id: v.id ?? '-',
      imei_number: v.imei_number ?? '-',
      vehicle_name: v.vehicle_name ?? '-',
      vehicle_number: v.vehicle_number ?? '-',
      route_name: route,
      today_distance: getOdo(todayVal),
      seats: v.seats ?? '-',
      assigned_seats: v.AssignedSeats ?? '-',
      onboarded_employee: v.EmployeeOnboardCount ?? '-',
      speed: speedStr,
      driver_name: name,
      driver_number: v.driver?.phone_number ?? '-',
      address: v.address ?? '-',
      timestamp: localTime,
      speed_limit: v.speed_limit ?? v.speed ?? 0,
      lat: +v.latitude || 0,
      lng: +v.longitude || 0,
      hasGPS: hasLat && hasLng,
      hasIgnition: ign,
      hasBattery: get(68) > 0,
      hasExternalPower: get(66) > 0,
      movement: mov,
      color: colorOfDot(ign, mov, localTime, isNew),
      isOffline: isOneHourOld(localTime),
      status,
    };
  });

  const pick = (s) => devs.filter((d) => d.status === s);

  return {
    devices: devs,
    runningDevices: pick('Running'),
    idelDevices: pick('Idle'),
    parkedDevices: pick('Parked'),
    offlineVehicleData: pick('Offline'),
    newDevices: pick('New'),
  };
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
