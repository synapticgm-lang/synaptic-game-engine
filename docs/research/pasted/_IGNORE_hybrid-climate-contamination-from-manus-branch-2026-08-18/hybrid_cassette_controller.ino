/*
 Hybrid micro-climate cassette controller — ESP32 Arduino reference firmware
 Target: Arduino-ESP32 2.x. This is a controller reference, NOT production or
 safety-certified firmware. Hardware must provide default-OFF drivers, independent
 fuses/current limits/thermal cut-outs, independent overspeed layer, physical
 break-before-make mains interlock, and a tested emergency isolation path.

 Pinout assumes a custom conditioned-input board. Do not connect RTDs, anemometer,
 battery, mains, turbine phases, LiFePO4 cells, or pumps directly to ESP32 pins.
*/
#include <Arduino.h>
#include <math.h>

// ---------- Pin map (adapt only after hardware review) ----------
constexpr int PIN_FLOW_PULSE      = 4;
constexpr int PIN_LEAK            = 16;  // conditioned active LOW leak detector
constexpr int PIN_PAN_FLOAT       = 17;  // conditioned active LOW high condensate
constexpr int PIN_GUST_ALARM      = 18;  // independent wind threshold comparator
constexpr int PIN_SERVICE_RESET   = 19;  // guarded, active LOW
constexpr int PIN_PUMP_PWM        = 25;
constexpr int PIN_FAN_PWM         = 26;
constexpr int PIN_BLADE_FEATHER   = 27;  // commands fail-safe stow actuator
constexpr int PIN_MAG_BRAKE       = 14;  // commands external brake contactor driver
constexpr int PIN_DUMP_LOAD       = 12;  // commands external protected dump load
constexpr int PIN_STATUS_LED      = 2;
constexpr int PIN_AUX_IR_PERMIT   = 13;  // dry-contact permit only; no mains switching
constexpr int ADC_AMBIENT_TEMP    = 34;  // conditioned sensor interface (calibrate)
constexpr int ADC_AMBIENT_RH      = 35;
constexpr int ADC_COIL_TEMP       = 32;
constexpr int ADC_WATER_IN        = 33;
constexpr int ADC_WATER_OUT       = 36;
constexpr int ADC_WIND_SPEED      = 39;
constexpr int ADC_ROTOR_RPM       = 23;  // use external conditioned frequency-to-voltage
constexpr int ADC_BUS_VOLT        = 22;

constexpr uint8_t PUMP_CH = 0, FAN_CH = 1;
constexpr uint32_t PWM_HZ = 20000;
constexpr uint8_t PWM_BITS = 10;
constexpr uint16_t PWM_MAX = (1 << PWM_BITS) - 1;

// ---------- Screening constants — validate against calibrated hardware ----------
constexpr float GUST_CURTAIN_MPH  = 18.0f;
constexpr float GUST_OPEN_MPH     = 35.0f;
constexpr float DEW_MARGIN_C      = 2.0f;   // minimum surface-above-dew margin
constexpr float MAX_COIL_C         = 65.0f;
constexpr float MIN_COIL_C         = 2.0f;
constexpr float MIN_FLOW_LPM       = 1.0f;
constexpr float FLOW_PULSES_PER_L  = 450.0f; // sensor-specific calibration constant
constexpr float BUS_24_LOW         = 20.5f;
constexpr float BUS_48_LOW         = 41.0f;
constexpr float BUS_HIGH           = 58.0f;
constexpr uint32_t FLOW_PROVE_MS   = 10000;
constexpr uint32_t SENSOR_STALE_MS = 3000;
constexpr uint32_t FAULT_HOLD_MS   = 30000;

enum class State : uint8_t {
  SAFE_STOW, SOLAR_FAN_COOL, HYDRONIC_CHILL, HYDRONIC_HEAT, WIND_GENERATION, DUMP_HEAT, FAULT_LATCHED
};

enum Fault : uint32_t {
  F_NONE=0, F_LEAK=1u<<0, F_PAN=1u<<1, F_GUST=1u<<2, F_NO_FLOW=1u<<3,
  F_SENSOR=1u<<4, F_BUS=1u<<5, F_COIL=1u<<6
};

struct Sensors {
  float ambientC, rhPct, coilC, waterInC, waterOutC;
  float windMph, rotorRpm, flowLpm, busV;
  bool leak, panHigh, gustComparator;
  uint32_t sampleMs;
};

volatile uint32_t g_flowPulses = 0;
State g_state = State::SAFE_STOW;
uint32_t g_faults = F_NONE;
uint32_t g_stateSince = 0;
uint32_t g_flowStart = 0;
uint32_t g_lastFlowCalc = 0, g_lastFlowPulses = 0;
float g_flowLpm = 0.0f;
bool g_curtainsDeployed = false; // Must be set only by a validated curtain state input in production.

void IRAM_ATTR onFlowPulse() { g_flowPulses++; }

float adcToUnit(int pin, float minV, float maxV, float minOut, float maxOut) {
  int raw = analogRead(pin);
  float v = (raw / 4095.0f) * 3.3f;
  if (v < minV || v > maxV) return NAN;
  return minOut + (v-minV)*(maxOut-minOut)/(maxV-minV);
}

float dewPointC(float tempC, float rhPct) {
  // Magnus formula; valid operational range must be verified for selected sensor/service range.
  if (!isfinite(tempC) || !isfinite(rhPct) || rhPct <= 0.0f || rhPct > 100.0f) return NAN;
  const float a = 17.62f, b = 243.12f;
  float gamma = logf(rhPct/100.0f) + (a*tempC)/(b+tempC);
  return (b*gamma)/(a-gamma);
}

void setPwm(int channel, float duty01) {
  duty01 = constrain(duty01, 0.0f, 1.0f);
  ledcWrite(channel, (uint32_t)(duty01 * PWM_MAX));
}

void allOutputsSafe() {
  setPwm(PUMP_CH, 0); setPwm(FAN_CH, 0);
  digitalWrite(PIN_BLADE_FEATHER, HIGH); // Fail-safe command: feather/stow
  digitalWrite(PIN_MAG_BRAKE, HIGH);     // External contactor must also fail safe on loss of power
  digitalWrite(PIN_DUMP_LOAD, LOW);
  digitalWrite(PIN_AUX_IR_PERMIT, LOW);
}

void enter(State next) {
  if (next == g_state) return;
  allOutputsSafe();
  g_state = next;
  g_stateSince = millis();
  g_flowStart = 0;
}

void updateFlow() {
  uint32_t now = millis();
  if (now - g_lastFlowCalc < 1000) return;
  noInterrupts(); uint32_t pulses = g_flowPulses; interrupts();
  uint32_t dp = pulses - g_lastFlowPulses;
  float seconds = (now - g_lastFlowCalc) / 1000.0f;
  g_flowLpm = (dp / FLOW_PULSES_PER_L) * (60.0f / seconds);
  g_lastFlowPulses = pulses; g_lastFlowCalc = now;
}

Sensors readSensors() {
  updateFlow();
  Sensors s{};
  // All conversions assume 0.5-2.8 V conditioned outputs; adapt calibration coefficients per board.
  s.ambientC = adcToUnit(ADC_AMBIENT_TEMP, 0.5f,2.8f,-20.0f,60.0f);
  s.rhPct    = adcToUnit(ADC_AMBIENT_RH,   0.5f,2.8f,  0.0f,100.0f);
  s.coilC    = adcToUnit(ADC_COIL_TEMP,    0.5f,2.8f,-20.0f,90.0f);
  s.waterInC = adcToUnit(ADC_WATER_IN,     0.5f,2.8f,-20.0f,90.0f);
  s.waterOutC= adcToUnit(ADC_WATER_OUT,    0.5f,2.8f,-20.0f,90.0f);
  s.windMph  = adcToUnit(ADC_WIND_SPEED,   0.5f,2.8f,  0.0f,80.0f);
  s.rotorRpm = adcToUnit(ADC_ROTOR_RPM,    0.5f,2.8f,  0.0f,3000.0f);
  s.busV     = adcToUnit(ADC_BUS_VOLT,     0.5f,2.8f,  0.0f,65.0f);
  s.flowLpm = g_flowLpm;
  s.leak = digitalRead(PIN_LEAK) == LOW;
  s.panHigh = digitalRead(PIN_PAN_FLOAT) == LOW;
  s.gustComparator = digitalRead(PIN_GUST_ALARM) == HIGH;
  s.sampleMs = millis();
  return s;
}

bool sensorsValid(const Sensors& s) {
  return isfinite(s.ambientC) && isfinite(s.rhPct) && isfinite(s.coilC) &&
    isfinite(s.waterInC) && isfinite(s.waterOutC) && isfinite(s.windMph) &&
    isfinite(s.rotorRpm) && isfinite(s.busV);
}

uint32_t evaluateFaults(const Sensors& s) {
  uint32_t f = F_NONE;
  if (!sensorsValid(s)) f |= F_SENSOR;
  if (s.leak) f |= F_LEAK;
  if (s.panHigh) f |= F_PAN;
  float gustLimit = g_curtainsDeployed ? GUST_CURTAIN_MPH : GUST_OPEN_MPH;
  if (s.gustComparator || (isfinite(s.windMph) && s.windMph >= gustLimit)) f |= F_GUST;
  if (isfinite(s.busV) && (s.busV > BUS_HIGH || s.busV < BUS_24_LOW)) f |= F_BUS;
  if (isfinite(s.coilC) && (s.coilC > MAX_COIL_C || s.coilC < MIN_COIL_C)) f |= F_COIL;
  return f;
}

void runState(const Sensors& s) {
  const float dewC = dewPointC(s.ambientC, s.rhPct);
  const bool enoughBus = s.busV >= BUS_24_LOW;
  const bool excessBus = s.busV >= 54.0f;
  const bool chillAllowed = isfinite(dewC) && s.coilC >= dewC + DEW_MARGIN_C;

  if (g_faults != F_NONE) { enter(State::FAULT_LATCHED); return; }
  switch (g_state) {
    case State::SAFE_STOW:
      allOutputsSafe();
      if (enoughBus && s.ambientC > 25.0f && s.windMph < 12.0f) enter(State::SOLAR_FAN_COOL);
      break;
    case State::SOLAR_FAN_COOL:
      digitalWrite(PIN_BLADE_FEATHER, LOW); digitalWrite(PIN_MAG_BRAKE, LOW);
      setPwm(FAN_CH, 0.55f); setPwm(PUMP_CH, 0.0f);
      if (!enoughBus || s.ambientC < 23.0f) enter(State::SAFE_STOW);
      else if (chillAllowed && s.ambientC > 28.0f) enter(State::HYDRONIC_CHILL);
      else if (s.windMph > 8.0f) enter(State::WIND_GENERATION);
      break;
    case State::HYDRONIC_CHILL:
      digitalWrite(PIN_BLADE_FEATHER, LOW); digitalWrite(PIN_MAG_BRAKE, LOW);
      setPwm(FAN_CH, 0.70f);
      setPwm(PUMP_CH, chillAllowed ? 0.65f : 0.0f);
      if (g_flowStart == 0) g_flowStart = millis();
      if (millis()-g_flowStart > FLOW_PROVE_MS && s.flowLpm < MIN_FLOW_LPM) { g_faults |= F_NO_FLOW; break; }
      if (!chillAllowed || !enoughBus) enter(State::SOLAR_FAN_COOL);
      else if (s.windMph > 8.0f) enter(State::WIND_GENERATION);
      break;
    case State::HYDRONIC_HEAT:
      digitalWrite(PIN_BLADE_FEATHER, LOW); digitalWrite(PIN_MAG_BRAKE, LOW);
      setPwm(FAN_CH, 0.45f); setPwm(PUMP_CH, 0.60f);
      if (g_flowStart == 0) g_flowStart = millis();
      if (millis()-g_flowStart > FLOW_PROVE_MS && s.flowLpm < MIN_FLOW_LPM) { g_faults |= F_NO_FLOW; break; }
      if (s.ambientC > 21.0f || !enoughBus) enter(State::SAFE_STOW);
      break;
    case State::WIND_GENERATION:
      digitalWrite(PIN_BLADE_FEATHER, LOW); digitalWrite(PIN_MAG_BRAKE, LOW);
      setPwm(FAN_CH, s.ambientC > 25.0f ? 0.45f : 0.0f);
      if (excessBus) enter(State::DUMP_HEAT);
      else if (s.windMph < 6.0f) enter(State::SOLAR_FAN_COOL);
      break;
    case State::DUMP_HEAT:
      digitalWrite(PIN_BLADE_FEATHER, LOW); digitalWrite(PIN_MAG_BRAKE, LOW);
      digitalWrite(PIN_DUMP_LOAD, HIGH);
      setPwm(PUMP_CH, 0.50f); setPwm(FAN_CH, 0.0f);
      if (s.busV < 52.0f) enter(State::WIND_GENERATION);
      break;
    case State::FAULT_LATCHED:
      allOutputsSafe();
      if (digitalRead(PIN_SERVICE_RESET) == LOW && millis()-g_stateSince > FAULT_HOLD_MS) {
        g_faults = F_NONE; enter(State::SAFE_STOW);
      }
      break;
  }
}

void setup() {
  pinMode(PIN_LEAK, INPUT_PULLUP); pinMode(PIN_PAN_FLOAT, INPUT_PULLUP);
  pinMode(PIN_GUST_ALARM, INPUT_PULLDOWN); pinMode(PIN_SERVICE_RESET, INPUT_PULLUP);
  pinMode(PIN_BLADE_FEATHER, OUTPUT); pinMode(PIN_MAG_BRAKE, OUTPUT);
  pinMode(PIN_DUMP_LOAD, OUTPUT); pinMode(PIN_AUX_IR_PERMIT, OUTPUT); pinMode(PIN_STATUS_LED, OUTPUT);
  analogReadResolution(12);
  ledcSetup(PUMP_CH, PWM_HZ, PWM_BITS); ledcAttachPin(PIN_PUMP_PWM, PUMP_CH);
  ledcSetup(FAN_CH, PWM_HZ, PWM_BITS); ledcAttachPin(PIN_FAN_PWM, FAN_CH);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_PULSE), onFlowPulse, RISING);
  g_lastFlowCalc = millis();
  allOutputsSafe();
  Serial.begin(115200);
}

void loop() {
  Sensors s = readSensors();
  g_faults |= evaluateFaults(s);
  runState(s);
  digitalWrite(PIN_STATUS_LED, (g_state == State::FAULT_LATCHED) ? ((millis()/250)%2) : HIGH);
  Serial.printf("state=%u faults=0x%lx amb=%.1f rh=%.1f dew=%.1f coil=%.1f flow=%.2f wind=%.1f bus=%.1f\n",
    (unsigned)g_state, (unsigned long)g_faults, s.ambientC, s.rhPct,
    dewPointC(s.ambientC,s.rhPct), s.coilC, s.flowLpm, s.windMph, s.busV);
  delay(100);
}
