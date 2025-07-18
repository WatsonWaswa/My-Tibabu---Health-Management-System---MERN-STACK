import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminAPI } from '@/lib/api';
import {
  FileText,
  Download,
  Users,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface ReportData {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  userStats: any[];
  appointmentStats: any[];
}

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportGenerator = ({ isOpen, onClose }: ReportGeneratorProps) => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
    }
  }, [isOpen]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, userStatsRes, appointmentStatsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUserStats(),
        adminAPI.getAppointmentStats()
      ]);

      setReportData({
        ...dashboardRes.data,
        userStats: userStatsRes.data,
        appointmentStats: appointmentStatsRes.data
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      // Create a simple HTML report
      const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Tibabu Health Connect - System Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tibabu Health Connect</h1>
            <h2>System Report</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h3>System Overview</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${reportData?.totalUsers || 0}</div>
                <div class="stat-label">Total Users</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${reportData?.totalDoctors || 0}</div>
                <div class="stat-label">Total Doctors</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${reportData?.totalPatients || 0}</div>
                <div class="stat-label">Total Patients</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${reportData?.totalAppointments || 0}</div>
                <div class="stat-label">Total Appointments</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Financial Summary</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">KSH {reportData?.totalRevenue || 0}</div>
                <div class="stat-label">Total Revenue</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">KSH {reportData?.monthlyRevenue || 0}</div>
                <div class="stat-label">Monthly Revenue</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Appointment Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${reportData?.pendingAppointments || 0}</div>
                <div class="stat-label">Pending Appointments</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${reportData?.completedAppointments || 0}</div>
                <div class="stat-label">Completed Appointments</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This report was generated automatically by the Tibabu Health Connect system.</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tibabu-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate System Report</DialogTitle>
          <DialogDescription>
            Generate comprehensive reports about system activity and user interactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading report data...</p>
            </div>
          ) : reportData ? (
            <>
              {/* Report Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>System statistics and activity summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{reportData.totalUsers}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{reportData.totalAppointments}</div>
                      <div className="text-sm text-muted-foreground">Total Appointments</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <div className="text-2xl font-bold">KSH {reportData.totalRevenue}</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">{reportData.pendingAppointments}</div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                  </div>

                  {/* User Statistics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">User Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {reportData.userStats.map((stat: any) => (
                        <div key={stat._id} className="flex items-center justify-between p-3 border rounded-lg">
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
                  </div>

                  {/* Appointment Statistics */}
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Appointment Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {reportData.appointmentStats.map((stat: any) => (
                        <div key={stat._id} className="flex items-center justify-between p-3 border rounded-lg">
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
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={generatePDF} 
                  disabled={generating}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate & Download Report
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No report data available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportGenerator; 