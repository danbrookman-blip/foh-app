export function TierPill({
  tier,
}: {
  tier: "new" | "regular" | "vip" | "at-risk" | "recovery";
}) {
  switch (tier) {
    case "vip":
      return <span className="pill-accent">VIP</span>;
    case "at-risk":
      return <span className="pill-warn">At risk</span>;
    case "recovery":
      return <span className="pill-warn">Recovery</span>;
    case "new":
      return <span className="pill-ok">New</span>;
    case "regular":
    default:
      return <span className="pill-navy">Regular</span>;
  }
}
