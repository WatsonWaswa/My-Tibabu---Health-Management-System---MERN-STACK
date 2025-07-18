import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { doctorsAPI, appointmentsAPI } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { FadeIn, SlideIn, ScaleIn } from '@/components/ui/transition';
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Eye,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Messaging from '@/components/Messaging';

interface DoctorStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  monthlyAppointments: number;
  totalPatients: number;
  rating?: {
    average: number;
    count: number;
  } | number;
}

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
  symptoms: string;
  isUrgent: boolean;
  consultationFee: number;
  doctorNotes?: string;
  diagnosis?: string;
  prescription?: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  totalAppointments: number;
  lastAppointment: string;
}

const DoctorDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profileEdit, setProfileEdit] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    specialty: '',
    experience: '',
    education: '',
    bio: '',
    consultationFee: 0,
    isAvailable: true
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('appointments');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState<Appointment | null>(null);
  const [completionForm, setCompletionForm] = useState({
    doctorNotes: '',
    diagnosis: '',
    prescription: ''
  });

  useEffect(() => {
    fetchDashboardData();
    // Load user from localStorage or fetch profile
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setUser(parsed);
      setProfileEdit({ 
        name: parsed.name, 
        email: parsed.email, 
        phone: parsed.phone || '',
        specialty: '',
        experience: '',
        education: '',
        bio: '',
        consultationFee: 0,
        isAvailable: true
      });
    }
    // Fetch doctor profile
    doctorsAPI.getDoctorProfile().then(res => {
      setUser(res.data);
      setProfileEdit({ 
        name: res.data.userId?.name || res.data.name || '', 
        email: res.data.userId?.email || res.data.email || '', 
        phone: res.data.userId?.phone || res.data.phone || '',
        specialty: res.data.specialty || '',
        experience: res.data.experience || '',
        education: res.data.education || '',
        bio: res.data.bio || '',
        consultationFee: res.data.consultationFee || 0,
        isAvailable: res.data.isAvailable !== false
      });
    }).catch(() => {});
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, appointmentsRes] = await Promise.all([
        doctorsAPI.getDoctorStats(),
        doctorsAPI.getDoctorAppointments({ limit: 10 })
      ]);

      setStats(statsRes.data);
      setAppointments(appointmentsRes.data.appointments || []);
      
      // Extract unique patients from appointments
      const uniquePatients = new Map();
      appointmentsRes.data.appointments?.forEach((appointment: Appointment) => {
        const patientId = appointment.patientId._id;
        if (!uniquePatients.has(patientId)) {
          uniquePatients.set(patientId, {
            _id: patientId,
            name: appointment.patientId.name,
            email: appointment.patientId.email,
            phone: appointment.patientId.phone,
            totalAppointments: 1,
            lastAppointment: appointment.appointmentDate
          });
        } else {
          const patient = uniquePatients.get(patientId);
          patient.totalAppointments += 1;
          if (new Date(appointment.appointmentDate) > new Date(patient.lastAppointment)) {
            patient.lastAppointment = appointment.appointmentDate;
          }
        }
      });
      setPatients(Array.from(uniquePatients.values()));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleMarkAsComplete = async (appointmentId: string) => {
    const appointment = appointments.find(a => a._id === appointmentId);
    if (appointment) {
      setCompletingAppointment(appointment);
      setShowCompleteForm(true);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!completingAppointment) return;

    try {
      await appointmentsAPI.markAsComplete(completingAppointment._id);
      // Update appointment with doctor notes
      await doctorsAPI.updateAppointmentStatus(completingAppointment._id, {
        status: 'completed',
        doctorNotes: completionForm.doctorNotes,
        diagnosis: completionForm.diagnosis,
        prescription: completionForm.prescription
      });
      
      toast({ title: 'Appointment marked as complete.' });
      setShowCompleteForm(false);
      setCompletingAppointment(null);
      setCompletionForm({ doctorNotes: '', diagnosis: '', prescription: '' });
      fetchDashboardData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark appointment as complete.', variant: 'destructive' });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    try {
      await doctorsAPI.updateDoctorProfile({
        specialty: profileEdit.specialty,
        experience: profileEdit.experience,
        education: profileEdit.education,
        bio: profileEdit.bio,
        consultationFee: profileEdit.consultationFee,
        isAvailable: profileEdit.isAvailable
      });
      toast({ title: 'Profile updated', description: 'Your profile has been updated.' });
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.patientId.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickAction = (tabValue: string) => {
    setActiveTab(tabValue);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative">
      {/* Background image and overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1500&q=80"
          alt="Hospital background"
          className="w-full h-full object-cover object-center opacity-10"
        />
        <div className="absolute inset-0 bg-white/80" />
      </div>
      <div className="relative z-10 min-h-screen">
        <Navigation />
        <div className="max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in-up">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 drop-shadow">Doctor Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your appointments and patients</p>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <FadeIn delay={0.1}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats?.totalAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.monthlyAppointments || 0} this month
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Appointments</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.completedAppointments || 0} completed
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique patients seen
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.4}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {typeof stats?.rating === 'object' && stats?.rating !== null
                      ? (stats.rating as { average: number; count: number }).average ?? 0
                      : (stats?.rating as number) ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {typeof stats?.rating === 'object' && stats?.rating !== null
                      ? `${(stats.rating as { average: number; count: number }).count ?? 0} reviews`
                      : 'Average rating'}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">Appointments</TabsTrigger>
              <TabsTrigger value="patients" className="text-xs sm:text-sm">Patients</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm"><MessageSquare className="inline w-4 h-4 mr-1" />Messages</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Appointments</CardTitle>
                  <CardDescription>Your upcoming and recent appointments</CardDescription>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No appointments found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Patient</TableHead>
                            <TableHead className="min-w-[100px]">Date & Time</TableHead>
                            <TableHead className="min-w-[80px]">Type</TableHead>
                            <TableHead className="min-w-[80px]">Status</TableHead>
                            <TableHead className="min-w-[60px]">Fee</TableHead>
                            <TableHead className="min-w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredAppointments.map((appointment) => (
                          <TableRow key={appointment._id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {appointment.patientId?.name?.charAt(0) || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{appointment.patientId?.name || 'Unknown Patient'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {appointment.patientId?.email || 'No email'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatDate(appointment.appointmentDate)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {appointment.appointmentTime}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                              </Badge>
                              {appointment.isUrgent && (
                                <Badge variant="destructive" className="ml-1">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(appointment.status)}
                            </TableCell>
                            <TableCell>
                              KSH {appointment.consultationFee}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewAppointment(appointment)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {appointment.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleMarkAsComplete(appointment._id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patients" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Management</CardTitle>
                  <CardDescription>View and manage your patient list</CardDescription>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No patients found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Total Appointments</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPatients.map((patient) => (
                            <TableRow key={patient._id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {patient.name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{patient.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Patient ID: {patient._id.slice(-6)}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-sm">{patient.email}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {patient.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {patient.totalAppointments} visits
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(patient.lastAppointment)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 sm:space-y-6">
              <Messaging role="doctor" />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your professional profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6 max-w-2xl mx-auto" onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={profileEdit.name} 
                          onChange={e => setProfileEdit({ ...profileEdit, name: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={profileEdit.email} 
                          onChange={e => setProfileEdit({ ...profileEdit, email: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel" 
                          value={profileEdit.phone} 
                          onChange={e => setProfileEdit({ ...profileEdit, phone: e.target.value })} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input 
                          id="specialty" 
                          name="specialty" 
                          value={profileEdit.specialty} 
                          onChange={e => setProfileEdit({ ...profileEdit, specialty: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input 
                          id="experience" 
                          name="experience" 
                          type="number" 
                          value={profileEdit.experience} 
                          onChange={e => setProfileEdit({ ...profileEdit, experience: e.target.value })} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consultationFee">Consultation Fee (KSH)</Label>
                        <Input 
                          id="consultationFee" 
                          name="consultationFee" 
                          type="number" 
                          value={profileEdit.consultationFee} 
                          onChange={e => setProfileEdit({ ...profileEdit, consultationFee: Number(e.target.value) })} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education">Education & Certifications</Label>
                      <Textarea 
                        id="education" 
                        name="education" 
                        value={profileEdit.education} 
                        onChange={e => setProfileEdit({ ...profileEdit, education: e.target.value })} 
                        placeholder="List your education, certifications, and qualifications..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea 
                        id="bio" 
                        name="bio" 
                        value={profileEdit.bio} 
                        onChange={e => setProfileEdit({ ...profileEdit, bio: e.target.value })} 
                        placeholder="Tell patients about your expertise and approach..."
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={profileEdit.isAvailable}
                        onChange={e => setProfileEdit({ ...profileEdit, isAvailable: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isAvailable">Available for appointments</Label>
                    </div>
                    {profileError && <div className="text-red-500 text-sm">{profileError}</div>}
                    <Button type="submit" disabled={profileLoading} className="w-full">
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-6 sm:mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => handleQuickAction('appointments')}
                  >
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">View Schedule</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => handleQuickAction('profile')}
                  >
                    <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">Update Profile</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => handleQuickAction('patients')}
                  >
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">View Patients</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => handleQuickAction('messages')}
                  >
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">Messages</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Details Modal */}
          {showAppointmentDetails && selectedAppointment && (
            <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Appointment Details</DialogTitle>
                  <DialogDescription>
                    Patient appointment information and symptoms
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Patient Information */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {selectedAppointment.patientId?.name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedAppointment.patientId?.name || 'Unknown Patient'}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedAppointment.patientId?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.patientId?.phone}
                      </p>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Date & Time</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.appointmentTime}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <div>{getStatusBadge(selectedAppointment.status)}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Type</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.type.charAt(0).toUpperCase() + selectedAppointment.type.slice(1)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Consultation Fee</Label>
                      <p className="text-sm text-muted-foreground">
                        KSH {selectedAppointment.consultationFee}
                      </p>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {selectedAppointment.symptoms && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Patient Symptoms/Notes</Label>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                          {selectedAppointment.symptoms}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Doctor Notes (for completed appointments) */}
                  {selectedAppointment.doctorNotes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Doctor's Notes</Label>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-900">
                          {selectedAppointment.doctorNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Diagnosis (for completed appointments) */}
                  {selectedAppointment.diagnosis && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Diagnosis</Label>
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-900">
                          {selectedAppointment.diagnosis}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Prescription (for completed appointments) */}
                  {selectedAppointment.prescription && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Prescription</Label>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-900">
                          {selectedAppointment.prescription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAppointmentDetails(false)} className="flex-1">
                      Close
                    </Button>
                    {selectedAppointment.status === 'pending' && (
                      <Button 
                        variant="default" 
                        onClick={() => {
                          handleMarkAsComplete(selectedAppointment._id);
                          setShowAppointmentDetails(false);
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

                  {/* Complete Appointment Modal */}
                  {showCompleteForm && completingAppointment && (
                    <Dialog open={showCompleteForm} onOpenChange={setShowCompleteForm}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Complete Appointment</DialogTitle>
                          <DialogDescription>
                            Add your notes and complete the appointment for {completingAppointment.patientId.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="doctorNotes">Doctor's Notes</Label>
                            <Textarea
                              id="doctorNotes"
                              placeholder="Enter your clinical notes and observations..."
                              value={completionForm.doctorNotes}
                              onChange={(e) => setCompletionForm({ ...completionForm, doctorNotes: e.target.value })}
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="diagnosis">Diagnosis</Label>
                            <Textarea
                              id="diagnosis"
                              placeholder="Enter the diagnosis..."
                              value={completionForm.diagnosis}
                              onChange={(e) => setCompletionForm({ ...completionForm, diagnosis: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="prescription">Prescription</Label>
                            <Textarea
                              id="prescription"
                              placeholder="Enter prescription details..."
                              value={completionForm.prescription}
                              onChange={(e) => setCompletionForm({ ...completionForm, prescription: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="flex space-x-2 pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setShowCompleteForm(false);
                                setCompletingAppointment(null);
                                setCompletionForm({ doctorNotes: '', diagnosis: '', prescription: '' });
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCompleteAppointment}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Complete Appointment
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard; 