import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@shared/schema";
import { User } from "lucide-react";

interface TeamMembersProps {
  project: Project;
}

const TeamMembers = ({ project }: TeamMembersProps) => {
  // Create an array of team members from the project data
  const teamMembers = [
    { role: "Project Manager", name: project.pmName },
    { role: "Delivery Lead", name: project.dlName },
    { role: "Business Analyst", name: project.baName },
    { role: "Technical Lead", name: project.tlName },
    { role: "UI Lead", name: project.uiLeadName },
    { role: "DB Lead", name: project.dbLeadName },
    { role: "QA Lead", name: project.qaLeadName }
  ].filter(member => member.name); // Filter out empty roles
  
  // Function to get avatar background color based on role
  const getAvatarColor = (role: string) => {
    switch (role) {
      case "Project Manager":
        return "bg-primary-100 text-primary-600";
      case "Delivery Lead":
        return "bg-amber-100 text-amber-600";
      case "Business Analyst":
        return "bg-green-100 text-green-600";
      case "Technical Lead":
        return "bg-blue-100 text-blue-600";
      case "UI Lead":
        return "bg-purple-100 text-purple-600";
      case "DB Lead":
        return "bg-indigo-100 text-indigo-600";
      case "QA Lead":
        return "bg-pink-100 text-pink-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "??";
    
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  return (
    <Card className="col-span-2">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Project Team</h2>
        
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No team members assigned yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getAvatarColor(member.role)}`}>
                  {getInitials(member.name || "")}
                </div>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembers;
