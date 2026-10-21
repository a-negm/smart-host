import { useState } from "react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CHECK_IN_CLOSES,
  DAY,
  EARLIEST,
  FLIGHTS,
  LATEST_LEAVE,
  ORGANISER,
  PEOPLE,
  SHORT_DAYS,
  TRANSFER,
  checkInOptions,
  checkInPerson,
  checkoutLabel,
  clock,
  formatTime,
  guestsFor,
  nightNames,
  weekendLabel,
  type Flight,
  type Guest,
  type Stay,
  type State,
} from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

// The strip runs Fri 12:00 to Mon 18:00 in 3-hour blocks.
const BLOCKS = Array.from({ length: 26 }, (_, i) => 720 + i * 180)

// Shows whether someone is there during a block: yes, no, or maybe (time on that day not set).
function blockState(g: Guest, start: number) {
  const day = Math.floor(start / DAY)
  if (day < g.from || day > g.to) return "no"
  if (day === g.from) return g.arrive === null ? "maybe" : g.arrive < start + 180 ? "yes" : "no"
  if (day === g.to) return g.leave === null ? "maybe" : g.leave > start ? "yes" : "no"
  return "yes"
}

const LOCKED = `Locked. ${ORGANISER} can reopen it under Still to decide.`

export function Availability({ state, me, update }: Props) {
  const guests = guestsFor(state)
  const options = checkInOptions(state)
  const checkIn = checkInPerson(state)
  const mine = guests.find((g) => g.name === me)
  const tomasComing = state.preview === 1 && guests.some((g) => g.name === "Tomás")
  const notSet = guests.filter((g) => g.from === 0 && g.arrive === null).map((g) => g.name)

  function saveStay(name: string, stay: Stay) {
    const stays = [...state.stays]
    stays[state.preview] = { ...stays[state.preview], [name]: stay }
    update({ stays })
  }

  function chooseFlight(flight: Flight) {
    const stays = [...state.stays]
    stays[1] = { ...stays[1], Tomás: { ...stays[1].Tomás, arrive: FLIGHTS[flight].lands + TRANSFER } }
    update({ flight, stays })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Who's there when</h2>
        <p className="text-sm text-muted-foreground">
          {weekendLabel(state.preview)}. Check-in Fri 15:00 to 22:00. {checkoutLabel(state)}.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex pl-16 text-xs text-muted-foreground">
          <span className="w-[15.4%]">Fri</span>
          <span className="w-[30.8%]">Sat</span>
          <span className="w-[30.8%]">Sun</span>
          <span>Mon</span>
        </div>
        {PEOPLE.map((p) => {
          const g = guests.find((g) => g.name === p.name)
          return (
            <div key={p.name} className="flex items-center gap-2">
              <span className={cn("w-14 shrink-0 truncate text-sm", p.name === me && "font-semibold")}>{p.name}</span>
              {g ? (
                <div className={cn("flex h-6 flex-1 gap-px rounded-sm p-0.5", p.name === me && "bg-accent")}>
                  {BLOCKS.map((start) => {
                    const s = blockState(g, start)
                    return (
                      <div
                        key={start}
                        className={cn(
                          "flex-1 rounded-xs",
                          s === "yes" ? "bg-primary" : s === "maybe" ? "bg-primary/35" : "bg-muted",
                          start % DAY === 0 && "ml-1"
                        )}
                      />
                    )
                  })}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Can't come</span>
              )}
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground">Lighter blocks: there that day, time not set.</p>
      </div>

      <ul className="space-y-1 text-sm">
        {guests.map((g) => (
          <li key={g.name}>
            <span className="font-medium">{g.name}</span>{" "}
            <span className="text-muted-foreground">
              nights {nightNames(g)}. Arrives {g.arrive === null ? `${SHORT_DAYS[g.from]}, time not set` : formatTime(g.arrive)}.
              Leaves{" "}
              {g.atCheckout ? checkoutLabel(state) : g.leave === null ? `${SHORT_DAYS[g.to]}, time not set` : formatTime(g.leave)}.
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Label>Who checks in on Friday</Label>
        {options.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>Nobody with a set arrival gets there by 22:00 on Friday, so nobody can check in yet.</AlertDescription>
          </Alert>
        ) : (
          <Select value={checkIn ?? ""} disabled={checkIn !== null} onValueChange={(name) => update({ checkIn: name })}>
            <SelectTrigger className="w-full" aria-label="Who checks in on Friday">
              <SelectValue placeholder="Not decided" />
            </SelectTrigger>
            <SelectContent>
              {options.map((g) => (
                <SelectItem key={g.name} value={g.name}>{g.name}, arrives {clock(g.arrive!)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {checkIn && <p className="text-xs text-muted-foreground">{LOCKED}</p>}
        {notSet.length > 0 && (
          <p className="text-xs text-muted-foreground">Not counted until they set an arrival time: {notSet.join(", ")}.</p>
        )}
      </div>

      {tomasComing && (
        <div className="space-y-2">
          <Label>Tomás's flight on the 13th</Label>
          <RadioGroup
            value={state.flight ?? ""}
            onValueChange={(v) => chooseFlight(v as Flight)}
            disabled={me !== "Tomás" || state.flight !== null}
          >
            {(Object.keys(FLIGHTS) as Flight[]).map((f) => (
              <div key={f} className="flex items-center gap-2">
                <RadioGroupItem value={f} id={`flight-${f}`} />
                <Label htmlFor={`flight-${f}`} className="font-normal">
                  {FLIGHTS[f].label}, at the apartment {clock(FLIGHTS[f].lands + TRANSFER)}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            {state.flight === null ? "Only Tomás can choose." : LOCKED} Includes {TRANSFER} minutes from the airport.
          </p>
        </div>
      )}

      {mine ? (
        <StayEditor
          key={`${state.preview}-${mine.name}-${JSON.stringify(state.stays[state.preview][mine.name])}`}
          stay={state.stays[state.preview][mine.name]}
          earliest={EARLIEST[state.preview]?.[mine.name]}
          checkout={checkoutLabel(state)}
          onSave={(stay) => saveStay(mine.name, stay)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {me ? "You can't come this weekend." : "Pick your name at the top to set your dates."}
        </p>
      )}
    </section>
  )
}

const TIMES = Array.from({ length: 96 }, (_, i) => i * 15)

// Edits a draft and only saves it when it makes sense.
function StayEditor({
  stay,
  earliest,
  checkout,
  onSave,
}: {
  stay: Stay
  earliest?: { at: number; why: string }
  checkout: string
  onSave: (stay: Stay) => void
}) {
  const [draft, setDraft] = useState(stay)
  const set = (changes: Partial<Stay>) => setDraft({ ...draft, ...changes })

  let error = ""
  if (draft.to <= draft.from) error = "Leaving has to be after arriving."
  else if (earliest && draft.from * DAY + (draft.arrive ?? DAY - 1) < earliest.at)
    error = `The earliest you can arrive is ${formatTime(earliest.at)}.`
  else if (draft.to === 3 && typeof draft.leave === "number" && draft.leave > LATEST_LEAVE) error = "Leave by Mon 18:00."

  const changed = JSON.stringify(draft) !== JSON.stringify(stay)

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Your dates</p>
      {earliest && (
        <p className="text-xs text-muted-foreground">Earliest arrival {formatTime(earliest.at)}, {earliest.why}.</p>
      )}
      <DayTime
        label="Arrive"
        days={[0, 1, 2]}
        day={draft.from}
        time={draft.arrive}
        onDay={(from) => set({ from })}
        onTime={(arrive) => set({ arrive: arrive as number | null })}
      />
      <DayTime
        label="Leave"
        days={[1, 2, 3]}
        day={draft.to}
        time={draft.leave}
        withCheckout={draft.to === 3}
        onDay={(to) => set({ to, leave: to !== 3 && draft.leave === "checkout" ? null : draft.leave })}
        onTime={(leave) => set({ leave })}
      />
      <p className="text-xs text-muted-foreground">
        {draft.to > draft.from && `Nights: ${nightNames(draft)}. `}
        {draft.leave === "checkout" && checkout}
      </p>
      {draft.from === 0 && draft.arrive !== null && draft.arrive > CHECK_IN_CLOSES && (
        <p className="text-xs text-muted-foreground">After 22:00 someone else has to check in.</p>
      )}
      {error && <p className="text-sm text-destructive">{error} Not saved.</p>}
      <Button className="w-full" disabled={!changed || error !== ""} onClick={() => onSave(draft)}>
        Save my dates
      </Button>
    </div>
  )
}

function DayTime({
  label,
  days,
  day,
  time,
  withCheckout = false,
  onDay,
  onTime,
}: {
  label: string
  days: number[]
  day: number
  time: number | "checkout" | null
  withCheckout?: boolean
  onDay: (day: number) => void
  onTime: (time: number | "checkout" | null) => void
}) {
  // Flight times like 21:50 aren't on the 15-minute grid, so keep them selectable.
  const times = typeof time !== "number" || TIMES.includes(time) ? TIMES : [...TIMES, time].sort((a, b) => a - b)

  return (
    <div className="flex items-center gap-2">
      <Label className="w-14">{label}</Label>
      <Select value={String(day)} onValueChange={(d) => onDay(Number(d))}>
        <SelectTrigger className="flex-1" aria-label={`${label} day`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={String(d)}>{SHORT_DAYS[d]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={time === null ? "unset" : String(time)}
        onValueChange={(t) => onTime(t === "unset" ? null : t === "checkout" ? "checkout" : Number(t))}
      >
        <SelectTrigger className="w-32" aria-label={`${label} time`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">Time not set</SelectItem>
          {withCheckout && <SelectItem value="checkout">At checkout</SelectItem>}
          {times.map((t) => (
            <SelectItem key={t} value={String(t)}>{clock(t)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

