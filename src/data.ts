// Days are 0 = Fri, 1 = Sat, 2 = Sun, 3 = Mon. Times are minutes, either within a day or counted from Fri 00:00.

export type Status = "yes" | "no" | "partial"
export type Flight = "late" | "early"
export type Slot = "morning" | "afternoon" | "evening" | "full"

// Anyone proposes a group choice; it only counts once the organiser confirms it.
export type Proposal<T> = { value: T; by: string; confirmed: boolean }

// Nights are the days from `from` up to (not including) `to`. Times are time of day; null = not set.
export type Stay = { from: number; to: number; arrive: number | null; leave: number | "checkout" | null }

// A person coming that weekend, with times counted from Fri 00:00.
export type Guest = {
  name: string
  from: number
  to: number
  arrive: number | null
  leave: number | null
  atCheckout: boolean
  earliest: number
}
export type Idea = { id: number; title: string; addedBy: string; note: string; day: number | null; slot: Slot | null }
export type Decision = {
  id: number
  title: string
  owner: string
  done: boolean
  detail?: string
  // Linked decisions are settled by a control elsewhere on the page, not by ticking them.
  link?: "weekend" | "checkin" | "flight"
}

export type State = {
  v: 3
  preview: number
  weekend: Proposal<number> | null
  status: Record<string, Status[]>
  stays: Record<string, Stay>[]
  travel: Record<string, number | null>
  checkIn: string | null
  flight: Flight | null
  ideas: Idea[]
  decisions: Decision[]
}

export const ORGANISER = "Lina"
export const PEOPLE = [
  { name: "Lina", city: "Berlin", budget: 450 },
  { name: "Jonas", city: "Berlin", budget: 400 },
  { name: "Sara", city: "Amsterdam", budget: 320 },
  { name: "Malik", city: "Paris", budget: 500 },
  { name: "Chloé", city: "Paris", budget: 380 },
  { name: "Tomás", city: "Madrid", budget: 350 },
]

// Fixed details, not editable in the app.
export const APARTMENT = 900
export const NIGHTS = 3
export const CHECK_IN_OPENS = 15 * 60
export const CHECK_IN_CLOSES = 22 * 60

export const DAY = 1440
export const WEEKENDS = [6, 13, 20] // Friday's date in November
export const SHORT_DAYS = ["Fri", "Sat", "Sun", "Mon"]
export const CHECKOUT_TIME = 11 * 60 // not confirmed
export const LATEST_LEAVE = 18 * 60 // Mon 18:00
export const CHECKOUT_DECISION = 8
export const TRANSFER = 45 // airport to Alfama, minutes

export const FLIGHTS: Record<Flight, { lands: number; extra: number; label: string }> = {
  late: { lands: 22 * 60 + 45, extra: 0, label: "Lands 22:45" },
  early: { lands: 21 * 60 + 5, extra: 50, label: "Lands 21:05, €50 more" },
}

// Earliest possible arrival per weekend (from Fri 00:00), known even before someone sets their time.
export const EARLIEST: Record<number, Record<string, { at: number; why: string }>> = {
  1: {
    Jonas: { at: DAY + 17 * 60, why: "on call until Sat 12:00 Berlin time" },
    Tomás: { at: FLIGHTS.early.lands + TRANSFER, why: "earliest flight lands 21:05" },
  },
}

export const SLOTS: Record<Slot, { label: string; from: number; to: number }> = {
  morning: { label: "Morning", from: 9 * 60, to: 13 * 60 },
  afternoon: { label: "Afternoon", from: 13 * 60, to: 18 * 60 },
  evening: { label: "Evening", from: 20 * 60, to: 24 * 60 },
  full: { label: "Full day", from: 9 * 60, to: 19 * 60 },
}

export function weekendLabel(w: number) {
  return `${WEEKENDS[w]}–${WEEKENDS[w] + 3} Nov`
}

export function dayLabels(w: number) {
  return SHORT_DAYS.map((d, i) => `${d} ${WEEKENDS[w] + i} Nov`)
}

export function clock(min: number) {
  const m = min % DAY
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

export function formatTime(min: number) {
  return `${SHORT_DAYS[Math.floor(min / DAY)]} ${clock(min)}`
}

export function nightNames(g: { from: number; to: number }) {
  return SHORT_DAYS.slice(g.from, g.to).join(", ")
}

export function checkoutLabel(state: State) {
  const confirmed = state.decisions.find((d) => d.id === CHECKOUT_DECISION)?.done
  return confirmed ? "Mon checkout 11:00" : "Mon checkout (11:00, not confirmed)"
}

export function initialState(): State {
  const stays = WEEKENDS.map(() =>
    Object.fromEntries(PEOPLE.map((p) => [p.name, { from: 0, to: 3, arrive: null, leave: null } as Stay]))
  )
  stays[1].Jonas = { from: 1, to: 3, arrive: null, leave: null }

  return {
    v: 3,
    preview: 1,
    weekend: null,
    status: {
      Lina: ["yes", "yes", "yes"],
      Jonas: ["no", "partial", "yes"],
      Sara: ["yes", "yes", "yes"],
      Malik: ["no", "yes", "yes"],
      Chloé: ["yes", "yes", "no"],
      Tomás: ["yes", "yes", "yes"],
    },
    stays,
    travel: Object.fromEntries(PEOPLE.map((p) => [p.name, null])),
    checkIn: null,
    flight: null,
    ideas: [
      { id: 1, title: "Sintra day trip", addedBy: "Malik", note: "Train about €5", day: null, slot: "full" },
      { id: 2, title: "Pastéis de Belém", addedBy: "Chloé", note: "", day: null, slot: null },
      { id: 3, title: "Free walking tour", addedBy: "Sara", note: "Friday?", day: 0, slot: "afternoon" },
      { id: 4, title: "Fado", addedBy: "Tomás", note: "", day: 1, slot: "evening" },
    ],
    decisions: [
      { id: 1, title: "Which weekend", owner: "Lina", done: false, link: "weekend" },
      { id: 3, title: "Who checks in on Friday", owner: "Lina", done: false, link: "checkin" },
      { id: 4, title: "Tomás's flight", owner: "Tomás", done: false, link: "flight" },
      { id: 6, title: "Book fado for Saturday night", owner: "Tomás", done: false },
      { id: 7, title: "Which day for Sintra", owner: "Malik", done: false },
      { id: CHECKOUT_DECISION, title: "Checkout time on Monday", owner: "Lina", done: false, detail: "11:00 is a guess." },
    ],
  }
}

export function isComing(state: State, name: string) {
  return state.status[name][state.preview] !== "no"
}

export function guestsFor(state: State): Guest[] {
  return PEOPLE.filter((p) => isComing(state, p.name)).map((p) => {
    const s = state.stays[state.preview][p.name]
    const leaveTime = s.leave === "checkout" ? CHECKOUT_TIME : s.leave
    return {
      name: p.name,
      from: s.from,
      to: s.to,
      arrive: s.arrive === null ? null : s.from * DAY + s.arrive,
      leave: leaveTime === null ? null : s.to * DAY + leaveTime,
      atCheckout: s.leave === "checkout",
      earliest: EARLIEST[state.preview]?.[p.name]?.at ?? 0,
    }
  })
}

// Only people arriving on Friday with a set time by 22:00 count.
export function checkInOptions(state: State) {
  return guestsFor(state).filter((g) => g.from === 0 && g.arrive !== null && g.arrive <= CHECK_IN_CLOSES)
}

// The chosen person only counts if they can still make it for the previewed weekend.
export function checkInPerson(state: State) {
  return checkInOptions(state).find((g) => g.name === state.checkIn)?.name ?? null
}

// Nights decide who's there. Arrival times only matter within the arrival and departure days.
export function staysNight(g: Guest, night: number) {
  return night >= g.from && night < g.to
}

export function isPresentOnDay(g: Guest, day: number) {
  return day >= g.from && day <= g.to
}

// true / false, or null when it depends on a time that isn't set yet.
export function missesIdea(g: Guest, idea: Idea) {
  if (idea.day === null || idea.slot === null) return null
  if (!isPresentOnDay(g, idea.day)) return true
  const start = idea.day * DAY + SLOTS[idea.slot].from
  const end = idea.day * DAY + SLOTS[idea.slot].to
  if (idea.day === g.from) {
    const arrive = g.arrive ?? (g.earliest > start ? g.earliest : null)
    return arrive === null ? null : arrive > start
  }
  if (idea.day === g.to) return g.leave === null ? null : g.leave < end
  return false
}

export function flightExtra(state: State, name: string) {
  return name === "Tomás" && state.preview === 1 && state.flight ? FLIGHTS[state.flight].extra : 0
}

// Each night is a third of the total, shared evenly by whoever stays that night.
// Works in cents; leftover cents go to the first guests so shares always add up to the total.
// If nobody stays a night, everyone coming shares it.
export function splitByNights(guests: Guest[], total: number) {
  const shares = guests.map(() => 0)
  if (guests.length === 0) return shares
  const totalCents = Math.round(total * 100)
  const perNight = Math.floor(totalCents / NIGHTS)
  for (let night = 0; night < NIGHTS; night++) {
    const cents = night === NIGHTS - 1 ? totalCents - perNight * (NIGHTS - 1) : perNight
    let who = guests.map((_, i) => i).filter((i) => staysNight(guests[i], night))
    if (who.length === 0) who = guests.map((_, i) => i)
    const each = Math.floor(cents / who.length)
    who.forEach((i, k) => {
      shares[i] += each + (k < cents - each * who.length ? 1 : 0)
    })
  }
  return shares.map((c) => c / 100)
}

// What reopening a settled decision does. Only the organiser gets this option.
export function reopen(state: State, d: Decision): Partial<State> {
  if (d.link === "weekend") return { weekend: state.weekend && { ...state.weekend, confirmed: false } }
  if (d.link === "checkin") return { checkIn: null }
  if (d.link === "flight") {
    const stays = [...state.stays]
    stays[1] = { ...stays[1], Tomás: { ...stays[1].Tomás, arrive: null } }
    return { flight: null, stays }
  }
  return { decisions: state.decisions.map((x) => (x.id === d.id ? { ...x, done: false } : x)) }
}

export function euros(amount: number) {
  return `€${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
}
