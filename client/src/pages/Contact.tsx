
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Phone, 
  Clock,
  MessageSquare
} from 'lucide-react';

const Contact = () => {
  const handleWhatsAppClick = () => {
    const message = "Hello! I'd like to get in touch with My-Tibabu healthcare services.";
    const whatsappUrl = `https://wa.me/254717629522?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmergencyCall = () => {
    window.open('tel:0717629522', '_self');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get in Touch
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Have questions? We're here to help. Contact our support team or visit our location.
          </p>
        </div>
      </section>
      <section className="py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <Card className="shadow-xl border-0 mb-12 bg-white/90 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary drop-shadow-sm">Contact Us</CardTitle>
              <CardDescription>
                We are always happy to hear from you! Please reach out via phone, WhatsApp, email, or visit us in person. Our team will respond as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-8">
                <li className="flex items-start space-x-4 p-6 rounded-lg bg-primary/5 hover:bg-primary/10 transition">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Our Location</h3>
                    <p className="text-gray-600">
                      Near Runda Estate<br />
                      Nairobi, Kenya<br />
                      East Africa
                    </p>
                  </div>
                </li>
                <li className="flex items-start space-x-4 p-6 rounded-lg bg-green-50 hover:bg-green-100 transition">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Phone Number</h3>
                    <p className="text-gray-600 mb-2">
                      +254 717 629 522
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
                      onClick={() => window.open('tel:+254717629522', '_self')}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </li>
                <li className="flex items-start space-x-4 p-6 rounded-lg bg-green-100 hover:bg-green-200 transition">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow animate-pulse">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">WhatsApp</h3>
                    <p className="text-gray-600 mb-2">
                      Chat with us on WhatsApp
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white shadow"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      WhatsApp Chat
                    </Button>
                  </div>
                </li>
                <li className="flex items-start space-x-4 p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    {/* Email Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Email</h3>
                    <p className="text-gray-600 mb-2">
                      watsonliwa@yahoo.com
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow"
                      onClick={() => window.open('mailto:watsonliwa@yahoo.com', '_blank')}
                    >
                      {/* Mail Icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4-4-4 4m8 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6" /></svg>
                      Email Us
                    </Button>
                  </div>
                </li>
                <li className="flex items-start space-x-4 p-6 rounded-lg bg-purple-50 hover:bg-purple-100 transition md:col-span-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 8:00 AM - 8:00 PM<br />
                      Saturday: 9:00 AM - 5:00 PM<br />
                      Sunday: Emergency Only
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          {/* Emergency Notice */}
          <Card className="bg-red-50 border-red-200 mb-12">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Medical Emergency?</h3>
                  <p className="text-red-700 text-sm mb-3">
                    If you're experiencing a medical emergency, don't wait. Call immediately.
                  </p>
                  <div className="text-center">
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700 py-3 text-lg font-bold text-white"
                      onClick={handleEmergencyCall}
                    >
                      Call Emergency
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Map Section */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Our Location</CardTitle>
              <CardDescription>
                Visit us near Runda Estate, Nairobi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8199999999997!2d36.8175!3d-1.2921!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMTcnMzEuNiJTIDM2wrA0OScwMy4wIkU!5e0!3m2!1sen!2ske!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="My-Tibabu Location"
                ></iframe>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Address Details</h4>
                <p className="text-gray-600">
                  Near Runda Estate<br />
                  Nairobi, Kenya<br />
                  East Africa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Contact;
