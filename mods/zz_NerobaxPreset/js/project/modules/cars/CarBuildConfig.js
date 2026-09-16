define(["require", "exports", "common/core/DataStore", "project/data/GameTypes"], function (require, exports, DS, GameTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCarPartInspectionModifier = exports.getCarPartInspectionLabel = exports.CarPartDesignLabelPreset = exports.getCarPartFanfareIcon = exports.getCarPartIcon = exports.PerformanceAnalysisType = exports.getPartStatIcon = exports.getCarStatIcon = exports.sortOnPartStatId = exports.sortOnPartId = exports.sortOnStatId = exports.getCategoryIcon = exports.getCategoryName = exports.getStatCategory = exports.getStatCategoryDetails = exports.getPartStatCategoryDetails = exports.isStatPowertrain = exports.isPartPowertrain = exports.isPartAerodynamics = exports.isStatSecondary = exports.isStatPrimary = exports.POWERTRAIN_PART_STATS = exports.PERFORMANCE_ANALYSIS_PARTS_ORDER = exports.POWERTRAIN_PART_TYPES = exports.AERODYNAMICS_PART_TYPES = exports.CAR_PARTS_STATS = exports.SECONDARY_CAR_STATS = exports.PRIMARY_CAR_STATS = exports.CAR_STAT_CATEGORIES = exports.PART_STAT_CATEGORIES = exports.CarStatCategoryType = exports.ProjectType = exports.INSPECTION_FAILURE_PART_WEAR_HIGH = exports.INSPECTION_FAILURE_PART_WEAR_LOW = exports.MAX_PART_CONDITION_VALUE = exports.MIN_PART_CONDITION_VALUE = void 0;
    exports.MIN_PART_CONDITION_VALUE = 0;
    exports.MAX_PART_CONDITION_VALUE = 1;
    exports.INSPECTION_FAILURE_PART_WEAR_LOW = 70;
    exports.INSPECTION_FAILURE_PART_WEAR_HIGH = 30;
    var ProjectType;
    (function (ProjectType) {
        ProjectType[ProjectType["Design"] = 0] = "Design";
        ProjectType[ProjectType["Research"] = 1] = "Research";
        ProjectType[ProjectType["Manufacture"] = 2] = "Manufacture";
    })(ProjectType || (exports.ProjectType = ProjectType = {}));
    var CarStatCategoryType;
    (function (CarStatCategoryType) {
        CarStatCategoryType[CarStatCategoryType["None"] = 0] = "None";
        CarStatCategoryType[CarStatCategoryType["Cornering"] = 1] = "Cornering";
        CarStatCategoryType[CarStatCategoryType["Cooling"] = 2] = "Cooling";
        CarStatCategoryType[CarStatCategoryType["Downforce"] = 3] = "Downforce";
        CarStatCategoryType[CarStatCategoryType["Airflow"] = 4] = "Airflow";
        CarStatCategoryType[CarStatCategoryType["Durability"] = 5] = "Durability";
        CarStatCategoryType[CarStatCategoryType["DRS"] = 6] = "DRS";
        CarStatCategoryType[CarStatCategoryType["DirtyAirCornering"] = 7] = "DirtyAirCornering";
        CarStatCategoryType[CarStatCategoryType["Velocity"] = 8] = "Velocity";
        CarStatCategoryType[CarStatCategoryType["Attribute"] = 9] = "Attribute";
    })(CarStatCategoryType || (exports.CarStatCategoryType = CarStatCategoryType = {}));
    exports.PART_STAT_CATEGORIES = [
        {
            categoryType: CarStatCategoryType.Downforce,
            categoryName: '[CAR_BUILD_DOWNFORCE]',
            carStats: [GameTypes_1.EPartStat.HighSpeedDownforce, GameTypes_1.EPartStat.MedSpeedDownforce, GameTypes_1.EPartStat.LowSpeedDownforce],
            icon: '/img/icons/downforce.svg'
        },
        {
            categoryType: CarStatCategoryType.Airflow,
            categoryName: '[CAR_BUILD_AIRFLOW]',
            carStats: [GameTypes_1.EPartStat.AirflowFront, GameTypes_1.EPartStat.AirflowMiddle, GameTypes_1.EPartStat.AirflowTolerance,],
            icon: '/img/icons/wind.svg'
        },
        {
            categoryType: CarStatCategoryType.Cooling,
            categoryName: '[Part_Stat_Cooling]',
            carStats: [GameTypes_1.EPartStat.BrakeCooling, GameTypes_1.EPartStat.EngineCooling],
            icon: '/img/icons/carTemp.svg'
        },
        {
            categoryType: CarStatCategoryType.Velocity,
            categoryName: '[Part_Stat_Velocity]',
            carStats: [GameTypes_1.EPartStat.DRSDelta, GameTypes_1.EPartStat.Drag, GameTypes_1.EPartStat.Power],
            icon: '/img/icons/speed.svg'
        },
        {
            categoryType: CarStatCategoryType.Attribute,
            categoryName: '[Part_Stat_Attribute]',
            carStats: [
                GameTypes_1.EPartStat.PerformanceThreshold,
                GameTypes_1.EPartStat.PerformanceLoss,
                GameTypes_1.EPartStat.OperationalRange,
                GameTypes_1.EPartStat.Durability,
            ],
            icon: '/img/icons/car.svg'
        },
        {
            categoryType: CarStatCategoryType.None,
            categoryName: '',
            carStats: [
                GameTypes_1.EPartStat.FuelEfficiency,
            ],
            icon: '/img/icons/car.svg'
        },
    ];
    exports.CAR_STAT_CATEGORIES = [
        {
            categoryType: CarStatCategoryType.Cornering,
            categoryName: '[CAR_BUILD_CORNERING]',
            carStats: [GameTypes_1.ECarStat.HighSpeedCornering, GameTypes_1.ECarStat.LowSpeedCornering, GameTypes_1.ECarStat.MediumSpeedCornering],
            icon: '../../../img/icons/cornering.svg'
        },
        {
            categoryType: CarStatCategoryType.Downforce,
            categoryName: '[CAR_BUILD_DOWNFORCE]',
            carStats: [GameTypes_1.ECarStat.HighSpeedDownforce, GameTypes_1.ECarStat.MediumSpeedDownforce, GameTypes_1.ECarStat.LowSpeedDownforce],
            icon: '../../../img/icons/downforce.svg'
        },
        {
            categoryType: CarStatCategoryType.Airflow,
            categoryName: '[CAR_BUILD_AIRFLOW]',
            carStats: [GameTypes_1.ECarStat.AirflowFront, GameTypes_1.ECarStat.AirflowMiddle],
            icon: '../../../img/icons/wind.svg'
        },
        {
            categoryType: CarStatCategoryType.DRS,
            categoryName: '[CAR_BUILD_DEV_DRS]',
            carStats: [GameTypes_1.ECarStat.DRS],
            icon: '../../../img/icons/drs.svg'
        },
        {
            categoryType: CarStatCategoryType.DirtyAirCornering,
            categoryName: '[CAR_BUILD_DEV_DIRTYAIR]',
            carStats: [GameTypes_1.ECarStat.DirtyAirLowSpeedCornering, GameTypes_1.ECarStat.DirtyAirMediumSpeedCornering, GameTypes_1.ECarStat.DirtyAirHighSpeedCornering],
            icon: '../../../img/icons/dirtyAirCornering.svg'
        },
    ];
    exports.PRIMARY_CAR_STATS = [
        GameTypes_1.ECarStat.TopSpeed,
        GameTypes_1.ECarStat.Acceleration,
        GameTypes_1.ECarStat.DRS,
        GameTypes_1.ECarStat.LowSpeedCornering,
        GameTypes_1.ECarStat.MediumSpeedCornering,
        GameTypes_1.ECarStat.HighSpeedCornering,
        GameTypes_1.ECarStat.DirtyAirTolerance,
        GameTypes_1.ECarStat.DirtyAirLowSpeedCornering,
        GameTypes_1.ECarStat.DirtyAirMediumSpeedCornering,
        GameTypes_1.ECarStat.DirtyAirHighSpeedCornering,
        GameTypes_1.ECarStat.BrakeCooling,
        GameTypes_1.ECarStat.EngineCooling,
    ];
    exports.SECONDARY_CAR_STATS = [
        GameTypes_1.ECarStat.Drag,
        GameTypes_1.ECarStat.LowSpeedDownforce,
        GameTypes_1.ECarStat.MediumSpeedDownforce,
        GameTypes_1.ECarStat.HighSpeedDownforce,
        GameTypes_1.ECarStat.AirflowFront,
        GameTypes_1.ECarStat.AirflowMiddle,
    ];
    exports.CAR_PARTS_STATS = [
        GameTypes_1.EPartStat.Drag,
        GameTypes_1.EPartStat.DRSDelta,
        GameTypes_1.EPartStat.LowSpeedDownforce,
        GameTypes_1.EPartStat.MedSpeedDownforce,
        GameTypes_1.EPartStat.HighSpeedDownforce,
        GameTypes_1.EPartStat.EngineCooling,
        GameTypes_1.EPartStat.BrakeCooling,
        GameTypes_1.EPartStat.AirflowTolerance,
        GameTypes_1.EPartStat.AirflowFront,
        GameTypes_1.EPartStat.AirflowMiddle,
        GameTypes_1.EPartStat.Power,
        GameTypes_1.EPartStat.PerformanceThreshold,
        GameTypes_1.EPartStat.PerformanceLoss,
        GameTypes_1.EPartStat.OperationalRange,
        GameTypes_1.EPartStat.FuelEfficiency,
        GameTypes_1.EPartStat.Durability,
    ];
    exports.AERODYNAMICS_PART_TYPES = [
        GameTypes_1.EPartType.Body,
        GameTypes_1.EPartType.FrontWing,
        GameTypes_1.EPartType.RearWing,
        GameTypes_1.EPartType.SidePods,
        GameTypes_1.EPartType.Floor,
        GameTypes_1.EPartType.Suspension
    ];
    exports.POWERTRAIN_PART_TYPES = [
        GameTypes_1.EPartType.Engine,
        GameTypes_1.EPartType.ERS,
        GameTypes_1.EPartType.Gearbox,
    ];
    exports.PERFORMANCE_ANALYSIS_PARTS_ORDER = [
        GameTypes_1.EPartType.Body,
        GameTypes_1.EPartType.FrontWing,
        GameTypes_1.EPartType.RearWing,
        GameTypes_1.EPartType.SidePods,
        GameTypes_1.EPartType.Floor,
        GameTypes_1.EPartType.Suspension,
        GameTypes_1.EPartType.Engine,
        GameTypes_1.EPartType.ERS,
        GameTypes_1.EPartType.Gearbox,
    ];
    exports.POWERTRAIN_PART_STATS = [
        GameTypes_1.EPartStat.Power,
        GameTypes_1.EPartStat.PerformanceThreshold,
        GameTypes_1.EPartStat.PerformanceLoss,
        GameTypes_1.EPartStat.OperationalRange,
        GameTypes_1.EPartStat.FuelEfficiency,
    ];
    function isStatPrimary(carStat) {
        return exports.PRIMARY_CAR_STATS.indexOf(carStat) != -1;
    }
    exports.isStatPrimary = isStatPrimary;
    function isStatSecondary(carStat) {
        return exports.SECONDARY_CAR_STATS.indexOf(carStat) != -1;
    }
    exports.isStatSecondary = isStatSecondary;
    function isPartAerodynamics(part) {
        return exports.AERODYNAMICS_PART_TYPES.indexOf(part) != -1;
    }
    exports.isPartAerodynamics = isPartAerodynamics;
    function isPartPowertrain(part) {
        return exports.POWERTRAIN_PART_TYPES.indexOf(part) != -1;
    }
    exports.isPartPowertrain = isPartPowertrain;
    function isStatPowertrain(part) {
        return exports.POWERTRAIN_PART_STATS.indexOf(part) != -1;
    }
    exports.isStatPowertrain = isStatPowertrain;
    function getPartStatCategoryDetails(carStat) {
        for (let i = 0; i < exports.PART_STAT_CATEGORIES.length; i++) {
            let index = exports.PART_STAT_CATEGORIES[i].carStats.indexOf(carStat);
            if (index > -1)
                return exports.PART_STAT_CATEGORIES[i];
        }
    }
    exports.getPartStatCategoryDetails = getPartStatCategoryDetails;
    function getStatCategoryDetails(carStat) {
        for (let i = 0; i < exports.CAR_STAT_CATEGORIES.length; i++) {
            let index = exports.CAR_STAT_CATEGORIES[i].carStats.indexOf(carStat);
            if (index > -1)
                return exports.CAR_STAT_CATEGORIES[i];
        }
    }
    exports.getStatCategoryDetails = getStatCategoryDetails;
    function getStatCategory(carStat) {
        for (let i = 0; i < exports.CAR_STAT_CATEGORIES.length; i++) {
            for (let j = 0; j < exports.CAR_STAT_CATEGORIES[i].carStats.length; j++) {
                if (exports.CAR_STAT_CATEGORIES[i].carStats[j] == carStat) {
                    return exports.CAR_STAT_CATEGORIES[i].categoryType;
                }
            }
        }
        return CarStatCategoryType.None;
    }
    exports.getStatCategory = getStatCategory;
    function getCategoryName(categoryType) {
        for (let i = 0; i < exports.CAR_STAT_CATEGORIES.length; i++) {
            if (exports.CAR_STAT_CATEGORIES[i].categoryType == categoryType) {
                return exports.CAR_STAT_CATEGORIES[i].categoryName;
            }
        }
        return '';
    }
    exports.getCategoryName = getCategoryName;
    function getCategoryIcon(categoryType) {
        for (let i = 0; i < exports.CAR_STAT_CATEGORIES.length; i++) {
            if (exports.CAR_STAT_CATEGORIES[i].categoryType == categoryType) {
                return exports.CAR_STAT_CATEGORIES[i].icon;
            }
        }
        return '../../../img/icons/placeholder.svg';
    }
    exports.getCategoryIcon = getCategoryIcon;
    function sortOnStatId(statList) {
        return function (itemA, itemB) {
            const valueA = parseInt(itemA.id);
            const valueB = parseInt(itemB.id);
            const sortedA = statList.indexOf(valueA);
            const sortedB = statList.indexOf(valueB);
            return sortedA == sortedB ? 0 : (sortedA < sortedB ? -1 : 1);
        };
    }
    exports.sortOnStatId = sortOnStatId;
    function sortOnPartId(statList) {
        return function (itemA, itemB) {
            const valueA = parseInt(itemA.id);
            const valueB = parseInt(itemB.id);
            const sortedA = statList.indexOf(valueA);
            const sortedB = statList.indexOf(valueB);
            return sortedA == sortedB ? 0 : (sortedA < sortedB ? -1 : 1);
        };
    }
    exports.sortOnPartId = sortOnPartId;
    function sortOnPartStatId(itemA, itemB) {
        const valueA = DS.getValue(itemA, 'id');
        const valueB = DS.getValue(itemB, 'id');
        const sortedA = exports.CAR_PARTS_STATS.indexOf(valueA);
        const sortedB = exports.CAR_PARTS_STATS.indexOf(valueB);
        return sortedA == sortedB ? 0 : (sortedA < sortedB ? -1 : 1);
    }
    exports.sortOnPartStatId = sortOnPartStatId;
    function getCarStatIcon(id) {
        if (typeof id == 'string')
            id = parseInt(id);
        switch (id) {
            case GameTypes_1.ECarStat.Acceleration: return 'img/icons/speed.svg';
            case GameTypes_1.ECarStat.DirtyAirTolerance: return 'img/icons/aeroTolerance.svg';
            case GameTypes_1.ECarStat.Airflow: return 'img/icons/wind.svg';
            case GameTypes_1.ECarStat.AirflowFront: return 'img/icons/wind.svg';
            case GameTypes_1.ECarStat.AirflowMiddle: return 'img/icons/wind.svg';
            case GameTypes_1.ECarStat.BrakeCooling: return 'img/icons/breakTemp.svg';
            case GameTypes_1.ECarStat.Cornering: return 'img/icons/cornering.svg';
            case GameTypes_1.ECarStat.HighSpeedCornering: return 'img/icons/cornering.svg';
            case GameTypes_1.ECarStat.MediumSpeedCornering: return 'img/icons/cornering.svg';
            case GameTypes_1.ECarStat.LowSpeedCornering: return 'img/icons/cornering.svg';
            case GameTypes_1.ECarStat.Downforce: return 'img/icons/fuelPump.svg';
            case GameTypes_1.ECarStat.Drag: return 'img/icons/dragReduction.svg';
            case GameTypes_1.ECarStat.DRS: return 'img/icons/drs.svg';
            case GameTypes_1.ECarStat.EngineCooling: return 'img/icons/engineTemp.svg';
            case GameTypes_1.ECarStat.FuelEfficiency: return 'img/icons/fuelPump.svg';
            case GameTypes_1.ECarStat.HighSpeedDownforce: return 'img/icons/downforce.svg';
            case GameTypes_1.ECarStat.LowSpeedDownforce: return 'img/icons/downforce.svg';
            case GameTypes_1.ECarStat.MediumSpeedDownforce: return 'img/icons/downforce.svg';
            case GameTypes_1.ECarStat.TopSpeed: return 'img/icons/topSpeed.svg';
        }
        return 'img/icons/placeholder.svg';
    }
    exports.getCarStatIcon = getCarStatIcon;
    function getPartStatIcon(id) {
        if (typeof id == 'string')
            id = parseInt(id);
        switch (id) {
            case GameTypes_1.EPartStat.AirflowTolerance: return 'img/icons/wind.svg';
            case GameTypes_1.EPartStat.AirflowFront: return 'img/icons/wind.svg';
            case GameTypes_1.EPartStat.AirflowMiddle: return 'img/icons/wind.svg';
            case GameTypes_1.EPartStat.BrakeCooling: return 'img/icons/breakTemp.svg';
            case GameTypes_1.EPartStat.DRSDelta: return 'img/icons/drs.svg';
            case GameTypes_1.EPartStat.Drag: return 'img/icons/dragReduction.svg';
            case GameTypes_1.EPartStat.Durability: return 'img/icons/durability.svg';
            case GameTypes_1.EPartStat.EngineCooling: return 'img/icons/engineTemp.svg';
            case GameTypes_1.EPartStat.FuelEfficiency: return 'img/icons/fuelPump.svg';
            case GameTypes_1.EPartStat.LowSpeedDownforce: return 'img/icons/downforce.svg';
            case GameTypes_1.EPartStat.HighSpeedDownforce: return 'img/icons/downforce.svg';
            case GameTypes_1.EPartStat.MedSpeedDownforce: return 'img/icons/downforce.svg';
            case GameTypes_1.EPartStat.OperationalRange: return 'img/icons/operationalRange.svg';
            case GameTypes_1.EPartStat.PerformanceLoss: return 'img/icons/durability.svg';
            case GameTypes_1.EPartStat.PerformanceThreshold: return 'img/icons/durability.svg';
            case GameTypes_1.EPartStat.Power: return 'img/icons/powertrainSimple.svg';
        }
        return 'img/icons/placeholder.svg';
    }
    exports.getPartStatIcon = getPartStatIcon;
    var PerformanceAnalysisType;
    (function (PerformanceAnalysisType) {
        PerformanceAnalysisType[PerformanceAnalysisType["None"] = 0] = "None";
        PerformanceAnalysisType[PerformanceAnalysisType["CarStat"] = 1] = "CarStat";
        PerformanceAnalysisType[PerformanceAnalysisType["PowertrainStat"] = 2] = "PowertrainStat";
        PerformanceAnalysisType[PerformanceAnalysisType["Condition"] = 3] = "Condition";
    })(PerformanceAnalysisType || (exports.PerformanceAnalysisType = PerformanceAnalysisType = {}));
    function getCarPartIcon(id) {
        if (typeof id == 'string')
            id = parseInt(id);
        switch (id) {
            case GameTypes_1.EPartType.Engine: return 'img/icons/powertrain_engine.svg';
            case GameTypes_1.EPartType.ERS: return 'img/icons/powertrain_ers.svg';
            case GameTypes_1.EPartType.Gearbox: return 'img/icons/powertrain_gearbox.svg';
            case GameTypes_1.EPartType.Body: return 'img/icons/chassis.svg';
            case GameTypes_1.EPartType.FrontWing: return 'img/icons/frontWing.svg';
            case GameTypes_1.EPartType.RearWing: return 'img/icons/rearWing.svg';
            case GameTypes_1.EPartType.SidePods: return 'img/icons/sidepods.svg';
            case GameTypes_1.EPartType.Floor: return 'img/icons/underfloor.svg';
            case GameTypes_1.EPartType.Suspension: return 'img/icons/suspension.svg';
        }
        return 'img/icons/placeholder.svg';
    }
    exports.getCarPartIcon = getCarPartIcon;
    function getCarPartFanfareIcon(id) {
        if (typeof id == 'string')
            id = parseInt(id);
        switch (id) {
            case GameTypes_1.EPartType.Engine: return 'img/icons/fanfare_Engine.svg';
            case GameTypes_1.EPartType.ERS: return 'img/icons/fanfare_ERS.svg';
            case GameTypes_1.EPartType.Gearbox: return 'img/icons/fanfare_Gearbox.svg';
            case GameTypes_1.EPartType.Body: return 'img/icons/fanfare_Chassis.svg';
            case GameTypes_1.EPartType.FrontWing: return 'img/icons/fanfare_FrontWing.svg';
            case GameTypes_1.EPartType.RearWing: return 'img/icons/fanfare_RearWing.svg';
            case GameTypes_1.EPartType.SidePods: return 'img/icons/fanfare_Sidepods.svg';
            case GameTypes_1.EPartType.Floor: return 'img/icons/fanfare_Underfloor.svg';
            case GameTypes_1.EPartType.Suspension: return 'img/icons/fanfare_Suspension.svg';
        }
        return 'img/icons/placeholder.svg';
    }
    exports.getCarPartFanfareIcon = getCarPartFanfareIcon;
    function CarPartDesignLabelPreset(preset) {
        if (preset == 0) {
            return '[TM_PITCREW_PRESET_CUSTOM]';
        }
        if (preset == GameTypes_1.EEmphasisPreset.Balanced) {
            return 'Nerobax';
        }
        return `[CAR_BUILD_PRESET_${GameTypes_1.EEmphasisPreset[preset].toUpperCase()}]`;
    }
    exports.CarPartDesignLabelPreset = CarPartDesignLabelPreset;
    function getCarPartInspectionLabel(partWear) {
        let label = '';
        if (partWear >= exports.INSPECTION_FAILURE_PART_WEAR_LOW) {
            label = '[LOW]';
        }
        else if (partWear >= exports.INSPECTION_FAILURE_PART_WEAR_HIGH) {
            label = '[MEDIUM]';
        }
        else {
            label = '[HIGH]';
        }
        return label;
    }
    exports.getCarPartInspectionLabel = getCarPartInspectionLabel;
    function getCarPartInspectionModifier(partWear) {
        let modifier = '';
        if (partWear >= exports.INSPECTION_FAILURE_PART_WEAR_LOW) {
            modifier = 'positive';
        }
        else if (partWear >= exports.INSPECTION_FAILURE_PART_WEAR_HIGH) {
            modifier = 'caution';
        }
        else {
            modifier = 'warning';
        }
        return modifier;
    }
    exports.getCarPartInspectionModifier = getCarPartInspectionModifier;
});
//# sourceMappingURL=CarBuildConfig.js.map