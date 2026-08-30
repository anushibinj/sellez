"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { sendOtp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/field";
import { PrivacyNote } from "@/components/privacy-note";

const schema = z.object({ email: z.string().email("Use your work or school email") });

export default function LoginPage() {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-3xl">Sign in quietly</h1>
        <PrivacyNote>Your email is never shared. We only use it to verify you belong to a community.</PrivacyNote>
        <form
          className="mt-6 space-y-4"
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
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="mt-1 text-sm text-[var(--warn)]">{form.formState.errors.email.message}</p>}
          </div>
          <Button className="w-full" disabled={form.formState.isSubmitting}>Send 6-digit code</Button>
        </form>
      </Card>
    </div>
  );
}
