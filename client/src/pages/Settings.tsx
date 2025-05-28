import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Save, RefreshCw } from "lucide-react";

export default function Settings() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // State for general settings
  const [siteName, setSiteName] = useState("Corebase CMS");
  const [apiPrefix, setApiPrefix] = useState("/api");
  const [mediaProvider, setMediaProvider] = useState("local");
  const [cloudinaryConfig, setCloudinaryConfig] = useState({
    cloudName: "",
    apiKey: "",
    apiSecret: "",
  });
  
  // State for permission settings
  const [permissions, setPermissions] = useState({
    publicRegistration: false,
    defaultRole: "viewer",
    contentApproval: false,
    mediaUploadRoles: {
      admin: true,
      editor: true,
      viewer: false,
    },
  });
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access Settings",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, navigate, user, toast]);

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Update settings on load
  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "Corebase CMS");
      setApiPrefix(settings.apiPrefix || "/api");
      setMediaProvider(settings.mediaProvider || "local");
      setCloudinaryConfig({
        cloudName: settings.cloudinary?.cloudName || "",
        apiKey: settings.cloudinary?.apiKey || "",
        apiSecret: settings.cloudinary?.apiSecret || "",
      });
      setPermissions({
        publicRegistration: settings.permissions?.publicRegistration || false,
        defaultRole: settings.permissions?.defaultRole || "viewer",
        contentApproval: settings.permissions?.contentApproval || false,
        mediaUploadRoles: settings.permissions?.mediaUploadRoles || {
          admin: true,
          editor: true,
          viewer: false,
        },
      });
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    const settingsData = {
      siteName,
      apiPrefix,
      mediaProvider,
      cloudinary: mediaProvider === "cloudinary" ? cloudinaryConfig : undefined,
      permissions,
    };
    
    saveMutation.mutate(settingsData);
  };

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "administrator")) {
    return null;
  }

  return (
    <AdminLayout pageTitle="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Configure your Corebase CMS instance</p>
      </div>

      <Tabs defaultValue="general">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <Button 
            className="bg-primary text-dark hover:bg-primary/90"
            onClick={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure the basic settings for your CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input 
                  id="site-name" 
                  value={siteName} 
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="api-prefix">API Prefix</Label>
                <Input 
                  id="api-prefix" 
                  value={apiPrefix} 
                  onChange={(e) => setApiPrefix(e.target.value)}
                  placeholder="Enter API prefix"
                />
                <p className="text-xs text-muted-foreground">
                  This is the prefix used for all API endpoints
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media Settings</CardTitle>
              <CardDescription>
                Configure how media files are stored and processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Media Provider</Label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="local-storage" 
                    name="media-provider"
                    checked={mediaProvider === "local"}
                    onChange={() => setMediaProvider("local")}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="local-storage" className="cursor-pointer">Local Storage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="cloudinary" 
                    name="media-provider"
                    checked={mediaProvider === "cloudinary"}
                    onChange={() => setMediaProvider("cloudinary")}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="cloudinary" className="cursor-pointer">Cloudinary</Label>
                </div>
              </div>
              
              {mediaProvider === "cloudinary" && (
                <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                  <h3 className="font-medium">Cloudinary Configuration</h3>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="cloud-name">Cloud Name</Label>
                    <Input 
                      id="cloud-name" 
                      value={cloudinaryConfig.cloudName} 
                      onChange={(e) => setCloudinaryConfig({...cloudinaryConfig, cloudName: e.target.value})}
                      placeholder="Enter Cloudinary cloud name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input 
                      id="api-key" 
                      value={cloudinaryConfig.apiKey} 
                      onChange={(e) => setCloudinaryConfig({...cloudinaryConfig, apiKey: e.target.value})}
                      placeholder="Enter Cloudinary API key"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="api-secret">API Secret</Label>
                    <Input 
                      id="api-secret" 
                      type="password"
                      value={cloudinaryConfig.apiSecret} 
                      onChange={(e) => setCloudinaryConfig({...cloudinaryConfig, apiSecret: e.target.value})}
                      placeholder="Enter Cloudinary API secret"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Configure user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="public-registration" className="text-base">Public Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to register accounts without admin approval
                  </p>
                </div>
                <Switch 
                  id="public-registration"
                  checked={permissions.publicRegistration}
                  onCheckedChange={(checked) => 
                    setPermissions({...permissions, publicRegistration: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="content-approval" className="text-base">Content Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Require admin approval before content is published
                  </p>
                </div>
                <Switch 
                  id="content-approval"
                  checked={permissions.contentApproval}
                  onCheckedChange={(checked) => 
                    setPermissions({...permissions, contentApproval: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-base font-medium mb-2">Media Upload Permissions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which roles can upload media files
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="admin-upload"
                      checked={permissions.mediaUploadRoles.admin}
                      onCheckedChange={(checked) => 
                        setPermissions({
                          ...permissions, 
                          mediaUploadRoles: {
                            ...permissions.mediaUploadRoles,
                            admin: checked === true
                          }
                        })
                      }
                    />
                    <Label htmlFor="admin-upload">Administrator</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="editor-upload"
                      checked={permissions.mediaUploadRoles.editor}
                      onCheckedChange={(checked) => 
                        setPermissions({
                          ...permissions, 
                          mediaUploadRoles: {
                            ...permissions.mediaUploadRoles,
                            editor: checked === true
                          }
                        })
                      }
                    />
                    <Label htmlFor="editor-upload">Editor</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="viewer-upload"
                      checked={permissions.mediaUploadRoles.viewer}
                      onCheckedChange={(checked) => 
                        setPermissions({
                          ...permissions, 
                          mediaUploadRoles: {
                            ...permissions.mediaUploadRoles,
                            viewer: checked === true
                          }
                        })
                      }
                    />
                    <Label htmlFor="viewer-upload">Viewer</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-4">Theme</h3>
                <div className="flex gap-4">
                  <div 
                    className={`flex flex-col items-center gap-2 p-4 rounded-md cursor-pointer border-2 ${
                      theme === "light" ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Sun className="h-8 w-8 text-amber-500" />
                    </div>
                    <span className="font-medium">Light</span>
                  </div>
                  
                  <div 
                    className={`flex flex-col items-center gap-2 p-4 rounded-md cursor-pointer border-2 ${
                      theme === "dark" ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                      <Moon className="h-8 w-8 text-blue-400" />
                    </div>
                    <span className="font-medium">Dark</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-base font-medium mb-2">Brand Colors</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These are the default brand colors for Corebase CMS
                </p>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-md bg-primary" />
                    <span className="text-xs mt-1">Primary</span>
                    <span className="text-xs text-muted-foreground">#FFB200</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-md bg-secondary" />
                    <span className="text-xs mt-1">Secondary</span>
                    <span className="text-xs text-muted-foreground">#EB5B00</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-md bg-accent" />
                    <span className="text-xs mt-1">Accent</span>
                    <span className="text-xs text-muted-foreground">#D91656</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-md" style={{ backgroundColor: "#640D5F" }} />
                    <span className="text-xs mt-1">Dark</span>
                    <span className="text-xs text-muted-foreground">#640D5F</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <p className="text-sm text-muted-foreground">
                Custom color themes can be configured by modifying the CSS variables.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
