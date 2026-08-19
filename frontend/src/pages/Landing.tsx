import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { Mic, Wand2, Zap, Shield, AudioWaveform, ChevronRight } from 'lucide-react';

const Landing = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-purple-500/30">
      {/* Navigation Bar */}
      <nav className="w-full sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
              <AudioWaveform className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Voice<span className="text-purple-600">Clone</span></span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="ghost" className="hidden sm:inline-flex">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Log in
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all">
                    Start for free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -top-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
            <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-sm font-medium mb-4 ring-1 ring-purple-500/20">
              <Wand2 className="w-4 h-4" />
              <span>Next-generation voice synthesis</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
              Give your content a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">voice of its own.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
              Create studio-quality voiceovers in seconds. Clone your own voice or choose from our premium AI voices for YouTube, podcasts, and audiobooks.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Go to Dashboard
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                      Start Creating for Free
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-muted/50 transition-colors">
                      Log in
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4">No credit card required. Up to 10,000 characters free.</p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for Professional Creators</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to produce high-quality audio at scale, without the studio time.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-background rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                  <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Voice Cloning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload just 60 seconds of audio to create a perfect digital replica of your voice that captures your unique tone and cadence.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-background rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast Synthesis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate hours of high-fidelity audio in minutes. Our optimized infrastructure ensures you never miss a publishing deadline.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-background rounded-2xl p-8 shadow-sm border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Enterprise-Grade Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your voice data is encrypted and securely stored. You retain 100% ownership and control over your voice clones at all times.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AudioWaveform className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">VoiceClone</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VoiceClone Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
