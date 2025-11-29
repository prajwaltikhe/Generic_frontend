import { NavLink } from 'react-router-dom';

const CustomTab = ({ tabs }) => {
  return (
    <nav className='border-b border-gray-200 mb-4 bg-white'>
      <div className='flex'>
        {tabs.map((tab, index) => (
          <NavLink
            key={index}
            to={tab.path}
            className={({ isActive }) =>
              isActive
                ? 'text-[#07163d] border-t-2 border-[#07163d] font-medium px-4 py-2 bg-white-bold'
                : 'text-gray-600 border-t-2 border-transparent font-medium px-4 py-2 hover:text-[#07163d] hover:border-[#07163d]'
            }>
            {tab.name}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default CustomTab;
