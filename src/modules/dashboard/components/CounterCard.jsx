import { Link } from 'react-router-dom';
import { APIURL } from '../../../constants';
import { useEffect, useState } from 'react';
import { ApiService } from '../../../services';
import runningBusIcon from '../../../assets/running_bus.svg';
import emergencyAlert from '../../../assets/emergency_alerts.svg';
import employeeOnboarded from '../../../assets/employee_onboard.svg';

function useDashboardTotalCount() {
  const [total, setTotal] = useState({ vehicleTotal: 0, employeesTotal: 0, alertTotal: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.get(APIURL.TOTALCOUNT).then((res) => {
      if (res?.success) setTotal(res.data?.total || {});
      setLoading(false);
    });
  }, []);
  return { total, loading };
}

export default function CounterCard() {
  const { total, loading } = useDashboardTotalCount();
  const cards = [
    {
      id: 'vehicles',
      label: 'Total Vehicle Running',
      value: total.vehicleTotal || 0,
      icon: runningBusIcon,
      link: '/master/vehicle',
      iconWidth: 'w-14',
    },
    {
      id: 'onboard',
      label: 'Employee Onboarded',
      value: total.employeesTotal || 0,
      icon: employeeOnboarded,
      link: '/report/employees-on-board',
      iconWidth: 'w-8',
    },
    {
      id: 'emergency',
      label: 'Emergency Alerts Today',
      value: total.alertTotal || 0,
      icon: emergencyAlert,
      link: '/report/emergency-alert',
      iconWidth: 'w-8',
    },
  ];
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
      {cards.map(({ id, label, value, icon, link, iconWidth }) => (
        <Link key={id} to={link} className='flex items-center bg-white rounded shadow p-3 hover:bg-gray-50 transition'>
          <img src={icon} alt='' className={`${iconWidth} h-8`} />
          <div className='ml-4'>
            <div className='text-xs text-gray-500'>{label}</div>
            <div className='text-lg font-bold'>
              {loading ? <span className='animate-pulse text-gray-300'>--</span> : value}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
