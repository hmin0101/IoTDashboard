const express = require('express');
const router = express.Router();
const moment = require('moment');

const query = require('../model/query');

const initTime = Date.now();

const BASIC_DATA_SIZE = 360;
const PM_DATA_SIZE = 360;

let nodeList = [];
let thDataList = [];
let pmDataList = [];
let pcDataList = [];
let offset_th = 0, offset_pm = 0, offset_pc = 0;

/* GET home page. */
router.get('/', async function(req, res, next) {

  let tempList = [];
  let humidityList = [];
  let pm025List = [];

  let recentlyTime = moment().format('YYYY-MM-DD hh:mm');
  const result = await query.getNodeList();
  if (result.result) {
    nodeList = result.list;
    const dataResult = await query.getTHData(offset_th, nodeList, initTime);
    if (dataResult.result) {
      thDataList = dataResult.list;

      tempList = thDataList.map(function(elem, index) {
        if (index === thDataList.length - 1) {
          recentlyTime = moment(elem.t[elem.t.length - 1][0]).format('YYYY-MM-DD hh:mm');
        }

        return {
          name: "Node"+elem.id,
          type: "line",
          data: elem.t
        }
      });

      humidityList = thDataList.map(function(elem) {
        return {
          name: "Node"+elem.id,
          type: "line",
          data: elem.h
        }
      });
    }

    const result2 = await query.getPm025(offset_pm, nodeList);
    if (result2.result) {
      pmDataList = result2.list;
      pm025List = pmDataList.map(function(elem) {
        return {
          name: "Node"+elem.id,
          type: "line",
          data: elem.pm025
        }
      });
    }

    res.render('dashboard', {recentlyTime: recentlyTime, tempData: JSON.stringify(tempList), humidityData: JSON.stringify(humidityList), pm025Data: JSON.stringify(pm025List)});
  } else {
    res.render('dashboard', {recentlyTime: recentlyTime, tempData: JSON.stringify([]), humidityData: JSON.stringify([]), pm025Data: JSON.stringify([])});
  }

});

router.get('/next/th', async function(req, res) {

  let recentlyTime = moment().format('YYYY-MM-DD hh:mm');
  const result = await query.getNextTHData(BASIC_DATA_SIZE + offset_th, nodeList.length);
  if (result.result) {
    recentlyTime = moment(result.message[0].time).format('YYYY-MM-DD hh:mm');

    for (const d of result.message) {
      for (const node of thDataList) {
        if (node.id === d.id) {
          node.t.shift();
          node.h.shift();

          node.t.push([d.time, d.temperature]);
          node.h.push([d.time, d.humidity]);
        }
      }
    }

    const tempList = thDataList.map(function(elem) {
      return {
        name: "Node"+elem.id,
        type: "line",
        data: elem.t
      }
    });

    const humidityList = thDataList.map(function(elem) {
      return {
        name: "Node"+elem.id,
        type: "line",
        data: elem.h
      }
    });

    offset_th += 1;
    offset_pc = offset_th;

    await res.json({recentlyTime: recentlyTime, tempList: tempList, humidityList: humidityList});
  } else {
    await res.json({recentlyTime: moment().format('YYYY-MM-DD hh:mm'), tempList: [], humidityList: []});
  }

});

router.get('/next/pm', async function(req, res) {

  let recentlyTime = moment().format('YYYY-MM-DD hh:mm');
  const result = await query.getNextPmData(PM_DATA_SIZE + offset_pm, nodeList.length);
  if (result.result) {
    recentlyTime = moment(result.message[0].time).format('YYYY-MM-DD hh:mm');

    for (const d of result.message) {
      for (const node of pmDataList) {
        if (node.id === d.id) {
          node.pm025.shift();
          node.pm025.push([d.time, d.pm025]);
        }
      }
    }

    const pm025List = pmDataList.map(function(elem) {
      return {
        name: "Node"+elem.id,
        type: "line",
        data: elem.pm025
      }
    });

    offset_pm += 1;

    await res.json({recentlyTime: recentlyTime, pm025List: pm025List});
  } else {
    await res.json({recentlyTime: recentlyTime, pm025List: []});
  }

});

router.get('/spc', async function(req, res) {

  let series_th = [], series_pm = [];
  let recentlyTime = moment().format('YYYY-MM-DD hh:mm');
  const result = await query.getPeriodControlData(offset_pc);
  if (result.result) {
    pcDataList = result.list;
    recentlyTime = moment(pcDataList.t[pcDataList.t.length - 1][0]).format('YYYY-MM-DD hh:mm');

    series_th = [{
      name: "Temperature",
      type: "line",
      data: pcDataList.t
    },
    {
      name: "Humidity",
      type: "line",
      data: pcDataList.h
    },
    {
      name: "Predict Temperature",
      type: "line",
      data: pcDataList.p_t
    },
    {
      name: "Predict Humidity",
      type: "line",
      data: pcDataList.p_h
    }];

    series_pm = [{
      name: "pm025",
      type: "line",
      data: pcDataList.pm025
    },
    {
      name: "pm100",
      type: "line",
      data: pcDataList.pm100
    },
    {
      name: "Predict PM025",
      type: "line",
      data: pcDataList.p_pm025
    },
    {
      name: "Predict PM100",
      type: "line",
      data: pcDataList.p_pm100
    }];
  }

  res.render('sensor_period_control', {recentlyTime: recentlyTime, series_th: JSON.stringify(series_th), series_pm: JSON.stringify(series_pm)});

});

router.get('/next/spc', async function(req, res) {

  let series_th = [], series_pm = [];
  let recentlyTime = moment().format('YYYY-MM-DD hh:mm');
  const result = await query.getNextPeriodControlData(BASIC_DATA_SIZE + offset_pc);
  if (result.result) {
    recentlyTime = moment(pcDataList.t[pcDataList.t.length - 1][0]).format('YYYY-MM-DD hh:mm');
    offset_pc += 1;
    offset_th = offset_pc;
    offset_pm = offset_pc;

    if (pcDataList.t !== undefined) {
      pcDataList.t.shift();
      pcDataList.h.shift();
      pcDataList.pm025.shift();
      pcDataList.pm100.shift();
      pcDataList.p_t.shift();
      pcDataList.p_h.shift();
      pcDataList.p_pm025.shift();
      pcDataList.p_pm100.shift();

      pcDataList.t.push(result.data.t);
      pcDataList.h.push(result.data.h);
      pcDataList.pm025.push(result.data.pm025);
      pcDataList.pm100.push(result.data.pm100);
      pcDataList.p_t.push(result.data.p_t);
      pcDataList.p_h.push(result.data.p_h);
      pcDataList.p_pm025.push(result.data.p_pm025);
      pcDataList.p_pm100.push(result.data.p_pm100);
    }

    series_th = [{
      name: "Temperature",
      type: "line",
      data: pcDataList.t
    },
    {
      name: "Humidity",
      type: "line",
      data: pcDataList.h
    },
    {
      name: "Predict Temperature",
      type: "line",
      data: pcDataList.p_t
    },
    {
      name: "Predict Humidity",
      type: "line",
      data: pcDataList.p_h
    }];

    series_pm = [{
      name: "pm025",
      type: "line",
      data: pcDataList.pm025
    },
    {
      name: "pm100",
      type: "line",
      data: pcDataList.pm100
    },
    {
      name: "Predict PM025",
      type: "line",
      data: pcDataList.p_pm025
    },
    {
      name: "Predict PM100",
      type: "line",
      data: pcDataList.p_pm100
    }];
  }

  await res.json({recentlyTime: recentlyTime, series_th: series_th, series_pm: series_pm});
});

router.get('/testbed', function(req, res) {

  res.render('testbed');

});

router.post('/reset', function(req, res) {

  offset_th = 0;
  offset_pm = 0;
  offset_pc = 0;

  res.json({result: true});

});

module.exports = router;
