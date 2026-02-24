import { health } from "../lib/api"

export async function Health() {
  const value = await health()
  return (
    <div className="text-sm">
      <span className="inline-flex items-center rounded-md bg-card px-2 py-1 ring-1 ring-inset ring-border">
        Status: <span className="ml-2 font-medium">{value}</span>
      </span>
    </div>
  )
}

