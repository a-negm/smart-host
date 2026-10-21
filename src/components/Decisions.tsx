import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FLIGHTS, ORGANISER, PEOPLE, checkInPerson, reopen, weekendLabel, type Decision, type State } from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

const WHERE: Record<NonNullable<Decision["link"]>, string> = {
  weekend: `Propose one under Which weekend. ${ORGANISER} confirms.`,
  checkin: "Choose under Who's there when.",
  flight: "Tomás chooses under Who's there when.",
}

// A linked decision is settled when its control is set (and confirmed, for the weekend).
function linkedAnswer(state: State, link: Decision["link"]) {
  if (link === "weekend") return state.weekend?.confirmed ? weekendLabel(state.weekend.value) : null
  if (link === "checkin") return checkInPerson(state)
  if (link === "flight") return state.flight === null ? null : FLIGHTS[state.flight].label
  return null
}

export function Decisions({ state, me, update }: Props) {
  const [title, setTitle] = useState("")
  const [owner, setOwner] = useState("")
  // A new decision is owned by whoever raises it, unless they pick someone else.
  const newOwner = owner || me || ""

  const isDone = (d: Decision) => (d.link ? linkedAnswer(state, d.link) !== null : d.done)
  const open = state.decisions.filter((d) => !isDone(d))
  const settled = state.decisions.filter(isDone)

  function change(id: number, changes: Partial<Decision>) {
    update({ decisions: state.decisions.map((d) => (d.id === id ? { ...d, ...changes } : d)) })
  }

  function row(d: Decision) {
    const done = isDone(d)
    const answer = d.link ? linkedAnswer(state, d.link) : null
    const pending = d.link === "weekend" && state.weekend && !state.weekend.confirmed ? state.weekend : null
    return (
      <li key={d.id} className="flex items-start gap-3">
        {/* Anyone can settle a decision; settled ones are locked until the organiser reopens them. */}
        <Checkbox
          className="mt-1"
          checked={done}
          disabled={d.link !== undefined || done}
          onCheckedChange={(c) => c === true && change(d.id, { done: true })}
          aria-label={`Mark "${d.title}" as decided`}
        />
        <div className="flex-1 space-y-1">
          <p className={done ? "text-sm text-muted-foreground line-through" : "text-sm"}>{d.title}</p>
          {d.detail && <p className="text-xs text-muted-foreground">{d.detail}</p>}
          {d.link && !done && (
            <p className="text-xs text-muted-foreground">
              {pending
                ? `${weekendLabel(pending.value)}, proposed by ${pending.by}. Waiting for ${ORGANISER}.`
                : WHERE[d.link]}
            </p>
          )}
          {answer && <p className="text-xs text-muted-foreground">Decided: {answer}.</p>}
          <div className="flex items-center gap-2">
            <OwnerSelect value={d.owner} disabled={done} onChange={(o) => change(d.id, { owner: o })} />
            {done && me === ORGANISER && (
              <Button size="sm" variant="ghost" onClick={() => update(reopen(state, d))}>Reopen</Button>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Still to decide</h2>

      {open.length === 0 && <p className="text-sm text-muted-foreground">Nothing left to decide.</p>}
      <ul className="space-y-4">{open.map(row)}</ul>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim() || !newOwner) return
          const decision: Decision = { id: Date.now(), title: title.trim(), owner: newOwner, done: false }
          update({ decisions: [...state.decisions, decision] })
          setTitle("")
        }}
      >
        <Input
          placeholder={me ? "Something the group needs to decide" : "Pick your name to add a decision"}
          disabled={!me}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <OwnerSelect value={newOwner} onChange={setOwner} />
          <Button type="submit" className="flex-1" disabled={!me}>Add decision</Button>
        </div>
      </form>

      {settled.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Decided, locked</h3>
          {me !== ORGANISER && <p className="text-xs text-muted-foreground">Only {ORGANISER} can reopen these.</p>}
          <ul className="space-y-4">{settled.map(row)}</ul>
        </div>
      )}
    </section>
  )
}

function OwnerSelect({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <Select value={value} disabled={disabled} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-32" aria-label="Owner">
        <SelectValue placeholder="Owner" />
      </SelectTrigger>
      <SelectContent>
        {PEOPLE.map((p) => (
          <SelectItem key={p.name} value={p.name}>{p.name} owns it</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
