theme: /

    state: ВыборКарты
        q!: (выбери|поставь|возьми|выбираю) 
            [карту|карта]
            ($AnyText::cardValue)
            
        script:
            // Enhanced parsing function
            function parseCardValue(input) {
                if (!input) return null;
                
                var inputStr = input.toString().toLowerCase().trim();
                var validCards = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];
                
                // Direct match - if input is already a valid card
                if (validCards.indexOf(inputStr) !== -1) {
                    return inputStr;
                }
                
                // Text to number conversion (Russian)
                var textToNumber = {
                    "ноль": "0", "нуль": "0",
                    "один": "1", "одна": "1",
                    "два": "2",
                    "три": "3",
                    "пять": "5",
                    "восемь": "8",
                    "тринадцать": "13",
                    "двадцать": "20",
                    "сорок": "40",
                    "сто": "100"
                };
                
                if (textToNumber[inputStr]) {
                    return textToNumber[inputStr];
                }
                
                // Try to parse as number and find closest match
                var numValue = parseInt(inputStr);
                if (!isNaN(numValue)) {
                    var validNumbers = [0, 1, 2, 3, 5, 8, 13, 20, 40, 100];
                    var closest = validNumbers[0];
                    var minDiff = Math.abs(numValue - closest);
                    
                    for (var i = 1; i < validNumbers.length; i++) {
                        var diff = Math.abs(numValue - validNumbers[i]);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = validNumbers[i];
                        }
                    }
                    
                    return closest.toString();
                }
                
                return null;
            }
            
            var inRoom = $request.rawRequest.payload.meta.current_app.state.inRoom

            if (!inRoom) {
                $reactions.answer("Чтобы выбрать карту, зайдите в комнату.");
                return;
            }

            var cardValue = $parseTree._cardValue;
            var parsedValue = parseCardValue(cardValue);
            if (parsedValue === null) {
                $reactions.answer("Недопустимое значение карты. Доступные карты: 0, 1, 2, 3, 5, 8, 13, 20, 40, 100");
                return;
            }
            
            selectCard(parsedValue, $context);
            
            var responses = [
                "Карта выбрана!",
                "Отлично, карта " + parsedValue + "!",
                "Принято!"
            ];
            $reactions.answer(responses[Math.floor(Math.random() * responses.length)]);