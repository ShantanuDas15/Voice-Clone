import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';

const Landing = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          Voice <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">Clone</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The ultimate platform for creating, managing, and utilizing AI-generated voice clones with enterprise-grade quality and precision.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-8">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border-2 hover:bg-muted/50 transition-colors">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Decorative background blur */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>
    </div>
  );
};

export default Landing;
