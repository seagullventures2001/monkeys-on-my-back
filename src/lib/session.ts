// Things remembered only while the app is open (reset next time it starts).

let troopSeen = false

/** Whether the Troop screen has been opened since the app started. */
export function troopVisited(): boolean {
  return troopSeen
}

export function markTroopVisited(): void {
  troopSeen = true
}
