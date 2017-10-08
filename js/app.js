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
    "offense": false,
    "rules": {
      "maxInPile": [8],
      "statusGo": []
    }
  },
  "low": {
    "qty": 10,
    "type": "low",
    "offense": false,
    "rules": {
      "maxInPile": [4],
      "statusGo": []
    }
  },
  "high": {
    "qty": 10,
    "type": "high",
    "offense": false,
    "rules": {
      "maxInPile": [2],
      "statusGo": []
    }
  }, 
  "max": {
    "qty": 12,
    "type": "max",
    "offense": false,
    "rules": {
      "maxInPile": [2],
      "statusGo": []
    }
  }
};

const tableSchema = {
  "common": ['deck', 'discard'],
  "player": ['hand', 'status', 'speed', 'min', 'low', 'high', 'max']
};

const playerSchema = {
  "mandie": [],
  "max": []
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
  destination.push(source[index]);
  source.splice(index, 1);
}

const moveCardToString = function(cardName, destinationPlayer, destinationName, status) {
  let p = destinationPlayer ? " opponent " : " yourself ";
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
  for (let i = 0; i < len; i++) {
    lister(player, i, table, deckSchema, toStringer, checker, ruleFactory);
  }
}

const listMovesForCard = function(player, handIndex, table, deckSchema, toStringer, checker, ruleFactory) {
  let card = table.players[player].hand[handIndex];
  var str = '';
  for (let ruleHandler in deckSchema[card].rules) {
    if (deckSchema[card].offense) {
      for (let i in table.players) {
        let check = checker(card, table.players[i], deckSchema);
        if (check) {
          str += toStringer(card, true, deckSchema[card].type, true);
        } else {
          str += toStringer(card, true, deckSchema[card].type, false);
        }
      }
    } else {
      let check = checker(card, table.players[player], deckSchema);
      if (check) {
        str += toStringer(card, false, deckSchema[card].type, true);
      } else {
        str += toStringer(card, false, deckSchema[card].type, false);
      }
    }
  }
  console.log(str);
}

const checkPlay = function(card, player, deckSchema) {
  let pile = player[deckSchema[card].type], isValid = false;
  for (let rule in deckSchema[card].rules) {
    let handler = ruleFactory(rule);
    if (!window[handler](card, player, deckSchema, deckSchema[card].rules[rule])) {
      return false;
    }
  }
  return true;
}

const ruleFactory = function(ruleHandler) {
  return (ruleHandler + "RuleHandler");
}

maxInPileRuleHandler = function(card, player, deckSchema, args) {
  let pile = player[deckSchema[card].type];
  if (pile.length >= args[0]) {
    return false;
  }
  return true;
}

topCardRegexRuleHandler = function(card, player, deckSchema, args) {
  let pile = player[deckSchema[card].type];
  if (!pile.length && args[1]) {
    return true;
  }
  if (pile.length == 0 || !pile[0].match(args[0])) {
    return false;
  }
  return true;
}

statusGoRuleHandler = function(card, player, deckSchema) {
  if (!player.status.length || !player.status[0] == 'go') {
    return false;
  }
  return true;
}