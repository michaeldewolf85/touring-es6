/**
 * @file
 * Schema definitions.
 */

/**
 * Schema information of card types.
 */
const deckSchema = {
  "go": {
    "qty": 15,
    "type": "status",
    "offense": false,
    "rules": {
      "topCardRegex": [/(hauledIn|gasoline|puncture)/, true]
    }
  },
  "cityLimits": {
    "qty": 4,
    "type": "speed",
    "offense": true,
    "rules": {
      "topCardRegex": [/country/]
    }
  },
  "country": {
    "qty": 5,
    "type": "speed",
    "offense": false,
    "rules": {
      "topCardRegex": [/cityLimits/, true]
    }
  },
  "collision": {
    "qty": 3,
    "type": "status",
    "offense": true,
    "rules": {
      "topCardRegex": [/go/]
    }
  },
  "hauledIn": {
    "qty": 8,
    "type": "status",
    "offense": false,
    "rules": {
      "topCardRegex": [/collision/]
    }
  },
  "outOfGasoline": {
    "qty": 3,
    "type": "status",
    "offense": true,
    "rules": {
      "topCardRegex": [/go/]
    }
  },
  "gasoline": {
    "qty": 8,
    "type": "status",
    "offense": false,
    "rules": {
      "topCardRegex": [/outOfGasoline/]
    }
  },
  "puncture": {
    "qty": 2,
    "type": "status",
    "offense": true,
    "rules": {
      "topCardRegex": [/go/]
    }
  },
  "min": {
    "qty": 20,
    "type": "min",
    "value": 1,
    "goal": 8,
    "offense": false,
    "rules": {
      "maxInPile": [8],
      "statusGo": []
    }
  },
  "low": {
    "qty": 10,
    "type": "low",
    "value": 3,
    "goal": 4,
    "offense": false,
    "rules": {
      "maxInPile": [4],
      "statusGo": []
    }
  },
  "high": {
    "qty": 10,
    "type": "high",
    "value": 5,
    "goal": 2,
    "offense": false,
    "rules": {
      "maxInPile": [2],
      "statusGo": []
    }
  }, 
  "max": {
    "qty": 12,
    "type": "max",
    "value": 10,
    "offense": false,
    "goal": 2,
    "rules": {
      "maxInPile": [2],
      "statusGo": [],
      "speedLimit": []
    }
  }
};

/**
 * Schema information for table piles.
 */
const tableSchema = {
  "common": ['deck', 'discard'],
  "player": ['hand', 'status', 'speed', 'min', 'low', 'high', 'max']
};

/**
 * Schema information for players.
 */
const playerSchema = {
  "mike": {
    "machine": false,
    'temperment': 0.2
  },  
  "mandie": {
    "machine": true,
    'temperment': 0.8
  },
  "max": {
    "machine": true,
    'temperment': 0.2
  }
};

/**
 * Game settings schema.
 */
const gameSchema = {
  "handSize": 5
};

/**
 * Build the game table in memory with all piles.
 */
const makeTable = function(tableSchema, playerSchema) {
  let len = tableSchema.common.length, table = {};

  table.common = {};
  for (let i = 0; i < len; i++) {
    table.common[tableSchema.common[i]] = [];
  }

  table.players = {};
  let players = playerSchema.length;
  for (let i in playerSchema) {
    let len = tableSchema.player.length;
    table.players[i] = {};
    for (let j = 0; j < len; j++) {
      table.players[i][tableSchema.player[j]] = [];
    }
  }
  return table;
}

/**
 * Build the deck.
 */
const makeStack = function(schema) {
  let cards = [];
  for (let cardName in deckSchema) {
    cards = cards.concat(Array(deckSchema[cardName].qty).fill(cardName));
  }
  return cards;
};

/**
 * Shuffle a stack of cards.
 */
const shuffle = function(stack) {
  let count = stack.length;
  while (count) {
    let rand = Math.floor(Math.random() * count--);
    let temp = stack[count]
    stack[count] = stack[rand];
    stack[rand] = temp;
  }
  return stack;
};

/**
 * Add multiple cards to a stack.
 */
const addCards = function(cards, destination) {
  destination.push.apply(destination, cards);
}

/**
 * Move a card from one stack to another.
 */
const moveCard = function(source, destination, index) {
  index = index ? index : 0;
  destination.unshift(source[index]);
  source.splice(index, 1);
}

/**
 * Make a human readable string out of a move object.
 */
const moveCardToString = function(cardName, destinationPlayer, destinationName) {
  let p = destinationPlayer === false ? " of yourself " : " of player " + destinationPlayer;
  if (destinationName == 'discard') {
    p = '';
  }

  return cardName + " moves to " + destinationName + p;
}

/**
 * Deal hands to all players.
 */
const deal = function(table, gameSchema, mover) {
  for (let i = 0; i < gameSchema.handSize; i++) {
    for (let j in table.players) {
      mover(table.common.deck, table.players[j].hand);
    }
  }
}

/**
 * Find all possible moves for a player's hand.
 */
const listMoves = function(player, table, deckSchema, lister, toStringer, checker, ruleFactory) {
  var len = table.players[player].hand.length;
  let availableMoves = [];
  for (let i = 0; i < len; i++) {
    let moves = lister(player, i, table, deckSchema, toStringer, checker, ruleFactory);
    if (moves.length) {
      availableMoves.push(moves);
    }
  }
  return availableMoves;
}

/**
 * Find all possible moves for an individual card.
 */
const listMovesForCard = function(player, handIndex, table, deckSchema, toStringer, checker, ruleFactory) {
  let card = table.players[player].hand[handIndex], str = '', moves = [];
  if (deckSchema[card].offense) {
    for (let i in table.players) {
      if (i == player) {
        continue;
      }
      let check = true;
      for (let ruleHandler in deckSchema[card].rules) {
        if (!checker(card, table.players[i], table, deckSchema)) {
          check = false;
          continue;
        }
      }
      if (check) {
        moves.push([toStringer(card, i, deckSchema[card].type), table.players[player].hand, table.players[i][deckSchema[card].type], handIndex, 'offense', i, deckSchema[card].type]);
      }
    }
  } else {
    let check = true;
    for (let ruleHandler in deckSchema[card].rules) {
      if (!checker(card, table.players[player], table, deckSchema)) {
        check = false;
        continue;
      }
    }
    if (check) {
      moves.push([toStringer(card, false, deckSchema[card].type), table.players[player].hand, table.players[player][deckSchema[card].type], handIndex, 'defense', player, deckSchema[card].type]);
    }
  }
  moves.push([toStringer(card, false, 'discard'), table.players[player].hand, table.common.discard, handIndex, 'discard', false]);
  return moves;
}

/**
 * Check if a move is valid.
 */
const checkPlay = function(card, player, table, deckSchema) {
  let pile = player[deckSchema[card].type], isValid = false;
  for (let rule in deckSchema[card].rules) {
    let handler = ruleFactory(rule);
    if (!window[handler](card, player, table, deckSchema, deckSchema[card].rules[rule])) {
      return false;
    }
  }
  return true;
}

/**
 * Generate a rule handler from card schema definition.
 */
const ruleFactory = function(ruleHandler) {
  return (ruleHandler + "RuleHandler");
}

/**
 * Rule handler that let's a pile have a max number of cards.
 */
maxInPileRuleHandler = function(card, player, table, deckSchema, args) {
  let pile = player[deckSchema[card].type];
  if (pile.length >= args[0]) {
    return false;
  }
  return true;
}

/**
 * Rule handler that makes sure the top card of a pile matches a regex.
 */
topCardRegexRuleHandler = function(card, player, table, deckSchema, args) {
  let pile = player[deckSchema[card].type];
  if (!pile.length && args[1]) {
    return true;
  }
  if (pile.length == 0 || !pile[0].match(args[0])) {
    return false;
  }
  return true;
}

/**
 * Rule handler that the status pile for the current player must have a "Go" card on top.
 */
statusGoRuleHandler = function(card, player, table, deckSchema) {
  if (!player.status.length || player.status[0] != 'go') {
    return false;
  }
  return true;
}

/**
 * Rule handler for speed limits.
 */
speedLimitRuleHandler = function(card, player, table, deckSchema) {
  var isCountry = false;
  for (let i in table.players) {
    if (table.players[i].speed.length && table.players[i].speed == 'cityLimits') {
      return false;
    }
    if (table.players[i].speed.length && table.players[i].speed == 'country') {
      isCountry = true;
    }
  }
  return isCountry;
}

/**
 * Move picking for a machine player.
 */
const AIMove = function(players, playerIndex, playerSchema, moves, mover, stringer) {
  let len = moves.length, moveMap = {};
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < moves[i].length; j++) {
      moveMap[moves[i][j][4]] = moveMap[moves[i][j][4]] ? moveMap[moves[i][j][4]] : [];
      moveMap[moves[i][j][4]].push(moves[i][j]);
    }
  }

  let arr = ['offense', 'defense', 'discard'];
  for (let i = 0; i < arr.length; i++) {
    if (moveMap[arr[i]] && moveMap[arr[i]].length) {
      moveInfo = moveMap[arr[i]][0];
      let str = playerIndex + " - " + moveInfo[0];
      mover(moveInfo[1], moveInfo[2], moveInfo[3]);
      return str;
    }
  }
}

/**
 * Generates a GUI and handler for humans to make a move.
 */
const moveGUI = function(players, playerIndex, playerSchema, moves, mover, postCallback) {
  let choicesGUI = document.createElement('DIV');
  let playerText = document.createElement('H3');
  playerText.innerHTML = 'PLAYER ' + playerIndex + ': ' + players[playerIndex].hand.toString();
  choicesGUI.appendChild(playerText);
  choicesGUI.className = 'choices-gui';
  let choicesList = document.createElement('UL');

  let len = moves.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < moves[i].length; j++) {
      let moveInfo = moves[i][j];
      let choice = document.createElement('LI');
      choice.innerHTML = moveInfo[0];
      choice.addEventListener('click', function() {
        mover(moveInfo[1], moveInfo[2], moveInfo[3]);
        postCallback();
      });
      choicesList.appendChild(choice);
    }
  }

  choicesGUI.appendChild(choicesList);
  return choicesGUI;
}

/**
 * Manages turns and passes each turn onto the next.
 */
const turnManager = function(table, playerIndex, mover, lister, deckSchema, stringer, checker, ruleF, cardLister, div, gameManager, playerSchema) {
  var info = gameManager(table.players, deckSchema);
  let len = table.players.length;
  let score = '<h2>SCORE</h2>';
  for (let player in table.players) {
    let status = table.players[player].status.length ? table.players[player].status[0] : 'Stopped';
    score += 'Player ' + player + "(" + status + "): <strong>" + info.players[player].score + " miles</strong></br>";
  }
  div.innerHTML = score; 
  if (info.winner) {
    div.innerHTML += info.winner + 'WON!!!!';
    return;
  }
  mover(table.common.deck, table.players[playerIndex].hand);
  let moves = lister(playerIndex, table, deckSchema, cardLister, stringer, checker, ruleF);
  let callback = function() {
    var keys = Object.keys(playerSchema).sort();
    var loc = keys.indexOf(playerIndex);
    var nextPlayerKey = keys[loc + 1] ? keys[loc + 1] : keys[0];
    turnManager(table, nextPlayerKey, mover, lister, deckSchema, stringer, checker, ruleF, cardLister, div, gameManager, playerSchema);
  }
  
  if (playerSchema[playerIndex].machine) {
    div.innerHTML += AIMove(table.players, playerIndex, playerSchema, moves, mover, stringer);
    setTimeout(callback, 2000);
  }
  else {
    var moveInterface = moveGUI(table.players, playerIndex, playerSchema, moves, mover, callback);
    div.appendChild(moveInterface);
  }
  console.log(table);
}

/**
 * Determines the score and watches for a winner.
 */
const gameManager = function(players, deckSchema) {
  let data = {"players": []};
  for (let player in players) {
    data.players[player] = {};
    data.players[player].score = (function() {
      let arr = ['min', 'low', 'high', 'max'], score = 0;
      let complete = 0;
      for (let i = 0; i < arr.length; i++) {
        let val = deckSchema[arr[i]].value;
        let goal = deckSchema[arr[i]].goal;
        score += (players[player][arr[i]].length * val);
        if (players[player][arr[i]].length == goal) {
          complete++;
        }
      }
      return score;
    }());
    if (data.players[player].score == 50) {
      data.winner = player;
    }
  }
  return data;
}