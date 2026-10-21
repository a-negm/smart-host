// Times are minutes counted from Friday 00:00 of the chosen weekend (Sat 14:00 = 1440 + 840).

export type Status = "yes" | "no" | "partial"
export type SplitRule = "equal" | "nights"
export type Flight = "late" | "early"
export type Slot = "morning" | "afternoon" | "evening" | "full"
export type Vote = "yes" | "no"

// Anyone proposes a group choice; it only counts once the organiser confirms it.
export type Proposal<T> = { value: T; by: string; confirmed: boolean }

// null = not set yet. leave "checkout" = staying until Monday checkout.
export type Stay = { arrive: number | null; leave: number | "checkout" | null }
export type Guest = { name: string; arrive: number | null; leave: number | null; atCheckout: boolean; earliest: number }
export type Idea = { id: number; title: string; addedBy: string; note: string; day: number | null; slot: Slot | null }
export type Decision = {
  id: number
  title: string
  owner: string
  done: boolean
  detail?: string
  votes?: { voters: string[]; answers: Record<string, Vote> }
  // Linked decisions are settled by a control elsewhere on the page, not by ticking them.
  link?: "weekend" | "split" | "checkin" | "flight"
}

export type State = {
  v: 2
  preview: number
  weekend: Proposal<number> | null
  split: Proposal<SplitRule> | null
  status: Record<string, Status[]>
  stays: Record<string, Stay>[]
  travel: Record<string, number | null>
  apartment: number
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

export const DAY = 1440
export const WEEKENDS = [6, 13, 20] // Friday's date in November
export const NIGHTS = 3
export const CHECK_IN_OPENS = 15 * 60
export const CHECK_IN_CLOSES = 22 * 60
export const TRIP_END = 3 * DAY + 18 * 60 // latest allowed departure, Mon 18:00
export const CHECKOUT = 3 * DAY + 11 * 60 // Mon 11:00, not confirmed
export const CHECKOUT_DECISION = 8
export const TRANSFER = 45 // airport to Alfama, minutes

export const FLIGHTS: Record<Flight, { lands: number; extra: number; label: string }> = {
  late: { lands: 22 * 60 + 45, extra: 0, label: "Lands 22:45" },
  early: { lands: 21 * 60 + 5, extra: 50, label: "Lands 21:05, €50 more" },
}

// Earliest possible arrival per weekend, known even before someone sets their time.
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

export function checkoutConfirmed(state: State) {
  return state.decisions.find((d) => d.id === CHECKOUT_DECISION)?.done ?? false
}

export function checkoutLabel(state: State) {
  return checkoutConfirmed(state) ? "Mon checkout 11:00" : "Mon checkout (11:00, not confirmed)"
}

export function initialState(): State {
  const stays = WEEKENDS.map(() =>
    Object.fromEntries(PEOPLE.map((p) => [p.name, { arrive: null, leave: null } as Stay]))
  )

  return {
    v: 2,
    preview: 1,
    weekend: null,
    split: null,
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
    apartment: 900,
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
      { id: 2, title: "How to split the apartment", owner: "Lina", done: false, link: "split" },
      { id: 3, title: "Who checks in on Friday", owner: "Lina", done: false, link: "checkin" },
      { id: 4, title: "Tomás's flight", owner: "Tomás", done: false, link: "flight" },
      {
        id: 5,
        title: "Does Jonas pay for 2 nights?",
        owner: "Jonas",
        done: false,
        votes: {
          voters: ["Lina", "Sara", "Malik", "Chloé", "Tomás"],
          answers: { Lina: "yes", Malik: "yes", Sara: "yes" },
        },
      },
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
    const stay = state.stays[state.preview][p.name]
    const leave = stay.leave === "checkout" ? CHECKOUT : stay.leave
    const earliest = EARLIEST[state.preview]?.[p.name]?.at ?? 0
    return { name: p.name, arrive: stay.arrive, leave, atCheckout: stay.leave === "checkout", earliest }
  })
}

export function hasTimes(g: Guest): g is Guest & { arrive: number; leave: number } {
  return g.arrive !== null && g.leave !== null
}

// Only people with a set arrival by 22:00 on Friday count.
export function checkInOptions(state: State) {
  return guestsFor(state).filter((g) => g.arrive !== null && g.arrive <= CHECK_IN_CLOSES)
}

// The chosen person only counts if they can still make it for the previewed weekend.
export function checkInPerson(state: State) {
  return checkInOptions(state).find((g) => g.name === state.checkIn)?.name ?? null
}

// Someone stays night n if they are in the apartment at midnight after day n.
// Missing times count as staying the whole trip, so the split still adds up.
export function staysNight(g: Guest, night: number) {
  const midnight = (night + 1) * DAY
  return (g.arrive ?? 0) < midnight && (g.leave ?? CHECKOUT) > midnight
}

// true / false, or null when we can't tell because times aren't set.
// Without an arrival we still know they're absent before their earliest possible arrival.
export function isPresentOnDay(g: Guest, day: number) {
  if (g.arrive === null && g.earliest >= (day + 1) * DAY) return false
  if (!hasTimes(g)) return null
  return g.arrive < (day + 1) * DAY && g.leave > day * DAY
}

export function missesIdea(g: Guest, idea: Idea) {
  if (idea.day === null || idea.slot === null) return null
  const from = idea.day * DAY + SLOTS[idea.slot].from
  const to = idea.day * DAY + SLOTS[idea.slot].to
  if (g.arrive === null && g.earliest > from) return true
  if (!hasTimes(g)) return null
  return g.arrive > from || g.leave < to
}

export function flightExtra(state: State, name: string) {
  return name === "Tomás" && state.preview === 1 && state.flight ? FLIGHTS[state.flight].extra : 0
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
