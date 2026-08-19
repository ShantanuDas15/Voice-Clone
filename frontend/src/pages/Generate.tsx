import { useState, useEffect } from "react";
import { toast } from "../hooks/use-toast";
import { Skeleton } from "../components/ui/loading-skeleton";

import api from "../lib/axios";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Loader2, Wand2, PlayCircle, History, Sparkles, Mic2 } from "lucide-react";
import { WavePlayer } from "../components/audio";

interface Voice {
  id: string;
  name: string;
  external_voice_id?: string;
  status?: string;
  voice_id?: string; // from elevenlabs pre-made
}

export default function Generate() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<{ user_voices: Voice[]; engine_voices: Voice[] }>({ user_voices: [], engine_voices: [] });
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
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
      setIsLoadingVoices(true);
      const { data } = await api.get("/api/v1/voices/");
      setVoices(data);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const fetchGenerations = async () => {
    try {
      const { data } = await api.get("/api/v1/generations/");
      setGenerations(data);
    } catch (error) {
      console.error("Failed to fetch generations:", error);
    }
  };

  const pollGeneration = async (id: string) => {
    try {
      const { data } = await api.get(`/api/v1/generations/${id}`);
      if (data.status === "completed" || data.status === "failed") {
        setCurrentPollId(null);
        setIsGenerating(false);
        fetchGenerations();
        if (data.status === "completed") {
          toast({
            title: "Success",
            description: "Your audio has been generated!",
          });
        }
      }
    } catch (error) {
      console.error("Failed to poll generation:", error);
    }
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoice) return;
    
    if (text.length > 5000) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Text cannot exceed 5000 characters."
      });
      return;
    }

    setIsGenerating(true);

    const isCustom = voices.user_voices.some(v => v.id === selectedVoice);
    
    try {
      const { data } = await api.post("/api/v1/generations/", {
        text,
        voice_id: selectedVoice,
        is_custom_voice: isCustom
      });
      setCurrentPollId(data.id);
      
      setGenerations([{
        id: data.id,
        status: "queued",
        text: text,
        created_at: new Date().toISOString()
      }, ...generations]);
      
    } catch (error) {
      console.error("Generation request failed:", error);
      setIsGenerating(false);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not start generation task."
      });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative p-2 sm:p-4 lg:p-8">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Audio</span> 🎙️
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
          Transform your text into ultra-realistic speech using your cloned voices or our premium library.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Generation Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Wand2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Studio Setup</CardTitle>
                  <CardDescription className="text-base font-medium">Select a voice and write your script.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Select Voice Model
                </label>
                {isLoadingVoices ? (
                  <Skeleton className="h-12 w-full rounded-xl" />
                ) : (
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-700 focus:ring-purple-500 text-slate-900 dark:text-white font-medium">
                      <SelectValue placeholder="Choose a voice..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                      {voices.user_voices.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider p-2">Your Cloned Voices</SelectLabel>
                          {voices.user_voices.map((v) => (
                            <SelectItem 
                              key={v.id} 
                              value={v.id} 
                              disabled={v.status !== 'ready'}
                              className="font-medium cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-900/20 focus:text-purple-700 dark:focus:text-purple-300"
                            >
                              <div className="flex items-center">
                                <Mic2 className="w-4 h-4 mr-2 text-blue-500" />
                                {v.name} {v.status !== 'ready' && `(Processing)`}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                      <SelectGroup>
                        <SelectLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider p-2">Premium Library</SelectLabel>
                        {voices.engine_voices.map((v) => (
                          <SelectItem 
                            key={v.voice_id} 
                            value={v.voice_id as string}
                            className="font-medium cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-700 dark:focus:text-blue-300"
                          >
                             <div className="flex items-center">
                                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                                {v.name}
                              </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Script
                  </label>
                  <div className={`text-xs font-medium ${text.length > 4500 ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {text.length} / 5000 characters
                  </div>
                </div>
                <Textarea 
                  placeholder="Type what you want to hear... E.g., 'Welcome to the latest episode of our podcast!'" 
                  className="min-h-[250px] resize-none rounded-2xl bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-700 focus-visible:ring-purple-500 text-slate-900 dark:text-white p-4 leading-relaxed"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6 px-6 relative z-10">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !text || !selectedVoice}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] text-white font-bold text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Generating your audio...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-3 h-6 w-6" />
                    Generate Speech
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Generation History */}
        <div className="lg:col-span-5">
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl h-full shadow-sm flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-slate-400" />
                <CardTitle className="text-xl font-bold">Recent History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[550px] px-6 pb-6">
                <div className="space-y-4">
                  {generations.length === 0 ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <PlayCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No generations yet</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">Create your first audio clip using the form on the left.</p>
                    </div>
                  ) : (
                    generations.map((gen) => {
                      const isCompleted = gen.status === 'completed';
                      const isFailed = gen.status === 'failed';
                      const isPending = gen.status === 'queued' || gen.status === 'processing';
                      
                      return (
                        <div 
                          key={gen.id} 
                          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-300 group"
                        >
                          <div className="flex justify-between items-start mb-3 gap-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed font-medium">"{gen.text}"</p>
                            <Badge 
                              variant="outline"
                              className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider shrink-0 ${
                                isCompleted ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 
                                isFailed ? 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10' : 
                                'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                              }`}
                            >
                              {gen.status}
                            </Badge>
                          </div>
                          
                          {isPending && (
                            <div className="mt-4 flex items-center text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg">
                              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing audio...
                            </div>
                          )}

                          {isCompleted && gen.audio_url && (
                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                              <WavePlayer 
                                audioUrl={gen.audio_url} 
                                downloadFilename={`voiceclone_${gen.id.substring(0, 8)}.mp3`}
                              />
                            </div>
                          )}
                          
                          {isFailed && (
                            <p className="text-xs font-medium text-red-500 mt-3 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                              {gen.error || 'Generation failed. Please try again.'}
                            </p>
                          )}
                        </div>
                      );
                    })
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
