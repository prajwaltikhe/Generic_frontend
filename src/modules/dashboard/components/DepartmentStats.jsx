import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDepartmentAnalytics } from '../../../redux/dashboardSlice';
import supportIcon from '../../../assets/support.png';
import computerIcon from '../../../assets/computer.png';
import refrigeratorIcon from '../../../assets/refrigerator.png';
import VisualDisplayIcon from '../../../assets/visual_display.png';
import washingMachineIcon from '../../../assets/washing_machine.png';
import airConditionerIcon from '../../../assets/air_conditioner.png';

const DEPTS = {
  AC: { label: 'AC', icon: airConditionerIcon },
  WM: { label: 'WM', icon: washingMachineIcon },
  VD: { label: 'VD', icon: VisualDisplayIcon },
  COMP: { label: 'COMP', icon: computerIcon },
  REF: { label: 'REF', icon: refrigeratorIcon },
  SUPPORT: { label: 'SUPPORT', icon: supportIcon },
};

export default function DepartmentStats() {
  const dispatch = useDispatch();
  const departments = useSelector((state) =>
    Array.isArray(state.dashboard?.departmentAnalytics)
      ? state.dashboard.departmentAnalytics.filter((d) => DEPTS[d.department_name])
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
          {departments.slice(0, 6).map((d, i) => {
            const { label, icon } = DEPTS[d.department_name];
            return (
              <div key={i} className='flex flex-col items-center'>
                <img src={icon} alt={label} className='w-12 mb-1' />
                <span className='font-semibold text-lg'>{d.count}</span>
                <p className='text-sm capitalize'>{label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
