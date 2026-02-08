import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Added 'consumedToday' to props for real calculation
const RestockPredictor = ({ itemName, currentStock, consumedToday }) => {
  
  // 1. CALCULATE REAL BURN RATE
  // We assume the dining hall opens at 8 AM.
  const openingHour = 8;
  const currentHour = new Date().getHours();
  // Ensure we don't divide by zero if checking at 8 AM
  const hoursOpen = Math.max(1, currentHour - openingHour);
  
  // Real Calculation: (Total Eaten Today) / (Hours Open)
  // If nothing eaten yet, default to a low number (5) to prevent errors
  const burnRate = consumedToday > 0 ? (consumedToday / hoursOpen) : 5;

  const generatePredictionData = () => {
    const data = [];
    
    // A. PAST DATA (Reverse Engineered)
    // We create 4 hours of history based on the calculated burn rate
    for (let i = 4; i >= 1; i--) {
      data.push({
        time: `-${i}h`,
        stock: Math.round(currentStock + (i * burnRate)), // Estimate what stock was
        prediction: null // No prediction for the past
      });
    }

    // B. CURRENT MOMENT (The Connector)
    // This point has BOTH 'stock' and 'prediction' values so the lines connect!
    data.push({
      time: 'Now',
      stock: currentStock,
      prediction: currentStock
    });

    // C. FUTURE PREDICTION
    const hoursToEmpty = currentStock / burnRate;
    
    // Generate future points until stock hits 0
    for (let i = 1; i <= Math.ceil(hoursToEmpty) + 2; i++) {
      const predictedValue = currentStock - (i * burnRate);
      
      data.push({
        time: `+${i}h`,
        stock: null, // No actual data for future
        prediction: predictedValue > 0 ? Math.round(predictedValue) : 0
      });

      // Stop generating if we hit zero
      if (predictedValue <= 0) break;
    }
    
    return { data, hoursToEmpty };
  };

  const { data, hoursToEmpty } = generatePredictionData();
  const isUrgent = hoursToEmpty < 2;

  return (
    <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in-down">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-purple-600 text-xl">✨</span> 
            AI Consumption Forecast: {itemName}
          </h3>
          <p className="text-sm text-gray-500">
            Current Burn Rate: <span className="font-bold text-gray-700">{burnRate.toFixed(1)} units/hr</span>
          </p>
        </div>
        
        {/* The "Smart" Alert */}
        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
          isUrgent ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {hoursToEmpty < 1 
            ? "⚠️ EMPTY SOON" 
            : `Empty in ~${hoursToEmpty.toFixed(1)} hrs`
          }
        </div>
      </div>

      {/* The Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#6b7280', fontSize: 12}} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            
            <ReferenceLine y={20} label="Restock Trigger" stroke="#ef4444" strokeDasharray="3 3" />
            
            {/* 1. ACTUAL HISTORY LINE */}
            <Line 
              type="monotone" 
              dataKey="stock" 
              stroke="#3b82f6" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} 
              activeDot={{ r: 8 }}
              name="Actual Stock"
              connectNulls={true} // Ensures smooth connection
            />
            
            {/* 2. AI PREDICTION LINE */}
            {/* Starts at 'Now' to connect seamlessly */}
            <Line 
              type="monotone" 
              dataKey="prediction" 
              stroke="#8b5cf6" 
              strokeWidth={4} 
              strokeDasharray="8 8" 
              dot={{ r: 6, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }} 
              activeDot={{ r: 8 }}
              name="AI Forecast"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RestockPredictor;