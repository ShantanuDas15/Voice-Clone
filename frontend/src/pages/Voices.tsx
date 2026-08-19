import { useState, useEffect, useRef } from "react";
import { toast } from "../hooks/use-toast";
import api from "../lib/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Plus, UploadCloud, Mic, AudioWaveform, Sparkles, ArrowRight, Mic2 } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  status: string;
  external_voice_id?: string;
}

export default function Voices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const { data } = await api.get("/api/v1/voices/");
      setVoices(data.user_voices);
    } catch (error) {
      console.error("Failed to fetch voices:", error);
    }
  };

  const handleCreateVoice = async () => {
    if (!newVoiceName) return;
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", newVoiceName);
      formData.append("description", "Custom cloned voice");

      const { data } = await api.post("/api/v1/voices/", formData);
      setVoices([data, ...voices]);
      setNewVoiceName("");
      setSelectedVoiceId(data.id);
      
      toast({
        title: "Profile Created",
        description: "Now upload some audio samples to clone the voice.",
      });
    } catch (error) {
      console.error("Failed to create voice record:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedVoiceId) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach(file => {
        formData.append("files", file);
      });

      await api.post(`/api/v1/voices/${selectedVoiceId}/samples`, formData);
      
      toast({
        title: "Upload Successful",
        description: "Your voice is now being processed and cloned! This may take a few minutes.",
      });

      setSelectedVoiceId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchVoices();
      
    } catch (error) {
      console.error("Failed to upload samples:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your samples.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative p-2 sm:p-4 lg:p-8">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Voice <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Studio</span> 🎙️
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
          Clone your own voice or create entirely new characters by uploading high-quality audio samples.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Create & Upload */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <CardHeader className="pb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <Plus className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold">New Profile</CardTitle>
              <CardDescription className="text-base font-medium">Name your new voice to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Voice Name</label>
                <Input 
                  placeholder="e.g. Narrative Podcast, My Voice" 
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  className="bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-700 h-12 rounded-xl focus-visible:ring-purple-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateVoice()}
                />
              </div>
              <Button 
                onClick={handleCreateVoice} 
                disabled={isCreating || !newVoiceName}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 font-bold shadow-md transition-all"
              >
                {isCreating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Create Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Upload Samples Card (shown when a voice is selected) */}
          {selectedVoiceId && (
            <Card className="rounded-3xl border-0 bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/20 overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
              
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <UploadCloud className="h-5 w-5 text-white" />
                  </div>
                  Upload Samples
                </CardTitle>
                <CardDescription className="text-purple-100 font-medium mt-2">
                  Select clear audio clips (MP3/WAV) without background noise. Recommended 1-5 minutes total.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 pt-4">
                <input 
                  type="file" 
                  multiple
                  accept="audio/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  variant="secondary"
                  className="w-full h-12 rounded-xl font-bold bg-white text-purple-700 hover:bg-white/90 shadow-lg transition-all hover:scale-[1.02]"
                >
                  {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
                  {isUploading ? "Uploading..." : "Select Audio Files"}
                </Button>
                <div className="mt-4 flex justify-between items-center text-xs text-purple-200/80 font-medium">
                   <span>Max 10MB per file</span>
                   <button onClick={() => setSelectedVoiceId(null)} className="hover:text-white hover:underline transition-all">Cancel</button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Existing Voices Grid */}
        <div className="lg:col-span-8">
          <Card className="rounded-3xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl h-full shadow-sm flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold">Your Cloned Voices</CardTitle>
              <CardDescription className="text-base font-medium">All active and processing voice models.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {voices.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <AudioWaveform className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your Studio is Empty</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Create a new voice profile on the left to start generating lifelike speech.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {voices.map((voice) => {
                    const isSelected = selectedVoiceId === voice.id;
                    const isReady = voice.status === 'ready';
                    const isProcessing = voice.status === 'processing';
                    const isPending = voice.status === 'pending';
                    
                    return (
                      <div 
                        key={voice.id} 
                        className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 shadow-purple-500/10' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-purple-300 dark:hover:border-purple-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isReady ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : isProcessing ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic2 className="w-5 h-5" />}
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[150px]">{voice.name}</h3>
                          </div>
                          
                          <Badge 
                            variant="outline"
                            className={`rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider ${
                              isReady ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 
                              isProcessing ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 
                              'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                            }`}
                          >
                            {voice.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-auto">
                          {isPending ? (
                            <Button 
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full rounded-xl font-semibold transition-all ${isSelected ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 border-slate-200 dark:border-slate-800'}`}
                              onClick={() => setSelectedVoiceId(voice.id)}
                            >
                              <UploadCloud className="w-4 h-4 mr-2" />
                              Upload Samples
                            </Button>
                          ) : isProcessing ? (
                            <div className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
                              Cloning in progress...
                            </div>
                          ) : (
                            <div className="w-full bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 flex items-center justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Ready to Use</span>
                              <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
