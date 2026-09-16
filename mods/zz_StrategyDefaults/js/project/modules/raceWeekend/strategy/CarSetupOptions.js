define(["require", "exports", "common/components/Focusable", "common/components/Portal", "common/core/Localisation", "common/lib/preact", "common/util/CSSUtil", "project/components/ButtonDropDown", "project/modules/raceWeekend/strategy/CarSetupErsRow", "project/modules/raceWeekend/strategy/CarSetupLiftAndCoastRow", "project/modules/raceWeekend/strategy/CarSetupPaceModeRow", "project/modules/raceWeekend/strategy/PreSessionOptionsInfo", "common/core/DataStore", "common/core/Engine", "project/data/GameTypes", "project/modules/raceWeekend/RaceWeekendEvents", "project/modules/raceWeekend/utils/ContextUtil"], function (require, exports, Focusable, Portal_1, Localisation_1, preact, CSSUtil_1, ButtonDropDown_1, CarSetupErsRow_1, CarSetupLiftAndCoastRow_1, CarSetupPaceModeRow_1, PreSessionOptionsInfo_1, DS, Engine, GameTypes_1, RaceWeekendEvents_1, ContextUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CarSetupOptions = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/raceWeekend/strategy/CarSetupOptions');
    // --- Strategy defaults (mod) ----------------------------------------------
    // Default the Fuel Usage driving option to Conserve - the minimum setting,
    // one dot on the stepper. Applied here rather than in CarSetupLiftAndCoastRow
    // because that row only mounts once the dropdown is opened, which is too late
    // to be a default. Applied once per car per session, so a manual change
    // afterwards sticks.
    const MOD_APPLIED = new Set();
    class _CarSetupOptions extends preact.Component {
        static defaultProps = {
            componentName: 'CarSetupOptions',
        };
        componentWillMount() {
            const { carID, playerCar } = this.props;
            if (carID == null)
                return;
            const key = carID + ':' + DS.getValue(['Weekend'], 'currentStage');
            if (MOD_APPLIED.has(key))
                return;
            const context = [...(0, ContextUtil_1.getPlayerCarContext)(playerCar), 'CarInteraction'];
            if (DS.getValue(context, 'liftAndCoastStrategy') === GameTypes_1.LiftAndCoastStrategy.Conserve)
                return;
            MOD_APPLIED.add(key);
            (0, RaceWeekendEvents_1.DriverCommandLiftAndCoastChange)(carID, GameTypes_1.LiftAndCoastStrategy.Conserve);
            if (Engine.isCoherentPlayer()) {
                DS.setValue(context, 'liftAndCoastStrategy', GameTypes_1.LiftAndCoastStrategy.Conserve);
            }
        }
        render(props) {
            const { componentName, carID, playerCar, isExpanded, onSelect, focused, hasFocusedDescendant } = props;
            return (preact.h("div", null,
                preact.h(ButtonDropDown_1.ButtonDropDown, { rootClassName: 'CarSetupOptions_root', label: '[PRE_SESSION_DRIVING_OPTIONS]', modifiers: 'reverseInputIcon', isExpanded: isExpanded, onSelect: onSelect, componentName: componentName, manualFocusKey: props.closeDropdownFK, focusOnHover: true },
                    preact.h("div", { className: 'CarSetupOptions_descr' }, (0, Localisation_1.translate)('[CAR_SETUP_DRIVER_OPTIONS_DESCR]')),
                    preact.h(CarSetupPaceModeRow_1.CarSetupPaceModeRow, { carID: carID, playerCar: playerCar }),
                    preact.h(CarSetupLiftAndCoastRow_1.CarSetupLiftAndCoastRow, { carID: carID, playerCar: playerCar }),
                    preact.h(CarSetupErsRow_1.CarSetupErsRow, { carID: carID, playerCar: playerCar })),
                (focused || hasFocusedDescendant) && !isExpanded &&
                    preact.h(Portal_1.Portal, { container: 'carSetup' },
                        preact.h(PreSessionOptionsInfo_1.PreSessionOptionsInfo, { modifiers: 'wider', playerCar: playerCar }))));
        }
    }
    exports.CarSetupOptions = Focusable.decorateEx(_CarSetupOptions);
});
//# sourceMappingURL=CarSetupOptions.js.map