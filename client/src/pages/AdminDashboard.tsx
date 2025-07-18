import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { FadeIn, SlideIn, ScaleIn } from '@/components/ui/transition';
import UserManagementModal from '@/components/UserManagementModal';
import DoctorVerificationModal from '@/components/DoctorVerificationModal';
import ReportGenerator from '@/components/ReportGenerator';
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Users2,
  Stethoscope,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Check,
  X,
  Eye,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  User,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  monthlyAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
}

interface UserStats {
  _id: string;
  count: number;
  activeCount: number;
}

interface AppointmentStats {
  _id: string;
  count: number;
}

interface PendingDoctor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
  };
  specialty: string;
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  createdAt: string;
}

interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  doctorId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    specialty: string;
    consultationFee: number;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
  symptoms: string;
  consultationFee: number;
  paymentStatus: string;
  paymentMethod: string;
  isUrgent: boolean;
  createdAt: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showDoctorVerification, setShowDoctorVerification] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  
  // Appointment management states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentFilters, setAppointmentFilters] = useState({
    search: '',
    status: '',
    date: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch appointments when component mounts
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, userStatsRes, appointmentStatsRes, pendingDoctorsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUserStats(),
        adminAPI.getAppointmentStats(),
        adminAPI.getPendingDoctors()
      ]);

      setStats(statsRes.data);
      setUserStats(userStatsRes.data);
      setAppointmentStats(appointmentStatsRes.data);
      setPendingDoctors(pendingDoctorsRes.data);
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

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      // Only include status in the query if it's not 'all'
      const filters = { ...appointmentFilters };
      if (filters.status === 'all') {
        delete filters.status;
      }
      const response = await adminAPI.getAllAppointments({
        page: 1,
        limit: 50,
        ...filters
      });
      setAppointments(response.data.appointments);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no-show':
        return <Badge variant="outline" className="text-orange-600">No Show</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>;
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

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleVerifyDoctor = async (doctorId: string) => {
    try {
      await adminAPI.verifyDoctor(doctorId);
      toast({
        title: "Success",
        description: "Doctor verified successfully",
      });
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to verify doctor",
        variant: "destructive",
      });
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    try {
      await adminAPI.rejectDoctor(doctorId, "Verification failed");
      toast({
        title: "Success",
        description: "Doctor registration rejected",
      });
      fetchDashboardData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject doctor",
        variant: "destructive",
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
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80"
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 drop-shadow">Admin Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your healthcare system</p>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <FadeIn delay={0.1}>
              <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-primary">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalDoctors || 0} doctors, {stats?.totalPatients || 0} patients
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.monthlyAppointments || 0} this month
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KSH {stats?.totalRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    KSH {stats?.monthlyRevenue || 0} this month
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.4}>
              <Card className="hover:shadow-lg transition-shadow">
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
          </div>

          {/* Charts and Tables */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">Users</TabsTrigger>
              <TabsTrigger value="appointments" className="text-xs sm:text-sm">Appointments</TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs sm:text-sm">Revenue</TabsTrigger>
              <TabsTrigger value="doctors" className="text-xs sm:text-sm">Doctors</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <SlideIn>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* User Distribution */}
                  <ScaleIn delay={0.1}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle>User Distribution</CardTitle>
                        <CardDescription>Breakdown by user roles</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {userStats.map((stat) => (
                            <div key={stat._id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant={stat._id === 'doctor' ? 'default' : 'secondary'}>
                                  {stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}s
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {stat.activeCount} active
                                </span>
                              </div>
                              <span className="font-medium">{stat.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </ScaleIn>

                  {/* Appointment Status */}
                  <ScaleIn delay={0.2}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle>Appointment Status</CardTitle>
                        <CardDescription>Current appointment distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {appointmentStats.map((stat) => (
                            <div key={stat._id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={
                                    stat._id === 'completed' ? 'default' :
                                    stat._id === 'pending' ? 'secondary' :
                                    'destructive'
                                  }
                                >
                                  {stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}
                                </Badge>
                              </div>
                              <span className="font-medium">{stat.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </ScaleIn>
                </div>
              </SlideIn>
            </TabsContent>

            <TabsContent value="doctors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Verification</CardTitle>
                  <CardDescription>Review and verify pending doctor registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingDoctors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No pending doctor verifications</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Specialty</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Experience</TableHead>
                            <TableHead>Fee</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingDoctors.map((doctor) => (
                            <TableRow key={doctor._id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {doctor.userId?.name?.charAt(0) || 'D'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{doctor.userId?.name || 'Unknown Doctor'}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {doctor.userId?.email || 'No email'}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{doctor.specialty || 'General Medicine'}</Badge>
                              </TableCell>
                              <TableCell>{doctor.licenseNumber || 'N/A'}</TableCell>
                              <TableCell>{doctor.experience || 0} years</TableCell>
                              <TableCell>KSH {doctor.consultationFee || 0}</TableCell>
                              <TableCell>
                                {new Date(doctor.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleVerifyDoctor(doctor._id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectDoctor(doctor._id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
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

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">User Statistics</h3>
                      <Button 
                        size="sm"
                        onClick={() => setShowUserManagement(true)}
                      >
                        <Users2 className="mr-2 h-4 w-4" />
                        Manage Users
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {userStats.map((stat) => (
                        <div key={stat._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {stat._id.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}s</div>
                              <div className="text-sm text-muted-foreground">
                                {stat.activeCount} active, {stat.count - stat.activeCount} inactive
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{stat.count}</div>
                            <Badge variant={stat._id === 'admin' ? 'destructive' : stat._id === 'doctor' ? 'default' : 'secondary'}>
                              {stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">             <Card>
                <CardHeader>
                  <CardTitle>Appointment Management</CardTitle>
                  <CardDescription>View and manage all appointments with full transparency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search appointments..."
                          value={appointmentFilters.search}
                          onChange={(e) => setAppointmentFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                      <Select value={appointmentFilters.status || "all"} onValueChange={(value) => setAppointmentFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={fetchAppointments} disabled={appointmentsLoading}>
                        {appointmentsLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4 mr-2" />
                        )}
                        Search
                      </Button>
                    </div>

                    {/* Appointment Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">{stats?.totalAppointments || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Appointments</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{stats?.pendingAppointments || 0}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{stats?.completedAppointments || 0}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{stats?.monthlyAppointments || 0}</div>
                        <div className="text-sm text-muted-foreground">This Month</div>
                      </div>
                    </div>

                    {/* Appointments Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Fee</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.map((appointment) => (
                            <TableRow key={appointment._id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {appointment.patientId.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{appointment.patientId.name}</div>
                                    <div className="text-sm text-muted-foreground">{appointment.patientId.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{appointment.doctorId.userId.name}</div>
                                  <div className="text-sm text-muted-foreground">{appointment.doctorId.specialty}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{formatDate(appointment.appointmentDate)}</div>
                                  <div className="text-sm text-muted-foreground">{appointment.appointmentTime}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(appointment.status)}
                              </TableCell>
                              <TableCell>
                                {getPaymentStatusBadge(appointment.paymentStatus)}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-green-600">
                                  KSH {appointment.consultationFee?.toLocaleString() || 0}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewAppointment(appointment)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">             <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Track revenue and financial metrics from real appointment data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Revenue Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                            Total Revenue
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            KSH {stats?.totalRevenue?.toLocaleString() || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            All time revenue from completed appointments
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                            Monthly Revenue
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            KSH {stats?.monthlyRevenue?.toLocaleString() || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            This month's revenue
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-orange-600" />
                            Pending Revenue
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">
                            KSH {stats?.pendingRevenue?.toLocaleString() || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Revenue from pending appointments
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Completed Revenue
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            KSH {stats?.completedRevenue?.toLocaleString() || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Revenue from completed appointments
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-medium">Revenue Breakdown</CardTitle>
                          <CardDescription>Detailed revenue analysis by status</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                  <div className="font-medium text-green-900">Completed Appointments</div>
                                  <div className="text-sm text-green-600">
                                    {stats?.completedAppointments || 0} appointments
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  KSH {stats?.completedRevenue?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-green-600">
                                  {stats?.totalRevenue ? ((stats.completedRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-orange-600" />
                                <div>
                                  <div className="font-medium text-orange-900">Pending Payments</div>
                                  <div className="text-sm text-orange-600">
                                    {stats?.pendingAppointments || 0} appointments
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-orange-600">
                                  KSH {stats?.pendingRevenue?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-orange-600">
                                  {stats?.totalRevenue ? ((stats.pendingRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-medium text-blue-900">Monthly Appointments</div>
                                  <div className="text-sm text-blue-600">
                                    {stats?.monthlyAppointments || 0} appointments
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  KSH {stats?.monthlyRevenue?.toLocaleString() || 0}
                                </div>
                                <div className="text-xs text-blue-600">
                                  This month's revenue
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-medium">Revenue Metrics</CardTitle>
                          <CardDescription>Key financial indicators</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Average Revenue per Appointment</span>
                              <span className="font-bold text-green-600">
                                KSH {stats?.totalAppointments && stats?.totalRevenue 
                                  ? Math.round(stats.totalRevenue / stats.totalAppointments).toLocaleString() 
                                  : 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Monthly Average Revenue</span>
                              <span className="font-bold text-blue-600">
                                KSH {stats?.monthlyAppointments && stats?.monthlyRevenue 
                                  ? Math.round(stats.monthlyRevenue / stats.monthlyAppointments).toLocaleString() 
                                  : 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Payment Success Rate</span>
                              <span className="font-bold text-green-600">
                                {stats?.totalAppointments && stats?.completedRevenue 
                                  ? ((stats.completedRevenue / (stats.completedRevenue + stats.pendingRevenue)) * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Total Appointments</span>
                              <span className="font-bold text-gray-600">
                                {stats?.totalAppointments?.toLocaleString() || 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Completed Appointments</span>
                              <span className="font-bold text-green-600">
                                {stats?.completedAppointments?.toLocaleString() || 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Pending Appointments</span>
                              <span className="font-bold text-orange-600">
                                {stats?.pendingAppointments?.toLocaleString() || 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Revenue Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-medium">Revenue Insights</CardTitle>
                        <CardDescription>Analysis and recommendations based on revenue data</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <TrendingUp className="h-8 mx-auto text-green-600 mb-2" />
                              <div className="font-medium text-green-900">Revenue Growth</div>
                              <div className="text-sm text-green-600">
                                {stats?.monthlyRevenue && stats?.totalRevenue 
                                  ? ((stats.monthlyRevenue / (stats.totalRevenue / 12)) * 100).toFixed(1)
                                  : 0}% monthly growth
                              </div>
                            </div>
                            
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <Activity className="h-8 mx-auto text-blue-600 mb-2" />
                              <div className="font-medium text-blue-900">Appointment Efficiency</div>
                              <div className="text-sm text-blue-600">
                                {stats?.totalAppointments && stats?.completedAppointments 
                                  ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
                                  : 0}% completion rate
                              </div>
                            </div>
                            
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                              <div className="font-medium text-purple-900">Revenue per Patient</div>
                              <div className="text-sm text-purple-600">
                                KSH {stats?.totalPatients && stats?.totalRevenue 
                                  ? Math.round(stats.totalRevenue / stats.totalPatients).toLocaleString()
                                  : 0}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Key Insights:</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                              <li>• Total revenue is calculated from all paid appointments</li>
                              <li>• Monthly revenue shows current months performance</li>
                              <li>• Pending revenue represents potential future income</li>
                              <li>• Revenue metrics are updated in real-time from appointment data</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-6 sm:mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => setShowUserManagement(true)}
                  >
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">User Management</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => setShowDoctorVerification(true)}
                  >
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">Verify Doctors</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-3 sm:p-4 flex-col"
                    onClick={() => setShowReportGenerator(true)}
                  >
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 mb-2" />
                    <span className="text-xs sm:text-sm">Generate Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modals */}
          <UserManagementModal 
            isOpen={showUserManagement} 
            onClose={() => setShowUserManagement(false)} 
          />
          
          <DoctorVerificationModal 
            isOpen={showDoctorVerification} 
            onClose={() => setShowDoctorVerification(false)}
            onVerificationComplete={fetchDashboardData}
          />
          
          <ReportGenerator 
            isOpen={showReportGenerator} 
            onClose={() => setShowReportGenerator(false)} 
          />

          {/* Appointment Details Modal */}
          <Dialog open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">           <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                  Complete information about the selected appointment
                </DialogDescription>
              </DialogHeader>
              
              {selectedAppointment && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <User className="h-5 w-5 mr-2" />                   Patient Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {selectedAppointment.patientId.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedAppointment.patientId.name}</div>
                            <div className="text-sm text-muted-foreground">{selectedAppointment.patientId.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4" />
                          <span>{selectedAppointment.patientId.phone}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Stethoscope className="h-5 w-5 mr-2" />                   Doctor Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {selectedAppointment.doctorId.userId.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedAppointment.doctorId.userId.name}</div>
                            <div className="text-sm text-muted-foreground">{selectedAppointment.doctorId.specialty}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-4 w-4" />
                          <span>{selectedAppointment.doctorId.userId.email}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Appointment Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />                   Appointment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Date</div>
                          <div className="font-medium">{formatDate(selectedAppointment.appointmentDate)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Time</div>
                          <div className="font-medium">{selectedAppointment.appointmentTime}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Type</div>
                          <div className="font-medium capitalize">{selectedAppointment.type}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Status</div>
                          <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Payment Status</div>
                          <div className="mt-1">{getPaymentStatusBadge(selectedAppointment.paymentStatus)}</div>
                        </div>
                      </div>

                      {selectedAppointment.symptoms && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Symptoms</div>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            {selectedAppointment.symptoms}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Consultation Fee</div>
                          <div className="font-medium text-green-600">
                            KSH {selectedAppointment.consultationFee?.toLocaleString() || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                          <div className="font-medium capitalize">{selectedAppointment.paymentMethod}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Urgent</div>
                          <div className="font-medium">
                            {selectedAppointment.isUrgent ? (
                              <Badge variant="destructive">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2" />                   System Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Appointment ID</div>
                          <div className="font-mono text-sm">{selectedAppointment._id}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Created</div>
                          <div className="text-sm">{formatDate(selectedAppointment.createdAt)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 