"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { verifyOtp } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/field";
import { OtpInput } from "@/components/ui/otp-input";

export default function VerifyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(sessionStorage.getItem("sellez-email"));
  }, []);

  async function submit(value: string) {
    if (value.length !== 6 || submitting) return;
    const storedEmail = sessionStorage.getItem("sellez-email");
    if (!storedEmail) {
      router.replace("/login");
      return;
    }
    setSubmitting(true);
    try {
      const me = await verifyOtp(storedEmail, value);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push(me.onboarded ? "/marketplace" : "/onboarding");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not verify");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full space-y-6 shadow-[var(--shadow-md)]">
        <div className="space-y-2">
          <span className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-tint)] text-[var(--accent)]">
            <ShieldCheck className="size-5" />
          </span>
          <h1 className="editorial text-3xl">Check your inbox</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {email ? <>We sent a code to <span className="font-medium text-[var(--foreground)]">{email}</span>.</> : "Codes expire in 10 minutes."} Five attempts max.
          </p>
        </div>
        <div className="space-y-4">
          <OtpInput value={code} onChange={(v) => { setCode(v); if (v.length === 6) submit(v); }} />
          <Button className="w-full" size="lg" loading={submitting} disabled={code.length !== 6} onClick={() => submit(code)}>
            Continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
