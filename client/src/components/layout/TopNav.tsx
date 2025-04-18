import { Search, Bell, Menu, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface TopNavProps {
  toggleSidebar: () => void;
}

const TopNav = ({ toggleSidebar }: TopNavProps) => {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  
  return (
    <>
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
            >
              <Menu size={24} />
            </button>
          </div>
          
          <div className="flex md:hidden ml-2">
            <h1 className="text-lg font-bold text-primary-600">Project Tracker</h1>
          </div>
          
          <div className={`relative w-full max-w-lg ${searchOpen ? 'block' : 'hidden'} md:block`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search projects, tasks, milestones..."
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search size={20} />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sub Navigation / Tabs */}
      <div className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 overflow-x-auto hide-scrollbar">
            <Link href="/">
              <a className={`py-2 px-1 border-b-2 whitespace-nowrap ${
                location === "/" ? "border-primary-500 text-primary-600 font-medium" : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
              }`}>
                Dashboard
              </a>
            </Link>
            <Link href="/analytics">
              <a className={`py-2 px-1 border-b-2 whitespace-nowrap ${
                location === "/analytics" ? "border-primary-500 text-primary-600 font-medium" : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
              }`}>
                Analytics
              </a>
            </Link>
            <Link href="/settings">
              <a className={`py-2 px-1 border-b-2 whitespace-nowrap ${
                location === "/settings" ? "border-primary-500 text-primary-600 font-medium" : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
              }`}>
                Settings
              </a>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-gray-500">View:</span>
              <button className="bg-primary-50 text-primary-600 p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
            <button className="flex items-center bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-1 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              Filters <ChevronDown size={14} className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNav;
