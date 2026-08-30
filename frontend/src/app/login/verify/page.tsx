"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyOtp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/field";

const schema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

export default function VerifyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { code: "" } });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-3xl">Check your inbox</h1>
        <p className="mt-2 text-[var(--muted)]">Codes expire in 10 minutes. Five attempts max.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit(async ({ code }) => {
            const email = sessionStorage.getItem("sellez-email");
            if (!email) {
              router.replace("/login");
              return;
            }
            try {
              const me = await verifyOtp(email, code);
              await queryClient.invalidateQueries({ queryKey: ["me"] });
              router.push(me.onboarded ? "/marketplace" : "/onboarding");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not verify");
            }
          })}
        >
          <div>
            <Label htmlFor="code">One-time code</Label>
            <Input id="code" inputMode="numeric" autoComplete="one-time-code" {...form.register("code")} />
          </div>
          <Button className="w-full" disabled={form.formState.isSubmitting}>Continue</Button>
        </form>
      </Card>
    </div>
  );
}
