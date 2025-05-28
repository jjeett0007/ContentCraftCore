import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, UserCircle } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.string().min(1, "Role is required"),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UserManagement() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "admin" && user?.role !== "administrator") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access User Management",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAuthenticated, navigate, user, toast]);

  // Form setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "editor",
    },
  });

  // Reset form when editing user changes
  useEffect(() => {
    if (editingUser) {
      form.reset({
        username: editingUser.username,
        password: "",  // Don't fill password field
        role: editingUser.role,
      });
    } else {
      form.reset({
        username: "",
        password: "",
        role: "editor",
      });
    }
  }, [editingUser, form]);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UserFormValues }) => {
      // If password is empty, remove it from the payload
      if (!data.password) {
        const { password, ...rest } = data;
        return apiRequest("PUT", `/api/users/${id}`, rest);
      }
      return apiRequest("PUT", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setShowForm(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setDeletingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
      setDeletingUser(null);
    }
  });

  const onSubmit = (data: UserFormValues) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeletingUser(id);
  };

  const confirmDelete = () => {
    if (deletingUser) {
      deleteMutation.mutate(deletingUser);
    }
  };

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "administrator")) {
    return null;
  }

  return (
    <AdminLayout pageTitle="User Management">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">Manage users and their permissions</p>
        </div>
        <Button 
          className="bg-secondary text-white hover:bg-secondary/90"
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                            <span className="text-sm font-medium">
                              {user.username.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span>{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin" 
                            ? "bg-primary/10 text-primary" 
                            : user.role === "editor"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4 text-secondary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            disabled={user.id === (user as any).id} // Prevent deleting yourself
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                        <p className="text-sm text-muted-foreground">Add your first user to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? "Update user information and permissions"
                : "Add a new user to the system"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter username" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editingUser ? "Password (leave blank to keep current)" : "Password"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={editingUser ? "••••••" : "Enter password"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary text-dark hover:bg-primary/90"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this user
              and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
