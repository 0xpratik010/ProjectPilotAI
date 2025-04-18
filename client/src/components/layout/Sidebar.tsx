import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Calendar, 
  FileBarChart,
  Plus, 
  Settings 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const [location] = useLocation();
  
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 z-50 w-64 bg-white border-r border-gray-200 h-screen transition-transform duration-200 ease-in-out`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Project Tracker</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <button 
              onClick={() => {
                // This would be linked to a modal or route to create a new project
                setOpen(false);
              }}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-md font-medium transition flex items-center justify-center"
            >
              <Plus size={18} className="mr-2" /> New Project
            </button>
          </div>

          <div>
            <p className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Main Menu</p>
            <Link href="/">
              <a className={`flex items-center py-2 px-3 rounded-md ${
                location === "/" ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}>
                <LayoutDashboard className="mr-3" size={20} /> Dashboard
              </a>
            </Link>
            <Link href="/projects">
              <a className={`flex items-center py-2 px-3 rounded-md ${
                location.includes("/projects") ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}>
                <CheckSquare className="mr-3" size={20} /> Projects
              </a>
            </Link>
            <Link href="/teams">
              <a className={`flex items-center py-2 px-3 rounded-md ${
                location.includes("/teams") ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}>
                <Users className="mr-3" size={20} /> Teams
              </a>
            </Link>
            <Link href="/calendar">
              <a className={`flex items-center py-2 px-3 rounded-md ${
                location.includes("/calendar") ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}>
                <Calendar className="mr-3" size={20} /> Calendar
              </a>
            </Link>
            <Link href="/reports">
              <a className={`flex items-center py-2 px-3 rounded-md ${
                location.includes("/reports") ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}>
                <FileBarChart className="mr-3" size={20} /> Reports
              </a>
            </Link>
          </div>
          
          <div className="mt-6">
            <p className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Recent Projects</p>
            <div className="space-y-1">
              {projects.slice(0, 3).map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <a className="block py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100">
                    {project.name}
                  </a>
                </Link>
              ))}
              
              {projects.length === 0 && (
                <p className="text-sm text-gray-500 py-2 px-3">No projects yet</p>
              )}
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-2">
              <span className="text-xs font-medium">JD</span>
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-500">Project Manager</p>
            </div>
            <button className="ml-auto text-gray-400 hover:text-gray-500">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
