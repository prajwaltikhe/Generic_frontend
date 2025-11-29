import { useEffect, useState } from 'react';
import { APIURL } from '../../../constants';
import { ApiService } from '../../../services';
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
  const [departments, setDepartments] = useState([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    ApiService.get(APIURL.DEPARTMENTANALYTICS, { company_id: localStorage.getItem('company_id') }).then((res) => {
      setDepartments(res?.success && Array.isArray(res.data) ? res.data.filter((d) => DEPTS[d.department_name]) : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className='shadow-sm rounded-sm bg-white w-full p-3'>
      <p className='pb-3 text-sm'>Departments Analytics</p>
      <hr className='border-gray-100' />
      {loading ? (
        <div className='w-full flex justify-center items-center py-8'>
          <span className='text-xs text-gray-400 animate-pulse'>Loading...</span>
        </div>
      ) : (
        <div className='my-4 grid grid-cols-3 gap-y-6'>
          {departments.slice(0, 6).map((d, i) => {
            const { label, icon } = DEPTS[d.department_name];
            return (
              <div key={i} className='flex flex-col items-center'>
                <img src={icon} alt={label} className='w-10' />
                <span>{d.count}</span>
                <p className='text-sm capitalize'>{label}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
