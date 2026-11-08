export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight sm:text-xl">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground sm:size-9">
        P
      </span>
      Proplord
    </a>
  );
}
