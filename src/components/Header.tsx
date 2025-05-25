import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="p-4 flex justify-between items-center bg-[#23243a] text-gray-100 shadow-md">
      <h1 className="text-xl font-bold">Trading Dashboard</h1>
    </header>
  );
};

export default Header;