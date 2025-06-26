require: slotfilling/slotFilling.sc
  module = sys.zb-common
  
# Подключение javascript обработчиков
require: js/getters.js
require: js/reply.js
require: js/actions.js

# Подключение сценарных файлов
require: sc/selectCard.sc
require: sc/startNewRound.sc


patterns:
    $AnyText = $nonEmptyGarbage
    $number = $regexp<\d+>

theme: /


    state: runApp
        event!: runApp
        q!: * *start
        q!: (запусти | открой | вруби) Покер Планирования
        script:
            $response.replies = $response.replies || [];
            $response.replies.push({
                type: 'raw',
                body: {
                    items: [
                        {
                            command: {
                                type: "smart_app_data",
                                smart_app_data: {
                                    type: "app_action",
                                    message: "запустиприложение"
                                },
                            },
                            auto_listening: true
                        },
                    ],
                },
            });

    state: createRoom
        q!: (создай|войди|создать|войти|присоединиться)
            [комната|комнату|комнаты]
        a: Пока что через голос это сделать нельзя, но я обязательно скоро научусь 

    state: Fallback
        event!: noMatch
        script:
            log('entryPoint: Fallback: context: ' + JSON.stringify($context))
        a: Я не понимаю. Попробуйте сказать "выбери карту 5" или "начни новый раунд".

