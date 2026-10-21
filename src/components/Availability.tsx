import { useState } from "react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CHECK_IN_OPENS,
  CHECKOUT,
  DAY,
  EARLIEST,
  FLIGHTS,
  PEOPLE,
  TRANSFER,
  TRIP_END,
  checkInOptions,
  checkInPerson,
  checkoutLabel,
  clock,
  dayLabels,
  formatTime,
  guestsFor,
  hasTimes,
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
  const notSet = guests.filter((g) => g.arrive === null).map((g) => g.name)

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
              {g && hasTimes(g) ? (
                <div className={cn("flex h-6 flex-1 gap-px rounded-sm p-0.5", p.name === me && "bg-accent")}>
                  {BLOCKS.map((start) => (
                    <div
                      key={start}
                      className={cn(
                        "flex-1 rounded-xs",
                        g.arrive < start + 180 && g.leave > start ? "bg-primary" : "bg-muted",
                        start % DAY === 0 && "ml-1"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">{g ? "Times not set" : "Not coming"}</span>
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
              arrives {g.arrive === null ? "not set" : formatTime(g.arrive)}, leaves{" "}
              {g.leave === null ? "not set" : g.atCheckout ? checkoutLabel(state) : formatTime(g.leave)}
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
          <Select value={checkIn ?? ""} onValueChange={(name) => update({ checkIn: name })}>
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
        {notSet.length > 0 && (
          <p className="text-xs text-muted-foreground">Not counted until they set an arrival: {notSet.join(", ")}.</p>
        )}
      </div>

      {tomasComing && (
        <div className="space-y-2">
          <Label>Tomás's flight on the 13th</Label>
          <RadioGroup value={state.flight ?? ""} onValueChange={(v) => chooseFlight(v as Flight)} disabled={me !== "Tomás"}>
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
            {state.flight === null ? "Tomás hasn't chosen yet. Only Tomás can choose." : "Tomás has chosen."} Includes{" "}
            {TRANSFER} minutes from the airport.
          </p>
        </div>
      )}

      {mine ? (
        <StayEditor
          key={`${state.preview}-${mine.name}-${mine.arrive}-${mine.leave}-${mine.atCheckout}`}
          days={dayLabels(state.preview)}
          stay={state.stays[state.preview][mine.name]}
          earliest={EARLIEST[state.preview]?.[mine.name]}
          checkout={checkoutLabel(state)}
          onSave={(stay) => saveStay(mine.name, stay)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {me ? "You said no to this weekend." : "Pick your name at the top to set your dates."}
        </p>
      )}
    </section>
  )
}

const TIMES = Array.from({ length: 96 }, (_, i) => i * 15)

// Edits a draft and only saves it when the times make sense.
function StayEditor({
  days,
  stay,
  earliest,
  checkout,
  onSave,
}: {
  days: string[]
  stay: Stay
  earliest?: { at: number; why: string }
  checkout: string
  onSave: (stay: Stay) => void
}) {
  const [arrive, setArrive] = useState(stay.arrive)
  const [leave, setLeave] = useState(stay.leave)
  const leaveAt = leave === "checkout" ? CHECKOUT : leave
  const from = earliest?.at ?? 0

  let error = ""
  if (arrive !== null && arrive < from) error = `The earliest you can arrive is ${formatTime(from)}.`
  else if (leaveAt !== null && leaveAt > TRIP_END) error = "Leave by Mon 18:00."
  else if (arrive !== null && leaveAt !== null && leaveAt <= arrive) error = "Leaving has to be after arriving."

  const changed = arrive !== stay.arrive || leave !== stay.leave
  const leaveMode = leave === null ? "unset" : leave === "checkout" ? "checkout" : "time"

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Your dates</p>
      {earliest && (
        <p className="text-xs text-muted-foreground">
          Earliest arrival {formatTime(earliest.at)}, {earliest.why}.
        </p>
      )}
      <TimePicker label="Arrive" days={days} value={arrive} onChange={setArrive} />
      <div className="flex items-center gap-2">
        <Label className="w-14">Leave</Label>
        <Select
          value={leaveMode}
          onValueChange={(m) => setLeave(m === "unset" ? null : m === "checkout" ? "checkout" : CHECKOUT)}
        >
          <SelectTrigger className="flex-1" aria-label="When you leave">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Not set</SelectItem>
            <SelectItem value="checkout">At checkout</SelectItem>
            <SelectItem value="time">Pick a time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {leave === "checkout" && <p className="text-xs text-muted-foreground">{checkout}</p>}
      {typeof leave === "number" && <TimePicker label="" days={days} value={leave} onChange={setLeave} />}
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
  value: number | null
  onChange: (v: number) => void
}) {
  const day = value === null ? null : Math.floor(value / DAY)
  const time = value === null ? null : value % DAY
  // Flight times like 21:50 aren't on the 15-minute grid, so keep them selectable.
  const times = time === null || TIMES.includes(time) ? TIMES : [...TIMES, time].sort((a, b) => a - b)

  return (
    <div className="flex items-center gap-2">
      <Label className="w-14">{label}</Label>
      <Select
        value={day === null ? "" : String(day)}
        onValueChange={(d) => onChange(Number(d) * DAY + (time ?? (d === "0" ? CHECK_IN_OPENS : 12 * 60)))}
      >
        <SelectTrigger className="flex-1" aria-label={`${label || "Leave"} day`}>
          <SelectValue placeholder="Not set" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d, i) => (
            <SelectItem key={d} value={String(i)}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={time === null ? "" : String(time)} onValueChange={(t) => onChange((day ?? 0) * DAY + Number(t))}>
        <SelectTrigger className="w-24" aria-label={`${label || "Leave"} time`}>
          <SelectValue placeholder="--:--" />
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
