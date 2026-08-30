import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/field";

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-20">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Private by design</p>
          <h1 className="max-w-xl text-5xl leading-[1.05] sm:text-6xl">A marketplace that never asks you to be seen.</h1>
          <p className="max-w-lg text-lg text-[var(--muted)]">
            Buy and sell with people who share your email domain. Your email is never shared. Your identity stays private. Chats are anonymous.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/login">Sign in with work email</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="#how">How it works</Link></Button>
          </div>
        </div>
        <Card className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Quiet handshake</p>
          <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
            <p className="text-sm text-[var(--muted)]">Seller</p>
            <p>Still available after Friday stand-up?</p>
          </div>
          <div className="rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] p-4">
            <p className="text-sm text-[var(--muted)]">Interested Buyer</p>
            <p>Yes — lobby at 5. No names needed.</p>
          </div>
          <p className="text-sm text-[var(--muted)]">Only verified members of your community can see listings.</p>
        </Card>
      </section>

      <section id="how" className="grid gap-4 md:grid-cols-3">
        {[
          ["1. Verify", "Sign in with a 6-digit email code. No passwords, no social graph."],
          ["2. List or browse", "Draft, submit for review, then appear only inside your domain."],
          ["3. Chat privately", "One thread per buyer. Aliases only. Report anything that feels off."],
        ].map(([title, body]) => (
          <Card key={title}>
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-3 text-[var(--muted)]">{body}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-3xl">Privacy promise</h2>
          <ul className="mt-4 space-y-2 text-[var(--muted)]">
            <li>Your email is never shared.</li>
            <li>Your identity stays private.</li>
            <li>Chats are anonymous.</li>
            <li>Admins moderate listings — they cannot browse member inboxes as identities.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="text-3xl">Built for closed communities</h2>
          <p className="mt-4 text-[var(--muted)]">
            Companies, universities, and organizations get a trusted classifieds board without leaking personal contact details onto the public internet.
          </p>
          <Button asChild className="mt-6"><Link href="/login">Enter your community</Link></Button>
        </Card>
      </section>
    </div>
  );
}
