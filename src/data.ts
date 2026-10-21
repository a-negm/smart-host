// Times are minutes counted from Friday 00:00 of the chosen weekend (Sat 14:00 = 1440 + 840).

export type Status = "yes" | "no" | "partial"
export type SplitRule = "equal" | "nights"
export type Flight = "late" | "early"
export type Slot = "full" | "evening" | "any"

export type Stay = { arrive: number; leave: number | null } // leave null = at checkout
export type Guest = { name: string; arrive: number; leave: number; atCheckout: boolean }
export type Idea = { id: number; title: string; addedBy: string; note: string; day: number | null; slot: Slot }
export type Decision = {
  id: number
  title: string
  owner: string
  done: boolean
  detail?: string
  // Linked decisions are settled by a control elsewhere on the page, not by ticking them.
  link?: "weekend" | "split" | "checkin" | "flight"
}

export type State = {
  v: 1
  preview: number
  picked: number | null
  status: Record<string, Status[]>
  stays: Record<string, Stay>[]
  travel: Record<string, number | null>
  apartment: number
  split: SplitRule | null
  checkIn: string | null
  flight: Flight | null
  ideas: Idea[]
  decisions: Decision[]
}

export const PEOPLE = [
  { name: "Lina", city: "Berlin", budget: 450 },
  { name: "Jonas", city: "Berlin", budget: 400 },
  { name: "Sara", city: "Amsterdam", budget: 320 },
  { name: "Malik", city: "Paris", budget: 500 },
  { name: "Chloé", city: "Paris", budget: 380 },
  { name: "Tomás", city: "Madrid", budget: 350 },
]

const DAY = 1440
export const WEEKENDS = [6, 13, 20] // Friday's date in November
export const NIGHTS = 3
export const CHECK_IN_OPENS = 15 * 60
export const CHECK_IN_CLOSES = 22 * 60
export const TRIP_END = 3 * DAY + 18 * 60 // latest allowed departure, Mon 18:00
export const CHECKOUT_PLACEHOLDER = 3 * DAY + 11 * 60 // checkout time is unknown, 11:00 used for maths
export const FLIGHTS: Record<Flight, { lands: number; label: string }> = {
  late: { lands: 22 * 60 + 45, label: "Lands 22:45" },
  early: { lands: 21 * 60 + 5, label: "Lands 21:05, €50 more" },
}
export const SLOTS: Record<Slot, { label: string; from: number; to: number }> = {
  full: { label: "Full day", from: 9 * 60, to: 19 * 60 },
  evening: { label: "Evening", from: 20 * 60, to: 24 * 60 },
  any: { label: "Any time", from: 0, to: DAY },
}

const SHORT_DAYS = ["Fri", "Sat", "Sun", "Mon"]

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

export function initialState(): State {
  const status: State["status"] = {
    Lina: ["yes", "yes", "yes"],
    Jonas: ["no", "partial", "yes"],
    Sara: ["yes", "yes", "yes"],
    Malik: ["no", "yes", "yes"],
    Chloé: ["yes", "yes", "no"],
    Tomás: ["yes", "yes", "yes"],
  }
  const stays = WEEKENDS.map(() =>
    Object.fromEntries(PEOPLE.map((p) => [p.name, { arrive: CHECK_IN_OPENS, leave: null }]))
  )
  stays[1].Jonas = { arrive: DAY + 12 * 60, leave: null } // on call until Sat 12:00
  stays[1].Tomás = { arrive: FLIGHTS.late.lands, leave: null }

  return {
    v: 1,
    preview: 1,
    picked: null,
    status,
    stays,
    travel: Object.fromEntries(PEOPLE.map((p) => [p.name, null])),
    apartment: 900,
    split: null,
    checkIn: null,
    flight: null,
    ideas: [
      { id: 1, title: "Sintra day trip", addedBy: "Malik", note: "Full day, train about €5", day: null, slot: "full" },
      { id: 2, title: "Pastéis de Belém", addedBy: "Chloé", note: "", day: null, slot: "any" },
      { id: 3, title: "Free walking tour", addedBy: "Sara", note: "Friday?", day: 0, slot: "any" },
      { id: 4, title: "Fado", addedBy: "Tomás", note: "Saturday night", day: 1, slot: "evening" },
    ],
    decisions: [
      { id: 1, title: "Which weekend", owner: "Lina", done: false, link: "weekend" },
      { id: 2, title: "How to split the apartment", owner: "Lina", done: false, link: "split" },
      { id: 3, title: "Who checks in on Friday", owner: "Lina", done: false, link: "checkin" },
      { id: 4, title: "Tomás's flight", owner: "Tomás", done: false, link: "flight" },
      {
        id: 5,
        title: "Does Jonas pay for 2 nights?",
        owner: "Lina",
        done: false,
        detail: "Agreed: Lina, Malik, Sara. No answer yet: Chloé, Tomás.",
      },
      { id: 6, title: "Fado on Saturday night", owner: "Tomás", done: false },
      { id: 7, title: "Which day for Sintra", owner: "Malik", done: false },
      { id: 8, title: "Checkout time on Monday", owner: "Lina", done: false, detail: "Not known yet." },
    ],
  }
}

export function isComing(state: State, name: string) {
  return state.status[name][state.preview] !== "no"
}

export function guestsFor(state: State): Guest[] {
  return PEOPLE.filter((p) => isComing(state, p.name)).map((p) => {
    const stay = state.stays[state.preview][p.name]
    return { name: p.name, arrive: stay.arrive, leave: stay.leave ?? CHECKOUT_PLACEHOLDER, atCheckout: stay.leave === null }
  })
}

export function checkInOptions(state: State) {
  return guestsFor(state).filter((g) => g.arrive <= CHECK_IN_CLOSES)
}

// The chosen person only counts if they can still make it for the previewed weekend.
export function checkInPerson(state: State) {
  return checkInOptions(state).find((g) => g.name === state.checkIn)?.name ?? null
}

// Someone stays night n if they are in the apartment at midnight after day n.
export function staysNight(g: Guest, night: number) {
  const midnight = (night + 1) * DAY
  return g.arrive < midnight && g.leave > midnight
}

export function isPresentOnDay(g: Guest, day: number) {
  return g.arrive < (day + 1) * DAY && g.leave > day * DAY
}

export function missesIdea(g: Guest, idea: Idea) {
  if (idea.day === null) return false
  if (idea.slot === "any") return !isPresentOnDay(g, idea.day)
  const from = idea.day * DAY + SLOTS[idea.slot].from
  const to = idea.day * DAY + SLOTS[idea.slot].to
  return g.arrive > from || g.leave < to
}

// Shares out cents evenly between the given guests; leftover cents go to the first ones.
function shareOut(cents: number, who: number[], shares: number[]) {
  const each = Math.floor(cents / who.length)
  who.forEach((i, k) => {
    shares[i] += each + (k < cents - each * who.length ? 1 : 0)
  })
}

export function splitEqual(guests: Guest[], total: number) {
  const shares = guests.map(() => 0)
  if (guests.length > 0) shareOut(Math.round(total * 100), guests.map((_, i) => i), shares)
  return shares.map((c) => c / 100)
}

// Each night is a third of the total, shared by whoever sleeps there. Nobody there: everyone shares it.
export function splitByNights(guests: Guest[], total: number) {
  const shares = guests.map(() => 0)
  if (guests.length === 0) return shares
  const totalCents = Math.round(total * 100)
  const perNight = Math.floor(totalCents / NIGHTS)
  for (let night = 0; night < NIGHTS; night++) {
    const cents = night === NIGHTS - 1 ? totalCents - perNight * (NIGHTS - 1) : perNight
    let who = guests.map((_, i) => i).filter((i) => staysNight(guests[i], night))
    if (who.length === 0) who = guests.map((_, i) => i)
    shareOut(cents, who, shares)
  }
  return shares.map((c) => c / 100)
}

export function euros(amount: number) {
  return `€${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
}
