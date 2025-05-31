#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <LittleFS.h>
#include <Preferences.h>

#ifdef USE_HTTPS
#include <WiFiClientSecure.h>
#endif

Preferences preferences;

// #define USE_HTTPS  // Comment out to use HTTP instead of HTTPS
const char* BASE_API_URL = "http://192.168.2.160:3000";


const char* ap_password = "plantsarecool";
WebServer server(80);

#define WIFI_RESET_PIN 0
#define MOISTURE_PIN 34

bool wifiConnected = false;
String assignedIP = "";
bool apShutdownRequested = false;
unsigned long apShutdownTime = 0;
unsigned long lastMoistureSent = 0;
const unsigned long moistureInterval = 30000;

String accessToken = "";
String refreshToken = "";
int sensorId = -1;

int readMoisture() {
  int value = analogRead(MOISTURE_PIN);
  Serial.println("🌱 Moisture reading: " + String(value));
  return value;
}

void beginRequest(HTTPClient &client, String path) {
#ifdef USE_HTTPS
  WiFiClientSecure* secureClient = new WiFiClientSecure();
  secureClient->setInsecure();
  client.begin(*secureClient, String(BASE_API_URL) + path);
#else
  WiFiClient* wifiClient = new WiFiClient();
  client.begin(*wifiClient, String(BASE_API_URL) + path);
#endif
}

void saveCredentials(const char* ssid, const char* password) {
  DynamicJsonDocument doc(256);
  doc["ssid"] = ssid;
  doc["password"] = password;
  File file = LittleFS.open("/wifi.json", "w");
  if (file) {
    serializeJson(doc, file);
    file.close();
  }
}

bool tryConnectSavedWiFi() {
  if (!LittleFS.exists("/wifi.json")) Serial.println("❌ WiFi connection failed or credentials missing");
    return false;
  File file = LittleFS.open("/wifi.json", "r");
  if (!file) Serial.println("❌ WiFi connection failed or credentials missing");
    return false;
  DynamicJsonDocument doc(256);
  if (deserializeJson(doc, file)) Serial.println("❌ WiFi connection failed or credentials missing");
    return false;
  file.close();
  String ssid = doc["ssid"];
  String password = doc["password"];
  if (ssid.isEmpty() || password.isEmpty()) Serial.println("❌ WiFi connection failed or credentials missing");
    return false;

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), password.c_str());
  unsigned long start = millis();
  while (WiFi.waitForConnectResult() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
  }

  if (WiFi.waitForConnectResult() == WL_CONNECTED) {
    wifiConnected = true;
    assignedIP = WiFi.localIP().toString();
    Serial.println("✅ WiFi connected successfully");
    return true;
  }
  Serial.println("❌ WiFi connection failed or credentials missing");
    return false;
}

String buildMacBasedSSID() {
  WiFi.softAP("dummy", "dummy123");
  delay(100);
  uint8_t mac[6];
  WiFi.softAPmacAddress(mac);
  char ssid[32];
  sprintf(ssid, "GreenSensor_%02X%02X%02X", mac[3], mac[4], mac[5]);
  WiFi.softAPdisconnect(true);
  delay(100);
  return String(ssid);
}

void startAccessPoint() {
  WiFi.mode(WIFI_AP);
  String ssid = buildMacBasedSSID();
  Serial.print("SSID from Sensor: ");
  Serial.println(ssid);
  WiFi.softAP(ssid.c_str(), ap_password);
}

void handlePostCredentials() {
  if (!server.hasArg("plain")) return server.send(400, "application/json", "{\"status\":\"error\"}");
  DynamicJsonDocument doc(256);
  if (deserializeJson(doc, server.arg("plain"))) return server.send(400, "application/json", "{\"status\":\"error\"}");
  const char* ssid = doc["ssid"];
  const char* password = doc["password"];
  if (!ssid || !password) return server.send(400, "application/json", "{\"status\":\"error\"}");

  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  unsigned long startAttempt = millis();
  while (WiFi.waitForConnectResult() != WL_CONNECTED && millis() - startAttempt < 15000) delay(500);

  if (WiFi.waitForConnectResult() == WL_CONNECTED) {
    wifiConnected = true;
    assignedIP = WiFi.localIP().toString();
    saveCredentials(ssid, password);
    server.send(200, "application/json", "{\"status\":\"connected\"}");
  } else {
    Serial.println("🌐 Starting fallback Access Point");
    startAccessPoint();
    server.send(500, "application/json", "{\"status\":\"failed\"}");
  }
}

void handleStatus() {
  DynamicJsonDocument doc(128);
  doc["connected"] = wifiConnected;
  doc["ip"] = assignedIP;
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleAssignSensor() {
  Serial.println("📥 Incoming /assign request...");

  if (!server.hasArg("plain")) {
    Serial.println("❌ Missing JSON body in request.");
    server.send(400, "application/json", "{\"status\":\"error\",\"reason\":\"Missing body\"}");
    return;
  }

  String body = server.arg("plain");
  Serial.println("📨 Raw body:");
  Serial.println(body);

  DynamicJsonDocument doc(512);
  DeserializationError parseErr = deserializeJson(doc, body);
  if (parseErr) {
    Serial.print("❌ JSON parse error: ");
    Serial.println(parseErr.c_str());
    server.send(400, "application/json", "{\"status\":\"error\",\"reason\":\"Invalid JSON\"}");
    return;
  }

  const char* name = doc["name"];
  int userId = doc["userId"];
  int plantId = doc["plantId"];

  if (!name || !userId || !plantId) {
    Serial.println("❌ Missing required fields: name, userId, or plantId");
    server.send(400, "application/json", "{\"status\":\"error\",\"reason\":\"Missing fields\"}");
    return;
  }

  Serial.println("✅ Parsed assign data:");
  Serial.printf("  name: %s\n  userId: %d\n  plantId: %d\n", name, userId, plantId);

  // Build payload for backend
  DynamicJsonDocument payload(512);
  payload["name"] = name;
  payload["user_id"] = userId;
  payload["plant_id"] = plantId;
  payload["current_moisture_level"] = readMoisture();

  String jsonPayload;
  serializeJson(payload, jsonPayload);

  Serial.println("📤 Sending to backend:");
  Serial.println(jsonPayload);

  HTTPClient http;
  beginRequest(http, "/api/sensor/pair");
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonPayload);
  String response = http.getString();

  Serial.print("🔁 HTTP status: ");
  Serial.println(httpCode);
  Serial.println("📥 Backend response:");
  Serial.println(response);

  if (httpCode == 200 || httpCode == 201) {
    DynamicJsonDocument responseDoc(512);
    DeserializationError respErr = deserializeJson(responseDoc, response);
    if (respErr) {
      Serial.print("❌ Response JSON parse error: ");
      Serial.println(respErr.c_str());
      server.send(500, "application/json", "{\"status\":\"error\",\"reason\":\"Invalid backend JSON\"}");
      http.end();
      return;
    }

    accessToken = responseDoc["accessToken"].as<String>();
    refreshToken = responseDoc["refreshToken"].as<String>();
    sensorId = responseDoc["sensor"]["id"].as<int>();

    Serial.println("🔐 Tokens received and sensor ID:");
    Serial.println("  accessToken: " + accessToken);
    Serial.println("  sensorId: " + String(sensorId));

    File tokenFile = LittleFS.open("/token.json", "w");
    if (!tokenFile) {
      Serial.println("❌ Failed to open /token.json for writing");
      server.send(500, "application/json", "{\"status\":\"error\",\"reason\":\"Token file write failed\"}");
      http.end();
      return;
    }

    DynamicJsonDocument tokenDoc(512);
    tokenDoc["accessToken"] = accessToken;
    tokenDoc["refreshToken"] = refreshToken;
    tokenDoc["sensorId"] = sensorId;
    serializeJson(tokenDoc, tokenFile);
    tokenFile.close();

    server.send(200, "application/json", "{\"status\":\"success\"}");
    apShutdownRequested = true;
    apShutdownTime = millis() + 7000;
  } else {
    Serial.println("❌ Sensor pairing failed with backend");
    server.send(500, "application/json", "{\"status\":\"error\",\"reason\":\"Backend error\"}");
  }

  http.end();
}


void loadTokens() {
  if (!LittleFS.exists("/token.json")) return;
  File file = LittleFS.open("/token.json", "r");
  if (!file) return;
  DynamicJsonDocument doc(512);
  if (!deserializeJson(doc, file)) {
    accessToken = doc["accessToken"].as<String>();
    refreshToken = doc["refreshToken"].as<String>();
    sensorId = doc["sensorId"].as<int>();
  }
  file.close();
}

bool refreshAccessToken() {
  if (refreshToken == "") Serial.println("❌ WiFi connection failed or credentials missing");
    return false;
  DynamicJsonDocument doc(512);
  doc["refreshToken"] = refreshToken;
  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  beginRequest(http, "/api/sensor/refresh-token");
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  String response = http.getString();

  if (code == 200 || code == 201) {
    DynamicJsonDocument resDoc(512);
    if (!deserializeJson(resDoc, response)) {
      accessToken = resDoc["accessToken"].as<String>();
      http.end();
      Serial.println("✅ WiFi connected successfully");
    return true;
    }
  }
  http.end();
  Serial.println("❌ WiFi connection failed or credentials missing");
    return false;
}

void sendMoistureReading() {
  if (accessToken == "" || sensorId == -1) return;
  int moisture = readMoisture();
  DynamicJsonDocument doc(256);
  doc["moisture"] = moisture;
  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  beginRequest(http, "/api/sensor/data");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + accessToken);
  int code = http.POST(payload);
  if (code == 401 || code == 403) {
    if (refreshAccessToken()) {
      http.end();
      Serial.println("📤 Sending moisture reading...");
    sendMoistureReading(); return;
    }
  }
  http.end();
}

void handleWiFiResetButton() {
  static unsigned long pressStart = 0;
  static bool wasLow = false;
  if (digitalRead(WIFI_RESET_PIN) == LOW) {
    if (!wasLow) {
      pressStart = millis();
      wasLow = true;
    } else if (millis() - pressStart > 2000) {
      LittleFS.remove("/wifi.json");
      delay(500);
      ESP.restart();
    }
  } else {
    wasLow = false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  pinMode(WIFI_RESET_PIN, INPUT_PULLUP);
  if (!LittleFS.begin(true)) return;
  if (!tryConnectSavedWiFi()) Serial.println("🌐 Starting fallback Access Point");
    startAccessPoint();

  server.on("/wifi", HTTP_POST, handlePostCredentials);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/assign", HTTP_POST, handleAssignSensor);
  Serial.println("🌐 HTTP Server started");
  server.begin();
  loadTokens();
}

void loop() {
  server.handleClient();
  handleWiFiResetButton();

  if (apShutdownRequested && millis() > apShutdownTime) {
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_STA);
    apShutdownRequested = false;
  }

  if (wifiConnected && millis() - lastMoistureSent > moistureInterval) {
    Serial.println("📤 Sending moisture reading...");
    sendMoistureReading();
    lastMoistureSent = millis();
  }
}
