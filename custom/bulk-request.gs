const STATS_FIELDS_LIST = ["impCnt","clkCnt","salesAmt", "ctr", "cpc", "avgRnk", "ccnt", "pcNxAvgRnk", "mblNxAvgRnk", "crto", "convAmt", "ror", "cpConv", "viewCnt"];

function getKeywordBulkRequest(ids = []) {
  const requestlist = ids.map((id) => ({ url: BASE_URL2 + `/ncc/keywords?nccAdgroupId=${id}`, headers: getHeader("GET", "/ncc/keywords") }));
  const responselist = UrlFetchApp.fetchAll(requestlist);

  return responselist.map((response) => JSON.parse(response)).flat();
}

function getStatsBulkRequest(_ids, datePreset = "", timeRange = { since: "0000-00-00", until: "0000-00-00" }) {
  const validIdsList = listOfValidKeywordIdsForRequestStats(_ids, STATS_FIELDS_LIST, datePreset, timeRange);
  return validIdsList.map((ids) => getRequest("/stats", generateStatsQueryParams(ids, STATS_FIELDS_LIST, datePreset, timeRange)));
}

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
