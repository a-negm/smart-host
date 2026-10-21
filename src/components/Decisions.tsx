import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FLIGHTS, PEOPLE, checkInPerson, weekendLabel, type Decision, type State } from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

const WHERE: Record<NonNullable<Decision["link"]>, string> = {
  weekend: "Pick it under Which weekend.",
  split: "Choose it under What each person pays.",
  checkin: "Choose it under Who's there when.",
  flight: "Tomás chooses it under Who's there when.",
}

// A linked decision is settled when its control has a value; returns that value, or null.
function linkedAnswer(state: State, link: Decision["link"]) {
  if (link === "weekend") return state.picked === null ? null : weekendLabel(state.picked)
  if (link === "split") return state.split === null ? null : state.split === "equal" ? "Equal" : "By nights stayed"
  if (link === "checkin") return checkInPerson(state)
  if (link === "flight") return state.flight === null ? null : FLIGHTS[state.flight].label
  return null
}

export function Decisions({ state, me, update }: Props) {
  const [title, setTitle] = useState("")
  const [owner, setOwner] = useState("")
  // Every decision needs an owner: the one you pick, else you, else the first person.
  const newOwner = owner || me || PEOPLE[0].name

  const isDone = (d: Decision) => (d.link ? linkedAnswer(state, d.link) !== null : d.done)
  const open = state.decisions.filter((d) => !isDone(d))
  const settled = state.decisions.filter(isDone)

  function change(id: number, changes: Partial<Decision>) {
    update({ decisions: state.decisions.map((d) => (d.id === id ? { ...d, ...changes } : d)) })
  }

  function row(d: Decision) {
    const answer = d.link ? linkedAnswer(state, d.link) : null
    return (
      <li key={d.id} className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={isDone(d)}
          disabled={d.link !== undefined}
          onCheckedChange={(c) => change(d.id, { done: c === true })}
          aria-label={`Mark "${d.title}" as decided`}
        />
        <div className="flex-1 space-y-1">
          <p className={isDone(d) ? "text-sm text-muted-foreground line-through" : "text-sm"}>{d.title}</p>
          {d.detail && <p className="text-xs text-muted-foreground">{d.detail}</p>}
          {d.link && <p className="text-xs text-muted-foreground">{answer ? `Decided: ${answer}.` : WHERE[d.link]}</p>}
          <OwnerSelect value={d.owner} onChange={(o) => change(d.id, { owner: o })} />
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
          if (!title.trim()) return
          const decision: Decision = { id: Date.now(), title: title.trim(), owner: newOwner, done: false }
          update({ decisions: [...state.decisions, decision] })
          setTitle("")
        }}
      >
        <Input placeholder="Something the group needs to decide" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex gap-2">
          <OwnerSelect value={newOwner} onChange={setOwner} />
          <Button type="submit" className="flex-1">Add decision</Button>
        </div>
      </form>

      {settled.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Decided</h3>
          <ul className="space-y-4">{settled.map(row)}</ul>
        </div>
      )}
    </section>
  )
}

function OwnerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-32" aria-label="Owner">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PEOPLE.map((p) => (
          <SelectItem key={p.name} value={p.name}>{p.name} owns it</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
