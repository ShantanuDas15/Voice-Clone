import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Mic2, Activity, PlayCircle, Settings2, ArrowRight, Wand2, AudioWaveform } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '../components/ui/loading-skeleton';

const Dashboard = () => {
  const { stats, recentGenerations, userVoices, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
        <div>
          <Skeleton className="h-12 w-64 mb-3" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-3xl">
          <CardHeader>
            <Skeleton className="h-7 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oops! Something went wrong</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-center">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-8 rounded-full h-12 px-8">Try Again</Button>
      </div>
    );
  }

  const usagePercent = stats ? (stats.chars_used_this_month / stats.monthly_limit) * 100 : 0;
  const isUsageHigh = usagePercent >= 90;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative p-2 sm:p-4 lg:p-8">
      {/* Subtle Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Creator</span> ✨
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Here's what's happening with your voice studio today.
          </p>
        </div>
        <Button className="h-12 px-6 sm:px-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:-translate-y-1 text-white font-bold" asChild>
          <Link to="/generate">
            <Wand2 className="w-5 h-5 mr-2" />
            Generate Audio
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card 1 */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cloned Voices</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Mic2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.voice_count || 0}</div>
          </CardContent>
        </Card>

        {/* Stat Card 2 */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audio Tracks</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <PlayCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.generation_count || 0}</div>
          </CardContent>
        </Card>

        {/* Stat Card 3 */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chars Used</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.chars_used_this_month.toLocaleString() || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">This month</p>
          </CardContent>
        </Card>

        {/* Stat Card 4 */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Settings2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.chars_remaining.toLocaleString() || 0}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Out of {stats?.monthly_limit.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Quota Banner */}
      <Card className="rounded-3xl border border-slate-200 dark:border-0 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-15 dark:opacity-10 pointer-events-none text-slate-900 dark:text-white">
          <AudioWaveform className="w-64 h-64 -rotate-12" />
        </div>
        <CardContent className="p-8 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Monthly Usage Quota</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Keep track of your generation limits. Upgrades coming soon.</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black">{usagePercent.toFixed(1)}%</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium ml-2">Used</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950/50 rounded-full h-4 p-1 backdrop-blur-md border border-slate-200 dark:border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-1500 ease-out relative overflow-hidden ${isUsageHigh ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-4 font-medium">Quota resets automatically on the 1st of next month.</p>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Generations List */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl flex flex-col shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Recent Generations</CardTitle>
            <CardDescription className="text-base font-medium">Your latest AI speech creations.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {recentGenerations.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <PlayCircle className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No audio yet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-[250px]">Start turning your scripts into lifelike speech.</p>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link to="/generate">Create Audio</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGenerations.map((gen) => (
                  <div key={gen.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-purple-500/50 hover:shadow-md hover:shadow-purple-500/5 transition-all">
                    <div className="overflow-hidden mr-4 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{gen.text}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <Badge variant={gen.status === 'completed' ? 'default' : gen.status === 'failed' ? 'destructive' : 'secondary'} className="rounded-full px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
                        {gen.status}
                      </Badge>
                      {gen.status === 'completed' && (
                        <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" asChild>
                          <Link to="/generate">
                            <PlayCircle className="w-5 h-5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Profiles Grid */}
        <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl flex flex-col shadow-sm">
          <CardHeader className="flex flex-row items-end justify-between pb-4">
            <div>
              <CardTitle className="text-2xl font-bold mb-1">Your Voices</CardTitle>
              <CardDescription className="text-base font-medium">Recently added clones.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold" asChild>
              <Link to="/voices">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {userVoices.length === 0 ? (
              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <Mic2 className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No clones created</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-[250px]">Upload an audio sample to clone your first voice.</p>
                <Button className="rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20" asChild>
                  <Link to="/voices">Create Profile</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {userVoices.map((voice) => (
                  <Link
                    key={voice.id}
                    to={`/voices/${voice.id}`}
                    className="group relative flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                    
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                        <Mic2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Badge variant={voice.is_active ? "outline" : "secondary"} className={`rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider ${voice.is_active ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : ''}`}>
                        {voice.is_active ? 'Ready' : 'Processing'}
                      </Badge>
                    </div>
                    
                    <div className="relative z-10">
                      <p className="font-bold text-lg text-slate-900 dark:text-white truncate mb-1">{voice.name}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center">
                        Open studio <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-600 dark:text-blue-400" />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
