import { useState } from "react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CHECK_IN_OPENS,
  CHECKOUT_PLACEHOLDER,
  FLIGHTS,
  PEOPLE,
  TRIP_END,
  checkInOptions,
  checkInPerson,
  clock,
  dayLabels,
  formatTime,
  guestsFor,
  weekendLabel,
  type Flight,
  type Stay,
  type State,
} from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

// The strip runs Fri 12:00 to Mon 18:00 in 3-hour blocks.
const BLOCKS = Array.from({ length: 26 }, (_, i) => 720 + i * 180)

export function Availability({ state, me, update }: Props) {
  const guests = guestsFor(state)
  const options = checkInOptions(state)
  const checkIn = checkInPerson(state)
  const mine = guests.find((g) => g.name === me)
  const tomasComing = state.preview === 1 && guests.some((g) => g.name === "Tomás")

  function saveStay(name: string, stay: Stay) {
    const stays = [...state.stays]
    stays[state.preview] = { ...stays[state.preview], [name]: stay }
    update({ stays })
  }

  function chooseFlight(flight: Flight) {
    const stays = [...state.stays]
    stays[1] = { ...stays[1], Tomás: { ...stays[1].Tomás, arrive: FLIGHTS[flight].lands } }
    update({ flight, stays })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Who's there when</h2>
        <p className="text-sm text-muted-foreground">
          {weekendLabel(state.preview)}
          {state.picked !== state.preview && ", not picked yet"}. Check-in Fri 15:00 to 22:00. Checkout time not known yet.
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
                  {BLOCKS.map((start) => (
                    <div
                      key={start}
                      className={cn(
                        "flex-1 rounded-xs",
                        g.arrive < start + 180 && g.leave > start ? "bg-primary" : "bg-muted",
                        start % 1440 === 0 && "ml-1"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Not coming</span>
              )}
            </div>
          )
        })}
      </div>

      <ul className="space-y-1 text-sm">
        {guests.map((g) => (
          <li key={g.name}>
            <span className="font-medium">{g.name}</span>{" "}
            <span className="text-muted-foreground">
              from {formatTime(g.arrive)} until {g.atCheckout ? "Mon checkout" : formatTime(g.leave)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Label>Who checks in on Friday</Label>
        {options.length === 0 ? (
          <Alert variant="destructive">
            <AlertDescription>Nobody arrives by 22:00 on Friday, so nobody can check in.</AlertDescription>
          </Alert>
        ) : (
          <Select value={checkIn ?? ""} onValueChange={(name) => update({ checkIn: name })}>
            <SelectTrigger className="w-full" aria-label="Who checks in on Friday">
              <SelectValue placeholder="Not decided" />
            </SelectTrigger>
            <SelectContent>
              {options.map((g) => (
                <SelectItem key={g.name} value={g.name}>{g.name}, arrives {clock(g.arrive)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {tomasComing && (
        <div className="space-y-2">
          <Label>Tomás's flight on the 13th</Label>
          <RadioGroup
            value={state.flight ?? ""}
            onValueChange={(v) => chooseFlight(v as Flight)}
            disabled={me !== "Tomás"}
          >
            {(Object.keys(FLIGHTS) as Flight[]).map((f) => (
              <div key={f} className="flex items-center gap-2">
                <RadioGroupItem value={f} id={`flight-${f}`} />
                <Label htmlFor={`flight-${f}`} className="font-normal">{FLIGHTS[f].label}</Label>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            {state.flight === null ? "Tomás hasn't chosen. Only Tomás can choose." : "Tomás has chosen."} The landing time
            counts as his arrival.
          </p>
        </div>
      )}

      {mine ? (
        <StayEditor
          key={`${state.preview}-${mine.name}-${mine.arrive}-${mine.leave}-${mine.atCheckout}`}
          days={dayLabels(state.preview)}
          stay={state.stays[state.preview][mine.name]}
          onSave={(stay) => saveStay(mine.name, stay)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {me ? "You said no to this weekend." : "Pick your name at the top to change your dates."}
        </p>
      )}
    </section>
  )
}

const TIMES = Array.from({ length: 96 }, (_, i) => i * 15)

// Edits a draft and only saves it when the times make sense.
function StayEditor({ days, stay, onSave }: { days: string[]; stay: Stay; onSave: (stay: Stay) => void }) {
  const [arrive, setArrive] = useState(stay.arrive)
  const [leave, setLeave] = useState(stay.leave)
  const leaveAt = leave ?? CHECKOUT_PLACEHOLDER

  let error = ""
  if (arrive < CHECK_IN_OPENS) error = "You can arrive from Fri 15:00, when check-in opens."
  else if (leaveAt > TRIP_END) error = "Leave by Mon 18:00."
  else if (leaveAt <= arrive) error = "Leaving has to be after arriving."

  const changed = arrive !== stay.arrive || leave !== stay.leave

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Your dates</p>
      <TimePicker label="Arrive" days={days} value={arrive} onChange={setArrive} />
      <div className="flex items-center gap-2">
        <Checkbox
          id="at-checkout"
          checked={leave === null}
          onCheckedChange={(c) => setLeave(c === true ? null : CHECKOUT_PLACEHOLDER)}
        />
        <Label htmlFor="at-checkout" className="font-normal">Leave at checkout</Label>
      </div>
      {leave !== null && <TimePicker label="Leave" days={days} value={leave} onChange={setLeave} />}
      {error && <p className="text-sm text-destructive">{error} Not saved.</p>}
      <Button className="w-full" disabled={!changed || error !== ""} onClick={() => onSave({ arrive, leave })}>
        Save my dates
      </Button>
    </div>
  )
}

function TimePicker({
  label,
  days,
  value,
  onChange,
}: {
  label: string
  days: string[]
  value: number
  onChange: (v: number) => void
}) {
  const day = Math.floor(value / 1440)
  const time = value % 1440
  // Flight times like 21:05 aren't on the 15-minute grid, so keep them selectable.
  const times = TIMES.includes(time) ? TIMES : [...TIMES, time].sort((a, b) => a - b)

  return (
    <div className="flex items-center gap-2">
      <Label className="w-14">{label}</Label>
      <Select value={String(day)} onValueChange={(d) => onChange(Number(d) * 1440 + time)}>
        <SelectTrigger className="flex-1" aria-label={`${label} day`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {days.map((d, i) => (
            <SelectItem key={d} value={String(i)}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(time)} onValueChange={(t) => onChange(day * 1440 + Number(t))}>
        <SelectTrigger className="w-24" aria-label={`${label} time`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {times.map((t) => (
            <SelectItem key={t} value={String(t)}>{clock(t)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
