import { Search, Bell, Menu, ChevronDown, LayoutDashboard, BarChart2, Settings, Grid, List, Filter, X, PlusCircle } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopNavProps {
  toggleSidebar: () => void;
}

const TopNav = ({ toggleSidebar }: TopNavProps) => {
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    owner: "",
    dateRange: ""
  });
  const isMobile = useIsMobile();

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    // Here you would implement the logic to filter data based on the selected filters
    console.log("Applying filters:", filters);
    // For demonstration purposes, we'll close the filter panel
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      owner: "",
      dateRange: ""
    });
  };

  const handleCreateProject = () => {
    navigate('/projects?action=create');
  };

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
            <button
              onClick={() => navigate('/projects?action=create')}
              className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium inline-flex items-center mr-3"
            >
              <PlusCircle size={16} className="mr-2" /> Create Project
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
          <div className="flex space-x-1 md:space-x-4">
            <Link href="/">
              <a className={`py-2 px-3 md:px-3 border-b-2 flex items-center ${
                location === "/" ? "border-primary-500 text-primary-600 font-medium" : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
              }`}>
                <LayoutDashboard size={18} className="md:mr-2" />
                <span className="hidden md:inline">Dashboard</span>
              </a>
            </Link>
            <Link href="/analytics">
              <a className={`py-2 px-3 md:px-3 border-b-2 flex items-center ${
                location === "/analytics" ? "border-primary-500 text-primary-600 font-medium" : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
              }`}>
                <BarChart2 size={18} className="md:mr-2" />
                <span className="hidden md:inline">Analytics</span>
              </a>
            </Link>
            <Link href="/settings">
              <a className={`py-2 px-3 md:px-3 border-b-2 flex items-center ${
                location === "/settings" ? "border-primary-500 text-primary-600 font-medium" : "border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-800"
              }`}>
                <Settings size={18} className="md:mr-2" />
                <span className="hidden md:inline">Settings</span>
              </a>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-gray-500">View:</span>
              <button className="bg-primary-50 text-primary-600 p-1 rounded">
                <Grid size={20} />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <List size={20} />
              </button>
            </div>
            <button 
              onClick={() => setFiltersOpen(!filtersOpen)} 
              className="flex items-center bg-white text-gray-700 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-50"
            >
              <Filter size={16} className="mr-1.5" />
              <span className="inline mr-1">Filters</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {filtersOpen && (
        <div className="bg-white border-b border-gray-200 py-3 px-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Filter Results</h3>
            <button 
              onClick={() => setFiltersOpen(false)} 
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="At Risk">At Risk</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
              <select 
                name="owner"
                value={filters.owner}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-sm"
              >
                <option value="">All Owners</option>
                <option value="Sarah Chen">Sarah Chen</option>
                <option value="Michael Johnson">Michael Johnson</option>
                <option value="Robert Smith">Robert Smith</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <select 
                name="dateRange"
                value={filters.dateRange}
                onChange={handleFilterChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50 text-sm"
              >
                <option value="">Any Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button 
              onClick={resetFilters}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button 
              onClick={applyFilters}
              className="px-3 py-1 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;