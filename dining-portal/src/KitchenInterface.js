import { collection, doc, increment, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import RestockPredictor from './RestockPredictor';

function KitchenInterface({ hallId = 'snelling_dining' }) {
  // 1. Manage the Selected Hall in State (Default to the prop passed in)
  const [selectedHall, setSelectedHall] = useState(hallId);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // 2. REAL FIREBASE LISTENER (Updates whenever selectedHall changes)
  useEffect(() => {
    // Clear selection when switching halls to avoid showing "Pizza" from Snelling while looking at Bolton
    setSelectedItem(null);

    const q = query(collection(db, 'inventory'), where("hall_id", "==", selectedHall));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(liveItems);
      
      // Keep the AI chart live if an item is selected
      if (selectedItem) {
        const updatedSelected = liveItems.find(i => i.id === selectedItem.id);
        if (updatedSelected) setSelectedItem(updatedSelected);
      }
    });

    return () => unsubscribe();
  }, [selectedHall]); // <--- This dependency is key!

  // 3. REAL DB WRITE
  const handleUpdate = async (itemId, amount) => {
    const itemRef = doc(db, 'inventory', itemId);
    try {
      await updateDoc(itemRef, {
        quantity_remaining: increment(amount),
        quantity_consumed_today: amount < 0 ? increment(Math.abs(amount)) : increment(0)
      });
    } catch (error) {
      console.error("Error updating DB:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER WITH SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Kitchen Command Center
          </h2>
          <p className="text-gray-500 mt-1">Manage inventory and view AI predictions</p>
        </div>

        {/* The Location Switcher */}
        <div className="mt-4 md:mt-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
          <select 
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
            className="block w-full min-w-[250px] pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm bg-white border cursor-pointer font-semibold"
          >
            <option value="snelling_dining">Snelling Dining Commons</option>
            <option value="bolton_dining">Bolton Dining Commons</option>
            <option value="village_summit">Village Summit</option>
            <option value="oglethorpe_dining">Oglethorpe Dining Commons</option>
            <option value="niche_dining">The Niche</option>
          </select>
        </div>
      </div>
      
      {/* AI View - Only shows if an item is clicked */}
      {selectedItem && (
        <div className="mb-8 animate-fade-in-down">
          <button 
            onClick={() => setSelectedItem(null)} 
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors"
          >
            ← Back to Overview
          </button>
          <RestockPredictor 
            itemName={selectedItem.item_name} 
            currentStock={selectedItem.quantity_remaining} 
            consumedToday={selectedItem.quantity_consumed_today} 
          />
        </div>
      )}

      {/* Grid Display */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-xl text-gray-400 font-medium">No active inventory found for this location.</p>
          <p className="text-gray-400 text-sm mt-2">Items will appear here once students log meals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-1 ${selectedItem?.id === item.id ? 'ring-2 ring-blue-500 shadow-xl' : ''}`}
            >
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{item.item_name}</h3>
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    AI Ready
                  </span>
                </div>
                <div className="flex items-baseline mt-2">
                  <span className="text-gray-500 font-medium mr-2">Stock:</span>
                  <span className={`text-4xl font-extrabold ${item.quantity_remaining < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.quantity_remaining}
                  </span>
                </div>
              </div>

              <div className="flex border-t border-gray-100">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpdate(item.id, 20); }}
                  className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-5 text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>+</span> Refill
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpdate(item.id, -20); }}
                  className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-5 text-lg transition-colors border-l border-white/20 flex items-center justify-center gap-2"
                >
                  <span>⚠</span> Empty
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KitchenInterface;