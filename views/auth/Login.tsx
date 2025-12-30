import React from 'react';
import { MOCK_USERS } from '../../services/mockData';
import { User } from '../../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-white p-8 pb-4 text-center border-b border-gray-100">
          <img 
            src="https://www.pandarosametals.co.uk/wp-content/uploads/2015/10/logo.jpg" 
            alt="PandaRosaMetals" 
            className="h-24 mx-auto object-contain mb-2"
          />
          <p className="text-secondary opacity-70 mt-1 font-medium">PandaRosaMetals Logistics System</p>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-center text-gray-600 mb-4">Select Role (Demo Mode)</p>
          
          <div className="space-y-3">
            {MOCK_USERS.map(user => (
              <button
                key={user.id}
                onClick={() => onLogin(user)}
                className="w-full p-4 border-2 border-gray-100 hover:border-primary rounded-xl flex items-center justify-between transition-all group"
              >
                <div className="text-left">
                  <div className="font-bold text-lg text-secondary">{user.name}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{user.role}</div>
                </div>
                <div className="text-gray-300 group-hover:text-primary text-2xl">→</div>
              </button>
            ))}
          </div>

          <div className="text-center text-xs text-gray-400 mt-6">
            Production version would require password and 2FA.
          </div>
        </div>
      </div>
    </div>
  );
};