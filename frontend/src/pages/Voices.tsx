import { useState, useEffect, useRef } from "react";
import { toast } from "../hooks/use-toast";
import api from "../lib/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Plus, UploadCloud, Mic } from "lucide-react";

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
      setVoices([...voices, data]);
      setNewVoiceName("");
      setSelectedVoiceId(data.id);
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
      // Append all selected files
      Array.from(e.target.files).forEach(file => {
        formData.append("files", file);
      });

      await api.post(`/api/v1/voices/${selectedVoiceId}/samples`, formData);
      
      toast({
        title: "Success",
        description: "Voice is being cloned!",
      });

      // Reset selected voice and refresh
      setSelectedVoiceId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchVoices();
      
    } catch (error) {
      console.error("Failed to upload samples:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Voice Profiles</h1>
          <p className="text-zinc-400">Manage and clone custom voices using audio samples.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Create New Voice */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Clone a Voice</CardTitle>
              <CardDescription>Create a new profile first, then upload samples.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Voice Name</label>
                <Input 
                  placeholder="e.g. My Podcast Voice" 
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              <Button 
                onClick={handleCreateVoice} 
                disabled={isCreating || !newVoiceName}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Upload Samples Card (shown when a voice is selected) */}
          {selectedVoiceId && (
             <Card className="border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10">
               <CardHeader>
                 <CardTitle className="text-purple-100 flex items-center gap-2">
                   <UploadCloud className="h-5 w-5 text-purple-400" />
                   Upload Audio Samples
                 </CardTitle>
                 <CardDescription className="text-purple-200/70">
                   Select clear audio clips (MP3/WAV) without background noise.
                 </CardDescription>
               </CardHeader>
               <CardContent>
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
                   className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                 >
                   {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mic className="mr-2 h-4 w-4" />}
                   Select Audio Files
                 </Button>
               </CardContent>
             </Card>
          )}
        </div>

        {/* Right Column: Existing Voices */}
        <div className="md:col-span-2">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur h-full">
            <CardHeader>
              <CardTitle>Your Cloned Voices</CardTitle>
            </CardHeader>
            <CardContent>
              {voices.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                  You haven't cloned any voices yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {voices.map((voice) => (
                    <div 
                      key={voice.id} 
                      className={`p-5 rounded-lg border ${selectedVoiceId === voice.id ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700/50 bg-zinc-800/30'} flex flex-col justify-between`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-zinc-100">{voice.name}</h3>
                        <Badge 
                          variant={voice.status === 'ready' ? 'default' : voice.status === 'pending' ? 'secondary' : 'outline'}
                          className={voice.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500' : ''}
                        >
                          {voice.status}
                        </Badge>
                      </div>
                      
                      {voice.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                          onClick={() => setSelectedVoiceId(voice.id)}
                        >
                          Upload Samples
                        </Button>
                      )}
                      
                      {voice.status === 'processing' && (
                        <div className="text-xs text-zinc-500 flex items-center justify-center py-2">
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Processing in background...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
