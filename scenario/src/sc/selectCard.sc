theme: /

    state: ВыборКарты
        q!: (выбери|поставь|возьми|выбираю) 
            [карту|карта]
            ($number::cardValue | ноль | один | два | три | пять | восемь | тринадцать | двадцать | сорок | сто)
            
        script:
            log('selectCard: context: ' + JSON.stringify($context))
            var request = get_request($context);
            
            // Проверяем, можно ли выбирать карты
            if (!can_select_card(request)) {
                $reactions.answer("Сейчас нельзя выбирать карты. Дождитесь нового раунда.");
                return;
            }
            
            var cardValue = $parseTree._cardValue;
            
            // Если это число из duckling, извлекаем значение
            if (cardValue && cardValue.value !== undefined) {
                cardValue = cardValue.value.toString();
            }
            
            // Преобразуем текстовые числа в цифры
            if (cardValue === "ноль") cardValue = "0";
            else if (cardValue === "один") cardValue = "1";
            else if (cardValue === "два") cardValue = "2";
            else if (cardValue === "три") cardValue = "3";
            else if (cardValue === "пять") cardValue = "5";
            else if (cardValue === "восемь") cardValue = "8";
            else if (cardValue === "тринадцать") cardValue = "13";
            else if (cardValue === "двадцать") cardValue = "20";
            else if (cardValue === "сорок") cardValue = "40";
            else if (cardValue === "сто") cardValue = "100";
            
            // Проверяем, что карта допустима
            var validCards = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];
            if (validCards.indexOf(cardValue) === -1) {
                $reactions.answer("Недопустимое значение карты. Доступные карты: 0, 1, 2, 3, 5, 8, 13, 20, 40, 100");
                return;
            }
            
            selectCard(cardValue, $context);
            
        random:
            a: Карта выбрана!
            a: Отлично, карта {{ cardValue }}!
            a: Принято! 