import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import {
  UserCheck,
  Check,
  X,
  Eye,
  Stethoscope,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';

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

interface DoctorVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
}

const DoctorVerificationModal = ({ isOpen, onClose, onVerificationComplete }: DoctorVerificationModalProps) => {
  const { toast } = useToast();
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(null);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPendingDoctors();
    }
  }, [isOpen]);

  const fetchPendingDoctors = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingDoctors();
      setPendingDoctors(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending doctors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId: string) => {
    try {
      await adminAPI.verifyDoctor(doctorId);
      toast({
        title: "Success",
        description: "Doctor verified successfully",
      });
      fetchPendingDoctors();
      onVerificationComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to verify doctor",
        variant: "destructive",
      });
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to reject this doctor? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.rejectDoctor(doctorId, "Verification failed");
      toast({
        title: "Success",
        description: "Doctor registration rejected",
      });
      fetchPendingDoctors();
      onVerificationComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject doctor",
        variant: "destructive",
      });
    }
  };

  const handleViewDoctor = (doctor: PendingDoctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDetails(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Doctor Verification</DialogTitle>
          <DialogDescription>
            Review and verify pending doctor registrations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications ({pendingDoctors.length})</CardTitle>
              <CardDescription>Review doctor applications and approve or reject them</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading pending doctors...</p>
                </div>
              ) : pendingDoctors.length === 0 ? (
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
                            {formatDate(doctor.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDoctor(doctor)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyDoctor(doctor._id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectDoctor(doctor._id)}
                                className="text-red-600 hover:text-red-700"
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
        </div>

        {/* Doctor Details Modal */}
        <Dialog open={showDoctorDetails} onOpenChange={setShowDoctorDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Doctor Details</DialogTitle>
              <DialogDescription>
                Detailed information about the doctor application
              </DialogDescription>
            </DialogHeader>
            {selectedDoctor && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedDoctor.userId?.name?.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedDoctor.userId?.name || 'Unknown Doctor'}</h3>
                    <p className="text-muted-foreground">{selectedDoctor.userId?.email || 'No email'}</p>
                    <Badge variant="outline">{selectedDoctor.specialty || 'General Medicine'}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">License Number</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.licenseNumber || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Experience</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.experience || 0} years
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Consultation Fee</Label>
                    <p className="text-sm text-muted-foreground">
                      KSH {selectedDoctor.consultationFee || 0}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.userId?.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Application Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedDoctor.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={() => handleVerifyDoctor(selectedDoctor._id)}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Doctor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRejectDoctor(selectedDoctor._id)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorVerificationModal; 