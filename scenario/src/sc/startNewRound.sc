theme: /

    state: НовыйРаунд
        q!: (начни|начать|запусти|старт) 
            [новый|следующий] 
            [раунд|игру|голосование]
        q!: следующий раунд
        q!: новая игра
        q!: начать сначала
            
        script:
            log('startNewRound: context: ' + JSON.stringify($context))
            
            startNewRound($context);
            
            var responses = [
                "Новый раунд начат!",
                "Отлично, начинаем новый раунд!",
                "Поехали, новый раунд!"
            ];
            $reactions.answer(responses[Math.floor(Math.random() * responses.length)]);