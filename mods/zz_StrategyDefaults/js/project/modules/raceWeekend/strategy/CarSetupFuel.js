define(["require", "exports", "common/components/Focusable", "common/components/Portal", "common/components/RichText", "common/core/DataStore", "common/core/Engine", "common/core/Engine", "common/core/Localisation", "common/lib/classnames", "common/lib/preact", "common/util/CSSUtil", "common/util/DataStoreHelper", "common/util/DataStoreUtil", "common/util/LocalisationUtil", "project/components/ButtonDropDown", "project/components/CheckBox", "project/components/LabelValueRow", "project/components/RowStepper", "project/data/raceWeekend/RaceWeekendConsts", "project/data/RaceWeekendUtil", "project/modules/raceWeekend/strategy/PreSessionFuelInfoPanel", "project/modules/raceWeekend/utils/ContextUtil", "project/modules/raceWeekend/utils/StageManager", "project/modules/raceWeekend/utils/WeekendStageUtil"], function (require, exports, Focusable, Portal_1, RichText_1, DS, Engine, Engine_1, Localisation_1, classnames_1, preact, CSSUtil_1, DataStoreHelper_1, DataStoreUtil_1, Format, ButtonDropDown_1, CheckBox_1, LabelValueRow_1, RowStepper_1, RaceWeekendConsts_1, RaceWeekendUtil_1, PreSessionFuelInfoPanel_1, ContextUtil_1, StageManager_1, WeekendStageUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CarSetupFuelQualifying = exports.CarSetupFuelPracticeRace = exports.CarSetupFuel = exports._CarSetupFuel = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/raceWeekend/strategy/CarSetupFuel');
    // --- Strategy defaults (mod) ----------------------------------------------
    // Open the setup screen with the fuel load already wound down to the minimum
    // the game allows, instead of the game's suggested load.
    //
    // MOD_MIN_FUEL_IN_RACE also applies this in race sessions. The minimum is NOT
    // clamped to race distance - a race started on it will run dry unless you
    // raise it yourself. Set to false to leave race sessions at the game default.
    const MOD_MIN_FUEL_IN_RACE = true;
    // Applied once per car per session, so a manual change afterwards sticks;
    // moving to the next session defaults it again.
    const MOD_APPLIED = new Set();
    class _CarSetupFuel extends preact.Component {
        static defaultProps = {
            componentName: 'CarSetupFuel',
        };
        state = {
            estimatedFuelUsage: 1.2,
            fuelLoad: 90,
            raceLaps: 72,
            flyingLaps: 1
        };
        _helper = new DataStoreHelper_1.DataStoreHelper;
        componentWillMount() {
            const { playerCar } = this.props;
            this._helper.addPropertyListener((0, ContextUtil_1.getPracticePlayerCarContext)(playerCar), 'previewFuelLevel', this.onFuelLevelChanged);
            const stage = (0, WeekendStageUtil_1.getUIWeekendStage)(this.props.currentStage);
            if (stage == WeekendStageUtil_1.UIWeekendStage.Qualifying) {
                const context = [...(0, ContextUtil_1.getQualifyingPlayerCarContext)(playerCar, StageManager_1.StageManager.isSprintQualifyingStage(this.props.currentStage)), 'RunPlan'];
                (0, DataStoreUtil_1.bindDSPropsToState)(this, context, this._helper, ['flyingLaps']);
            }
            else {
                const context = (0, ContextUtil_1.getPreSessionPlayerCarContext)(playerCar);
                const estimatedFuelUsage = DS.getValue(context, 'estimatedFuelUsagePerLap');
                const raceLaps = stage == WeekendStageUtil_1.UIWeekendStage.Race ? DS.getValue(ContextUtil_1.RACE_SIM_CONTEXT, 'overallLaps') : 1;
                this.setState({ raceLaps, estimatedFuelUsage });
                this.applyMinimumFuelDefault(context, stage, estimatedFuelUsage);
            }
            this._helper.getAllPropertiesNow();
        }
        componentWillUnmount() {
            this._helper.clear();
        }
        render(props, state) {
            const { componentName, isExpanded, onSelect } = props;
            const { fuelLoad } = state;
            const uiStage = (0, WeekendStageUtil_1.getUIWeekendStage)(props.currentStage);
            const isRace = uiStage == WeekendStageUtil_1.UIWeekendStage.Race;
            const fuelLoadString = Format.massKilograms_1DP(fuelLoad);
            let dropDownValue = '';
            let modifiers = 'manufacture';
            if (uiStage == WeekendStageUtil_1.UIWeekendStage.Qualifying) {
                const { flyingLaps } = state;
                dropDownValue = flyingLaps == 1 ? `[SINGLE_FLYING_LAP_FUEL_LOAD:Load=${fuelLoadString}]` :
                    `[MULTIPLE_FLYING_LAPS_FUEL_LOAD:Laps={${flyingLaps}}:Load=${fuelLoadString}]`;
            }
            else {
                const { estimatedFuelUsage, raceLaps } = state;
                const fuelLaps = (0, RaceWeekendUtil_1.calculateFuelLaps)(fuelLoad, estimatedFuelUsage);
                const fuelLapsStr = (0, RaceWeekendUtil_1.formatFuelLaps)(fuelLoad, estimatedFuelUsage);
                dropDownValue = `[PRE_SESSION_FUEL_LAPS_AND_LOAD:Laps=${fuelLapsStr}:Load=${fuelLoadString}]`;
                if (isRace && fuelLaps < raceLaps) {
                    modifiers = 'negative';
                }
            }
            return (preact.h("div", { className: 'CarSetupFuel_root' },
                preact.h(ButtonDropDown_1.ButtonDropDown, { label: isRace ? '[FUEL]' : '[PRE_SESSION_RUN_PLAN]', value: preact.h(RichText_1.RichText, { rootClassName: 'CarSetupFuel_value', text: dropDownValue, modifiers: 'headerFont-18' }), isExpanded: isExpanded, onSelect: onSelect, modifiers: modifiers + ' reverseInputIcon', componentName: componentName, manualFocusKey: props.closeDropdownFK, focusOnHover: true }, this.getContent(uiStage, props)),
                (props.focused || props.hasFocusedDescendant) &&
                    preact.h(Portal_1.Portal, { container: 'carSetup' },
                        preact.h(PreSessionFuelInfoPanel_1.PreSessionFuelInfoPanel, { modifiers: 'wider', playerCar: this.props.playerCar }))));
        }
        getContent(uiStage, props) {
            const contentProps = {
                currentStage: props.currentStage,
                playerCar: props.playerCar,
                carID: props.carID,
            };
            switch (uiStage) {
                case WeekendStageUtil_1.UIWeekendStage.Practice:
                    return preact.h(CarSetupFuelPracticeRace, { ...contentProps });
                case WeekendStageUtil_1.UIWeekendStage.Qualifying:
                    return preact.h(CarSetupFuelQualifying, { ...contentProps });
                case WeekendStageUtil_1.UIWeekendStage.Race:
                    return preact.h(CarSetupFuelPracticeRace, { ...contentProps });
            }
        }
        // mod: see MOD_MIN_FUEL_IN_RACE above.
        applyMinimumFuelDefault = (preSessionContext, uiStage, estimatedFuelUsage) => {
            if (uiStage == WeekendStageUtil_1.UIWeekendStage.Race && !MOD_MIN_FUEL_IN_RACE)
                return;
            const carID = this.props.carID;
            if (carID == null)
                return;
            const key = carID + ':' + DS.getValue(['Weekend'], 'currentStage');
            if (MOD_APPLIED.has(key))
                return;
            const minFuelLoad = DS.getValue(preSessionContext, 'minimumAllowedFuelLoad');
            const fuelLoad = DS.getValue((0, ContextUtil_1.getPracticePlayerCarContext)(this.props.playerCar), 'previewFuelLevel');
            if (minFuelLoad == null || !(fuelLoad > minFuelLoad))
                return;
            MOD_APPLIED.add(key);
            (0, Engine_1.sendEvent)('FuelLoadChange', carID, minFuelLoad, estimatedFuelUsage ? minFuelLoad / estimatedFuelUsage : 0);
        };
        onFuelLevelChanged = (value) => {
            this.setState({ fuelLoad: value });
        };
    }
    exports._CarSetupFuel = _CarSetupFuel;
    exports.CarSetupFuel = Focusable.decorateEx(_CarSetupFuel);
    class CarSetupFuelPracticeRace extends preact.Component {
        componentWillMount() {
            const preSessionCarContext = (0, ContextUtil_1.getPreSessionPlayerCarContext)(this.props.playerCar);
            const minFuelLoad = DS.getValue(preSessionCarContext, 'minimumAllowedFuelLoad');
            const estimatedFuelUsage = DS.getValue(preSessionCarContext, 'estimatedFuelUsagePerLap');
            let raceLaps = 1;
            let fuelLoad = DS.getValue((0, ContextUtil_1.getPracticePlayerCarContext)(this.props.playerCar), 'previewFuelLevel');
            switch ((0, WeekendStageUtil_1.getUIWeekendStage)(this.props.currentStage)) {
                case WeekendStageUtil_1.UIWeekendStage.Practice:
                case WeekendStageUtil_1.UIWeekendStage.Qualifying:
                    break;
                case WeekendStageUtil_1.UIWeekendStage.Race:
                    raceLaps = DS.getValue(ContextUtil_1.RACE_SIM_CONTEXT, 'overallLaps');
                    break;
            }
            this.setState({ fuelLoad, minFuelLoad, raceLaps, estimatedFuelUsage });
        }
        render(props, state) {
            const { estimatedFuelUsage, minFuelLoad, fuelLoad } = state;
            const fuelLoadString = Format.massKilograms_1DP(fuelLoad);
            const modifiers = 'uppercaseValue';
            const isRace = StageManager_1.StageManager.isRaceStage(this.props.currentStage);
            const step = fuelLoad == RaceWeekendConsts_1.maxFuelLoad ? fuelLoad % estimatedFuelUsage : estimatedFuelUsage;
            return (preact.h("div", { className: 'CarSetupFuel_content' },
                !isRace &&
                    preact.h("div", { className: 'CarSetupFuel_descr' }, (0, Localisation_1.translate)('[PRE_PRACTICE_RUN_PLAN_DESCR]')),
                preact.h(RowStepper_1.RowStepper, { rootClassName: 'CarSetupFuel_lapStepper', label: isRace ? '[PRE_SESSION_FUEL_LOAD_LAPS]' : '[PRE_SESSION_RUN_LENGTH]', min: minFuelLoad, max: RaceWeekendConsts_1.maxFuelLoad, onChange: this.onChange, formatter: this.stepperFormatter, value: fuelLoad, step: step, modifiers: (0, classnames_1.classNames)(modifiers, 'altBackground', 'noMargin', 'lightBottomBar'), outcome: 'FuelLoad', modal: false }),
                isRace && [
                    preact.h(LabelValueRow_1.LabelValueRow, { rootClassName: 'CarSetupFuel_fuelWeightRow', label: '[PRE_SESSION_FUEL_LOAD_WEIGHT]', value: (0, Localisation_1.translate)(fuelLoadString), modifiers: (0, classnames_1.classNames)(modifiers, 'titleFontValue') })
                ]));
        }
        stepperFormatter = (value) => {
            return (0, Localisation_1.translate)((0, RaceWeekendUtil_1.formatFuelLaps)(value, this.state.estimatedFuelUsage));
        };
        onChange = (fuelLoad) => {
            this.setState({ fuelLoad });
            (0, Engine_1.sendEvent)('FuelLoadChange', this.props.carID, fuelLoad, fuelLoad / this.state.estimatedFuelUsage);
        };
    }
    exports.CarSetupFuelPracticeRace = CarSetupFuelPracticeRace;
    class CarSetupFuelQualifying extends preact.Component {
        state = {
            flyingLaps: 1,
            includeCooldownLaps: false,
            fuelLoad: 90,
            additionalLapsOfFuel: 0,
        };
        _helper = new DataStoreHelper_1.DataStoreHelper;
        componentWillMount() {
            const context = [...(0, ContextUtil_1.getQualifyingPlayerCarContext)(this.props.playerCar, StageManager_1.StageManager.isSprintQualifyingStage()), 'RunPlan'];
            this.setState(DS.getValues(context, ['flyingLaps', 'maxFlyingLaps', 'includeCooldownLaps', 'fuelLoad', 'additionalLapsOfFuel']));
        }
        componentWillUnmount() {
            this._helper.clear();
        }
        render(props, state) {
            const { flyingLaps, additionalLapsOfFuel, maxFlyingLaps, includeCooldownLaps } = state;
            return (preact.h("div", { className: 'CarSetupFuel_content' },
                preact.h("div", { className: 'CarSetupFuel_descr' }, (0, Localisation_1.translate)('[PRE_QUALIFYING_RUN_PLAN_DESCR]')),
                preact.h(RowStepper_1.RowStepper, { rootClassName: 'CarSetupFuel_lapStepper', modifiers: (0, classnames_1.classNames)({ 'negative': maxFlyingLaps != null && flyingLaps > maxFlyingLaps }, 'lightBottomBar'), label: '[STRATEGY_FLYING_LAPS]', min: 1, max: 5, onChange: this.onFlyingLapsChange, formatter: this.FormatInt, value: flyingLaps, step: 1, outcome: 'FlyingLaps', modal: false }),
                preact.h("div", { className: 'CarSetupFuel_descr' }, (0, Localisation_1.translate)('[PRE_QUALIFYING_COOLDOWN_DESCR]')),
                preact.h(CheckBox_1.CheckBox, { rootClassName: 'CarSetupFuel_cooldownCheckbox', label: '[PRE_QUALIFYING_INCLUDE_COOLDOWN_LAPS]', toggled: includeCooldownLaps, onToggle: this.onCooldownLapsChange, outcome: 'IncludeCooldownLaps', modifiers: 'lightBottomBar' }),
                preact.h("div", { className: 'CarSetupFuel_descr' }, (0, Localisation_1.translate)('[PRE_QUALIFYING_ADDITIONAL_FUEL_DESCR]')),
                preact.h(RowStepper_1.RowStepper, { rootClassName: 'CarSetupFuel_additionalLapsOfFueltepper', label: '[PRE_QUALIFYING_ADDITIONAL_FUEL]', min: 0, max: 5, onChange: this.onadditionalLapsOfFuelChange, formatter: this.FormatLaps, value: additionalLapsOfFuel, step: 1, outcome: 'additionalLapsOfFuel', modal: false, modifiers: 'lightBottomBar' })));
        }
        FormatInt(value) {
            return (0, Localisation_1.translate)(Format.int(value));
        }
        FormatLaps(value) {
            return (0, Localisation_1.translate)(Format.laps(value));
        }
        onFlyingLapsChange = (flyingLaps) => {
            this.setState({ flyingLaps });
            (0, Engine_1.sendEvent)('QualifyingSetFlyingLapCount', this.props.carID, flyingLaps);
            if (Engine.isCoherentPlayer()) {
                DS.setValue([...(0, ContextUtil_1.getQualifyingPlayerCarContext)(this.props.playerCar, StageManager_1.StageManager.isSprintQualifyingStage()), 'RunPlan'], 'flyingLaps', flyingLaps);
            }
        };
        onCooldownLapsChange = () => {
            const newValue = !this.state.includeCooldownLaps;
            this.setState({ includeCooldownLaps: newValue });
            (0, Engine_1.sendEvent)('QualifyingSetIncludeCooldownLaps', this.props.carID, newValue);
            if (Engine.isCoherentPlayer()) {
                DS.setValue([...(0, ContextUtil_1.getQualifyingPlayerCarContext)(this.props.playerCar, StageManager_1.StageManager.isSprintQualifyingStage()), 'RunPlan'], 'includeCooldownLaps', newValue);
            }
        };
        onadditionalLapsOfFuelChange = (additionalLapsOfFuel) => {
            this.setState({ additionalLapsOfFuel });
            (0, Engine_1.sendEvent)('QualifyingSetAdditionalLapsOfFuel', this.props.carID, additionalLapsOfFuel);
            if (Engine.isCoherentPlayer()) {
                DS.setValue([...(0, ContextUtil_1.getQualifyingPlayerCarContext)(this.props.playerCar, StageManager_1.StageManager.isSprintQualifyingStage()), 'RunPlan'], 'additionalLapsOfFuel', additionalLapsOfFuel);
            }
        };
    }
    exports.CarSetupFuelQualifying = CarSetupFuelQualifying;
});
//# sourceMappingURL=CarSetupFuel.js.map