var deck = shuffle(makeStack(deckSchema));
var table = makeTable(tableSchema, 2);
addCards(deck, table.common.deck);
moveCard(table.common.deck, table.common.discard);
deal(table, gameSchema, moveCard);
let main = document.getElementById('main');
turnManager(table, 0, moveCard, listMoves, deckSchema, moveCardToString, checkPlay, ruleFactory, listMovesForCard, main);
//var moves = listMoves(0, table, deckSchema, listMovesForCard, moveCardToString, checkPlay, ruleFactory);
//var moveInterface = moveGUI(table.players, 0, playerSchema, moves, moveCard);
//document.getElementById('main').appendChild(moveInterface);
//var move = chooseMove(table.players, 0, playerSchema, moves);