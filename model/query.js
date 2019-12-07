const db = require('../db/db_query');
const moment = require('moment');

const fontColor = ["#f44336", "#9c27b0", "#1e88e5", "#ffc107", "#795548", "#7cb342", "#00bcd4"];

const coor = {
    "Node41": {x: 582, y: 565},
    "Node42": {x: 93,  y: 571},
    "Node43": {x: 298, y: 230},
    "Node44": {x: 298, y: 147},
    "Node45": {x: 477, y: 147},
    "Node50": {x: 511, y: 408},
    "Node51": {x: 591, y: 462},
    "Node52": {x: 585, y: 329},
    "Node61": {x: 372, y: 571},
    "Node62": {x: 372, y: 474},
    "Node63": {x: 418, y: 229},
    "Node64": {x: 527, y: 244},
    "Node65": {x: 109, y: 230},
    "Node66": {x: 109, y: 147},
};

module.exports = {

    getNodeList: async function() {
        try {
            const selectQ = 'select distinct id from node_data';
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                const nodeList = selectResult.message.map(function (elem) {
                    return elem.id;
                });
                return {result: true, list: nodeList};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

    getTHData: async function(offset, nodeIdList, size) {
        try {
            const dataList = [];
            const selectQ = 'select time, id, t, h from node_data order by time ASC limit ' + (nodeIdList.length * size) + ' offset ' + (offset * nodeIdList.length);
            const result = await db.asyncSelect(selectQ);
            if (result.result) {
                for (const nodeId of nodeIdList) {
                    dataList.push({id: nodeId, t:[], h:[]});
                }

                let time = result.message[result.message.length - 1].time;
                for (const node of dataList) {
                    for (const elem of result.message) {
                        if (elem.id === node.id) {
                            let temperature = elem.t;
                            let humidity = elem.h;
                            // 값이 있는지 여부 확인
                            if (temperature === null) {temperature = node.t[node.t.length - 1];}
                            if (humidity === null) {humidity = node.h[node.h.length - 1];}
                            // Push
                            node.t.push([elem.time, temperature]);
                            node.h.push([elem.time, humidity]);
                        }
                    }
                }
                return {result: true, nodeList: dataList, time: time};
            } else {
                return result;
            }
        } catch (err) {
            return err;
        }
    },

    getPmData: async function(offset, nodeIdList, size) {
        try {
            const dataList = [];
            const selectQ = 'select time, id, pm025, pm100 from node_data where id not in (50, 51, 52) order by time ASC limit ' + ((nodeIdList.length - 3) * size) + ' offset ' + (offset * (nodeIdList.length - 3));
            const result = await db.asyncSelect(selectQ);
            if (result.result) {
                for (const nodeId of nodeIdList) {
                    dataList.push({id: nodeId, pm025: [], pm100: []});
                }

                let time = result.message[result.message.length - 1].time;
                for (const node of dataList) {
                    for (const elem of result.message) {
                        if (elem.id === node.id) {
                            let pm025 = elem.pm025;
                            let pm100 = elem.pm100;
                            // 값이 있는지 여부 확인
                            if (pm025 === null) {pm025 = node.pm025[node.pm025.length - 1];}
                            if (pm100 === null) {pm100 = node.pm100[node.pm100.length - 1];}
                            // Push
                            node.pm025.push([elem.time, pm025]);
                            node.pm100.push([elem.time, pm100]);
                        }
                    }
                }

                return {result: true, nodeList: dataList, time: time};
            } else {
                return result;
            }
        } catch (err) {
            return err;
        }
    },

    getTHData_include_predict:  async function(offset, nodeIdList, size) {
        try {
            const dataList = {t:[], h:[], p_t:[], p_h:[]};
            const selectQ = 'select time, id, t, h, p_t, p_h from node_data where id=43 order by time ASC limit ' + size + ' offset ' + offset;
            const result = await db.asyncSelect(selectQ);
            if (result.result) {
                let time = result.message[result.message.length - 1].time;
                for (const elem of result.message) {
                    let temperature = elem.t;
                    let humidity = elem.h;
                    let predict_temp = elem.p_t;
                    let predict_hum = elem.p_h;
                    // 값이 있는지 여부 확인
                    if (temperature === null) {temperature = dataList.t[dataList.t.length - 1];}
                    if (humidity === null) {humidity = dataList.h[dataList.h.length - 1];}
                    if (predict_temp === null) {predict_temp = temperature;}
                    if (predict_hum === null) {predict_hum = humidity;}
                    // Push
                    dataList.t.push([elem.time, temperature]);
                    dataList.h.push([elem.time, humidity]);
                    dataList.p_t.push([elem.time, predict_temp]);
                    dataList.p_h.push([elem.time, predict_hum]);
                }
                return {result: true, dataList: dataList, time: time};
            } else {
                return result;
            }
        } catch (err) {
            return err;
        }
    },

    getPMData_include_predict:  async function(offset, nodeIdList, size) {
        try {
            const dataList = {pm025:[], pm100:[], p_pm025:[], p_pm100:[]};
            const selectQ = 'select time, id, pm025, pm100, p_pm025, p_pm100 from node_data where id=43 order by time ASC limit ' + size + ' offset ' + offset;
            const result = await db.asyncSelect(selectQ);
            if (result.result) {
                let time = result.message[result.message.length - 1].time;
                for (const elem of result.message) {
                    let pm025 = elem.pm025;
                    let pm100 = elem.pm100;
                    let predict_pm025 = elem.p_pm025;
                    let predict_pm100 = elem.p_pm100;
                    // 값이 있는지 여부 확인
                    if (pm025 === null) {pm025 = dataList.pm025[dataList.pm025.length - 1];}
                    if (pm100 === null) {pm100 = dataList.pm100[dataList.pm100.length - 1];}
                    if (predict_pm025 === null) {predict_pm025 = pm025;}
                    if (predict_pm100 === null) {predict_pm100 = pm100;}
                    // Push
                    dataList.pm025.push([elem.time, pm025]);
                    dataList.pm100.push([elem.time, pm100]);
                    dataList.p_pm025.push([elem.time, predict_pm025]);
                    dataList.p_pm100.push([elem.time, predict_pm100]);
                }
                return {result: true, dataList: dataList, time: time};
            } else {
                return result;
            }
        } catch (err) {
            return err;
        }
    },

    getPrrData_derData: async function(offset, size) {
        try {
            const prrData = [];
            const derData = [];
            const selectQ = 'select time, power_reduction_ratio, data_error_ratio from evaluation_data order by time ASC limit ' + size + ' offset ' + offset;
            const result = await db.asyncSelect(selectQ);
            if (result.result) {
                let time = result.message[result.message.length - 1].time;
                for (const elem of result.message) {
                    let prr = elem.power_reduction_ratio;
                    let der = elem.data_error_ratio;
                    // 값이 있는지 여부 확인
                    if (prr === null) {prr = prrData[prrData.length - 1];}
                    if (der === null) {der = derData[derData.length - 1];}
                    // Push
                    prrData.push([elem.time, prr]);
                    derData.push([elem.time, der]);
                }
                return {result: true, prrData: prrData, derData:derData, time: time};
            } else {
                return result;
            }
        } catch (err) {
            return err;
        }
    },

    // 정량적 평가 항목 지표
    getQuantitativeEvaluationItem: async function(offset, size) {
        try {
            const silhouetteCoefficient = [];
            const reductionRate = [];
            const dataTrust = [];

            const selectQ = 'select time, sil_score, data_reliability, power_reduction_ratio from evaluation_data order by time ASC limit ' + size + ' offset ' + offset;
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                for (const elem of selectResult.message) {
                    silhouetteCoefficient.push([elem.time, elem.sil_score]);
                    reductionRate.push([elem.time, elem.power_reduction_ratio]);
                    dataTrust.push([elem.time, elem.data_reliability]);
                }
                return {result: true, list: {sc: silhouetteCoefficient, prr: reductionRate, dt: dataTrust}};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

    // Feature
    getFeatureData: async function(offset, nodeCnt, size) {
        try {
            const rawData = {};
            const featureData = [];
            const testbedData = [];

            const selectQ = 'select time, id, c_id, feat_x, feat_y from node_data order by time ASC limit ' + nodeCnt + ' offset ' + ((offset * nodeCnt) + ((nodeCnt * size) - nodeCnt));
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                for (const elem of selectResult.message) {      // cluster id list 추출
                    const isExist = Object.keys(rawData).some(function(id) {
                        return ("Cluster"+elem.c_id) === id;
                    });

                    if (!isExist) {
                        const newKeyName = "Cluster"+elem.c_id;

                        rawData[newKeyName] = [];
                        rawData[newKeyName].push({name: "Node"+elem.id, x: elem.feat_x, y: elem.feat_y});
                    } else {
                        const keyName = "Cluster"+elem.c_id;
                        rawData[keyName].push({name: "Node"+elem.id, x: elem.feat_x, y: elem.feat_y});
                    }
                }

                let idx = 0;
                for (const key of Object.keys(rawData)) {
                    const data = rawData[key].map(function (elem) {             // Create Feature Graph Data
                        return [elem.x, elem.y];                                    // 데이터
                    });
                    featureData.push({name: key, type: "scatter", data: data});

                    const links = [];
                    for (const data1 of rawData[key]) {
                        for (const data2 of rawData[key]) {
                            if (data1.name !== data2.name) {
                                links.push({source: {x: coor[data1.name].x, y: coor[data1.name].y}, target: {x: coor[data2.name].x, y: coor[data2.name].y}});
                            }
                        }
                    }
                    testbedData.push({name: key, links: links});
                    idx++;
                }

                if (featureData.length > 1) {
                    featureData.sort(function(prev, next) {
                        return prev.name < next.name ? -1 : prev.name > next.name ? 1 : 0;
                    });
                }

                if (testbedData.length > 1) {
                    testbedData.sort(function(prev, next) {
                        return prev.name < next.name ? -1 : prev.name > next.name ? 1 : 0;
                    });

                    for (let i=0; i<testbedData.length; i++) {
                        testbedData[i].color = fontColor[i];
                    }
                }

                console.log(testbedData);

                return {result: true, time: selectResult.message[0].time, featureData: featureData, testbedData: testbedData};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

};