const db = require('../db/db_query');
const moment = require('moment');

const DATA_SIZE = 120;

module.exports = {

    getNodeList: async function() {
        try {
            const selectQ = 'select distinct id from data_table';
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                const nodeList = selectResult.message.map(function(elem) {
                    return {
                        id: elem.id,
                        t: [],
                        h: [],
                        pm025: [],
                        pm100: []
                    };
                });
                return {result: true, list: nodeList};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

    getTHData: async function(offset, list, initTime) {
        try {
            const dataList = [];
            const nodeCount = list.length;

            const selectQ = 'select time, id, temperature, humidity from data_table order by time ASC limit ' + (nodeCount * DATA_SIZE) + ' offset ' + (offset * nodeCount);
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                for(const elem of list) {
                    dataList.push({
                        id: elem.id,
                        t: [],
                        h: [],
                    });
                }

                for (const d of selectResult.message) {
                    for (const elem of dataList) {
                        if (elem.id === d.id) {
                            const time = d.time;
                            let t = d.temperature;
                            let h = d.humidity;

                            if (Number(t) === 0) {
                                t = elem.t[elem.t.length - 1];
                            }

                            if (Number(h) === 0) {
                                h = elem.h[elem.h.length - 1];
                            }

                            elem.t.push([time, t]);
                            elem.h.push([time, h]);
                        }
                    }
                }

                return {result: true, list: dataList};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

    getNextTHData: async function(offset, nodeCount) {
        try {
            const selectQ = 'select time, id, temperature, humidity from data_table order by time ASC limit ' + nodeCount + ' offset ' + (offset * nodeCount);
            return await db.asyncSelect(selectQ);
        } catch (err) {
            return err;
        }
    },

    getPm025: async function(offset, list) {
        try {
            const dataList = [];
            const nodeCount = list.length;

            const selectQ = 'select time, id, pm025 from data_table where id not in (50, 51, 52) order by time ASC limit ' + ((nodeCount - 3) * DATA_SIZE) + ' offset ' + (offset * (nodeCount - 3));
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                for(const elem of list) {
                    dataList.push({
                        id: elem.id,
                        pm025: [],
                        pm100: [],
                    });
                }

                for (const d of selectResult.message) {
                    for (const elem of dataList) {
                        if (elem.id === d.id) {
                            const time = d.time;
                            let pm025 = d.pm025;

                            if (Number(pm025) === 0) {
                                pm025 = elem.pm025[elem.pm025.length - 1];
                            }

                            elem.pm025.push([time, pm025]);
                        }
                    }
                }

                return {result: true, list: dataList};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

    getNextPmData: async function(offset, nodeCount) {
        try {
            const selectQ = 'select time, id, pm025 from data_table where id not in (50, 51, 52) order by time ASC limit ' + (nodeCount - 3) + ' offset ' + (offset * (nodeCount - 3));
            return await db.asyncSelect(selectQ);
        } catch (err) {
            return err;
        }
    },

    getPeriodControlData: async function(offset) {
        try {
            const data = {
                t: [],
                h: [],
                pm025: [],
                pm100: [],
                p_t: [],
                p_h: [],
                p_pm025: [],
                p_pm100: [],
                prr: []
            };

            const selectQ = 'select time, temperature, humidity, pm025, pm100, p_t, p_h, p_pm025, p_pm100, period, power_reduction_ratio from data_table where id=43 order by time ASC limit ' + DATA_SIZE + ' offset ' + offset;
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                for (const elem of selectResult.message) {
                    data.t.push([elem.time, elem.temperature]);
                    data.h.push([elem.time, elem.humidity]);
                    data.pm025.push([elem.time, elem.pm025]);
                    data.pm100.push([elem.time, elem.pm100]);
                    data.prr.push([elem.time, elem.power_reduction_ratio]);

                    if (elem.p_t === null) {
                        data.p_t.push([elem.time, elem.temperature]);
                        data.p_h.push([elem.time, elem.humidity]);
                        data.p_pm025.push([elem.time, elem.pm025]);
                        data.p_pm100.push([elem.time, elem.pm100]);
                    } else {
                        data.p_t.push([elem.time, elem.p_t]);
                        data.p_h.push([elem.time, elem.p_h]);
                        data.p_pm025.push([elem.time, elem.p_pm025]);
                        data.p_pm100.push([elem.time, elem.p_pm100]);
                    }
                }

                return {result: true, list: data};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

    getNextPeriodControlData: async function(offset) {
        try {
            const data = {
                t: null,
                h: null,
                pm025: null,
                pm100: null,
                p_t: null,
                p_h: null,
                p_pm025: null,
                p_pm100: null,
                prr: null
            };

            const selectQ = 'select time, temperature, humidity, pm025, pm100, p_t, p_h, p_pm025, p_pm100, period, power_reduction_ratio from data_table where id=43 order by time ASC limit 1 offset ' + offset;
            const selectResult = await db.asyncSelect(selectQ);
            if (selectResult.result) {
                for (const elem of selectResult.message) {
                    data.t = [elem.time, elem.temperature];
                    data.h = [elem.time, elem.humidity];
                    data.pm025 = [elem.time, elem.pm025];
                    data.pm100 = [elem.time, elem.pm100];
                    data.prr = [elem.time, elem.power_reduction_ratio];

                    if (elem.p_t === null) {
                        data.p_t = [elem.time, elem.temperature];
                        data.p_h = [elem.time, elem.humidity];
                        data.p_pm025 = [elem.time, elem.pm025];
                        data.p_pm100 = [elem.time, elem.pm100];
                    } else {
                        data.p_t = [elem.time, elem.p_t];
                        data.p_h = [elem.time, elem.p_h];
                        data.p_pm025 = [elem.time, elem.p_pm025];
                        data.p_pm100 = [elem.time, elem.p_pm100];
                    }
                }
                return {result: true, data: data};
            } else {
                return selectResult;
            }
        } catch (err) {
            return err;
        }
    },

};