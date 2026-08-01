"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS, validatePassword } from "@/lib/auth/password";
import { Button } from "@/components/ui/button";

type Mode = "login" | "signup" | "forgot";

type AuthFormProps = {
  initialMode?: "login" | "signup";
  initialError?: string;
  next?: string;
};

const errorMessages: Record<string, string> = {
  auth_callback: "That sign-in link could not be completed. Please try again.",
  confirmation: "That confirmation link is invalid or has expired. Please request a new one.",
};

function safeNext(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export function AuthForm({ initialMode = "login", initialError = "", next }: AuthFormProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".auth-kicker, .auth-title, .auth-copy, .auth-social, .auth-fields, .auth-submit, .auth-footnote", {
        opacity: 0,
        y: 16,
        duration: 0.65,
        stagger: 0.055,
        ease: "power3.out",
        clearProps: "all",
      });
      gsap.to(".auth-spark", { rotation: 360, duration: 18, repeat: -1, ease: "none" });
    }, root);
    return () => ctx.revert();
  }, [mode]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();
    if (mode === "signup") {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
        });
        if (resetError) throw resetError;
        setNotice("If an account can use email sign-in, a secure password setup link is on its way. Google-only accounts can continue with Google.");
      } else if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (loginError) {
          if (loginError.code === "invalid_credentials") {
            throw new Error("Email or password is incorrect. If you joined with Google, continue with Google or set a password using “Forgot password?”.");
          }
          throw loginError;
        }
        window.location.assign(safeNext(next));
      } else {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (signupError) throw signupError;
        if (data.session) window.location.assign(safeNext(next));
        else if (data.user?.identities?.length === 0) {
          setNotice("This email may already use Google sign-in. Continue with Google, or use “Forgot password?” to add email access securely.");
        } else {
          setNotice("Account created. Check your inbox to confirm your email.");
        }
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError("");
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
    });
    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  }

  const isForgot = mode === "forgot";
  return (
    <div ref={root} className="mx-auto w-full max-w-md">
      <div className="auth-kicker mb-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><Sparkles size={13} /> MythMind workspace</span>
        <span className="auth-spark text-amber-400">✦</span>
      </div>
      <h1 className="auth-title text-4xl font-semibold tracking-[-.06em] text-zinc-950 sm:text-5xl">{isForgot ? "Reset your password." : mode === "login" ? "Welcome back." : "Make room for bigger ideas."}</h1>
      <p className="auth-copy mt-4 max-w-sm text-sm leading-6 text-zinc-500">{isForgot ? "Enter your email and we’ll send a secure link to get you back in." : mode === "login" ? "Your AI build team is ready when you are." : "Start your free workspace and turn your next thought into momentum."}</p>

      {!isForgot && <button type="button" onClick={handleGoogle} disabled={loading} className="auth-social mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-800 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md disabled:opacity-60"><span className="grid size-6 place-items-center rounded-full border border-zinc-200 text-xs font-black">G</span> Continue with Google</button>}
      {!isForgot && <div className="auth-social my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.16em] text-zinc-400"><span className="h-px flex-1 bg-zinc-200" /> or use email <span className="h-px flex-1 bg-zinc-200" /></div>}

      <form onSubmit={handleSubmit} className="auth-fields space-y-4">
        {mode === "signup" && <label className="block"><span className="mb-2 block text-xs font-bold text-zinc-600">Your name</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} required placeholder="Ada Lovelace" className="auth-input" /></label>}
        <label className="block"><span className="mb-2 block text-xs font-bold text-zinc-600">Email address</span><span className="auth-input-wrap"><Mail size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" placeholder="you@company.com" className="auth-input auth-input-icon" /></span></label>
        {!isForgot && <label className="block"><span className="mb-2 block text-xs font-bold text-zinc-600">Password</span><span className="auth-input-wrap"><LockKeyhole size={16} /><input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "Strong password" : "Your password"} aria-describedby={mode === "signup" ? "signup-password-requirements" : undefined} className="auth-input auth-input-icon pr-12" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-zinc-400 hover:text-zinc-800" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>{mode === "signup" && <span id="signup-password-requirements" className="mt-2 block text-[11px] leading-5 text-zinc-500">{PASSWORD_REQUIREMENTS}</span>}</label>}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-700">{errorMessages[error] ?? error}</p>}
        {notice && <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold leading-5 text-emerald-700"><Check size={15} className="mt-0.5 shrink-0" /> {notice}</p>}
        <Button type="submit" disabled={loading} size="lg" className="auth-submit w-full">{loading ? <LoaderCircle size={17} className="animate-spin" /> : null}{isForgot ? "Send reset link" : mode === "login" ? "Enter your workspace" : "Create free workspace"}<ArrowRight size={16} /></Button>
      </form>

      <div className="auth-footnote mt-6 flex justify-between gap-4 text-xs font-semibold text-zinc-500">
        {isForgot ? <button type="button" onClick={() => switchMode("login")} className="text-zinc-950 hover:underline">Back to sign in</button> : mode === "login" ? <><button type="button" onClick={() => switchMode("forgot")} className="hover:text-zinc-950 hover:underline">Forgot password?</button><button type="button" onClick={() => switchMode("signup")} className="text-zinc-950 hover:underline">Create an account</button></> : <><span>Already have an account?</span><button type="button" onClick={() => switchMode("login")} className="text-zinc-950 hover:underline">Sign in</button></>}
      </div>
      <p className="mt-10 text-center text-[11px] leading-5 text-zinc-400">By continuing, you agree to MythMind’s Terms and Privacy Policy.</p>
    </div>
  );
}