
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Brain, 
  Eye, 
  Bone, 
  Baby, 
  Stethoscope,
  Activity,
  Microscope,
  Pill,
  Users,
  Clock
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      id: 1,
      title: "General Medicine",
      description: "Comprehensive primary healthcare services for common medical conditions and preventive care.",
      icon: Stethoscope,
      category: "Primary Care"
    },
    {
      id: 2,
      title: "Cardiology",
      description: "Heart health specialists providing diagnosis and treatment for cardiovascular conditions.",
      icon: Heart,
      category: "Specialist"
    },
    {
      id: 3,
      title: "Neurology",
      description: "Expert care for neurological disorders, brain health, and nervous system conditions.",
      icon: Brain,
      category: "Specialist"
    },
    {
      id: 4,
      title: "Ophthalmology",
      description: "Complete eye care services including vision tests, treatments, and surgical procedures.",
      icon: Eye,
      category: "Specialist"
    },
    {
      id: 5,
      title: "Orthopedics",
      description: "Bone, joint, and muscle care including sports medicine and rehabilitation services.",
      icon: Bone,
      category: "Specialist"
    },
    {
      id: 6,
      title: "Pediatrics",
      description: "Specialized healthcare services for infants, children, and adolescents.",
      icon: Baby,
      category: "Primary Care"
    },
    {
      id: 7,
      title: "Mental Health",
      description: "Psychological counseling and psychiatric services for mental wellness and therapy.",
      icon: Activity,
      category: "Mental Health"
    },
    {
      id: 8,
      title: "Laboratory Services",
      description: "Comprehensive diagnostic testing and medical laboratory analysis services.",
      icon: Microscope,
      category: "Diagnostic"
    },
    {
      id: 9,
      title: "Pharmacy",
      description: "Online prescription management and medication delivery services.",
      icon: Pill,
      category: "Pharmacy"
    }
  ];

  const categories = ["All", "Primary Care", "Specialist", "Mental Health", "Diagnostic", "Pharmacy"];

  const handleEmergencyCall = () => {
    window.open('tel:0717629522', '_self');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-blue-600 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1500&q=80"
            alt="Medical background"
            className="w-full h-full object-cover object-center opacity-10"
          />
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-blue-600/70 z-10"></div>
        <div className="container max-w-6xl mx-auto px-4 text-center relative z-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Medical Services
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Comprehensive healthcare services delivered by experienced professionals using modern technology
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                    <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Specialists available
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-16 bg-red-50">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Emergency Services
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Need immediate medical attention? Our emergency services are available 24/7
            </p>
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleEmergencyCall}
            >
              Call Emergency: 0717629522
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join My-Tibabu today and connect with healthcare professionals
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 hover:bg-green-600 hover:text-white transition-colors"
            >
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
