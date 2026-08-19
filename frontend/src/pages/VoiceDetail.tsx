import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mic2, PlayCircle, Loader2, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../lib/axios';
import type { GenerationListItem } from '../hooks/useDashboardStats';
import type { VoiceProfileItem } from '../hooks/useDashboardStats';

const VoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [voice, setVoice] = useState<VoiceProfileItem | any>(null);
  const [generations, setGenerations] = useState<GenerationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoiceDetails = async () => {
      try {
        setIsLoading(true);
        const [voiceRes, gensRes] = await Promise.all([
          api.get(`/api/v1/voices/${id}`),
          api.get(`/api/v1/voices/${id}/generations`)
        ]);
        setVoice(voiceRes.data);
        setGenerations(gensRes.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching voice details:', err);
        setError(err.response?.data?.detail || 'Failed to load voice details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchVoiceDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this voice profile?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/api/v1/voices/${id}`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Error deleting voice:', err);
      alert(err.response?.data?.detail || 'Failed to delete voice profile');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading voice profile...</p>
      </div>
    );
  }

  if (error || !voice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="text-destructive font-semibold text-lg">{error || 'Voice profile not found'}</div>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Mic2 className="w-8 h-8 text-primary" /> {voice.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Created {format(new Date(voice.created_at), 'PPP')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={voice.status === 'ready' || voice.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
              {voice.status}
            </Badge>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Voice
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>Recent TTS tasks using this voice.</CardDescription>
            </CardHeader>
            <CardContent>
              {generations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-md border border-dashed flex flex-col items-center">
                  <PlayCircle className="w-8 h-8 mb-3 opacity-20" />
                  <p className="mb-4">You haven't generated any audio with this voice yet.</p>
                  <Button asChild>
                    <Link to="/generate">Generate Audio</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {generations.map((gen) => (
                    <div key={gen.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors shadow-sm">
                      <div className="overflow-hidden mr-4">
                        <p className="text-sm font-medium line-clamp-2">{gen.text}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={gen.status === 'completed' ? 'default' : gen.status === 'failed' ? 'destructive' : 'secondary'}>
                          {gen.status}
                        </Badge>
                        {gen.status === 'completed' && (
                          <Button size="icon" variant="ghost" asChild>
                            <Link to={`/generate`}>
                              <PlayCircle className="w-5 h-5 text-primary" />
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{voice.description || 'No description provided.'}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Samples Provided</p>
                <p className="text-2xl font-bold">{voice.sample_count}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <p className="text-sm capitalize">{voice.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VoiceDetail;
