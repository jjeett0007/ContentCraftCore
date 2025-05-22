import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronDown, Code, Copy, FileJson, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocumentation() {
  const [selectedContentType, setSelectedContentType] = useState<string>("");
  const { toast } = useToast();
  
  // Get all content types
  const { data: contentTypes = [], isLoading: isLoadingContentTypes } = useQuery({
    queryKey: ['/api/content-types'],
  });

  // Set the first content type as selected when data loads
  useEffect(() => {
    if (contentTypes.length > 0 && !selectedContentType) {
      setSelectedContentType(contentTypes[0].apiId);
    }
  }, [contentTypes, selectedContentType]);

  // Get selected content type details
  const { data: contentTypeDetails } = useQuery({
    queryKey: ['/api/content-types', selectedContentType],
    enabled: !!selectedContentType,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The code snippet has been copied to your clipboard.",
      duration: 2000,
    });
  };

  // Generate sample request/response based on content type
  const generateSamples = (contentType: any) => {
    if (!contentType) return { post: {}, get: {}, getById: {}, put: {}, patch: {}, delete: {} };
    
    const fields = contentType.fields;
    const sampleData: any = {};
    const sampleId = "123456789";
    
    // Create sample data based on field types
    fields.forEach((field: any) => {
      switch (field.type) {
        case 'text':
          sampleData[field.name] = `Sample ${field.displayName}`;
          break;
        case 'number':
          sampleData[field.name] = 42;
          break;
        case 'boolean':
          sampleData[field.name] = true;
          break;
        case 'date':
          sampleData[field.name] = new Date().toISOString();
          break;
        case 'email':
          sampleData[field.name] = "user@example.com";
          break;
        case 'url':
          sampleData[field.name] = "https://example.com";
          break;
        case 'select':
          if (field.options && field.options.length > 0) {
            sampleData[field.name] = field.options[0];
          } else {
            sampleData[field.name] = "option1";
          }
          break;
        default:
          sampleData[field.name] = "Sample value";
      }
    });

    return {
      post: {
        request: sampleData,
        response: { 
          id: sampleId, 
          ...sampleData,
          createdAt: new Date().toISOString()
        }
      },
      get: {
        response: { 
          entries: [
            { id: sampleId, ...sampleData, createdAt: new Date().toISOString() },
            { id: "987654321", ...sampleData, createdAt: new Date().toISOString() }
          ],
          totalCount: 2,
          page: 1,
          limit: 10
        }
      },
      getById: {
        response: { 
          id: sampleId, 
          ...sampleData,
          createdAt: new Date().toISOString() 
        }
      },
      put: {
        request: sampleData,
        response: { 
          id: sampleId, 
          ...sampleData,
          updatedAt: new Date().toISOString() 
        }
      },
      patch: {
        request: {
          [Object.keys(sampleData)[0]]: sampleData[Object.keys(sampleData)[0]]
        },
        response: { 
          id: sampleId, 
          ...sampleData,
          updatedAt: new Date().toISOString() 
        }
      },
      delete: {
        response: { 
          success: true,
          message: "Record deleted successfully" 
        }
      }
    };
  };

  const samples = contentTypeDetails ? generateSamples(contentTypeDetails) : null;

  // Format code for display
  const formatJson = (json: any): string => {
    return JSON.stringify(json, null, 2);
  };

  // Generate API endpoint
  const getApiEndpoint = (contentType: string, id?: boolean): string => {
    return id 
      ? `/api/content/${contentType}/:id` 
      : `/api/content/${contentType}`;
  };

  // Render code block with copy button
  const CodeBlock = ({ code, language = "json", title = "" }: { code: string, language?: string, title?: string }) => (
    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden mt-2">
      {title && (
        <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 font-mono">
          {title}
        </div>
      )}
      <div className="relative">
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute right-2 top-2 p-1 h-auto"
          onClick={() => copyToClipboard(code)}
        >
          <Copy size={14} />
        </Button>
        <pre className="p-4 pt-8 overflow-x-auto text-sm">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );

  // Render method documentation
  const MethodDoc = ({ method, endpoint, requestSample, responseSample, description }: any) => (
    <AccordionItem value={method}>
      <AccordionTrigger className="text-left">
        <div className="flex items-center">
          <span className={`mr-2 px-2 py-1 text-xs font-bold rounded-md 
            ${method === "GET" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : ""}
            ${method === "POST" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
            ${method === "PUT" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : ""}
            ${method === "PATCH" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : ""}
            ${method === "DELETE" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : ""}
          `}>
            {method}
          </span>
          <span className="font-mono text-sm">{endpoint}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          
          {requestSample && (
            <div>
              <h4 className="text-sm font-medium mb-1 flex items-center">
                <FileJson className="h-4 w-4 mr-1" />
                Request Body
              </h4>
              <CodeBlock code={formatJson(requestSample)} />
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-1 flex items-center">
              <Server className="h-4 w-4 mr-1" />
              Response
            </h4>
            <CodeBlock code={formatJson(responseSample)} />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <AdminLayout pageTitle="API Documentation">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
            <p className="text-muted-foreground">
              Interactive documentation for your content type APIs
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            <Select 
              value={selectedContentType} 
              onValueChange={setSelectedContentType}
              disabled={isLoadingContentTypes || contentTypes.length === 0}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type: any) => (
                  <SelectItem key={type.apiId} value={type.apiId}>
                    {type.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingContentTypes ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contentTypes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                No Content Types Available
              </CardTitle>
              <CardDescription>
                Create a content type to see its API documentation.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !contentTypeDetails ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <Code className="mr-2 h-5 w-5" />
                    {contentTypeDetails.displayName} API
                  </div>
                </CardTitle>
                <CardDescription>
                  Base path: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">/api/content/{contentTypeDetails.apiId}</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="rest">
                  <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="rest">REST API</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="rest" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>These endpoints allow you to manage {contentTypeDetails.displayName.toLowerCase()} content.</p>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {samples && (
                        <>
                          <MethodDoc 
                            method="GET" 
                            endpoint={getApiEndpoint(contentTypeDetails.apiId)}
                            responseSample={samples.get.response} 
                            description={`Retrieves a list of all ${contentTypeDetails.displayName.toLowerCase()}. Supports pagination with query parameters ?page=1&limit=10.`}
                          />
                          
                          <MethodDoc 
                            method="GET" 
                            endpoint={getApiEndpoint(contentTypeDetails.apiId, true)}
                            responseSample={samples.getById.response} 
                            description={`Retrieves a specific ${contentTypeDetails.displayName.toLowerCase()} by its ID.`}
                          />
                          
                          <MethodDoc 
                            method="POST" 
                            endpoint={getApiEndpoint(contentTypeDetails.apiId)}
                            requestSample={samples.post.request} 
                            responseSample={samples.post.response} 
                            description={`Creates a new ${contentTypeDetails.displayName.toLowerCase()}.`}
                          />
                          
                          <MethodDoc 
                            method="PUT" 
                            endpoint={getApiEndpoint(contentTypeDetails.apiId, true)}
                            requestSample={samples.put.request} 
                            responseSample={samples.put.response} 
                            description={`Replaces an existing ${contentTypeDetails.displayName.toLowerCase()} with the provided data.`}
                          />
                          
                          <MethodDoc 
                            method="PATCH" 
                            endpoint={getApiEndpoint(contentTypeDetails.apiId, true)}
                            requestSample={samples.patch.request} 
                            responseSample={samples.patch.response} 
                            description={`Updates specific fields of an existing ${contentTypeDetails.displayName.toLowerCase()}.`}
                          />
                          
                          <MethodDoc 
                            method="DELETE" 
                            endpoint={getApiEndpoint(contentTypeDetails.apiId, true)}
                            responseSample={samples.delete.response} 
                            description={`Deletes a ${contentTypeDetails.displayName.toLowerCase()} by its ID.`}
                          />
                        </>
                      )}
                    </Accordion>
                  </TabsContent>
                  
                  <TabsContent value="schema">
                    <h3 className="text-sm font-medium mb-2">Schema Definition</h3>
                    <CodeBlock 
                      code={formatJson(contentTypeDetails.fields)} 
                      title="Content Type Fields"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  All API requests require authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">Add the following header to your requests:</p>
                <CodeBlock 
                  code={`Authorization: Bearer YOUR_JWT_TOKEN`} 
                  language="http" 
                  title="Request Header"
                />
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">How to get an authentication token</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Send a POST request to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded font-mono">/api/auth/login</code> with your username and password to receive a JWT token.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}