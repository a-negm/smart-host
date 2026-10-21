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
  type Guest,
  type Idea,
  weekendLabel,
  type State,
} from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

function partialNote(g: Guest, day: number) {
  if (g.arrive > day * 1440) return `from ${clock(g.arrive)}`
  if (g.leave < (day + 1) * 1440) return g.atCheckout ? "until checkout" : `until ${clock(g.leave)}`
  return null
}

export function Days({ state, me, update }: Props) {
  const [title, setTitle] = useState("")
  const guests = guestsFor(state)
  const days = dayLabels(state.preview)
  const unplanned = state.ideas.filter((idea) => idea.day === null)

  // People who said no to this weekend miss everything.
  function whoMisses(idea: Idea) {
    return PEOPLE.filter((p) => {
      const g = guests.find((g) => g.name === p.name)
      return !g || missesIdea(g, idea)
    }).map((p) => p.name)
  }

  function moveIdea(id: number, day: number | null) {
    update({ ideas: state.ideas.map((i) => (i.id === id ? { ...i, day } : i)) })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Plan each day</h2>
        {state.picked !== state.preview && (
          <p className="text-sm text-muted-foreground">{weekendLabel(state.preview)}, not picked yet.</p>
        )}
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
              {absent.length === 0 ? "Everyone is here." : `Not here: ${absent.map((p) => p.name).join(", ")}`}
            </p>
            {state.ideas
              .filter((idea) => idea.day === day)
              .map((idea) => (
                <IdeaRow key={idea.id} idea={idea} days={days} misses={whoMisses(idea)} onMove={moveIdea} />
              ))}
          </div>
        )
      })}

      <div className="space-y-3">
        <h3 className="font-medium">Not planned yet</h3>
        {unplanned.length === 0 && <p className="text-sm text-muted-foreground">Every idea has a day.</p>}
        {unplanned.map((idea) => (
          <IdeaRow key={idea.id} idea={idea} days={days} misses={null} onMove={moveIdea} />
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim() || !me) return
            const idea: Idea = { id: Date.now(), title: title.trim(), addedBy: me, note: "", day: null, slot: "any" }
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
  misses,
  onMove,
}: {
  idea: Idea
  days: string[]
  misses: string[] | null
  onMove: (id: number, day: number | null) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-medium">{idea.title}</span>
        <Select
          value={idea.day === null ? "none" : String(idea.day)}
          onValueChange={(v) => onMove(idea.id, v === "none" ? null : Number(v))}
        >
          <SelectTrigger size="sm" className="w-24" aria-label={`Day for ${idea.title}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No day</SelectItem>
            {days.map((d, i) => (
              <SelectItem key={d} value={String(i)}>{d.slice(0, 3)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {SLOTS[idea.slot].label}. Added by {idea.addedBy}.{idea.note && ` ${idea.note}`}
      </p>
      {misses && (
        <p className="text-xs">{misses.length === 0 ? "Nobody misses it." : `Misses it: ${misses.join(", ")}`}</p>
      )}
    </div>
  )
}
