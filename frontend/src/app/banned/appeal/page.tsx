"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Label, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";

export default function AppealPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        eyebrow="Restricted account"
        title="Appeal restriction"
        description="Explain what happened. A community admin will review your case."
      />
      <Card className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--warning-tint)] p-3.5 text-sm text-[var(--warning)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Your account currently has posting or chat restricted. Submitting an appeal does not lift it automatically.
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const data = new FormData(e.currentTarget);
              const body = new FormData();
              body.append("message", String(data.get("message") || ""));
              const file = data.get("evidence") as File | null;
              if (file && file.size) body.append("evidence", file);
              await api("/appeals", { method: "POST", body });
              toast.success("Appeal submitted. We'll notify you once it's reviewed.");
              router.push("/marketplace");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not submit appeal");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" placeholder="What happened, and why should this be reconsidered?" required />
          </div>
          <div>
            <Label htmlFor="evidence">Evidence (optional)</Label>
            <input
              id="evidence"
              name="evidence"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-[var(--muted-foreground)] file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--surface-2)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--border)]"
            />
          </div>
          <Button type="submit" className="w-full" loading={submitting}>Submit appeal</Button>
        </form>
      </Card>
    </div>
  );
}
