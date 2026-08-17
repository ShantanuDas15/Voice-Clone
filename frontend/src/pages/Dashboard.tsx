import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Mic2, Plus } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage your voice clones and recent generations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder Stat Cards */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clones</CardTitle>
            <Mic2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0 this month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed border-2 bg-muted/30">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Voice Library Coming Soon</CardTitle>
          <CardDescription>
            In Phase 2, you will be able to upload audio samples and train your own custom voice clones here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-4 pb-8">
          <Button disabled className="bg-primary/50 cursor-not-allowed">
            <Plus className="mr-2 h-4 w-4" /> Add New Voice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
