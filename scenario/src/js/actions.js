function parseCardValue(input) {
  var validCards = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];

  if (validCards.indexOf(input) !== -1) {
    return input;
  }

  var normalizedInput = String(input).toLowerCase().trim();

  var textToNumber = {
    ноль: "0",
    нуль: "0",
    один: "1",
    одна: "1",
    два: "2",
    три: "3",
    пять: "5",
    восемь: "8",
    тринадцать: "13",
    двадцать: "20",
    сорок: "40",
    сто: "100"
  };

  if (textToNumber[normalizedInput]) {
    return textToNumber[normalizedInput];
  }

  var numericValue = parseInt(normalizedInput, 10);
  if (!isNaN(numericValue)) {
    var closest = validCards[0];
    var minDiff = Math.abs(parseInt(validCards[0], 10) - numericValue);

    for (var i = 1; i < validCards.length; i++) {
      var diff = Math.abs(parseInt(validCards[i], 10) - numericValue);
      if (diff < minDiff) {
        minDiff = diff;
        closest = validCards[i];
      }
    }

    return closest;
  }

  return null;
}

function selectCard(cardValue, context) {
  var parsedValue = parseCardValue(cardValue);

  if (parsedValue === null) {
    return null;
  }

  addAction(
    {
      type: "select_card",
      cardValue: parsedValue
    },
    context
  );

  return parsedValue;
}

function startNewRound(context) {
  addAction(
    {
      type: "start_new_round"
    },
    context
  );
}
