import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


interface Form {
  id: string;
  form_code: string;
  created_at: string;
}

interface Submission {
  id: string;
  form_id: string;
  email: string;
  last_name: string;
  city: string;
  region: string;
  country: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/superlogin");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's forms
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (formsError) {
        toast({
          title: "Error",
          description: "Failed to fetch forms",
          variant: "destructive",
        });
      } else {
        setForms(formsData || []);
      }

      // Fetch submissions for forms owned by this user
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          forms!inner(user_id)
        `)
        .eq('forms.user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
      } else {
        setSubmissions(submissionsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createForm = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-form', {
        body: { userId: user?.id }
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create form",
          variant: "destructive",
        });
        return;
      }

      if (data?.form) {
        // Add the new form to the state immediately
        setForms(prev => [data.form, ...prev]);
        
        toast({
          title: "Form Created Successfully",
          description: `Form URL: /${user?.username}/${data.form.form_code}`,
        });
      } else {
        toast({
          title: "Error", 
          description: "Failed to create form - no data returned",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating form:', error);
      toast({
        title: "Error",
        description: "Failed to create form",
        variant: "destructive",
      });
    }
  };


  const downloadExcel = () => {
    const csvContent = [
      ['Email', 'Last Name', 'City', 'Region', 'Country', 'IP Address', 'User Agent', 'Date'],
      ...submissions.map(sub => [
        sub.email,
        sub.last_name,
        sub.city || '',
        sub.region || '',
        sub.country || '',
        sub.ip_address || '',
        sub.user_agent || '',
        new Date(sub.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'submissions.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.username}!</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/change-password")}
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Change Password
            </Button>
            <Button 
              onClick={logout}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Forms Created</CardTitle>
              <CardDescription>Total forms you've created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{forms.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Submissions</CardTitle>
              <CardDescription>Data collected across all forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{submissions.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Forms</CardTitle>
                <CardDescription>Manage your document collection forms</CardDescription>
              </div>
              <Button onClick={createForm} className="bg-blue-600 hover:bg-blue-700">
                Create Form
              </Button>
            </CardHeader>
            <CardContent>
              {forms.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No forms created yet</p>
              ) : (
                <div className="space-y-2">
                  {forms.map((form) => (
                    <div key={form.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">/{user?.username}/{form.form_code}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(form.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const formUrl = `/${user?.username}/${form.form_code}`;
                            window.open(formUrl, '_blank');
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <CardTitle>Data Collection</CardTitle>
                  <CardDescription>Submissions from your forms</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={fetchData}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                  {submissions.length > 0 && (
                    <Button onClick={downloadExcel} variant="outline" size="sm">
                      Download Excel
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No submissions yet</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                     <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.email}</TableCell>
                          <TableCell>{submission.last_name}</TableCell>
                          <TableCell>
                            {[submission.city, submission.region, submission.country]
                              .filter(Boolean)
                              .join(', ') || 'Unknown'}
                          </TableCell>
                          <TableCell>{submission.ip_address || 'Unknown'}</TableCell>
                          <TableCell>
                            {new Date(submission.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;