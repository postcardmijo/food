import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // Re-import DB
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore'; // Re-import Hooks
import RestockPredictor from './RestockPredictor';

function KitchenInterface({ hallId = 'snelling_dining' }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // 1. REAL FIREBASE LISTENER
  useEffect(() => {
    const q = query(collection(db, 'inventory'), where("hall_id", "==", hallId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(liveItems);
      
      // If an item is currently selected for the chart, keep it updated live!
      if (selectedItem) {
        const updatedSelected = liveItems.find(i => i.id === selectedItem.id);
        if (updatedSelected) setSelectedItem(updatedSelected);
      }
    });

    return () => unsubscribe();
  }, [hallId, selectedItem]); // Re-run if selection changes to keep data fresh

  // 2. REAL DB WRITE
  const handleUpdate = async (itemId, amount) => {
    const itemRef = doc(db, 'inventory', itemId);
    try {
      await updateDoc(itemRef, {
        quantity_remaining: increment(amount),
        // If removing food (negative), add to consumed count
        quantity_consumed_today: amount < 0 ? increment(Math.abs(amount)) : increment(0)
      });
    } catch (error) {
      console.error("Error updating DB:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
        Kitchen Staff: <span className="text-blue-600 capitalize">{hallId.replace('_', ' ')}</span>
      </h2>
      
      {/* AI View - Now uses REAL data */}
      {selectedItem && (
        <div className="mb-8">
          <button onClick={() => setSelectedItem(null)} className="mb-4 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">← Back to Overview</button>
          <RestockPredictor 
            itemName={selectedItem.item_name} 
            currentStock={selectedItem.quantity_remaining} 
            consumedToday={selectedItem.quantity_consumed_today} // Passing the real stat!
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col transition-all cursor-pointer hover:shadow-lg ${selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.item_name}</h3>
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">AI Ready</span>
              </div>
              <p className="text-gray-500 font-medium">
                Current Stock: <span className={`text-3xl font-bold ml-2 ${item.quantity_remaining < 20 ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity_remaining}</span>
              </p>
            </div>

            <div className="flex border-t border-gray-100">
              <button 
                onClick={(e) => { e.stopPropagation(); handleUpdate(item.id, 20); }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 text-lg"
              >
                + Refill
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleUpdate(item.id, -20); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-4 text-lg border-l border-white/20"
              >
                ⚠ Empty
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KitchenInterface;