import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Mic2, Activity, PlayCircle, Settings2, Loader2, ArrowRight } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { stats, recentGenerations, userVoices, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-destructive">
        <p>Failed to load dashboard: {error}</p>
      </div>
    );
  }

  const usagePercent = stats ? (stats.chars_used_this_month / stats.monthly_limit) * 100 : 0;
  const isUsageHigh = usagePercent >= 90;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your voice clones and generation usage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cloned Voices</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.voice_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Audio</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.generation_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Characters Used</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chars_used_this_month.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Characters Remaining</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.chars_remaining.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats?.monthly_limit.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quota Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Monthly Usage Quota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${isUsageHigh ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{usagePercent.toFixed(1)}% Used</span>
            <span>Resets on the 1st of next month</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Generations */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Recent Generations</CardTitle>
            <CardDescription>Your 5 most recent TTS tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {recentGenerations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                No recent generations.
              </div>
            ) : (
              <div className="space-y-4">
                {recentGenerations.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="overflow-hidden mr-4">
                      <p className="text-sm font-medium truncate">{gen.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={gen.status === 'completed' ? 'default' : gen.status === 'failed' ? 'destructive' : 'secondary'}>
                        {gen.status}
                      </Badge>
                      {gen.status === 'completed' && (
                        <Button size="icon" variant="ghost" asChild>
                          <Link to="/generate">
                            <PlayCircle className="w-4 h-4 text-primary" />
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

        {/* Voice Profiles Mini-Cards */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Your Voice Profiles</CardTitle>
              <CardDescription>Recently added or modified voices.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/voices">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {userVoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed flex flex-col items-center">
                <p className="mb-4">No voice profiles found.</p>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/voices">Create Voice</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {userVoices.map((voice) => (
                  <Link
                    key={voice.id}
                    to={`/voices/${voice.id}`}
                    className="flex flex-col justify-between p-4 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Mic2 className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      <Badge variant={voice.is_active ? "outline" : "secondary"} className="text-[10px]">
                        {voice.is_active ? 'Active' : 'Processing'}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold text-sm truncate">{voice.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        View details <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
