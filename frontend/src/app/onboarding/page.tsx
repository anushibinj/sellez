"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-3xl">A name only you see</h1>
        <PrivacyNote>Optional. This is never shown to other members. Your public identity is a generated alias.</PrivacyNote>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(({ name }) => finish(name))}>
          <div>
            <Label htmlFor="name">Internal name</Label>
            <Input id="name" {...form.register("name")} />
          </div>
          <Button className="w-full" type="submit">Save and enter</Button>
          <Button className="w-full" type="button" variant="ghost" onClick={() => finish()}>Skip</Button>
        </form>
      </Card>
    </div>
  );
}
