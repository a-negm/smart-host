import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProposalStatus } from "@/components/ProposalStatus"
import {
  NIGHTS,
  PEOPLE,
  euros,
  flightExtra,
  guestsFor,
  hasTimes,
  splitByNights,
  splitEqual,
  staysNight,
  type SplitRule,
  type State,
} from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

const RULES: Record<SplitRule, string> = { equal: "Equal", nights: "By nights stayed" }

export function Costs({ state, me, update }: Props) {
  const guests = guestsFor(state)
  const equal = splitEqual(guests, state.apartment)
  const byNights = splitByNights(guests, state.apartment)
  const sum = (shares: number[]) => shares.reduce((a, b) => a + b, 0)
  const notComing = PEOPLE.filter((p) => !guests.some((g) => g.name === p.name))
  const noTimes = guests.filter((g) => !hasTimes(g)).map((g) => g.name)
  const rule = state.split?.confirmed ? state.split.value : null

  // Travel counts once the person has entered it, plus any extra for a chosen flight.
  const travelOf = (name: string) => {
    const travel = state.travel[name]
    return travel === null ? null : travel + flightExtra(state, name)
  }

  const warnings = guests.flatMap((g, i) => {
    const travel = travelOf(g.name)
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
          value={state.split?.value ?? ""}
          disabled={!me}
          onValueChange={(v) => me && update({ split: { value: v as SplitRule, by: me, confirmed: false } })}
        >
          {(Object.keys(RULES) as SplitRule[]).map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem value={value} id={`split-${value}`} />
              <Label htmlFor={`split-${value}`} className="font-normal">Propose {RULES[value].toLowerCase()}</Label>
            </div>
          ))}
        </RadioGroup>
        <ProposalStatus
          proposal={state.split}
          label={(v) => RULES[v]}
          me={me}
          onConfirm={() => state.split && update({ split: { ...state.split, confirmed: true } })}
        />
        {!rule && <p className="text-xs text-muted-foreground">Both splits are shown until one is confirmed.</p>}
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
            const travel = travelOf(g.name)
            const extra = flightExtra(state, g.name)
            const share = rule === "equal" ? equal[i] : byNights[i]
            return (
              <TableRow key={g.name} className={cn(g.name === me && "bg-accent")}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell className="text-right">
                  {hasTimes(g) ? [0, 1, 2].filter((n) => staysNight(g, n)).length : "?"}
                </TableCell>
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
                      value={state.travel[g.name] ?? ""}
                      onChange={(e) => setTravel(g.name, e.target.value)}
                    />
                  ) : travel === null ? (
                    <span className="text-muted-foreground">Not yet</span>
                  ) : (
                    euros(travel)
                  )}
                  {extra > 0 && <span className="block text-xs text-muted-foreground">+{euros(extra)} flight</span>}
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

      {noTimes.length > 0 && rule !== "equal" && (
        <p className="text-xs text-muted-foreground">
          No times yet for {noTimes.join(", ")}, so their by-nights share assumes all {NIGHTS} nights.
        </p>
      )}
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
