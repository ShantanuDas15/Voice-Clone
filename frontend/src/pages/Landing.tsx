import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { Mic, Wand2, Zap, Shield, AudioWaveform, ChevronRight, Play } from 'lucide-react';

const Landing = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Navigation Bar */}
      <nav className="w-full sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
              <AudioWaveform className="w-5 h-5 text-white animate-pulse" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Voice<span className="text-purple-600">Clone</span></span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="ghost" className="hidden sm:inline-flex hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Log in
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md">
                    Start for free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-600/10 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-pink-500/20 dark:bg-pink-600/10 blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-lighten" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-32 pb-40 flex items-center justify-center min-h-[85vh]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold mb-4 ring-1 ring-purple-500/30 shadow-sm animate-float">
              <Wand2 className="w-4 h-4" />
              <span>Next-generation voice synthesis is here</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-6xl mx-auto leading-[1.1]">
              Give your content a <br className="hidden md:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 animate-text-gradient">voice of its own.</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light mt-8">
              Create studio-quality voiceovers in seconds. Clone your own voice or choose from our premium AI voices for YouTube, podcasts, and audiobooks.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-white group">
                    Go to Dashboard
                    <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/signup">
                  <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 hover:-translate-y-1 text-white group">
                    Start Creating for Free
                    <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-8 font-medium">No credit card required. Up to 10,000 characters free forever.</p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 backdrop-blur-sm relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900 dark:text-white">Built for Professional Creators</h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">Everything you need to produce high-quality audio at scale, without the studio time or expensive equipment.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group bg-white dark:bg-slate-950 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Instant Voice Cloning</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  Upload just 60 seconds of clean audio to create a perfect digital replica of your voice that captures your unique tone, pitch, and natural cadence.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group bg-white dark:bg-slate-950 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Lightning Fast Synthesis</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  Generate hours of high-fidelity audio in minutes. Our distributed GPU infrastructure ensures you never miss a publishing deadline again.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group bg-white dark:bg-slate-950 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-pink-500/50 dark:hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 rounded-2xl bg-pink-50 dark:bg-pink-950 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-7 h-7 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Enterprise-Grade Security</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  Your voice data is encrypted at rest and in transit. You retain 100% ownership, copyright, and absolute control over your voice clones.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AudioWaveform className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-500">VoiceClone</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} VoiceClone Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
