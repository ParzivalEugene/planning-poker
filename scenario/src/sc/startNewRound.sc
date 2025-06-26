theme: /

    state: НовыйРаунд
        q!: (начни|начать|запусти|старт|начнем) 
            [новый|следующий] 
            [раунд|игру|голосование]
        q!: следующий раунд
        q!: новая игра
            
        script:
            log('startNewRound: context: ' + JSON.stringify($context))
            var inRoom = $request.rawRequest.payload.meta.current_app.state.inRoom
            
            if (!inRoom) {
                $reactions.answer("Чтобы начать новый раунд, зайдите в комнату.");
                return;
            }

            startNewRound($context);
            
            var responses = [
                "Новый раунд начат!",
                "Отлично, начинаем новый раунд!",
                "Поехали, новый раунд!"
            ];
            $reactions.answer(responses[Math.floor(Math.random() * responses.length)]);