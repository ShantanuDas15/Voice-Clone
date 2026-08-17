import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { User, Mail, Database } from 'lucide-react';

const Profile = () => {
  const { user, dbUser, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

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
            <Label>Firebase UID</Label>
            <div className="flex items-center text-sm font-mono text-muted-foreground bg-muted p-2 rounded-md">
              <User className="mr-2 h-4 w-4" />
              {user?.uid}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input readOnly value={user?.email || ''} className="pl-9 bg-muted/50 cursor-not-allowed" />
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
