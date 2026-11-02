/** The sketch the Lab starts with. Deliberately the same blink program module 21 teaches,
 *  comment for comment, so the Lab and the lesson agree. */
export const DEFAULT_SKETCH = `// Blink an LED on GPIO13.
// setup() runs once when the board powers on.
// loop() runs over and over, forever, until you press Stop.

#define LED 13

void setup() {
  pinMode(LED, OUTPUT);   // this pin is going to drive something
}

void loop() {
  digitalWrite(LED, HIGH); // 3.3 V on the pin
  delay(500);              // wait half a second
  digitalWrite(LED, LOW);  // 0 V on the pin
  delay(500);
}
`;
