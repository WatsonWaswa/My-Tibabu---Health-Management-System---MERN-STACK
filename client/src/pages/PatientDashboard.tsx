import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { appointmentsAPI, doctorsAPI, usersAPI } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { FadeIn, SlideIn, ScaleIn } from '@/components/ui/transition';
import AppointmentBooking from '@/components/AppointmentBooking';
import {
  Calendar,
  Clock,
  Search,
  MessageSquare,
  User,
  FileText,
  MapPin,
  Plus,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle,
  Phone,
  AlertTriangle
} from 'lucide-react';
import Messaging from '@/components/Messaging';

interface Appointment {
  _id: string;
  doctorId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      phone: string;
    };
    specialty: string;
    consultationFee: number;
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

interface Doctor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
  specialty: string;
  experience: number;

  consultationFee: number;
  isAvailable: boolean;
  isVerified: boolean;
}

const PatientDashboard = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileEdit, setProfileEdit] = useState({ name: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [doctorSelectOpen, setDoctorSelectOpen] = useState(false);
  const [selectedBookingDoctor, setSelectedBookingDoctor] = useState<Doctor | null>(null);
  const [showHealthRecords, setShowHealthRecords] = useState(false);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    // Load user from localStorage or fetch profile
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const parsed = JSON.parse(localUser);
      setUser(parsed);
      setProfileEdit({ name: parsed.name, email: parsed.email, phone: parsed.phone || '' });
    }
    usersAPI.getProfile().then(res => {
      setUser(res.data);
      setProfileEdit({ name: res.data.name, email: res.data.email, phone: res.data.phone || '' });
    }).catch(() => {});
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes] = await Promise.all([
        appointmentsAPI.getMyAppointments({ limit: 50 }), // Get more appointments for health records
        doctorsAPI.getAllDoctors({ limit: 6 })
      ]);

      setAppointments(appointmentsRes.data.appointments || []);
      // Filter out doctors with null userId and only show verified doctors
      const validDoctors = (doctorsRes.data.doctors || []).filter(doctor => 
        doctor.userId && doctor.isVerified && doctor.isAvailable
      );
      setDoctors(validDoctors);

      // Create health records from completed appointments
      const completedAppointments = appointmentsRes.data.appointments?.filter((appointment: any) => 
        appointment.status === 'completed' && (appointment.doctorNotes || appointment.diagnosis || appointment.prescription)
      ) || [];

      const healthRecordsData = completedAppointments.map((appointment: any) => ({
        id: appointment._id,
        date: appointment.appointmentDate,
        type: appointment.type || 'Consultation',
        doctor: appointment.doctorId?.userId?.name || 'Unknown Doctor',
        symptoms: appointment.symptoms || 'No symptoms recorded',
        doctorNotes: appointment.doctorNotes || '',
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || '',
        status: 'Completed'
      }));

      setHealthRecords(healthRecordsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const handleEmergencyCall = () => {
    window.open('tel:0717629522', '_self');
  };

  const handleBookAppointment = async (doctor: Doctor) => {
    if (!doctor.userId) {
      toast({
        title: 'Error',
        description: 'Doctor information is incomplete',
        variant: 'destructive',
      });
      return;
    }

    setBookingLoading(true);
    try {
      const res = await doctorsAPI.getDoctorById(doctor._id);
      setBookingDoctor(res.data);
      setShowBooking(true);
    } catch (err) {
      console.error('Error fetching doctor details:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch latest doctor details',
        variant: 'destructive',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    fetchDashboardData();
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentsAPI.cancelAppointment(appointmentId);
      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled successfully.',
      });
      fetchDashboardData(); // Refresh the appointments list
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment. Please try again.',
        variant: 'destructive',
      });
    }
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
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd23?auto=format&fit=crop&w=1500&q=80"
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 drop-shadow">Patient Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your health and appointments</p>
          </div>
          {/* Emergency Contact */}
          <div className="mb-6">
            <Card className="border-red-200 bg-red-50/90">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">Emergency Contact</h3>
                      <p className="text-sm text-red-600">For urgent medical assistance</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleEmergencyCall}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call 0717629522
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <FadeIn delay={0.1}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{appointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {appointments.filter(a => a.status === 'pending').length} upcoming
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">Available Doctors</CardTitle>
                  <User className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{doctors.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {doctors.filter(d => d.isAvailable).length} available now
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">Health Records</CardTitle>
                  <FileText className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{healthRecords.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {healthRecords.length > 0 ? 'View your medical history' : 'No records yet'}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="appointments" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">My Appointments</TabsTrigger>
              <TabsTrigger value="doctors" className="text-xs sm:text-sm">Find Doctors</TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm"><MessageSquare className="inline w-4 h-4 mr-1" />Messages</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>My Appointments</CardTitle>
                      <CardDescription>Your upcoming and past appointments</CardDescription>
                    </div>
                    <Button onClick={() => setDoctorSelectOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Book New Appointment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No appointments found</p>
                      <p className="text-sm mt-2 mb-4">Ready to book your first appointment?</p>
                      <Button onClick={() => setDoctorSelectOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Book Your First Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px]">Doctor</TableHead>
                            <TableHead className="min-w-[100px]">Date & Time</TableHead>
                            <TableHead className="min-w-[80px]">Type</TableHead>
                            <TableHead className="min-w-[80px]">Status</TableHead>
                            <TableHead className="min-w-[60px]">Fee</TableHead>
                            <TableHead className="min-w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                        {appointments.map((appointment) => (
                          <TableRow key={appointment._id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {appointment.doctorId?.userId?.name?.charAt(0) || 'D'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{appointment.doctorId?.userId?.name || 'Doctor no longer available'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {appointment.doctorId?.specialty || 'General Medicine'}
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
                                {appointment.type?.charAt(0).toUpperCase() + appointment.type?.slice(1) || 'Consultation'}
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
                              KSH {appointment.consultationFee || 0}
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
                                    variant="destructive"
                                    onClick={() => handleCancelAppointment(appointment._id)}
                                  >
                                    <XCircle className="w-4 h-4" />
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

            <TabsContent value="doctors" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Doctors</CardTitle>
                  <CardDescription>Find and book appointments with healthcare professionals</CardDescription>
                </CardHeader>
                <CardContent>
                  {doctors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No verified doctors available at the moment</p>
                      <p className="text-sm mt-2">Please check back later or contact support</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {doctors.map((doctor) => (
                        <Card key={doctor._id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>
                                  {doctor.userId?.name?.charAt(0) || 'D'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold">{doctor.userId?.name || 'Unknown Doctor'}</h3>
                                <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {doctor.experience} years experience
                                </p>

                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-sm font-medium">KSH {doctor.consultationFee || 0}</span>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleBookAppointment(doctor)}
                                    disabled={!doctor.isAvailable}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    {doctor.isAvailable ? 'Book' : 'Unavailable'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 sm:space-y-6">
              <Messaging role="patient" />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4 max-w-md mx-auto" onSubmit={async (e) => {
                    e.preventDefault();
                    setProfileLoading(true);
                    setProfileError('');
                    try {
                      await usersAPI.updateProfile(profileEdit);
                      toast({ title: 'Profile updated', description: 'Your profile has been updated.' });
                    } catch (err: any) {
                      setProfileError(err.response?.data?.message || 'Failed to update profile');
                    } finally {
                      setProfileLoading(false);
                    }
                  }}>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" value={profileEdit.name} onChange={e => setProfileEdit({ ...profileEdit, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={profileEdit.email} onChange={e => setProfileEdit({ ...profileEdit, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" value={profileEdit.phone} onChange={e => setProfileEdit({ ...profileEdit, phone: e.target.value })} required />
                    </div>
                    {profileError && <div className="text-red-500 text-sm">{profileError}</div>}
                    <Button type="submit" disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save Changes'}</Button>
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
                    onClick={() => setDoctorSelectOpen(true)}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">Book Appointment</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={handleEmergencyCall}
                  >
                    <Phone className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">Emergency Call</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => setShowHealthRecords(true)}
                  >
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">
                      {healthRecords.length > 0 ? `Health Records (${healthRecords.length})` : 'Health Records'}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Appointment Booking Modal */}
        {showBooking && (
          <AppointmentBooking
            doctor={bookingDoctor || undefined}
            patientData={{
              name: user?.name || profileEdit.name,
              email: user?.email || profileEdit.email,
              phone: user?.phone || profileEdit.phone,
              dateOfBirth: user?.dateOfBirth || '',
              nationalId: user?.nationalId || ''
            }}
            doctors={doctors}
            onClose={() => {
              setShowBooking(false);
              setBookingDoctor(null);
            }}
            onSuccess={handleBookingSuccess}
          />
        )}
        {showBooking && bookingLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded shadow text-center">Loading doctor details...</div>
          </div>
        )}
        {doctorSelectOpen && (
          <Dialog open={doctorSelectOpen} onOpenChange={setDoctorSelectOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select a Doctor</DialogTitle>
                <DialogDescription>Choose a doctor to book an appointment with</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {doctors.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No verified doctors available</p>
                  </div>
                ) : (
                  doctors.map((doctor) => (
                    <Button 
                      key={doctor._id} 
                      className="w-full justify-start mb-2" 
                      onClick={async () => {
                        setDoctorSelectOpen(false);
                        await handleBookAppointment(doctor);
                      }}
                      disabled={!doctor.isAvailable}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <div className="font-medium">{doctor.userId?.name || 'Unknown Doctor'}</div>
                          <div className="text-xs text-muted-foreground">{doctor.specialty}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">KSH {doctor.consultationFee}</div>
                          <div className="text-xs text-muted-foreground">
                            {doctor.isAvailable ? 'Available' : 'Unavailable'}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Appointment Details Modal */}
        {showAppointmentDetails && selectedAppointment && (
          <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                  Detailed information about your appointment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Doctor Information */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedAppointment.doctorId?.userId?.name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedAppointment.doctorId?.userId?.name || 'Unknown Doctor'}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedAppointment.doctorId?.specialty || 'General Medicine'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.doctorId?.userId?.email}
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
                      {selectedAppointment.type?.charAt(0).toUpperCase() + selectedAppointment.type?.slice(1) || 'Consultation'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Consultation Fee</Label>
                    <p className="text-sm text-muted-foreground">
                      KSH {selectedAppointment.consultationFee || 0}
                    </p>
                  </div>
                </div>

                {/* Symptoms */}
                {selectedAppointment.symptoms && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Symptoms/Notes</Label>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.symptoms}
                      </p>
                    </div>
                  </div>
                )}

                {/* Doctor Notes */}
                {selectedAppointment.doctorNotes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Doctor's Notes</Label>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        {selectedAppointment.doctorNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Diagnosis */}
                {selectedAppointment.diagnosis && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Diagnosis</Label>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-900">
                        {selectedAppointment.diagnosis}
                      </p>
                    </div>
                  </div>
                )}

                {/* Prescription */}
                {selectedAppointment.prescription && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Prescription</Label>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-900">
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
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Health Records Modal */}
        {showHealthRecords && (
          <Dialog open={showHealthRecords} onOpenChange={setShowHealthRecords}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Health Records</DialogTitle>
                <DialogDescription>
                  Your complete medical history from completed appointments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {healthRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No health records found</p>
                    <p className="text-sm mt-2">Health records will appear here after your appointments are completed by doctors.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthRecords.map((record) => (
                      <Card key={record.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{record.type}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge variant={record.status === 'Completed' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Doctor</Label>
                            <p className="text-sm text-muted-foreground">{record.doctor}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Patient Symptoms</Label>
                            <div className="p-3 bg-gray-50 rounded-lg mt-1">
                              <p className="text-sm text-gray-700">{record.symptoms}</p>
                            </div>
                          </div>

                          {record.doctorNotes && (
                            <div>
                              <Label className="text-sm font-medium">Doctor's Notes</Label>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-1">
                                <p className="text-sm text-blue-900">{record.doctorNotes}</p>
                              </div>
                            </div>
                          )}

                          {record.diagnosis && (
                            <div>
                              <Label className="text-sm font-medium">Diagnosis</Label>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-1">
                                <p className="text-sm text-green-900">{record.diagnosis}</p>
                              </div>
                            </div>
                          )}

                          {record.prescription && (
                            <div>
                              <Label className="text-sm font-medium">Prescription</Label>
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mt-1">
                                <p className="text-sm text-yellow-900">{record.prescription}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard; 