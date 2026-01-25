const isDataOld = (d) => !!d && !isNaN((d = new Date(d))) && Date.now() - d > 600000;

const colorOfDot = (ign, mov, time, isNew, speed) =>
  isNew
    ? 'gray'
    : (ign && mov) || speed > 0
      ? 'rgb(0,128,0)'
      : isDataOld(time)
        ? 'rgb(0,0,255)'
        : ign
          ? 'rgb(255,255,0)'
          : !ign && !mov
            ? 'rgb(255,0,0)'
            : 'gray';

export const processVehicles = (vehicles) => {
  const devs = (vehicles || []).filter(Boolean).map((v) => {
    const io = Array.isArray(v.ioElements) ? v.ioElements : [];
    const get = (id) => io.find((i) => i.id === id)?.value ?? 0;
    const ign = get(239) === 1,
      mov = get(240) === 1;
    const speed = Number(v.speed) || 0;
    const hasTs = !!v.timestamp && !isNaN(new Date(v.timestamp));
    const hasLat = v.latitude != null && +v.latitude !== 0;
    const hasLng = v.longitude != null && +v.longitude !== 0;
    const isNew = !hasTs || !hasLat || !hasLng;
    const localTime = hasTs ? new Date(v.timestamp).toISOString() : '';
    const name =
      v.driver?.first_name || v.driver?.last_name
        ? `${v.driver?.first_name ?? ''} ${v.driver?.last_name ?? ''}`.trim()
        : '-';

    const status = isNew
      ? 'New'
      : (ign && mov) || speed > 0
        ? 'Running'
        : isDataOld(localTime)
          ? 'Offline'
          : ign
            ? 'Idle'
            : 'Parked';

    return {
      id: v.id ?? '-',
      imei_number: v.imei_number ?? '-',
      vehicle_name: v.vehicle_name ?? '-',
      vehicle_number: v.vehicle_number ?? '-',
      route_name: v.routes?.[0]?.name ?? '-',
      today_distance: v.todayDistance?.distanceKm != null ? `${v.todayDistance?.distanceKm.toFixed(2)} km` : '-',
      seats: v.seats ?? '-',
      assigned_seats: v.AssignedSeats ?? '-',
      onboarded_employee: v.EmployeeOnboardCount ?? '-',
      speed: v.speed != null && !isNaN(Number(v.speed)) ? `${Number(v.speed)} km/h` : '-',
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
      color: colorOfDot(ign, mov, localTime, isNew, speed),
      isOffline: isDataOld(localTime),
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
