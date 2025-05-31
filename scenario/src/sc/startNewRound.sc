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
            var request = get_request($context);
            
            // Проверяем, можно ли начать новый раунд
            if (!can_start_new_round(request)) {
                $reactions.answer("Сейчас нельзя начать новый раунд. Дождитесь, пока все проголосуют и карты будут раскрыты.");
                return;
            }
            
            startNewRound($context);
            
        random:
            a: Новый раунд начат!
            a: Отлично, начинаем новый раунд!
            a: Поехали, новый раунд! 