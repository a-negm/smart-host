import { Button } from "@/components/ui/button"
import { ORGANISER, type Proposal } from "@/data"

type Props<T> = {
  proposal: Proposal<T> | null
  label: (value: T) => string
  me: string | null
  onConfirm: () => void
}

export function ProposalStatus<T>({ proposal, label, me, onConfirm }: Props<T>) {
  if (!proposal) return <p className="text-sm text-muted-foreground">Nobody has proposed one yet.</p>

  if (proposal.confirmed) {
    return (
      <p className="text-sm">
        Decided: {label(proposal.value)}. Proposed by {proposal.by}, confirmed by {ORGANISER}.
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span>
        {label(proposal.value)}, proposed by {proposal.by}.{" "}
        {me !== ORGANISER && <span className="text-muted-foreground">Waiting for {ORGANISER} to confirm.</span>}
      </span>
      {me === ORGANISER && (
        <Button size="sm" onClick={onConfirm}>Confirm</Button>
      )}
    </div>
  )
}
