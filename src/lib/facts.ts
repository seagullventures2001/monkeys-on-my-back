// Fun facts for the safari loading screen. Kept to well-established ones.
export const FACTS: string[] = [
  'A group of monkeys is called a troop.',
  'Bananas are berries, botanically speaking. Strawberries are not.',
  'Banana plants aren’t trees. They’re giant herbs.',
  'A bunch of bananas is called a hand, and each banana is a finger.',
  'Bananas are very slightly radioactive, thanks to the potassium in them.',
  'Most bananas sold in supermarkets are one variety: the Cavendish.',
  'Bananas give off a gas called ethylene that helps nearby fruit ripen faster.',
  'Capuchin monkeys use stones as tools to crack open nuts.',
  'Some monkeys, like spider monkeys, can grip branches with their tails.',
  'Howler monkeys are among the loudest land animals. Their calls carry for kilometres.',
  'Japanese macaques, or snow monkeys, warm up in hot springs in winter.',
  'Monkeys groom each other to keep clean and to stay friends.',
  'A pygmy marmoset, one of the smallest monkeys, weighs about as much as a banana.',
]

export function randomFact(): string {
  return FACTS[Math.floor(Math.random() * FACTS.length)]
}
