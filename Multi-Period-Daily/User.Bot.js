﻿exports.newUserBot = function newUserBot(bot, logger, COMMONS, UTILITIES, BLOB_STORAGE, FILE_STORAGE) {

    const FULL_LOG = true;
    const LOG_FILE_CONTENT = false;

    const MODULE_NAME = "User Bot";

    const SIMULATED_RECORDS_FOLDER_NAME = "Trading-Simulation";
    const CONDITIONS_FOLDER_NAME = "Simulation-Conditions";

    const commons = COMMONS.newCommons(bot, logger, UTILITIES);

    thisObject = {
        initialize: initialize,
        start: start
    };

    let utilities = UTILITIES.newCloudUtilities(bot, logger);
    let thisBotStorage = BLOB_STORAGE.newBlobStorage(bot, logger);

    let dataDependencies;

    return thisObject;

    function initialize(pDataDependencies, callBackFunction) {

        try {

            logger.fileName = MODULE_NAME;
            logger.initialize();

            if (FULL_LOG === true) { logger.write(MODULE_NAME, "[INFO] initialize -> Entering function."); }

            dataDependencies = pDataDependencies;

            thisBotStorage.initialize(bot.devTeam, onStorageInizialized);

            function onStorageInizialized(err) {

                if (err.result === global.DEFAULT_OK_RESPONSE.result) {

                    callBackFunction(global.DEFAULT_OK_RESPONSE);

                } else {
                    logger.write(MODULE_NAME, "[ERROR] initializeStorage -> onStorageInizialized -> err = " + err.message);
                    callBackFunction(err);
                }
            }
        } catch (err) {
            logger.write(MODULE_NAME, "[ERROR] initialize -> err = " + err.message);
            callBackFunction(global.DEFAULT_FAIL_RESPONSE);
        }
    }

    function start(dataFiles, timePeriod, outputPeriodLabel, currentDay, startDate, endDate, interExecutionMemory, callBackFunction) {

        try {

            if (FULL_LOG === true) { logger.write(MODULE_NAME, "[INFO] start -> Entering function."); }

            let market = global.MARKET;
            let dataFile;

            let recordsArray = [];
            let conditionsArray = [];

            let simulationLogic = {};
            let lastObjectsArray = [];

            commons.initializeData();

            for (let i = 0; i < dataDependencies.config.length; i++) {

                let dependency = dataDependencies.config[i];
                dataFile = dataFiles[i];

                switch (i) {

                    case 0: {
                        commons.buildLRC(dataFile, callBackFunction);
                        break;
                    }
                    case 1: {
                        commons.buildPercentageBandwidthMap(dataFile, callBackFunction);
                        break;
                    }
                    case 2: {
                        commons.buildBollingerBandsMap(dataFile, callBackFunction);
                        break;
                    }
                    case 3: {
                        commons.buildBollingerChannelsArray(dataFile, callBackFunction);
                        break;
                    }
                    case 4: {
                        commons.buildBollingerSubChannelsArray(dataFile, callBackFunction);
                        break;
                    }
                    case 5: {
                        commons.buildCandles(dataFile, callBackFunction);
                        break;
                    }
                }
            }

            commons.runSimulation(
                recordsArray,
                conditionsArray,
                lastObjectsArray,
                simulationLogic,
                timePeriod,
                currentDay,
                startDate,
                endDate,
                interExecutionMemory,
                writeRecordsFile)

            function writeRecordsFile() {

                try {

                    if (FULL_LOG === true) { logger.write(MODULE_NAME, "[INFO] start -> writeRecordsFile -> Entering function."); }

                    let separator = "";
                    let fileRecordCounter = 0;

                    let fileContent = "";

                    for (let i = 0; i < recordsArray.length; i++) {

                        let record = recordsArray[i];

                        /* Will only add to the file the records of the current day */

                        if (record.begin < currentDay.valueOf()) { continue; }

                        fileContent = fileContent + separator + '[' +
                            record.begin + "," +
                            record.end + "," +
                            record.type + "," +
                            record.rate + "," +
                            record.amount + "," +
                            record.balanceA + "," +
                            record.balanceB + "," +
                            record.profit + "," +
                            record.lastProfit + "," +
                            record.stopLoss + "," +
                            record.roundtrips + "," +
                            record.hits + "," +
                            record.fails + "," +
                            record.hitRatio + "," +
                            record.ROI + "," +
                            record.periods + "," +
                            record.days + "," +
                            record.anualizedRateOfReturn + "," +
                            record.sellRate + "," +
                            record.lastProfitPercent + "," +
                            record.strategy + "," +
                            record.strategyPhase + "," +
                            record.buyOrder + "," +
                            record.stopLossPhase + "," +
                            record.buyOrderPhase + "," +
                            JSON.stringify(record.orderRecord) + "]";

                        if (separator === "") { separator = ","; }

                        fileRecordCounter++;

                    }

                    fileContent = "[" + fileContent + "]";

                    let dateForPath = currentDay.getUTCFullYear() + '/' + utilities.pad(currentDay.getUTCMonth() + 1, 2) + '/' + utilities.pad(currentDay.getUTCDate(), 2);
                    let fileName = '' + market.assetA + '_' + market.assetB + '.json';

                    let filePathRoot = bot.devTeam + "/" + bot.codeName + "." + bot.version.major + "." + bot.version.minor + "/" + global.PLATFORM_CONFIG.codeName + "." + global.PLATFORM_CONFIG.version.major + "." + global.PLATFORM_CONFIG.version.minor + "/" + global.EXCHANGE_NAME + "/" + bot.dataSetVersion;
                    let filePath = filePathRoot + "/Output/" + SIMULATED_RECORDS_FOLDER_NAME + "/" + "Multi-Period-Daily" + "/" + outputPeriodLabel + "/" + dateForPath;

                    thisBotStorage.createTextFile(filePath, fileName, fileContent + '\n', onFileCreated);

                    function onFileCreated(err) {

                        try {

                            if (FULL_LOG === true) { logger.write(MODULE_NAME, "[INFO] start -> writeRecordsFile -> onFileCreated -> Entering function."); }
                            if (LOG_FILE_CONTENT === true) { logger.write(MODULE_NAME, "[INFO] start -> writeRecordsFile -> onFileCreated -> fileContent = " + fileContent); }

                            if (err.result !== global.DEFAULT_OK_RESPONSE.result) {

                                logger.write(MODULE_NAME, "[ERROR] start -> writeRecordsFile -> onFileCreated -> err = " + err.message);
                                logger.write(MODULE_NAME, "[ERROR] start -> writeRecordsFile -> onFileCreated -> filePath = " + filePath);
                                logger.write(MODULE_NAME, "[ERROR] start -> writeRecordsFile -> onFileCreated -> market = " + market.assetA + "_" + market.assetB);

                                callBackFunction(err);
                                return;

                            }

                            writeConditionsFile();

                        }
                        catch (err) {
                            logger.write(MODULE_NAME, "[ERROR] start -> writeRecordsFile -> onFileCreated -> err = " + err.message);
                            callBackFunction(global.DEFAULT_FAIL_RESPONSE);
                        }
                    }
                }
                catch (err) {
                    logger.write(MODULE_NAME, "[ERROR] start -> writeRecordsFile -> err = " + err.message);
                    callBackFunction(global.DEFAULT_FAIL_RESPONSE);
                }
            }

            function writeConditionsFile() {

                try {

                    if (FULL_LOG === true) { logger.write(MODULE_NAME, "[INFO] start -> writeConditionsFile -> Entering function."); }

                    let separator = "";
                    let fileRecordCounter = 0;

                    let fileContent = "";

                    for (let i = 0; i < conditionsArray.length; i++) {

                        let record = conditionsArray[i];

                        let conditions = "";
                        let conditionsSeparator = "";

                        /* Will only add to the file the records of the current day */

                        if (record.begin < currentDay.valueOf()) { continue; }

                        for (let j = 0; j < record.length - 1; j++) {
                            conditions = conditions + conditionsSeparator + record[j];
                            if (conditionsSeparator === "") { conditionsSeparator = ","; }
                        }

                        conditions = conditions + conditionsSeparator + '[' + record[record.length - 1] + ']';   // The last item contains an Array of condition values.

                        fileContent = fileContent + separator + '[' + conditions + ']';

                        if (separator === "") { separator = ","; }

                        fileRecordCounter++;

                    }

                    fileContent = "[" + fileContent + "]";
                    fileContent = "[" + JSON.stringify(simulationLogic) + "," + JSON.stringify(lastObjectsArray) + "," + fileContent + "]";

                    let dateForPath = currentDay.getUTCFullYear() + '/' + utilities.pad(currentDay.getUTCMonth() + 1, 2) + '/' + utilities.pad(currentDay.getUTCDate(), 2);
                    let fileName = '' + market.assetA + '_' + market.assetB + '.json';

                    let filePathRoot = bot.devTeam + "/" + bot.codeName + "." + bot.version.major + "." + bot.version.minor + "/" + global.PLATFORM_CONFIG.codeName + "." + global.PLATFORM_CONFIG.version.major + "." + global.PLATFORM_CONFIG.version.minor + "/" + global.EXCHANGE_NAME + "/" + bot.dataSetVersion;
                    let filePath = filePathRoot + "/Output/" + CONDITIONS_FOLDER_NAME + "/" + "Multi-Period-Daily" + "/" + outputPeriodLabel + "/" + dateForPath;

                    thisBotStorage.createTextFile(filePath, fileName, fileContent + '\n', onFileCreated);

                    function onFileCreated(err) {

                        try {

                            if (FULL_LOG === true) { logger.write(MODULE_NAME, "[INFO] start -> writeConditionsFile -> onFileCreated -> Entering function."); }
                            if (LOG_FILE_CONTENT === true) { logger.write(MODULE_NAME, "[INFO] start -> writeConditionsFile -> onFileCreated -> fileContent = " + fileContent); }

                            if (err.result !== global.DEFAULT_OK_RESPONSE.result) {

                                logger.write(MODULE_NAME, "[ERROR] start -> writeConditionsFile -> onFileCreated -> err = " + err.message);
                                logger.write(MODULE_NAME, "[ERROR] start -> writeConditionsFile -> onFileCreated -> filePath = " + filePath);
                                logger.write(MODULE_NAME, "[ERROR] start -> writeConditionsFile -> onFileCreated -> market = " + market.assetA + "_" + market.assetB);

                                callBackFunction(err);
                                return;

                            }

                            callBackFunction(global.DEFAULT_OK_RESPONSE);

                        }
                        catch (err) {
                            logger.write(MODULE_NAME, "[ERROR] start -> writeConditionsFile -> onFileCreated -> err = " + err.message);
                            callBackFunction(global.DEFAULT_FAIL_RESPONSE);
                        }
                    }
                }
                catch (err) {
                    logger.write(MODULE_NAME, "[ERROR] start -> writeConditionsFile -> err = " + err.message);
                    callBackFunction(global.DEFAULT_FAIL_RESPONSE);
                }
            }

        }
        catch (err) {
            logger.write(MODULE_NAME, "[ERROR] start -> err = " + err.message);
            callBackFunction(global.DEFAULT_FAIL_RESPONSE);
        }
    }
};
