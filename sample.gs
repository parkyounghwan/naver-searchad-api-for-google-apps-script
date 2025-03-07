const BASE_URL = "https://api.searchad.naver.com";
const API_KEY = "발급받은 라이선스 (API-KEY)";  // ex) "0100000000e5b6598263137ca151c351b1ddc6f41da64a8475f4f2dd08c8ca2ef4e4247fa5";
const SECRET_KEY = "발급받은 비밀키 (API_SECRET)";  // ex) "PY6keeelL+7HV+498Y83BLv4K65XJRxmfbnZYVzutCA=";
const CUSTOMER_ID = "조회할 광고주ID";  // ex) "338047";

function main() {
  const campaigns = getRequest("/ncc/campaigns")
  Logger.log(JSON.stringify(campaigns, null, 2));
}

function getRequest(uri, query = "") {
  const method = "GET";
  const options = { muteHttpExceptions: true, headers: getHeader(method, uri) };
  const url = BASE_URL + uri + query;
  const response = UrlFetchApp.fetch(url, options);
  
  return JSON.parse(response);
}

function getHeader(method, uri) {
  const timestamp = new Date().valueOf().toString();
  const signature = generateSignature(timestamp, method, uri)

  return { 
    "Content-Type": "application/json; charset=UTF-8", 
    "X-Timestamp": timestamp, 
    "X-API-KEY": API_KEY, 
    "X-Customer": CUSTOMER_ID, 
    "X-Signature": signature, 
  };
}

function generateSignature(timestamp, method, uri) {
  const hmac = `${timestamp}.${method}.${uri}`;
  const byteSignature = Utilities.computeHmacSha256Signature(hmac, SECRET_KEY);
  
  return Utilities.base64Encode(byteSignature).toString();
}
