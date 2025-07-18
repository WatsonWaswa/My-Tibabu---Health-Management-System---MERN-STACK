
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  Shield, 
  Clock, 
  Star,
  ChevronRight,
  Activity,
  Stethoscope,
  UserCheck,
  Phone
} from 'lucide-react';
import Logo from '@/components/Logo';

const Index = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80")'
          }}
        ></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Digital Health
              <span className="text-primary block">Companion</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with healthcare professionals, manage your health records, and access quality medical services 
              from the comfort of your home with My-Tibabu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/register">
                  Get Started Today
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link to="/services">
                  Browse Services
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in-up">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Happy Patients</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Expert Doctors</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-gray-600">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose My-Tibabu?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience healthcare like never before with our comprehensive digital platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Easy Appointments</CardTitle>
                <CardDescription>
                  Book appointments with specialists instantly through our user-friendly platform
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <MessageCircle className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Direct Communication</CardTitle>
                <CardDescription>
                  Chat directly with doctors and get professional medical advice when you need it
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your health data is protected with enterprise-grade security and privacy measures
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Health Tracking</CardTitle>
                <CardDescription>
                  Monitor your health journey with comprehensive tracking and insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>24/7 Availability</CardTitle>
                <CardDescription>
                  Access healthcare services round the clock, whenever you need assistance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Expert Doctors</CardTitle>
                <CardDescription>
                  Connect with qualified healthcare professionals across various specialties
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Designed for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Tailored experiences for patients, doctors, and healthcare administrators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">For Patients</CardTitle>
                <CardDescription className="text-base">
                  Find doctors, book appointments, chat with healthcare professionals, and manage your health records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/register?role=patient">Join as Patient</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserCheck className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl mb-4">For Doctors</CardTitle>
                <CardDescription className="text-base">
                  Manage patients, schedule appointments, provide consultations, and grow your practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/register?role=doctor">Join as Doctor</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl mb-4">For Admins</CardTitle>
                <CardDescription className="text-base">
                  Manage the platform, oversee operations, handle services, and ensure quality care
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Admin Access</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of patients and healthcare professionals already using My-Tibabu
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link to="/register">
                Start Your Journey
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link to="/contact">
                <Phone className="mr-2 h-5 w-5" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                  <Logo size="md" className="text-white w-full h-full" />
                </div>
                <span className="font-bold text-xl">My-Tibabu</span>
              </div>
              <p className="text-gray-400">
                Your trusted digital health companion, connecting you with quality healthcare services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Healthcare Providers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register?role=doctor" className="hover:text-white transition-colors">Join as Doctor</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Provider Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 My-Tibabu. All rights reserved.</p>
            <p className="mt-2">
              Created by - <a 
                href="https://www.linkedin.com/in/eng-liwa-watson-waswa-03b094314" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors underline"
              >
                L.Watson.W
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
