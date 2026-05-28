"use client";

type VoucherCardProps = {
  title: string;
  description: string;
  value: string;
  expiresAt: number;
  selected: boolean;
  onToggle: () => void;
  kindLabel?: string;
};

export function VoucherCard(props: VoucherCardProps) {
  return (
    <button
      type="button"
      onClick={props.onToggle}
      aria-pressed={props.selected}
      className={`card w-full text-left p-4 transition border-2 ${
        props.selected ? "border-ink" : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-mute">{props.kindLabel ?? "Voucher"}</span>
            <span className="text-xs text-ink-muted">
              Expires {formatExpiry(props.expiresAt)}
            </span>
          </div>
          <div className="font-semibold text-ink text-base">{props.title}</div>
          <div className="text-sm text-ink-muted mt-0.5">{props.description}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-accent">{props.value}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
            props.selected
              ? "bg-ink border-ink text-white"
              : "border-slate-300 text-transparent"
          }`}
          aria-hidden
        >
          ✓
        </span>
        <span className={props.selected ? "text-ink font-medium" : "text-ink-muted"}>
          {props.selected ? "Selected" : "Tap to select"}
        </span>
      </div>
    </button>
  );
}

type GiftCardProps = {
  maskedCode: string;
  balancePence: number;
  expiresAt: number;
  selected: boolean;
  onToggle: () => void;
};

export function GiftCardItem(props: GiftCardProps) {
  return (
    <button
      type="button"
      onClick={props.onToggle}
      aria-pressed={props.selected}
      className={`card w-full text-left p-4 transition border-2 ${
        props.selected ? "border-ink" : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="pill-mute">Gift card · Toggle</span>
            <span className="text-xs text-ink-muted">
              Expires {formatExpiry(props.expiresAt)}
            </span>
          </div>
          <div className="font-semibold text-ink text-base font-mono">{props.maskedCode}</div>
          <div className="text-sm text-ink-muted mt-0.5">Balance available</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-accent">
            £{(props.balancePence / 100).toFixed(2)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
            props.selected
              ? "bg-ink border-ink text-white"
              : "border-slate-300 text-transparent"
          }`}
          aria-hidden
        >
          ✓
        </span>
        <span className={props.selected ? "text-ink font-medium" : "text-ink-muted"}>
          {props.selected ? "Selected" : "Tap to select"}
        </span>
      </div>
    </button>
  );
}

function formatExpiry(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
