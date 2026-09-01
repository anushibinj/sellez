import Link from "next/link";
import { ShieldCheck, EyeOff, MessageCircleOff, KeyRound, ListChecks, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/field";

const STEPS = [
  { icon: KeyRound, title: "Verify", body: "Sign in with a 6-digit email code. No passwords, no social graph." },
  { icon: ListChecks, title: "List or browse", body: "Draft, submit for review, then appear only inside your domain." },
  { icon: MessagesSquare, title: "Chat privately", body: "One thread per buyer. Aliases only. Report anything that feels off." },
];

const PROMISES = [
  { icon: EyeOff, text: "Your email is never shared." },
  { icon: ShieldCheck, text: "Your identity stays private." },
  { icon: MessageCircleOff, text: "Chats are anonymous." },
  { icon: ShieldCheck, text: "Admins moderate listings — they cannot browse member inboxes as identities." },
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-20">
      <section className="grid gap-10 pt-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-10">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Private by design</p>
          <h1 className="editorial max-w-xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            A marketplace that never asks you to be seen.
          </h1>
          <p className="max-w-lg text-base text-[var(--muted-foreground)] sm:text-lg">
            Buy and sell with people who share your email domain. Your email is never shared. Your identity stays private. Chats are anonymous.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/login">Sign in with work email</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="#how">How it works</Link></Button>
          </div>
        </div>
        <Card className="space-y-3 shadow-[var(--shadow-md)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Quiet handshake</p>
          <div className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3.5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Seller</p>
            <p className="text-sm">Still available after Friday stand-up?</p>
          </div>
          <div className="ml-8 rounded-[var(--radius-md)] bg-[var(--accent-tint)] p-3.5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Interested Buyer</p>
            <p className="text-sm">Yes — lobby at 5. No names needed.</p>
          </div>
          <p className="pt-1 text-sm text-[var(--muted-foreground)]">Only verified members of your community can see listings.</p>
        </Card>
      </section>

      <section id="how" className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <Card key={title} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-tint)] text-xs font-semibold text-[var(--accent)]">{i + 1}</span>
              <Icon className="size-4 text-[var(--muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{body}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Privacy promise</h2>
          <ul className="mt-4 space-y-3">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-[var(--muted-foreground)]">
                <Icon className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                {text}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="flex flex-col">
          <h2 className="text-xl font-semibold">Built for closed communities</h2>
          <p className="mt-4 flex-1 text-sm text-[var(--muted-foreground)]">
            Companies, universities, and organizations get a trusted classifieds board without leaking personal contact details onto the public internet.
          </p>
          <Button asChild className="mt-6 w-fit"><Link href="/login">Enter your community</Link></Button>
        </Card>
      </section>
    </div>
  );
}
