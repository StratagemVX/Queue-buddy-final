import { Header } from '@/components/layout/Header';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Activity, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        
        {/* CTA Section */}
        <section className="py-20 bg-gradient-primary">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Skip the Queue?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of patients who have transformed their hospital visit experience
            </p>
            <Link 
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 rounded-lg bg-card text-primary px-8 py-3 font-semibold hover:bg-card/90 transition-colors"
            >
              Get Started Now
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                  <Activity className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">MediQueue</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Smart OPD queue management for modern hospitals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
                <li><Link to="/departments" className="hover:text-foreground transition-colors">Departments</Link></li>
                <li><Link to="/queue-status" className="hover:text-foreground transition-colors">Queue Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +1 (555) 000-0000
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  support@mediqueue.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  123 Health St, Medical City
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2024 MediQueue. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;