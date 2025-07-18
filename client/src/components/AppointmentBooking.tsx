import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { appointmentsAPI } from '@/lib/api';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';

interface Doctor {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  specialty: string;
  consultationFee: number;
  isAvailable: boolean;
}

interface AppointmentBookingProps {
  doctor?: Doctor; // doctor is optional to allow selection
  onClose: () => void;
  onSuccess: () => void;
  patientData?: {
    name?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    nationalId?: string;
  };
  doctors?: Doctor[]; // for doctor selection
}

const AppointmentBooking = ({ doctor, onClose, onSuccess, patientData = {}, doctors = [] }: AppointmentBookingProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: patientData.name || '',
    dateOfBirth: patientData.dateOfBirth || '',
    phone: patientData.phone || '',
    email: patientData.email || '',
    nationalId: patientData.nationalId || '',
    doctorId: doctor?._id || '',
    appointmentDate: '',
    appointmentTime: '',
    location: '',
    type: 'consultation',
    symptoms: '',
    isUrgent: false
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, doctorId: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || !formData.dateOfBirth || !formData.phone || !formData.email || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime || !formData.type || !formData.symptoms) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      // Debug log
      console.log('Booking appointment with doctorId:', formData.doctorId);
      await appointmentsAPI.bookAppointment({
        ...formData,
        doctorId: formData.doctorId // ensure this is Doctor _id
      });
      toast({
        title: "Appointment booked successfully!",
        description: "Your appointment has been scheduled.",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.response?.data?.message || "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
          <CardDescription>
            Please fill in your details to book an appointment
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[80vh]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </div>
            {!doctor && (
              <div className="space-y-2">
                <Label htmlFor="doctorId">Preferred Doctor</Label>
                <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleDoctorChange} className="w-full border rounded p-2" required>
                  <option value="">Select Doctor</option>
                  {doctors.filter(doc => doc.userId).map((doc) => (
                    <option key={doc._id} value={doc._id}>{doc.userId?.name || 'N/A'} - {doc.specialty}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Preferred Date</Label>
                <Input id="appointmentDate" name="appointmentDate" type="date" value={formData.appointmentDate} onChange={handleInputChange} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentTime">Preferred Time</Label>
                <select id="appointmentTime" name="appointmentTime" value={formData.appointmentTime} onChange={handleInputChange} className="w-full border rounded p-2" required>
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="symptoms">Reason for Visit / Symptoms</Label>
              <Textarea id="symptoms" name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows={3} required />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isUrgent" name="isUrgent" checked={formData.isUrgent} onChange={handleInputChange} className="rounded" />
              <Label htmlFor="isUrgent" className="text-sm">Mark as urgent</Label>
            </div>
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm">
                {doctor && <span className="font-medium">Consultation Fee:</span>} {doctor ? `KSH ${doctor.consultationFee}` : ''}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Booking..." : "Book Appointment"}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentBooking; 