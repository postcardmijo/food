import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Re-import DB
import { collection, onSnapshot, query, where } from 'firebase/firestore'; // Re-import Hooks
import Login from './Login';
import KitchenInterface from './KitchenInterface';

function App() {
  const [currentView, setCurrentView] = useState('login'); 

  if (currentView === 'login') {
    return <Login onLogin={() => setCurrentView('manager')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight">UGA Dining Portal</span>
            </div>
            <div className="flex space-x-4">
              <NavButton active={currentView === 'manager'} onClick={() => setCurrentView('manager')}>Manager</NavButton>
              <NavButton active={currentView === 'kitchen'} onClick={() => setCurrentView('kitchen')}>Kitchen</NavButton>
              <button onClick={() => setCurrentView('login')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">Log Out</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        {currentView === 'manager' ? <ManagerDashboard /> : <KitchenInterface hallId="snelling_dining" />}
      </main>
    </div>
  );
}

const NavButton = ({ active, children, onClick }) => (
  <button onClick={onClick} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>{children}</button>
);

const ManagerDashboard = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedHall, setSelectedHall] = useState('all');

  // 1. REAL FIREBASE LISTENER
  useEffect(() => {
    const inventoryRef = collection(db, 'inventory');
    const q = selectedHall === 'all' 
      ? inventoryRef 
      : query(inventoryRef, where("hall_id", "==", selectedHall));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInventoryData(items);
    });

    return () => unsubscribe();
  }, [selectedHall]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Overview</h1>
        <div className="mt-4 sm:mt-0">
          <select onChange={(e) => setSelectedHall(e.target.value)} value={selectedHall} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white border">
            <option value="all">All Locations</option>
            <option value="bolton_dining">Bolton</option>
            <option value="snelling_dining">Snelling</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryData.map((item) => (
          <div key={item.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 transition hover:shadow-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-sm font-medium text-gray-500 truncate mb-1 capitalize">
                {item.hall_id ? item.hall_id.replace('_', ' ') : 'Unknown Hall'}
              </div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{item.item_name}</h3>
              <div className="flex justify-between items-end">
                <div>
                  <div className={`text-3xl font-bold ${item.quantity_remaining < 15 ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity_remaining}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Remaining</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-600">{item.quantity_consumed_today}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Eaten</div>
                </div>
              </div>
            </div>
            <div className={`h-2 w-full ${item.quantity_remaining < 15 ? 'bg-red-500' : 'bg-green-500'}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;