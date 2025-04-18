import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Lock, Bell, Globe } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="profile" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xl">
                    JD
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Profile Picture</h3>
                    <p className="text-sm text-gray-500 mb-2">Update your profile photo</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Upload New</Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" defaultValue="Project Manager" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue="IT" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Account Settings</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-gray-500">Update your password</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div />
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button>Update Password</Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 mb-2">Add an extra layer of security to your account</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-gray-500">Receive verification codes via SMS or authentication app</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-red-500">Danger Zone</h4>
                  <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data</p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Project Updates</p>
                      <p className="text-sm text-gray-500">Receive notifications about project status changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Milestone Reminders</p>
                      <p className="text-sm text-gray-500">Get notified about upcoming and overdue milestones</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Issue Alerts</p>
                      <p className="text-sm text-gray-500">Be notified when new issues are created or resolved</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Team Messages</p>
                      <p className="text-sm text-gray-500">Receive notifications for team discussions and mentions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium mb-2">Delivery Methods</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email_notifications">Email Notifications</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="email_notifications" defaultChecked />
                        <Label htmlFor="email_notifications">Enabled</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="browser_notifications">Browser Notifications</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="browser_notifications" defaultChecked />
                        <Label htmlFor="browser_notifications">Enabled</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">General Settings</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Language</h4>
                  <p className="text-sm text-gray-500 mb-2">Select your preferred language</p>
                  <select className="w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50">
                    <option>English (US)</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Spanish</option>
                    <option>Japanese</option>
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-2">
                  <h4 className="font-medium">Date Format</h4>
                  <p className="text-sm text-gray-500 mb-2">Choose how dates are displayed</p>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dateFormat1" name="dateFormat" className="text-primary-600 focus:ring-primary-500" defaultChecked />
                      <label htmlFor="dateFormat1">MM/DD/YYYY (04/18/2025)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dateFormat2" name="dateFormat" className="text-primary-600 focus:ring-primary-500" />
                      <label htmlFor="dateFormat2">DD/MM/YYYY (18/04/2025)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="dateFormat3" name="dateFormat" className="text-primary-600 focus:ring-primary-500" />
                      <label htmlFor="dateFormat3">YYYY-MM-DD (2025-04-18)</label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-2">
                  <h4 className="font-medium">Theme</h4>
                  <p className="text-sm text-gray-500 mb-2">Set your interface theme preference</p>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="theme1" name="theme" className="text-primary-600 focus:ring-primary-500" defaultChecked />
                    <label htmlFor="theme1">Light</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="theme2" name="theme" className="text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="theme2">Dark</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="theme3" name="theme" className="text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="theme3">System Default</label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;