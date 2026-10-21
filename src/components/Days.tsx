import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PEOPLE,
  SLOTS,
  clock,
  dayLabels,
  guestsFor,
  isPresentOnDay,
  missesIdea,
  weekendLabel,
  type Guest,
  type Idea,
  type Slot,
  type State,
} from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

function partialNote(g: Guest, day: number) {
  if (day === g.from) return g.arrive === null ? "arrives, time not set" : `from ${clock(g.arrive)}`
  if (day === g.to) return g.atCheckout ? "until checkout" : g.leave === null ? "leaves, time not set" : `until ${clock(g.leave)}`
  return null
}

const names = (list: { name: string }[]) => list.map((p) => p.name).join(", ")

export function Days({ state, me, update }: Props) {
  const [title, setTitle] = useState("")
  const guests = guestsFor(state)
  const days = dayLabels(state.preview)
  const cantCome = PEOPLE.filter((p) => !guests.some((g) => g.name === p.name))
  const unplanned = state.ideas.filter((idea) => idea.day === null)

  // Only people coming this weekend count; their misses can be unknown until times are set.
  function whoMisses(idea: Idea) {
    return {
      misses: guests.filter((g) => missesIdea(g, idea) === true),
      unknown: guests.filter((g) => missesIdea(g, idea) === null),
    }
  }

  function changeIdea(id: number, changes: Partial<Idea>) {
    update({ ideas: state.ideas.map((i) => (i.id === id ? { ...i, ...changes } : i)) })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Plan each day</h2>
        <p className="text-sm text-muted-foreground">
          {weekendLabel(state.preview)}.{cantCome.length > 0 && ` Can't come: ${names(cantCome)}.`}
        </p>
      </div>

      {days.map((label, day) => {
        const present = guests.filter((g) => isPresentOnDay(g, day))
        const absent = PEOPLE.filter((p) => !present.some((g) => g.name === p.name))
        return (
          <div key={label} className="space-y-2 border-l-2 border-primary pl-3">
            <h3 className="font-medium">{label}</h3>
            <p className="text-sm">
              {present.length === 0 && <span className="text-muted-foreground">Nobody is here.</span>}
              {present.map((g, i) => {
                const note = partialNote(g, day)
                return (
                  <span key={g.name}>
                    {i > 0 && ", "}
                    {g.name}
                    {note && <span className="text-muted-foreground"> {note}</span>}
                  </span>
                )
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {absent.length === 0 ? "Nobody is missing." : `Not here: ${names(absent)}`}
            </p>
            {state.ideas
              .filter((idea) => idea.day === day)
              .map((idea) => (
                <IdeaRow key={idea.id} idea={idea} days={days} who={whoMisses(idea)} onChange={changeIdea} />
              ))}
          </div>
        )
      })}

      <div className="space-y-3">
        <h3 className="font-medium">Not planned yet</h3>
        {unplanned.length === 0 && <p className="text-sm text-muted-foreground">Every idea has a day.</p>}
        {unplanned.map((idea) => (
          <IdeaRow key={idea.id} idea={idea} days={days} who={null} onChange={changeIdea} />
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim() || !me) return
            const idea: Idea = { id: Date.now(), title: title.trim(), addedBy: me, note: "", day: null, slot: null }
            update({ ideas: [...state.ideas, idea] })
            setTitle("")
          }}
        >
          <Input
            placeholder={me ? "New idea" : "Pick your name to add ideas"}
            disabled={!me}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" variant="outline" disabled={!me}>Add idea</Button>
        </form>
      </div>
    </section>
  )
}

function IdeaRow({
  idea,
  days,
  who,
  onChange,
}: {
  idea: Idea
  days: string[]
  who: { misses: Guest[]; unknown: Guest[] } | null
  onChange: (id: number, changes: Partial<Idea>) => void
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{idea.title}</p>
      <p className="text-xs text-muted-foreground">
        Added by {idea.addedBy}.{idea.note && ` ${idea.note}`}
      </p>
      <div className="flex gap-2">
        <Select
          value={idea.day === null ? "none" : String(idea.day)}
          onValueChange={(v) => onChange(idea.id, { day: v === "none" ? null : Number(v) })}
        >
          <SelectTrigger size="sm" className="flex-1" aria-label={`Day for ${idea.title}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No day</SelectItem>
            {days.map((d, i) => (
              <SelectItem key={d} value={String(i)}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={idea.slot ?? ""} onValueChange={(v) => onChange(idea.id, { slot: v as Slot })}>
          <SelectTrigger size="sm" className="flex-1" aria-label={`Time of day for ${idea.title}`}>
            <SelectValue placeholder="Time not set" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SLOTS) as Slot[]).map((s) => (
              <SelectItem key={s} value={s}>{SLOTS[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {who && idea.slot === null && <p className="text-xs">Set a time of day to see who misses it.</p>}
      {who && idea.slot !== null && (
        <p className="text-xs">
          {who.misses.length === 0 ? "Nobody misses it." : `Misses it: ${names(who.misses)}.`}
          {who.unknown.length > 0 && <span className="text-muted-foreground"> Not known yet: {names(who.unknown)}.</span>}
        </p>
      )}
    </div>
  )
}
