const express = require('express');
const router = express.Router();
const moment = require('moment');
// DB
const query = require('../model/query');

const DATA_SIZE = 120;

let nodeList = [];                          // Node List
let recentlyTime;
let offset = {                              // 시간에 따라 그래프를 변화시키기 위한 offset
  thpm: 0,
  spc: 0,
  qei: 0,
  tb: 0
};

// Init
(async function () {
  const result = await query.getNodeList();
  if (result.result) {
    nodeList = result.list;
  }
})();

/* GET home page. */
router.get('/', async function(req, res, next) {

    let recentlyTime = "Time error";
    let tempData = [];
    let humData = [];
    let pm025Data = [];
    let pm100Data = [];

    const thDataResult = await query.getTHData(offset.thpm, nodeList, DATA_SIZE);
    if (thDataResult.result) {
      recentlyTime = moment(new Date(thDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기

      const nodeList = thDataResult.nodeList;
      tempData = nodeList.map(function (elem) {         // 온도 그래프 데이터
        return {name: "Node"+elem.id, type: "line", data: elem.t};
      });

      humData = nodeList.map(function (elem) {          // 습도 그래프 데이터
        return {name: "Node"+elem.id, type: "line", data: elem.h};
      });
    }

    const pmDataResult = await query.getPmData(offset.thpm, nodeList, DATA_SIZE);
    if (pmDataResult.result) {
      const nodeList = pmDataResult.nodeList;
      pm025Data = nodeList.map(function (elem) {         // 온도 그래프 데이터
        return {name: "Node"+elem.id, type: "line", data: elem.pm025};
      });

      pm100Data = nodeList.map(function (elem) {          // 습도 그래프 데이터
        return {name: "Node"+elem.id, type: "line", data: elem.pm100};
      });
    }

    res.render('dashboard', {recentlyTime: recentlyTime, tempData: JSON.stringify(tempData), humidityData: JSON.stringify(humData), pm025Data: JSON.stringify(pm025Data), pm100Data: JSON.stringify(pm100Data)});

});

/* DB에 저장된 각 노드의 다음 온도,습도 데이터를 가져오는 API */
router.get('/next/thpm', async function(req, res) {

  recentlyTime = "Time Error";
  let tempData = [], humData = [];
  let pm025Data = [], pm100Data = [];

  const thDataResult = await query.getTHData(offset.thpm, nodeList, DATA_SIZE);
  if (thDataResult.result) {
    recentlyTime = moment(new Date(thDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기

    const nodeList = thDataResult.nodeList;
    tempData = nodeList.map(function (elem) {         // 온도 그래프 데이터
      return {name: "Node"+elem.id, type: "line", data: elem.t};
    });

    humData = nodeList.map(function (elem) {          // 습도 그래프 데이터
      return {name: "Node"+elem.id, type: "line", data: elem.h};
    });
  }

  const pmDataResult = await query.getPmData(offset.thpm, nodeList, DATA_SIZE);
  if (pmDataResult.result) {
    // recentlyTime = moment(new Date(pmDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기
    const nodeList = pmDataResult.nodeList;
    pm025Data = nodeList.map(function (elem) {         // PM025 그래프 데이터
      return {name: "Node"+elem.id, type: "line", data: elem.pm025};
    });

    pm100Data = nodeList.map(function (elem) {          // PM100 그래프 데이터
      return {name: "Node"+elem.id, type: "line", data: elem.pm100};
    });
  }

  offset.thpm++;
  offset.spc = offset.thpm;
  offset.qei = offset.thpm;
  offset.tb = offset.thpm;

  await res.json({recentlyTime: recentlyTime, tempData: tempData, humData: humData, pm025Data: pm025Data, pm100Data: pm100Data});

});

/* Sensor Period Control Page */
router.get('/spc', async function(req, res) {

  recentlyTime = "Time error";
  let thData = [];
  let pmData = [];
  let prrData = [];
  let derData = [];

  const thDataResult = await query.getTHData_include_predict(offset.spc, nodeList, DATA_SIZE);
  if (thDataResult.result) {
    recentlyTime = moment(new Date(thDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기

    thData = [{
        name: "Temperature",
        type: "line",
        smooth: true,
        yAxisIndex: 0,
        data: thDataResult.dataList.t
      }, {
        name: "Humidity",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: thDataResult.dataList.h
      }, {
        name: "Predict Temperature",
        type: "line",
        smooth: true,
        yAxisIndex: 0,
        data: thDataResult.dataList.p_t
      }, {
        name: "Predict Humidity",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        data: thDataResult.dataList.p_h
      }];

  }

  const pmDataResult = await query.getPMData_include_predict(offset.spc, nodeList, DATA_SIZE);
  if (pmDataResult.result) {
    // recentlyTime = moment(new Date(thDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기
    pmData = [{
      name: "PM025",
      type: "line",
      data: pmDataResult.dataList.pm025
    }, {
      name: "PM100",
      type: "line",
      data: pmDataResult.dataList.pm100
    }, {
      name: "Predict PM025",
      type: "line",
      data: pmDataResult.dataList.p_pm025
    }, {
      name: "Predict PM100",
      type: "line",
      data: pmDataResult.dataList.p_pm100
    }];
  }

  const controlResult = await query.getPrrData_derData(offset.spc, DATA_SIZE);
  if (controlResult.result) {
    prrData = [{
      name: "Power Reduction Rate",
      type: "line",
      data: controlResult.prrData
    }];

    derData = [{
      name: "Data Error Rate",
      type: "line",
      data: controlResult.derData
    }];
  }

  res.render('sensor_period_control', {recentlyTime: recentlyTime, thData: JSON.stringify(thData), pmData: JSON.stringify(pmData), prrData: JSON.stringify(prrData),  derData: JSON.stringify(derData)});

});

/* Sensor Period Page 에서 보여줄 그래프의 다음 데이터들을 가져오는 API */
router.get('/next/spc', async function(req, res) {

  recentlyTime = "Time error";
  let thData = [];
  let pmData = [];
  let prrData = [];
  let derData = [];

  const thDataResult = await query.getTHData_include_predict(offset.spc, nodeList, DATA_SIZE);
  if (thDataResult.result) {
    recentlyTime = moment(new Date(thDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기

    thData = [{
      name: "Temperature",
      type: "line",
      data: thDataResult.dataList.t
    }, {
      name: "Humidity",
      type: "line",
      data: thDataResult.dataList.h
    }, {
      name: "Predict Temperature",
      type: "line",
      data: thDataResult.dataList.p_t
    }, {
      name: "Predict Humidity",
      type: "line",
      data: thDataResult.dataList.p_h
    }];

  }

  const pmDataResult = await query.getPMData_include_predict(offset.spc, nodeList, DATA_SIZE);
  if (pmDataResult.result) {
    // recentlyTime = moment(new Date(thDataResult.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기
    pmData = [{
      name: "PM025",
      type: "line",
      data: pmDataResult.dataList.pm025
    }, {
      name: "PM100",
      type: "line",
      data: pmDataResult.dataList.pm100
    }, {
      name: "Predict PM025",
      type: "line",
      data: pmDataResult.dataList.p_pm025
    }, {
      name: "Predict PM100",
      type: "line",
      data: pmDataResult.dataList.p_pm100
    }];
  }

  const controlResult = await query.getPrrData_derData(offset.spc, DATA_SIZE);
  if (controlResult.result) {
    prrData = [{
      name: "Power Reduction Rate",
      type: "line",
      data: controlResult.prrData
    }];

    derData = [{
      name: "Data Error Rate",
      type: "line",
      data: controlResult.derData
    }];
  }

  offset.spc++;
  offset.thpm = offset.spc;
  offset.qei = offset.spc;
  offset.tb = offset.spc;

  await res.json({recentlyTime: recentlyTime, thData: thData, pmData: pmData, prrData: prrData, derData: derData});

});

/* 정량적 평가 항목 지표 */
router.get('/qei', async function(req, res) {

  let scData = [], prrData = [], dtData = [];
  let recentlyTime = "Time error";
  const result = await query.getQuantitativeEvaluationItem(offset.qei, DATA_SIZE);
  if (result.result) {
    recentlyTime = moment(result.list.sc[result.list.sc.length - 1][0]).format('YYYY-MM-DD HH:mm');

    scData = [{name: "Silhouette Coefficient", type: "line", data: result.list.sc}];
    prrData = [{name: "Power Reduction Ratio", type: "line", data: result.list.prr}];
    dtData = [{name: "Data Error Ratio", type: "line", data: result.list.dt}];
  }

  res.render('quantitative_evaluation_item', {recentlyTime: recentlyTime, scData: JSON.stringify(scData), prrData: JSON.stringify(prrData), dtData: JSON.stringify(dtData)});

});

router.get('/next/qei', async function(req, res) {

  offset.qei++;
  offset.thpm = offset.qei;
  offset.spc = offset.qei;
  offset.tb = offset.qei;

  let scData = [], prrData = [], dtData = [];
  recentlyTime = "Time error";
  const result = await query.getQuantitativeEvaluationItem(offset.qei, DATA_SIZE);
  if (result.result) {
    recentlyTime = moment(result.list.sc[result.list.sc.length - 1][0]).format('YYYY-MM-DD HH:mm');

    scData = [{name: "Silhouette Coefficient", type: "line", data: result.list.sc}];
    prrData = [{name: "Power Reduction Ratio", type: "line", data: result.list.prr}];
    dtData = [{name: "Data Error Ratio", type: "line", data: result.list.dt}];
  }

  await res.json({recentlyTime: recentlyTime, scData: scData, prrData: prrData, dtData: dtData});

});

router.get('/testbed', async function(req, res) {

  const result = await query.getFeatureData(offset.tb, nodeList.length, DATA_SIZE);
  if (result.result) {
    recentlyTime = moment(new Date(result.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기
    res.render('testbed', {recentlyTime: recentlyTime, featureData: JSON.stringify(result.featureData), testbedData: JSON.stringify(result.testbedData)});
  } else {
    res.render('testbed', {recentlyTime: recentlyTime, featureData: JSON.stringify([]),  testbedData: JSON.stringify([])});
  }

});

router.get('/next/testbed', async function(req, res) {

  offset.tb++;
  offset.thpm = offset.tb;
  offset.spc = offset.tb;
  offset.qei = offset.tb;

  const result = await query.getFeatureData(offset.tb, nodeList.length, DATA_SIZE);
  if (result.result) {
    recentlyTime = moment(new Date(result.time)).format("YYYY-MM-DD HH:mm");          // 최근 데이터 time 가져오기
    await res.json({recentlyTime: recentlyTime, featureData: result.featureData, testbedData: result.testbedData});
  } else {
    await res.json({recentlyTime: recentlyTime, featureData: [], testbedData: []});
  }

});

router.get('/testbed/image', function(req, res) {

  res.send("<img src='/images/testbed_configuration.png'></img>");

});

router.post('/reset', function(req, res) {

  offset.thpm = 0;
  offset.spm = 0;
  offset.qei = 0;
  offset.tb = 0;

  res.json({result: true});

});

module.exports = router;
