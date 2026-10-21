import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { NIGHTS, PEOPLE, euros, guestsFor, splitByNights, splitEqual, staysNight, type SplitRule, type State } from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

const RULES: Record<SplitRule, string> = { equal: "Equal", nights: "By nights stayed" }

export function Costs({ state, me, update }: Props) {
  const guests = guestsFor(state)
  const equal = splitEqual(guests, state.apartment)
  const byNights = splitByNights(guests, state.apartment)
  const sum = (shares: number[]) => shares.reduce((a, b) => a + b, 0)
  const notComing = PEOPLE.filter((p) => !guests.some((g) => g.name === p.name))
  const rule = state.split

  const warnings = guests.flatMap((g, i) => {
    const travel = state.travel[g.name]
    if (travel === null) return []
    const budget = PEOPLE.find((p) => p.name === g.name)!.budget
    if (rule) {
      const total = (rule === "equal" ? equal[i] : byNights[i]) + travel
      return total > budget ? [`${g.name} is ${euros(total - budget)} over their ${euros(budget)} budget.`] : []
    }
    const overEqual = equal[i] + travel > budget
    const overNights = byNights[i] + travel > budget
    if (!overEqual && !overNights) return []
    const which = overEqual && overNights ? "either split" : overEqual ? "an equal split" : "a by-nights split"
    return [`${g.name} goes over their ${euros(budget)} budget with ${which}.`]
  })

  function setTravel(name: string, value: string) {
    update({ travel: { ...state.travel, [name]: value === "" ? null : Number(value) } })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">What each person pays</h2>
        <p className="text-sm text-muted-foreground">Each person enters their own travel cost.</p>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="apartment" className="flex-1">Apartment, {NIGHTS} nights</Label>
        <Input
          id="apartment"
          type="number"
          min={0}
          className="w-28"
          value={state.apartment}
          onChange={(e) => update({ apartment: Number(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label>How the group splits it</Label>
        <RadioGroup
          value={rule ?? "undecided"}
          onValueChange={(v) => update({ split: v === "undecided" ? null : (v as SplitRule) })}
        >
          {[["undecided", "Not decided, show both"], ...Object.entries(RULES)].map(([value, label]) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`split-${value}`} />
              <Label htmlFor={`split-${value}`} className="font-normal">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Nights</TableHead>
            {rule !== "nights" && <TableHead className="text-right">Equal</TableHead>}
            {rule !== "equal" && <TableHead className="text-right">By nights</TableHead>}
            <TableHead className="text-right">Travel</TableHead>
            {rule && <TableHead className="text-right">Total</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((g, i) => {
            const travel = state.travel[g.name]
            const share = rule === "equal" ? equal[i] : byNights[i]
            return (
              <TableRow key={g.name} className={cn(g.name === me && "bg-accent")}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="text-right">{[0, 1, 2].filter((n) => staysNight(g, n)).length}</TableCell>
                {rule !== "nights" && <TableCell className="text-right">{euros(equal[i])}</TableCell>}
                {rule !== "equal" && <TableCell className="text-right">{euros(byNights[i])}</TableCell>}
                <TableCell className="text-right">
                  {g.name === me ? (
                    <Input
                      type="number"
                      min={0}
                      placeholder="€"
                      aria-label="Your travel cost"
                      className="ml-auto h-7 w-16 text-right"
                      value={travel ?? ""}
                      onChange={(e) => setTravel(g.name, e.target.value)}
                    />
                  ) : travel === null ? (
                    <span className="text-muted-foreground">Not yet</span>
                  ) : (
                    euros(travel)
                  )}
                </TableCell>
                {rule && (
                  <TableCell className="text-right font-medium">
                    {travel === null ? <span className="text-muted-foreground">?</span> : euros(share + travel)}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Apartment</TableCell>
            {rule !== "nights" && <TableCell className="text-right">{euros(sum(equal))}</TableCell>}
            {rule !== "equal" && <TableCell className="text-right">{euros(sum(byNights))}</TableCell>}
            <TableCell colSpan={rule ? 2 : 1} />
          </TableRow>
        </TableFooter>
      </Table>

      {notComing.length > 0 && (
        <p className="text-sm text-muted-foreground">Not coming, so not paying: {notComing.map((p) => p.name).join(", ")}.</p>
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
