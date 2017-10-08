var deck = shuffle(makeStack(deckSchema));
var table = makeTable(tableSchema, 2);
addCards(deck, table.common.deck);
moveCard(table.common.deck, table.common.discard);
deal(table, gameSchema, moveCard);
listMoves(0, table, deckSchema, listMovesForCard, moveCardToString, checkPlay, ruleFactory);
console.log(table);