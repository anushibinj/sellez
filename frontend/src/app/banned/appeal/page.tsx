"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Label, Textarea } from "@/components/ui/field";

export default function AppealPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <h1 className="text-3xl">Appeal restriction</h1>
        <form className="mt-6 space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const body = new FormData();
          body.append("message", String(data.get("message") || ""));
          const file = (data.get("evidence") as File | null);
          if (file && file.size) body.append("evidence", file);
          await api("/appeals", { method: "POST", body });
          router.push("/marketplace");
        }}>
          <div>
            <Label>Message</Label>
            <Textarea name="message" required />
          </div>
          <div>
            <Label>Evidence (optional)</Label>
            <input name="evidence" type="file" accept="image/*" className="block w-full text-sm" />
          </div>
          <Button type="submit">Submit appeal</Button>
        </form>
      </Card>
    </div>
  );
}
