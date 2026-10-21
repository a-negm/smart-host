import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { APARTMENT, NIGHTS, PEOPLE, euros, flightExtra, guestsFor, nightNames, splitByNights, weekendLabel, type State } from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

export function Costs({ state, me, update }: Props) {
  const guests = guestsFor(state)
  const shares = splitByNights(guests, APARTMENT)
  const total = shares.reduce((a, b) => a + b, 0)
  const cantCome = PEOPLE.filter((p) => !guests.some((g) => g.name === p.name))

  // Travel counts once the person has entered it, plus any extra for a chosen flight.
  const travelOf = (name: string) => {
    const travel = state.travel[name]
    return travel === null ? null : travel + flightExtra(state, name)
  }

  const warnings = guests.flatMap((g, i) => {
    const travel = travelOf(g.name)
    if (travel === null) return []
    const budget = PEOPLE.find((p) => p.name === g.name)!.budget
    const sum = shares[i] + travel
    return sum > budget ? [`${g.name} is ${euros(sum - budget)} over their ${euros(budget)} budget.`] : []
  })

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What each person pays</h2>
        <p className="text-sm text-muted-foreground">
          The apartment is {euros(APARTMENT)} for {NIGHTS} nights, so {euros(APARTMENT / NIGHTS)} a night, split between
          whoever stays that night. Each person enters their own travel cost.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Nights</TableHead>
            <TableHead className="text-right">Stay</TableHead>
            <TableHead className="text-right">Travel</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((g, i) => {
            const travel = travelOf(g.name)
            const extra = flightExtra(state, g.name)
            return (
              <TableRow key={g.name} className={cn(g.name === me && "bg-accent")}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="whitespace-normal">{nightNames(g)}</TableCell>
                <TableCell className="text-right">{euros(shares[i])}</TableCell>
                <TableCell className="text-right">
                  {g.name === me ? (
                    <Input
                      type="number"
                      min={0}
                      placeholder="€"
                      aria-label="Your travel cost"
                      className="ml-auto h-7 w-16 text-right"
                      value={state.travel[g.name] ?? ""}
                      onChange={(e) =>
                        update({
                          travel: { ...state.travel, [g.name]: e.target.value === "" ? null : Number(e.target.value) },
                        })
                      }
                    />
                  ) : travel === null ? (
                    <span className="text-muted-foreground">Not yet</span>
                  ) : (
                    euros(travel)
                  )}
                  {extra > 0 && <span className="block text-xs text-muted-foreground">+{euros(extra)} flight</span>}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {travel === null ? <span className="text-muted-foreground">?</span> : euros(shares[i] + travel)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Apartment, {weekendLabel(state.preview)}</TableCell>
            <TableCell className="text-right">{euros(total)}</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>

      {cantCome.length > 0 && (
        <p className="text-sm text-muted-foreground">Can't come, so not paying: {cantCome.map((p) => p.name).join(", ")}.</p>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
