import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDepartmentAnalytics } from '../../../redux/dashboardSlice';
import supportIcon from '../../../assets/support.png';
import computerIcon from '../../../assets/computer.png';
import refrigeratorIcon from '../../../assets/refrigerator.png';
import VisualDisplayIcon from '../../../assets/visual_display.png';
import washingMachineIcon from '../../../assets/washing_machine.png';
import airConditionerIcon from '../../../assets/air_conditioner.png';

const DEPTS = [
  { key: 'REF', label: 'REF', icon: refrigeratorIcon },
  { key: 'WM', label: 'WM', icon: washingMachineIcon },
  { key: 'AC', label: 'AC', icon: airConditionerIcon },
  { key: 'VD', label: 'VD', icon: VisualDisplayIcon },
  { key: 'COMP', label: 'RE/COMP', icon: computerIcon },
  { key: 'SUPPORT', label: 'Support', icon: supportIcon },
];

export default function DepartmentStats() {
  const dispatch = useDispatch();
  const deptKeys = DEPTS.map((d) => d.key);
  const departments = useSelector((state) =>
    Array.isArray(state.dashboard?.departmentAnalytics)
      ? state.dashboard.departmentAnalytics.filter((d) => deptKeys.includes(d.department_name))
      : [],
  );
  const loading = useSelector((state) => state.dashboard?.loading);

  useEffect(() => {
    dispatch(fetchDepartmentAnalytics({ company_id: localStorage.getItem('company_id') }));
  }, [dispatch]);

  return (
    <div className='shadow-sm rounded-sm bg-white w-full p-3'>
      <p className='pb-1 font-semibold'>Departments Analytics</p>
      {loading ? (
        <div className='w-full flex justify-center items-center py-8'>
          <span className='text-xs text-gray-400 animate-pulse'>Loading...</span>
        </div>
      ) : (
        <div className='mt-4 grid grid-cols-3 gap-y-4'>
          {DEPTS.map((dept, i) => {
            const deptData = departments.find((d) => d.department_name === dept.key);
            return (
              <div key={i} className='flex flex-col items-center'>
                <img src={dept.icon} alt={dept.label} className='w-12 mb-1' />
                <span className='font-semibold text-lg'>{deptData?.count || 0}</span>
                <p className='text-sm capitalize'>{dept.label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
