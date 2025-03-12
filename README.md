# 네이버 검색광고 API 호출 가이드 (at 'Google Apps Script')
Google Apps Script 에서 네이버 검색광고 API 를 호출하는 방법을 설명합니다.

## 1. 'Signature(서명)' 생성하기

1) API를 호출하는 시점에 맞는 시간 값('timestamp')으로 해시 값을 생성하기 위해 시간 값을 매개변수로 전달 받는다.
2) 사용자가 호출하고 싶은 API에 맞춰 HTTP Method('method') 값을 설정해야 한다.
3) 마찬가지로, 사용자가 호출하고 싶은 API Path('uri')에 맞게 Signature가 생성되어야 한다.

> 'HMAC-SHA256' 암호화 방식은 메시지(message)와 암호키(SECRET_KEY)로 해시 값을 생성한다. 사용자가 생성한 해시 값을 네이버에 전달하면, 네이버 또한 동일한 방식으로 해시 값을 생성한다. 내가 전달한 해시 값과 네이버가 생성한 해시 값이 동일하면 응답한다.

```js
function generateSignature(timestamp, method, uri) {
  const message = `${timestamp}.${method}.${uri}`;
  const byteSignature = Utilities.computeHmacSha256Signature(message, SECRET_KEY);
  
  return Utilities.base64Encode(byteSignature).toString();
}
```

## 2. Header 값 세팅하기

1) Header는 API를 호출할 때마다 생성되어야 하니, 호출 할 때마다 변경되는 값들('timestamp', 'method', 'uri')을 Header 생성 시 함께 처리해준다.

> 커스텀 등록 헤더('X-'를 붙이는)는 2012년 6월에 불편함을 야기한다는 이유로 폐기되었다. ([https://developer.mozilla.org/ko/docs/Web/HTTP/Headers](https://datatracker.ietf.org/doc/html/rfc6648))

```js
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
```

## 3. 'GET' Method 요청 호출하기

* 호출하려는 API 의 Path와 Query Parameter 를 받아서 호출 요청을 하는 함수로 편의를 위해 작성해두었다.
* 'Apps Scrtip' 내에서 UrlFetchApp' 클래스를 통해서 REST API 호출을 하는게 핵심이다.

> 'muteHttpExceptions' 속성은 'fetch' 매서드의 매개변수의 option 중 하나이며, 'true'로 설정하면 응답에 실패해도 HTTPResponse 를 반환한다.

```js
function getRequest(uri, query = "") {
  const method = "GET";
  const options = { muteHttpExceptions: true, headers: getHeader(method, uri) };
  const url = BASE_URL + uri + query;
  const response = UrlFetchApp.fetch(url, options);
  
  return JSON.parse(response);
}
```
