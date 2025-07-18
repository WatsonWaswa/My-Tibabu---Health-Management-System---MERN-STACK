
import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import Logo from '@/components/Logo';

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role') || '';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleFromUrl || 'patient',
    specialty: '',
    licenseNumber: '',
    consultationFee: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        consultationFee: formData.consultationFee,
        ...(formData.role === 'doctor' && {
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber
        })
      };

      const response = await authAPI.register(userData);
      const { token, user, requiresVerification } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    
      // Show appropriate message based on user type
      if (user.role === 'doctor' && requiresVerification) {
        toast({
          title: "Registration successful!",
          description: "Your account is pending admin verification. You will be notified once approved.",
        });
        // Redirect doctors to login page to wait for verification
        navigate('/login');
      } else {
        toast({
          title: "Registration successful!",
          description: "Welcome to My-Tibabu. You can now sign in to your account.",
        });
        // For patients and admins, redirect to login page
        navigate('/login');
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
    setIsLoading(false);
    }
  };

  const specialties = [
    "General Medicine", "Cardiology", "Neurology", "Orthopedics", 
    "Pediatrics", "Psychiatry", "Dermatology", "Ophthalmology",
    "ENT", "Gynecology", "Urology", "Oncology"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />
      
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 overflow-hidden">
              <Logo size="lg" className="text-primary w-full h-full" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join My-Tibabu</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Create Account</CardTitle>
              <CardDescription className="text-center">
                Fill in your information to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">I am a</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'doctor' && (
                  <div>
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select value={formData.specialty} onValueChange={(value) => setFormData(prev => ({ ...prev, specialty: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty} value={specialty.toLowerCase().replace(/\s+/g, '-')}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.role === 'doctor' && (
                  <div>
                    <Label htmlFor="consultationFee">Consultation Fee (Optional)</Label>
                    <Input
                      id="consultationFee"
                      name="consultationFee"
                      type="number"
                      placeholder="Enter your consultation fee (e.g., 5000)"
                      value={formData.consultationFee}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Creating account..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
