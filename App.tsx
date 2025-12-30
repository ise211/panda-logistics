import React, { useState } from 'react';
import { User, UserRole } from './types';
import { Login } from './views/auth/Login';
import { DriverApp } from './views/driver/DriverApp';
import { LogisticsApp } from './views/logistics/LogisticsApp';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Simple "Routing" based on Auth and Role
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === UserRole.DRIVER) {
    return <DriverApp user={user} onLogout={() => setUser(null)} />;
  }

  if (user.role === UserRole.LOGISTICS || user.role === UserRole.MANAGER) {
    return <LogisticsApp user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-xl font-bold">Role not supported</h1>
        <button onClick={() => setUser(null)} className="text-blue-500 underline mt-2">Go back</button>
      </div>
    </div>
  );
};

export default App;