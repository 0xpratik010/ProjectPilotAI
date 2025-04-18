import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Project } from "@shared/schema";
import { User, Users, Phone, Mail, Building } from "lucide-react";

const TeamsPage = () => {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Extract team members from projects
  const teamMembers = [
    { 
      id: 1, 
      name: "Sarah Chen", 
      role: "Project Manager",
      email: "sarah.chen@example.com",
      phone: "+1 (555) 123-4567",
      department: "IT",
      projects: projects.filter(p => p.pmName === "Sarah Chen").map(p => p.name)
    },
    { 
      id: 2, 
      name: "Michael Johnson", 
      role: "Business Analyst",
      email: "michael.johnson@example.com",
      phone: "+1 (555) 234-5678",
      department: "Business",
      projects: projects.filter(p => p.baName === "Michael Johnson").map(p => p.name)
    },
    { 
      id: 3, 
      name: "Robert Smith", 
      role: "Technical Lead",
      email: "robert.smith@example.com",
      phone: "+1 (555) 345-6789",
      department: "Engineering",
      projects: projects.filter(p => p.tlName === "Robert Smith").map(p => p.name)
    },
    { 
      id: 4, 
      name: "Emily Davis", 
      role: "UI Lead",
      email: "emily.davis@example.com",
      phone: "+1 (555) 456-7890",
      department: "Design",
      projects: projects.filter(p => p.uiLeadName === "Emily Davis").map(p => p.name)
    },
    { 
      id: 5, 
      name: "James Wilson", 
      role: "DB Lead",
      email: "james.wilson@example.com",
      phone: "+1 (555) 567-8901",
      department: "Engineering",
      projects: projects.filter(p => p.dbLeadName === "James Wilson").map(p => p.name)
    }
  ];
  
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Team Members</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map(member => (
          <Card key={member.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200 flex items-center">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
              
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-start">
                  <Mail size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-gray-700">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-gray-700">{member.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Building size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-gray-700">{member.department}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users size={16} className="mr-2 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Assigned Projects</p>
                    {member.projects.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.projects.map((project, index) => (
                          <span key={index} className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {project}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">No projects assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeamsPage;