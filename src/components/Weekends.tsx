import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { PEOPLE, WEEKENDS, weekendLabel, type State, type Status } from "@/data"

type Props = { state: State; me: string | null; update: (changes: Partial<State>) => void }

const LABELS: Record<Status, string> = { yes: "Yes", partial: "Partial", no: "No" }

export function Weekends({ state, me, update }: Props) {
  function setStatus(name: string, w: number, value: Status) {
    const row = [...state.status[name]]
    row[w] = value
    update({ status: { ...state.status, [name]: row } })
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Which weekend</h2>
        <p className="text-sm text-muted-foreground">
          {state.picked === null
            ? "Not decided yet. Tap a weekend to see how it works out below."
            : `The group picked ${weekendLabel(state.picked)}.`}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {WEEKENDS.map((_, w) => (
              <TableHead key={w} className={cn(w === state.preview && "text-foreground")}>{weekendLabel(w)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PEOPLE.map((p) => (
            <TableRow key={p.name} className={cn(p.name === me && "bg-accent")}>
              <TableCell className="font-medium">{p.name}</TableCell>
              {state.status[p.name].map((s, w) => (
                <TableCell key={w}>
                  {p.name === me ? (
                    <Select value={s} onValueChange={(v) => setStatus(p.name, w, v as Status)}>
                      <SelectTrigger size="sm" className="w-20" aria-label={`Your answer for ${weekendLabel(w)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(LABELS) as Status[]).map((k) => (
                          <SelectItem key={k} value={k}>{LABELS[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={s === "yes" ? "secondary" : s === "no" ? "destructive" : "outline"}>{LABELS[s]}</Badge>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-3 gap-2">
        {WEEKENDS.map((_, w) => {
          const coming = PEOPLE.filter((p) => state.status[p.name][w] !== "no").length
          return (
            <Button
              key={w}
              variant={w === state.preview ? "default" : "outline"}
              className="h-auto flex-col gap-0 py-2"
              onClick={() => update({ preview: w })}
            >
              <span>{weekendLabel(w)}</span>
              <span className="text-xs font-normal">{coming} of 6 can come</span>
            </Button>
          )
        })}
      </div>

      {state.picked === state.preview ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>{weekendLabel(state.preview)} is the group's pick.</span>
          <Button variant="ghost" size="sm" onClick={() => update({ picked: null })}>Undo pick</Button>
        </div>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => update({ picked: state.preview })}>
          Pick {weekendLabel(state.preview)} for the group
        </Button>
      )}
    </section>
  )
}
