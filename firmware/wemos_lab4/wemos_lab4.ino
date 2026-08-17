/*
 * Lab04 - Wemos D1 firmware
 *
 * One Wemos D1 does double duty (per lecturer's note, replacing the "2 boards"
 * requirement):
 *   - Reads BME680 (temperature + humidity) and BH1750 (light) over I2C and
 *     POSTs the readings to the REST API every 5s.
 *   - Subscribes to two MQTT topics to drive 2 LEDs in real time.
 *
 * Sensors:
 *   BME680  -> I2C address 0x77 (SDO pin tied to 3V3)
 *   BH1750  -> I2C address 0x23 (ADDR pin tied to GND)
 *   Both share the same bus: SDA -> D2 (GPIO4), SCL -> D1 (GPIO5)
 *
 * LEDs:
 *   LED1 -> D5 (GPIO14) + 220ohm resistor to GND
 *   LED2 -> D6 (GPIO12) + 220ohm resistor to GND
 *
 * Libraries needed (Arduino IDE Library Manager):
 *   - ESP8266WiFi / ESP8266HTTPClient (bundled with ESP8266 board package)
 *   - PubSubClient (Nick O'Leary)
 *   - ArduinoJson (Benoit Blanchon), v6.x
 *   - Adafruit BME680 Library + Adafruit Unified Sensor
 *   - BH1750 (Christopher Laws)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME680.h>
#include <BH1750.h>

// ---------------------------------------------------------------------------
// >>> FILL THESE IN BEFORE FLASHING <<<
// ---------------------------------------------------------------------------
const char* WIFI_SSID     = "localhost";
const char* WIFI_PASSWORD = "MatKhauSieuCap";

// LAN IP of the machine running the Express API server (your laptop). Must be
// reachable from the Wemos on the same network as the Pi. Check with
// `ipconfig getifaddr en0` (Wi-Fi) or `en1` on macOS.
const char* API_HOST = "192.168.1.55";   // <-- TODO: set this
const uint16_t API_PORT = 4000;
const char* API_SENSORS_PATH = "/api/sensors";

// Raspberry Pi MQTT broker (the NEW one on 1884, not the Lab3 one on 1883)
const char* MQTT_HOST = "192.168.1.34";
const uint16_t MQTT_PORT = 1884;

// Topic prefix - keep same group naming as Lab3
const char* TOPIC_LED1 = "mmcl/nhom1/led/n1";
const char* TOPIC_LED2 = "mmcl/nhom1/led/n2";

const char* DEVICE_ID = "wemos-d1-01";
// ---------------------------------------------------------------------------

#define PIN_LED1 D5   // GPIO14
#define PIN_LED2 D6   // GPIO12
#define PIN_SDA  D2   // GPIO4
#define PIN_SCL  D1   // GPIO5

#define BME680_ADDR 0x77
#define BH1750_ADDR 0x23

Adafruit_BME680 bme;
BH1750 lightMeter(BH1750_ADDR);

WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL_MS = 5000;

bool bmeOk = false;
bool bhOk = false;

void connectWiFi() {
  Serial.print("Connecting to WiFi \"");
  Serial.print(WIFI_SSID);
  Serial.println("\"...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected, IP = ");
  Serial.println(WiFi.localIP());
}

void setLed(uint8_t pin, bool on) {
  digitalWrite(pin, on ? HIGH : LOW);
}

// Parse an "ON"/"OFF"/"1"/"0" style payload, same convention as Lab3 cau 4/5.
bool parseOnOff(const String& msg, bool& outState) {
  String s = msg;
  s.trim();
  s.toUpperCase();
  if (s == "ON" || s == "1") { outState = true; return true; }
  if (s == "OFF" || s == "0") { outState = false; return true; }
  return false;
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  msg.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  String t = String(topic);
  bool state;
  if (!parseOnOff(msg, state)) {
    Serial.print("Ignoring unrecognised payload on ");
    Serial.print(t);
    Serial.print(": ");
    Serial.println(msg);
    return;
  }

  if (t == TOPIC_LED1) {
    setLed(PIN_LED1, state);
    Serial.print("LED1 -> ");
    Serial.println(state ? "ON" : "OFF");
  } else if (t == TOPIC_LED2) {
    setLed(PIN_LED2, state);
    Serial.print("LED2 -> ");
    Serial.println(state ? "ON" : "OFF");
  }
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT broker ");
    Serial.print(MQTT_HOST);
    Serial.print(":");
    Serial.print(MQTT_PORT);
    Serial.print(" ... ");
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
      // Subscribe again after every (re)connect - the broker doesn't
      // remember subscriptions across a dropped connection (default clean
      // session), same lesson as Lab3 cau 4.
      mqttClient.subscribe(TOPIC_LED1);
      mqttClient.subscribe(TOPIC_LED2);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" retrying in 2s");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(PIN_LED1, OUTPUT);
  pinMode(PIN_LED2, OUTPUT);
  digitalWrite(PIN_LED1, LOW);
  digitalWrite(PIN_LED2, LOW);

  Wire.begin(PIN_SDA, PIN_SCL);

  bmeOk = bme.begin(BME680_ADDR);
  if (!bmeOk) {
    Serial.println("!! BME680 not found at 0x77 - check wiring / SDO pin.");
  } else {
    bme.setTemperatureOversampling(BME680_OS_8X);
    bme.setHumidityOversampling(BME680_OS_2X);
    bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
    // Gas heater not needed for temp/humidity - leave default / off.
  }

  bhOk = lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);
  if (!bhOk) {
    Serial.println("!! BH1750 not found at 0x23 - check wiring / ADDR pin.");
  }

  connectWiFi();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);

  randomSeed(analogRead(A0));
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  float temperature = NAN;
  float humidity = NAN;
  float light = NAN;

  if (bmeOk && bme.performReading()) {
    temperature = bme.temperature;
    humidity = bme.humidity;
  }
  if (bhOk) {
    light = lightMeter.readLightLevel();
  }

  if (isnan(temperature) || isnan(humidity) || isnan(light) || light < 0) {
    Serial.println("Skipping this round - invalid sensor reading.");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["ip"] = WiFi.localIP().toString();
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["light"] = light;

  String payload;
  serializeJson(doc, payload);

  WiFiClient client;
  HTTPClient http;
  String url = String("http://") + API_HOST + ":" + String(API_PORT) + API_SENSORS_PATH;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);

  Serial.print("POST ");
  Serial.print(url);
  Serial.print(" -> ");
  Serial.print(code);
  Serial.print(" | ");
  Serial.println(payload);

  http.end();
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastSend >= SEND_INTERVAL_MS) {
    lastSend = now;
    sendSensorData();
  }
}
