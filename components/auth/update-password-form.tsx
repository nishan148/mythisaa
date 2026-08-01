"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS, validatePassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const supabaseRef = useRef(createClient());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabaseRef.current.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Check size={24} /></span>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-.06em] text-zinc-950">Password updated.</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-500">Your new password is ready. Continue to your MythMind workspace.</p>
        <Link href="/account" className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800">Open workspace <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-800"><LockKeyhole size={21} /></span>
      <h1 className="mt-6 text-4xl font-semibold tracking-[-.06em] text-zinc-950 sm:text-5xl">Choose a new password.</h1>
      <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">{PASSWORD_REQUIREMENTS} A strong, unique password keeps your workspace protected.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-zinc-600">New password</span>
          <span className="auth-input-wrap"><LockKeyhole size={16} /><input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={PASSWORD_MIN_LENGTH} type={showPassword ? "text" : "password"} autoComplete="new-password" className="auth-input auth-input-icon pr-12" placeholder="Strong password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-zinc-400 hover:text-zinc-800" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-zinc-600">Confirm password</span>
          <span className="auth-input-wrap"><LockKeyhole size={16} /><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={PASSWORD_MIN_LENGTH} type={showPassword ? "text" : "password"} autoComplete="new-password" className="auth-input auth-input-icon" placeholder="Repeat your password" /></span>
        </label>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-700">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">{loading && <LoaderCircle size={17} className="animate-spin" />} Update password <ArrowRight size={16} /></Button>
      </form>
    </div>
  );
}