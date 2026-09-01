import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That link does not exist in SellEZ."
        action={<Button asChild><Link href="/marketplace">Back to marketplace</Link></Button>}
        className="w-full border-none py-0"
      />
    </div>
  );
}
