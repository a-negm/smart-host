import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FLIGHTS, ORGANISER, PEOPLE, checkInPerson, weekendLabel, type Decision, type State, type Vote } from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

const WHERE: Record<NonNullable<Decision["link"]>, string> = {
  weekend: `Propose one under Which weekend. ${ORGANISER} confirms.`,
  split: `Propose one under What each person pays. ${ORGANISER} confirms.`,
  checkin: "Choose under Who's there when.",
  flight: "Tomás chooses under Who's there when.",
}

// A linked decision is settled when its control is set (and confirmed, for proposals).
function linkedAnswer(state: State, link: Decision["link"]) {
  if (link === "weekend") return state.weekend?.confirmed ? weekendLabel(state.weekend.value) : null
  if (link === "split") return state.split?.confirmed ? (state.split.value === "equal" ? "Equal" : "By nights stayed") : null
  if (link === "checkin") return checkInPerson(state)
  if (link === "flight") return state.flight === null ? null : FLIGHTS[state.flight].label
  return null
}

function proposalNote(state: State, link: Decision["link"]) {
  const p = link === "weekend" ? state.weekend : link === "split" ? state.split : null
  if (!p || p.confirmed) return null
  const value = link === "weekend" ? weekendLabel(p.value as number) : p.value === "equal" ? "Equal" : "By nights stayed"
  return `${value}, proposed by ${p.by}. Waiting for ${ORGANISER}.`
}

const names = (list: string[]) => list.join(", ")

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

  function vote(d: Decision, answer: Vote) {
    if (!d.votes || !me) return
    change(d.id, { votes: { ...d.votes, answers: { ...d.votes.answers, [me]: answer } } })
  }

  function row(d: Decision) {
    const answer = d.link ? linkedAnswer(state, d.link) : null
    const proposal = proposalNote(state, d.link)
    const votes = d.votes
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
          {d.link && (
            <p className="text-xs text-muted-foreground">{answer ? `Decided: ${answer}.` : (proposal ?? WHERE[d.link])}</p>
          )}
          {votes && (
            <div className="space-y-1 text-xs">
              {(["yes", "no"] as Vote[]).map((v) => {
                const who = votes.voters.filter((p) => votes.answers[p] === v)
                return who.length > 0 && <p key={v}>{v === "yes" ? "Yes" : "No"}: {names(who)}</p>
              })}
              {votes.voters.some((p) => !votes.answers[p]) && (
                <p className="text-muted-foreground">
                  Not answered: {names(votes.voters.filter((p) => !votes.answers[p]))}
                </p>
              )}
              {me && votes.voters.includes(me) && (
                <div className="flex gap-2">
                  {(["yes", "no"] as Vote[]).map((v) => (
                    <Button
                      key={v}
                      size="sm"
                      variant={votes.answers[me] === v ? "default" : "outline"}
                      onClick={() => vote(d, v)}
                    >
                      Vote {v}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
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
