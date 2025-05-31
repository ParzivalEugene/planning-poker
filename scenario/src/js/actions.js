function selectCard(cardValue, context) {
  addAction(
    {
      type: "select_card",
      cardValue: cardValue
    },
    context
  );
}

function startNewRound(context) {
  addAction(
    {
      type: "start_new_round"
    },
    context
  );
}
