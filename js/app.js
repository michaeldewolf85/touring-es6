/**
 * @file
 * Schema definitions.
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

const tableSchema = {
  "common": ['deck', 'discard'],
  "player": ['hand', 'status', 'speed', 'min', 'low', 'high', 'max']
};

const playerSchema = {
  "mandie": {
    "machine": 0,
    'temperment': 0.8
  },
  "max": {
    "machine": 0,
    'temperment': 0.2
  }
};

const gameSchema = {
  "handSize": 5
};

const makeTable = function(tableSchema, players) {
  let len = tableSchema.common.length, table = {};

  table.common = {};
  for (let i = 0; i < len; i++) {
    table.common[tableSchema.common[i]] = [];
  }

  table.players = {};
  for (let i = 0; i < players; i++) {
    let len = tableSchema.player.length;
    table.players[i] = {};
    for (let j = 0; j < len; j++) {
      table.players[i][tableSchema.player[j]] = [];
    }
  }
  return table;
}

const makeStack = function(schema) {
  let cards = [];
  for (let cardName in deckSchema) {
    cards = cards.concat(Array(deckSchema[cardName].qty).fill(cardName));
  }
  return cards;
};

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

const addCards = function(cards, destination) {
  destination.push.apply(destination, cards);
}

const moveCard = function(source, destination, index) {
  index = index ? index : 0;
  destination.unshift(source[index]);
  source.splice(index, 1);
}

const moveCardToString = function(cardName, destinationPlayer, destinationName, status) {
  let p = destinationPlayer === false ? " yourself " : " player " + destinationPlayer;
  var status = status ? "CAN" : "CANNOT";
  return cardName + " " + status + " by moved to " + destinationName + " of " + p;
}

const deal = function(table, gameSchema, mover) {
  for (let i = 0; i < gameSchema.handSize; i++) {
    for (let j in table.players) {
      mover(table.common.deck, table.players[j].hand);
    }
  }
}

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
        moves.push([toStringer(card, i, deckSchema[card].type, true), table.players[player].hand, table.players[i][deckSchema[card].type], handIndex]);
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
      moves.push([toStringer(card, false, deckSchema[card].type, true), table.players[player].hand, table.players[player][deckSchema[card].type], handIndex]);
    }
  }
  moves.push([toStringer(card, false, 'discard', true), table.players[player].hand, table.common.discard, handIndex]);
  return moves;
}

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

const ruleFactory = function(ruleHandler) {
  return (ruleHandler + "RuleHandler");
}

maxInPileRuleHandler = function(card, player, table, deckSchema, args) {
  let pile = player[deckSchema[card].type];
  if (pile.length >= args[0]) {
    return false;
  }
  return true;
}

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

statusGoRuleHandler = function(card, player, table, deckSchema) {
  if (!player.status.length || player.status[0] != 'go') {
    return false;
  }
  return true;
}

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

const chooseMove = function(players, playerIndex, playerSchema, moves) {
  let len = moves.length;
  for (let i = 0; i < len; i++) {
    if (!moves[i][1]) {
      continue;
    }
    let card = moves[i][1][moves[i][3]];
  }
}

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

const turnManager = function(table, playerIndex, mover, lister, deckSchema, stringer, checker, ruleF, cardLister, div, gameManager) {
  mover(table.common.deck, table.players[playerIndex].hand);
  let moves = lister(playerIndex, table, deckSchema, cardLister, stringer, checker, ruleF);
  var moveInterface = moveGUI(table.players, playerIndex, playerSchema, moves, mover, function() {
    var nextPlayer = table.players[playerIndex + 1] ? playerIndex + 1 : 0;
    turnManager(table, nextPlayer, mover, lister, deckSchema, stringer, checker, ruleF, cardLister, div, gameManager);
  });
  
  var info = gameManager(table.players, deckSchema);
  let len = table.players.length;
  let score = '<h2>SCORE</h2>';
  for (let player in table.players) {
    score += 'Player ' + player + ": <strong>" + info.players[player].score + " miles</strong></br>";
  }
  div.innerHTML = score; 
  div.appendChild(moveInterface);
  console.log(table);
}

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
  }
  return data;
}