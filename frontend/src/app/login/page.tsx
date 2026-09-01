"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { sendOtp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/field";
import { PrivacyNote } from "@/components/privacy-note";

const schema = z.object({ email: z.string().email("Use your work or school email") });

export default function LoginPage() {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full space-y-6 shadow-[var(--shadow-md)]">
        <div className="space-y-2">
          <span className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-tint)] text-[var(--accent)]">
            <Mail className="size-5" />
          </span>
          <h1 className="editorial text-3xl">Sign in quietly</h1>
          <PrivacyNote>Your email is never shared. We only use it to verify you belong to a community.</PrivacyNote>
        </div>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async ({ email }) => {
            try {
              await sendOtp(email);
              sessionStorage.setItem("sellez-email", email);
              router.push("/login/verify");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not send code");
            }
          })}
        >
          <div>
            <Label htmlFor="email">Work or school email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...form.register("email")} />
            {form.formState.errors.email && <p className="mt-1.5 text-sm text-[var(--danger)]">{form.formState.errors.email.message}</p>}
          </div>
          <Button className="w-full" size="lg" loading={form.formState.isSubmitting}>Send 6-digit code</Button>
        </form>
      </Card>
    </div>
  );
}
