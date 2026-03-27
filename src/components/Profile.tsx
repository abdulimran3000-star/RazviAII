import React from 'react';
import { User, Mail } from 'lucide-react';

interface ProfileProps {
  user: any;
}

export default function Profile({ user }: ProfileProps) {
  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
          <User size={48} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-sans text-gray-800">Your Profile</h2>
          <p className="text-gray-500 font-sans">Manage your account details</p>
        </div>

        <div className="w-full mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
            <Mail size={24} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
            <p className="text-lg font-medium text-gray-800">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
