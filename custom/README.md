# 네이버 검색광고 API 호출 가이드 (at 'Google Apps Script') - 'Stats 데이터를 한번에 여러개 요청하기'
### Summary
* 이 내용은 URL 길이 제약 사항 안에서 최대의 키워드 ID를 포함하여, 일괄로 각 키워드 ID에 대한 Stats 정보를 호출하는 방법을 설명한다.

### Overview
1. 검색광고의 성과는 설정한 키워드(Keyword) 별 정성적인 수치(Stats)로 보여진다. (ex, 'CTR', 'CPC' ...)
2. 예를들어, 키워드로 '박영환'을 설정하고 이 키워드가 얼마만큼의 수치를 기록했는지 확인하여 성과를 판단하게 된다.
3. 환경에 따라 다르겠지만, 검색광고에서 성과가 좋은 키워드를 가려내기 위해서는 굉장히 많은 키워드의 수치를 트레킹 해야한다.
4. 따라서, 여러 키워드에 대한 수치(Stats) 정보를 요청하고 불러와야 하며, 네이버 검색광고 API도 여러 키워드의 수치를 한번의 호출로 응답받을 수 있게 한다.
5. 키워드 ID(nccKeywordId)를 배열에 담아, Query Parameter 로 전달하면 된다. (`/stats?ids=[ncckeywordId1, ncckeywordId2 ...]&...`)
6. 다만, Google Apps Script에 'UrlFetchApp' 클래스가 허용하는 URL 길이는 영문 기준으로 2,082자까지 가능하다.
7. 따라서, 일괄로 요청할 수 있는 키워드 ID의 개수는 URL 길이 제약 사항 안에서 산정되어야 한다.

&nbsp;

## Description
### 1. 키워드 정보 수집하기

* 키워드 정보를 가지고 키워드 ID('nccKeywordId')를 수집한다.
* 각 광고그룹(Adgroup)에 속한 여러개의 키워드 정보를 수집한다.
* 'A'라는 광고그룹에는 N개(0개 이상)의 키워드가 포함되어 있다.
* 'fetchAll()'을 활용하여 여러 광고그룹의 키워드 정보를 일괄로 호출했다.

```js
function getKeywordBulkRequest(ids = []) {
  const requestlist = ids.map((id) => ({ url: BASE_URL2 + `/ncc/keywords?nccAdgroupId=${id}`, headers: getHeader("GET", "/ncc/keywords") }));
  const responselist = UrlFetchApp.fetchAll(requestlist);

  return responselist.map((response) => JSON.parse(response)).flat();
}
```

&nbsp;

### 2. Stats API 호출에 필요한 Query Parameter 세팅하기

* 응답받을 수치(Stats) 목록을 정리 한 'fields' 와 수치를 수집할 기간을 설정할 'datePreset' 과 'timeRange' 를 기본으로 받을 수 있게 세팅했다.
* 수집할 기간의 선택권을 다양하게 주기 위해 매개변수를 초기화하고 초기화 값에 따라 Query 를 선택적으로 적용할 수 있게했다.
* 배열이나 객체를 값으로 전달하는 경우 인코딩이 필요하다. (ex, `encodeURIComponent(JSON.stringify(fields))`)

> 키워드 ID를 전달하는 Query Parameter의 Key로 'id'를 사용해도 된다. 다만, 수치가 수집 된 기간 데이터(dateEnd, dateStart)는 응답받지 못한다.

```js
function generateStatsQueryParams(ids = [], fields = STATS_FIELDS_LIST, datePreset = "", timeRange = { since: "0000-00-00", until: "0000-00-00" }) {
  const query1 = `?ids=${ids}`;  // or `?id=${ids}'
  const query2 = `&fields=${encodeURIComponent(JSON.stringify(fields))}`;
  
  let query3 = "";
  if(datePreset == "") {
    query3 = `&timeRange=${encodeURIComponent(JSON.stringify(timeRange))}`;
  }

  if((timeRange.since == "0000-00-00") || (timeRange.until == "0000-00-00")) {
    query3 = `&datePreset=${datePreset}`;
  }

  return query1 + query2 + query3;
}
```

&nbsp;

### 3. Query Parameter에 담을 키워드 ID 개수 산정하기

* '2.'에서 세팅 한 Query Parameter를 기준으로 URL 최대 길이를 산정한다.
* 산정한 URL 길이만큼 담을 수 있는 키워드 ID 개수를 센다.

```js
function listOfValidKeywordIdsForRequestStats(ids = [], fields = STATS_FIELDS_LIST, datePreset = "", timeRange = { since: "0000-00-00", until: "0000-00-00" }) {
  const result = new Array();

  const urlWithoutIds = BASE_URL + "/stats" + generateStatsQueryParams([], fields, datePreset, timeRange);
  
  const MAX_URL_LENGTH = 2082;
  const validUrlLength = (MAX_URL_LENGTH - urlWithoutIds.length);

  let params = new Array();
  const idsLength = ids.length;
  for(let i = 0; i < idsLength; i++) {
    params.push(ids[i]);

    if(validUrlLength < params.toString().length) {
      let temp = params.pop();
      result.push(params);
      params = new Array();
      params.push(temp);
    }

    if(i == (idsLength - 1)){
      result.push(params);
    }
  }

  return result;
}
```
