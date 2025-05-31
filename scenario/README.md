# Poker Planning SmartApp Backend

Voice assistant backend for Poker Planning application using Salute platform.

## Features

- **Enhanced Card Selection**: Voice commands with both numeric and text input
  - Numeric: "выбери карту 5", "поставь карту 8"
  - Text: "выбери карту пять", "поставь карту восемь"
  - Smart matching: Invalid numbers are mapped to closest valid cards
- **New Round**: Voice commands like "начни новый раунд", "следующий раунд"
- **Robust Parsing**: Handles various input formats and provides fallbacks
- **Simple Integration**: All validation and conversion handled automatically

## Voice Commands

### Card Selection

**Numeric Input:**

- "выбери карту [0,1,2,3,5,8,13,20,40,100]"
- "поставь карту [число]"
- "возьми карту [число]"
- "выбираю карту [число]"

**Text Input (Russian):**

- "выбери карту ноль/нуль" → 0
- "выбери карту один/одна" → 1
- "выбери карту два" → 2
- "выбери карту три" → 3
- "выбери карту пять" → 5
- "выбери карту восемь" → 8
- "выбери карту тринадцать" → 13
- "выбери карту двадцать" → 20
- "выбери карту сорок" → 40
- "выбери карту сто" → 100

**Smart Matching:**

- Invalid numbers are automatically mapped to the closest valid card
- Example: "выбери карту 4" → maps to "3"
- Example: "выбери карту 6" → maps to "5"
- Example: "выбери карту 15" → maps to "13"

### New Round

- "начни новый раунд"
- "следующий раунд"
- "новая игра"
- "начать сначала"

## Technical Implementation

### Enhanced Parsing Function

The `parseCardValue()` function handles:

1. **Direct Match**: If input is already a valid card value
2. **Text Conversion**: Russian text numbers to numeric values
3. **Closest Match**: Invalid numbers mapped to nearest valid card
4. **Fallback**: Returns null for completely invalid input

### Input Processing Flow

1. User says command (e.g., "выбери карту пять")
2. Scenario system extracts the card value
3. `parseCardValue()` converts text to valid card number
4. `selectCard()` sends action to frontend with parsed value
5. Frontend receives clean, validated card value

## Setup

1. Get your Salute token from [Salute Studio](https://developers.sber.ru/portal/products/smartapp-code)
2. Set environment variables:
   ```bash
   NEXT_PUBLIC_SALUTE_TOKEN="your_salute_token_here"
   NEXT_PUBLIC_SALUTE_SMARTAPP="Покер Планирование"
   ```
3. Deploy the scenario to Salute Studio
4. The frontend will automatically connect when users join a room

## Testing

Run the test suite to verify functionality:

- Numeric input parsing
- Text input conversion
- Closest number matching
- Error handling for invalid input

## Architecture

- **Frontend**: Receives clean, validated card values
- **Assistant**: Handles all input parsing and conversion
- **Robust Error Handling**: Invalid input gracefully handled
- **No State Validation**: Assistant trusts frontend for game state

Made with SmartApp Code.
