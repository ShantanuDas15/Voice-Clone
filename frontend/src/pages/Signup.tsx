import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Lock, Loader2 } from 'lucide-react';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || 'Failed to sign up with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-purple-500/30">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-600/10 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-pink-500/20 dark:bg-pink-600/10 blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-lighten" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer mb-8 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md">
              <AudioWaveform className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Voice<span className="text-purple-600">Clone</span></span>
          </Link>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-2xl shadow-purple-500/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-3 text-center pt-8 pb-6">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create an account
            </CardTitle>
            <CardDescription className="text-base text-slate-500 dark:text-slate-400">
              Enter your email below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8">
            {authError && (
              <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20 text-center font-medium animate-in slide-in-from-top-2">
                {authError}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 transition-all"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500 font-medium px-1">{errors.email.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 transition-all"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-500 font-medium px-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 font-medium">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-11 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-purple-500 transition-all"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500 font-medium px-1">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 text-white mt-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Create Account'}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-semibold">
                <span className="bg-white dark:bg-slate-950 px-3 text-slate-400">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              className="w-full h-12 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold text-slate-700 dark:text-slate-300 shadow-sm" 
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8 bg-slate-50/50 dark:bg-slate-900/50 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800/50">
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-500 font-semibold hover:underline transition-colors">
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
