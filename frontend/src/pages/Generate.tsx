import { useState, useEffect } from "react";

import api from "../lib/axios";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Loader2, Download, Wand2 } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  external_voice_id?: string;
  status?: string;
  voice_id?: string; // from elevenlabs pre-made
}

export default function Generate() {
  // const { user } = useAuthStore(); // (will use if needed later)
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<{ user_voices: Voice[]; engine_voices: Voice[] }>({ user_voices: [], engine_voices: [] });
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generations, setGenerations] = useState<any[]>([]);
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);

  useEffect(() => {
    fetchVoices();
    fetchGenerations();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentPollId) {
      interval = setInterval(() => {
        pollGeneration(currentPollId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentPollId]);

  const fetchVoices = async () => {
    try {
      const { data } = await api.get("/voices/");
      setVoices(data);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
    }
  };

  const fetchGenerations = async () => {
    try {
      const { data } = await api.get("/generations/");
      setGenerations(data);
    } catch (error) {
      console.error("Failed to fetch generations:", error);
    }
  };

  const pollGeneration = async (id: string) => {
    try {
      const { data } = await api.get(`/generations/${id}`);
      if (data.status === "completed" || data.status === "failed") {
        setCurrentPollId(null);
        setIsGenerating(false);
        fetchGenerations(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to poll generation:", error);
    }
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoice) return;
    setIsGenerating(true);

    // Determine if it's a custom voice or engine voice
    const isCustom = voices.user_voices.some(v => v.id === selectedVoice);
    // If engine voice, the selectedVoice is the actual voice_id string
    
    try {
      const { data } = await api.post("/generations/", {
        text,
        voice_id: selectedVoice,
        is_custom_voice: isCustom
      });
      setCurrentPollId(data.id);
      
      // Optimistic add
      setGenerations([{
        id: data.id,
        status: "queued",
        text: text,
        created_at: new Date().toISOString()
      }, ...generations]);
      
    } catch (error) {
      console.error("Generation request failed:", error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Voice Studio</h1>
        <p className="text-zinc-400">Transform your text into ultra-realistic speech.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Input */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Create Audio</CardTitle>
              <CardDescription>Select a voice and enter your text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300">
                  Voice Model
                </label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-700 focus:ring-purple-500">
                    <SelectValue placeholder="Select a voice..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {voices.user_voices.length > 0 && (
                      <optgroup label="Your Cloned Voices" className="text-xs font-semibold text-zinc-400 p-2">
                        {voices.user_voices.map((v) => (
                          <SelectItem key={v.id} value={v.id} disabled={v.status !== 'ready'}>
                            {v.name} {v.status !== 'ready' && `(${v.status})`}
                          </SelectItem>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Premium Library" className="text-xs font-semibold text-zinc-400 p-2">
                      {voices.engine_voices.map((v) => (
                        <SelectItem key={v.voice_id} value={v.voice_id as string}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300">
                  Script
                </label>
                <Textarea 
                  placeholder="Type what you want to hear..." 
                  className="min-h-[200px] resize-none bg-zinc-800/50 border-zinc-700 focus-visible:ring-purple-500"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="text-xs text-zinc-500 text-right">
                  {text.length} / 5000 characters
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !text || !selectedVoice}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Speech
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: History */}
        <div className="md:col-span-1">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur h-full flex flex-col">
            <CardHeader>
              <CardTitle>Recent Generations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[400px] px-6">
                <div className="space-y-4">
                  {generations.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">
                      No generations yet.
                    </div>
                  ) : (
                    generations.map((gen) => (
                      <div key={gen.id} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 space-y-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">"{gen.text}"</p>
                          <Badge variant={gen.status === 'completed' ? 'default' : gen.status === 'failed' ? 'destructive' : 'secondary'}
                            className={gen.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' : ''}
                          >
                            {gen.status}
                          </Badge>
                        </div>
                        
                        {gen.status === 'completed' && gen.audio_url && (
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-700/50">
                            <audio controls src={gen.audio_url} className="h-8 w-full max-w-[200px]" />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white" asChild>
                              <a href={gen.audio_url} download target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        )}
                        {gen.status === 'failed' && (
                          <p className="text-xs text-red-400 mt-2">{gen.error || 'Generation failed.'}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
