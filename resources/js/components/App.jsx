import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-6 bg-white dark:bg-[#161615] rounded-lg shadow-lg border-2 border-[#F53003] dark:border-[#FF4433]">
      <h1 className="text-3xl font-bold mb-4 text-[#F53003] dark:text-[#FF4433]">
        ⚛️ React is Working! 🎉
      </h1>
      <p className="mb-4 text-[#706f6c] dark:text-[#A1A09A] text-lg">
        This is a React component running inside Laravel with Vite.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-6 py-3 bg-[#1b1b18] dark:bg-[#eeeeec] text-white dark:text-[#1C1C1A] rounded-sm hover:bg-black dark:hover:bg-white transition-colors text-lg font-bold"
        >
          -
        </button>
        <span className="text-2xl font-bold text-[#1b1b18] dark:text-[#EDEDEC] min-w-[120px] text-center">
          Count: {count}
        </span>
        <button
          onClick={() => setCount(count + 1)}
          className="px-6 py-3 bg-[#1b1b18] dark:bg-[#eeeeec] text-white dark:text-[#1C1C1A] rounded-sm hover:bg-black dark:hover:bg-white transition-colors text-lg font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default App;
