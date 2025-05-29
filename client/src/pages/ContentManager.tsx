import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Database, Settings } from "lucide-react";

export default function ContentManager() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch content types
  const { data: contentTypes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/content-types"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout pageTitle="Content Manager">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Content Manager</h1>
        <p className="text-gray-600">Manage and organize your content entries</p>
      </div>

      <Tabs defaultValue="collections">
        <TabsList className="mb-4">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="singleTypes">Single Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collections" className="space-y-4">




          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-muted/40">
                  <CardHeader className="h-24 animate-pulse bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-6 w-24 animate-pulse bg-muted rounded mb-2" />
                    <div className="h-4 w-32 animate-pulse bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contentTypes && contentTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTypes.map((contentType: any) => (
                <Card key={contentType.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                          <Database className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{contentType.displayName}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {contentType.description || `Manage your ${contentType.displayName.toLowerCase()} entries`}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {contentType.fieldCount || contentType.fields?.length || 0} fields
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate(`/content/${contentType.apiId}`)}
                      >
                        Manage
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Content Types Found</h3>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Start by creating a content type in the Content-Type Builder
                </p>
                <Button 
                  onClick={() => navigate("/content-type-builder")}
                  className="bg-secondary text-white hover:bg-secondary/90"
                >
                  Create Content Type
                </Button>
              </CardContent>
            </Card>
          )}









          
        </TabsContent>






        
        <TabsContent value="singleTypes">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Single Types Found</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Single types are not available yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
