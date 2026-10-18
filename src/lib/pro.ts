// Pro features (Household for now) in one place.
//
// While we're testing, everyone gets Pro so the features can be tried end to end.
// Before the App Store release: set PRO_FOR_EVERYONE to false and make hasPro() check
// a real purchase. Nothing else needs to change; every Pro screen asks hasPro().
export const PRO_FOR_EVERYONE = true

export function hasPro(): boolean {
  return PRO_FOR_EVERYONE
}
