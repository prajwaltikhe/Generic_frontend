import CounterCard from './components/CounterCard';
import FleetStatus from './components/FleetStatus';
import LateArrival from './components/LateArrival';
import DepartmentStats from './components/DepartmentStats';
import EmployeeBoarding from './components/EmployeeBoarding';
import OverspeedViolation from './components/OverspeedViolation';
import DistanceCoveredStats from './components/DistanceCoveredStats';

function Dashboard() {
  return (
    <div className='w-full h-full p-2'>
      <div className='bg-white rounded-xl shadow-sm px-4 py-3 border-b border-gray-200 mb-3'>
        <h1 className='text-xl font-bold text-gray-800'>SIEL-P(C) One-Touch Transport System</h1>
      </div>
      <CounterCard />
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
        <FleetStatus />
        <EmployeeBoarding />
        <DistanceCoveredStats />
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
        <DepartmentStats />
        <LateArrival />
        <OverspeedViolation />
      </div>
    </div>
  );
}

export default Dashboard;
