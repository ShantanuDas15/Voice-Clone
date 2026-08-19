import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Mail, Database, Edit2, Check, X, Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

const Profile = () => {
  const { user, dbUser, isLoading, setAuthUser } = useAuthStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  const handleEditName = () => {
    setNewName(user?.displayName || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      await updateProfile(user, { displayName: newName });
      // Update local state to reflect changes instantly without page reload
      setAuthUser({ ...user, displayName: newName } as any);
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update profile name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and subscription.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Your personal information synced from Firebase and our secure database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <div className="relative group flex-1">
                  <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="pl-11 h-[46px] rounded-xl bg-slate-50 dark:bg-slate-900 border-purple-500 dark:border-purple-500 focus-visible:ring-purple-500 transition-all" 
                    placeholder="Enter your full name"
                    disabled={isSaving}
                  />
                </div>
                <Button 
                  size="icon" 
                  className="h-[46px] w-[46px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                  onClick={handleSaveName}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="outline"
                  className="h-[46px] w-[46px] rounded-xl border-slate-200 dark:border-slate-800"
                  onClick={() => setIsEditingName(false)}
                  disabled={isSaving}
                >
                  <X className="h-5 w-5 text-slate-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl group">
                <div className="flex items-center">
                  <User className="mr-3 h-5 w-5 text-slate-500" />
                  {user?.displayName || 'Name not provided'}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-purple-600"
                  onClick={handleEditName}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <Input 
                readOnly 
                value={user?.email || ''} 
                className="pl-11 h-[46px] rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed focus-visible:ring-0" 
              />
            </div>
          </div>

          {dbUser && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center text-blue-600">
                <Database className="mr-2 h-4 w-4" /> Database Record
              </Label>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div>
                  <span className="text-muted-foreground block mb-1">Tier</span>
                  <span className="font-medium capitalize">{dbUser.tier}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Created At</span>
                  <span className="font-medium">{new Date(dbUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
};

export default Profile;
