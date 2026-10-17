// Things remembered only while the app is open (reset next time it starts).

let troopSeen = false
let rideRequested = false

/** Whether the Troop screen has been opened since the app started. */
export function troopVisited(): boolean {
  return troopSeen
}

export function markTroopVisited(): void {
  troopSeen = true
}

/** Ask for the safari bus ride on the next visit to Troop (used by the banana counter). */
export function requestRide(): void {
  rideRequested = true
}

/** True once after requestRide(), then resets. */
export function takeRideRequest(): boolean {
  const r = rideRequested
  rideRequested = false
  return r
}
