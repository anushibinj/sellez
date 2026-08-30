import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/field";

export default function NotFound() {
  return (
    <Card className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-2 text-[var(--muted)]">That link does not exist in SellEZ.</p>
      <Button asChild className="mt-6"><Link href="/marketplace">Back to marketplace</Link></Button>
    </Card>
  );
}
