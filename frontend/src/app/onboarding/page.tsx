"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
import { onboard } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Input, Label } from "@/components/ui/field";
import { PrivacyNote } from "@/components/privacy-note";

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm({ defaultValues: { name: "" } });

  async function finish(name?: string) {
    await onboard(name);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    router.push("/marketplace");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
      <Card className="w-full space-y-6 shadow-[var(--shadow-md)]">
        <div className="space-y-2">
          <span className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-tint)] text-[var(--accent)]">
            <UserCircle className="size-5" />
          </span>
          <h1 className="editorial text-3xl">A name only you see</h1>
          <PrivacyNote>Optional. This is never shown to other members. Your public identity is a generated alias.</PrivacyNote>
        </div>
        <form className="space-y-4" onSubmit={form.handleSubmit(({ name }) => finish(name))}>
          <div>
            <Label htmlFor="name">Internal name</Label>
            <Input id="name" placeholder="Optional" {...form.register("name")} />
          </div>
          <Button className="w-full" size="lg" type="submit" loading={form.formState.isSubmitting}>Save and enter</Button>
          <Button className="w-full" type="button" variant="ghost" onClick={() => finish()}>Skip</Button>
        </form>
      </Card>
    </div>
  );
}
