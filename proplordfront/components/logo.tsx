export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="flex items-center gap-2 text-xl font-black tracking-tight">
      <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
        P
      </span>
      Proplord
    </a>
  );
}
