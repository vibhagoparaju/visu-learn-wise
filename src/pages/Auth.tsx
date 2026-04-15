import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [forgotPassword, setForgotPassword] = useState(false);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a password reset link!");
      setForgotPassword(false);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, displayName || "Student");
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Check your email to confirm, or start exploring.");
        navigate("/");
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed");
        setLoading(false);
        return;
      }

      if (result.redirected) {
        return;
      }

      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient font-display">VISU</h1>
          <p className="text-sm text-muted-foreground mt-1">Your Personal AI Tutor</p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl p-6 shadow-elevated">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {forgotPassword ? "Reset Password" : isLogin ? "Welcome back!" : "Create your account"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {forgotPassword ? "Enter your email and we'll send a reset link" : isLogin ? "Sign in to continue learning" : "Start your learning journey today"}
          </p>

          {forgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-muted rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full rounded-xl h-12 font-semibold shadow-glow" disabled={loading}>
                {loading ? <span className="animate-pulse">Sending...</span> : <>Send Reset Link <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
              <div className="text-center">
                <button onClick={() => setForgotPassword(false)} className="text-sm text-primary hover:underline font-medium">
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
          <>

            className="w-full rounded-xl h-12 font-medium mb-4"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-muted rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-muted rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-muted rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full rounded-xl h-12 font-semibold shadow-glow"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-pulse">Please wait...</span>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-3 text-center">
              <button onClick={() => setForgotPassword(true)} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
          </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to study hard and never give up 🔥
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
