import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Availability } from "@/components/Availability"
import { Costs } from "@/components/Costs"
import { Days } from "@/components/Days"
import { Decisions } from "@/components/Decisions"
import { Weekends } from "@/components/Weekends"
import { PEOPLE, initialState, weekendLabel, type State } from "@/data"

// The link carries the whole plan in its hash. Without one, fall back to this browser's last copy.
function loadState(): State {
  try {
    const fromLink = JSON.parse(decodeURIComponent(location.hash.slice(1)))
    if (fromLink.v === 2) return fromLink
  } catch {
    // no or broken state in the link
  }
  try {
    const saved = JSON.parse(localStorage.getItem("trip") ?? "")
    if (saved.v === 2) return saved
  } catch {
    // nothing saved
  }
  return initialState()
}

function loadMe() {
  try {
    return localStorage.getItem("me")
  } catch {
    return null
  }
}

function App() {
  const [state, setState] = useState(loadState)
  const [me, setMe] = useState(loadMe)
  const [copied, setCopied] = useState(false)
  const picked = state.weekend?.confirmed ? state.weekend.value : null

  useEffect(() => {
    const json = JSON.stringify(state)
    history.replaceState(null, "", "#" + encodeURIComponent(json))
    try {
      localStorage.setItem("trip", json)
    } catch {
      // storage blocked, the link still has it
    }
  }, [state])

  function update(changes: Partial<State>) {
    setState((s) => ({ ...s, ...changes }))
  }

  function pickMe(name: string) {
    setMe(name)
    try {
      localStorage.setItem("me", name)
    } catch {
      // fine, you just pick again next time
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(location.href).then(() => setCopied(true))
  }

  return (
    <main className="mx-auto max-w-md space-y-8 px-4 pb-6">
      {picked !== state.preview && (
        <div className="sticky top-0 z-10 -mx-4 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Preview of {weekendLabel(state.preview)}, not picked
        </div>
      )}

      <header className="space-y-3 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Lisbon, Alfama apartment</h1>
        <p className="text-sm text-muted-foreground">
          {picked === null ? "Weekend not picked yet." : `${weekendLabel(picked)}, three nights.`}
        </p>
        <div className="flex gap-2">
          <Select value={me ?? ""} onValueChange={pickMe}>
            <SelectTrigger className="flex-1" aria-label="Your name">
              <SelectValue placeholder="Who are you?" />
            </SelectTrigger>
            <SelectContent>
              {PEOPLE.map((p) => (
                <SelectItem key={p.name} value={p.name}>I'm {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</Button>
        </div>
      </header>

      <Weekends state={state} me={me} update={update} />
      <Separator />
      <Availability state={state} me={me} update={update} />
      <Separator />
      <Costs state={state} me={me} update={update} />
      <Separator />
      <Days state={state} me={me} update={update} />
      <Separator />
      <Decisions state={state} me={me} update={update} />
    </main>
  )
}

export default App
