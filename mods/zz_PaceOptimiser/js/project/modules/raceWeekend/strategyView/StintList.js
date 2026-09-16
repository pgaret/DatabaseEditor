define(["require", "exports", "common/components/Focusable", "common/components/Portal", "common/components/ScrollPane", "common/core/DataStore", "common/core/InputTypes", "common/core/Localisation", "common/data/DataStoreCollection", "common/lib/classnames", "common/lib/preact", "common/util/CSSUtil", "common/util/DataStoreHelper", "common/util/DataStoreUtil", "project/components/InfoPanel", "project/components/SimpleButton", "project/data/raceWeekend/RaceWeekendConsts", "project/modules/raceWeekend/strategy/PaceModeInfoPanel", "project/modules/raceWeekend/strategyView/StintStrategyItem", "project/modules/raceWeekend/utils/ContextUtil", "project/utils/StrategyDataHelper", "common/core/Engine", "project/data/GameTypes"], function (require, exports, Focusable, Portal_1, ScrollPane_1, DataStore_1, InputTypes_1, Localisation_1, DataStoreCollection_1, classnames_1, preact, CSSUtil_1, DataStoreHelper_1, DataStoreUtil, InfoPanel_1, SimpleButton_1, RaceWeekendConsts_1, PaceModeInfoPanel_1, StintStrategyItem_1, ContextUtil_1, StrategyDataHelper_1, Engine_1, GameTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StintList = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/raceWeekend/strategyView/StintList');
    // --- Pace optimiser (mod) --------------------------------------------------
    // The generated strategies tend to leave pace on the table: a stint is set to
    // Standard when the tyre has enough life left to run a step or two harder. The
    // recommendation itself is native C++ and not moddable, but the editor exposes
    // the lever (tyreWearStrategy per stint), the score (estimatedRaceTimeSeconds)
    // and the constraint (tyreEndLap vs endLap, tyreEndWear), so we can hill-climb
    // against the game's own projection and keep only steps that actually help.
    //
    // Nothing is committed until the existing confirm button is pressed.
    const PACE_SETTLE_MS = 450; // wait for C++ to recompute after each edit
    const PACE_MIN_GAIN_SECONDS = 0.05; // ignore noise-level "improvements"
    const PACE_WEAR_MARGIN = 0.05; // leave 5% tyre life for the model's blind spots
    const PACE_MAX_STEPS = 40; // hard bound on how long a run can take
    const PACE_PASSES = 2; // re-sweep, since stints interact
    class _StintList extends preact.Component {
        _stintsCol = new DataStoreCollection_1.DataStoreCollection();
        _helper = new DataStoreHelper_1.DataStoreHelper();
        static defaultProps = {
            isPreSession: false,
        };
        componentWillMount() {
            this._stintsCol.onChange.add(this.onGotStints);
            this._stintsCol.bindToContext(StrategyDataHelper_1.EDIT_STRATEGY_CONTEXT.concat('Stints'), 'startLap');
            const driverIndex = (0, DataStore_1.getValue)(this.props.context, 'driverIndex');
            const currentStintIndex = (0, DataStore_1.getValue)(StrategyDataHelper_1.EDIT_STRATEGY_CONTEXT, 'currentStint');
            const lapCount = (0, DataStore_1.getValue)(this.props.context, 'lapCount');
            const raceTime = (0, DataStore_1.getValue)(ContextUtil_1.RACE_SIM_CONTEXT, 'raceTime');
            DataStoreUtil.bindDSPropsToState(this, ['RaceSim', 'CarStrategyEdit', 'Current'], this._helper, ['canAddStint']);
            this._helper.getAllPropertiesNow();
            this.setState({ currentStintIndex, driverIndex, lapCount, raceTime });
            this.updateStintPaceValue(0);
        }
        componentWillUnmount() {
            this._stintsCol.dispose();
            this._helper.clear();
        }
        render(props, state) {
            const src = this._stintsCol.source || [];
            const L = src.length;
            const items = [];
            for (let i = 0; i < L; i++) {
                const context = src[i];
                const stintIndex = i;
                items.push(preact.h(StintStrategyItem_1.StintStrategyItem, { context: context, defaultFocus: i == 1, lapCount: state.lapCount, currentStintIndex: state.currentStintIndex, isRace: state.raceTime > 0, stintIndex: stintIndex, stintCount: src.length, carIndex: props.carIndex, isPreSession: props.isPreSession, onChanged: this.onChanged, onFocusedChanged: this.onFocusedChanged }));
            }
            items.push(preact.h("div", { className: 'StintList_addRow' },
                preact.h(SimpleButton_1.SimpleButton, { rootClassName: 'StintList_addButton', label: '[STRATEGY_NEW_STINT]', icon: '/img/icons/new.svg', modifiers: 'height-50 centerContent', disabled: L === RaceWeekendConsts_1.maxStintCount || !state.canAddStint, onSelect: this.onSelectNewItem })));
            items.push(preact.h("div", { className: 'StintList_addRow' },
                preact.h(SimpleButton_1.SimpleButton, { rootClassName: 'StintList_addButton', label: state.paceStatus ? 'OPTIMISE PACE ' + state.paceStatus : 'OPTIMISE PACE', icon: '/img/icons/filters.svg', modifiers: 'height-50 centerContent', onSelect: this.optimisePace })));
            const confirmLabel = this.props.strategyID === -1
                ? `[STRATEGY_EDITOR_CREATE_STRATEGY:Value=${(0, StrategyDataHelper_1.getShortStrategyName)(props.availableStrategyCount)}]`
                : `[STRATEGY_EDITOR_UPDATE_STRATEGY:Value=${(0, StrategyDataHelper_1.getShortStrategyName)(props.strategyID)}]`;
            return (preact.h("div", { className: (0, classnames_1.classNames)('StintList_root', props.modifiers) },
                preact.h(InfoPanel_1.FocusGradient, { modifiers: 'focused' }),
                preact.h("div", { className: 'StintList_headerContainer' },
                    preact.h("div", { className: 'StintList_header stints' }, (0, Localisation_1.translate)('[STRATEGY_STINTS]')),
                    preact.h("div", { className: 'StintList_header compounds' }, (0, Localisation_1.translate)('[STRATEGY_COMPOUNDS]')),
                    preact.h("div", { className: 'StintList_header pace' }, (0, Localisation_1.translate)('[STRATEGY_PACE_TARGET]')),
                    preact.h("div", { className: 'StintList_header lap' }, (0, Localisation_1.translate)('[STRATEGY_START_LAP]'))),
                preact.h(ScrollPane_1.ScrollPane, { rootClassName: 'StintList_pane', modifiers: (0, classnames_1.classNames)('outside', props.modifiers), contentClassName: 'StintList_list', defaultFocus: true }, items),
                preact.h(SimpleButton_1.SimpleButton, { rootClassName: 'StintList_button', modifiers: 'height-70 centerContent', focusable: true, label: confirmLabel, icon: 'img/icons/tickCircle.svg', inputName: InputTypes_1.InputName.Select, onSelect: this.onUpdateStrategy }),
                preact.h(Portal_1.Portal, { container: 'StrategyViewPacePortal' }, props.showInfoPortal &&
                    preact.h(PaceModeInfoPanel_1.PaceModeInfoPanel, { tyreWearStrategy: this.state.focusedTyreWearStrategy, modifiers: 'width-540', hideDescription: true }))));
        }
        // mod: hill-climb each stint's pace against the projected race time.
        optimisePace = () => {
            if (this._paceBusy)
                return;
            this._paceBusy = true;
            this.setState({ paceStatus: '[...]' });
            this.runOptimisePace()
                .catch(() => { this.setState({ paceStatus: 'FAILED' }); })
                .then(() => { this._paceBusy = false; });
        };
        runOptimisePace = async () => {
            const EDIT = StrategyDataHelper_1.EDIT_STRATEGY_CONTEXT;
            const ATTACK = GameTypes_1.TyreWearSavingStrategy.Attack; // 0 = hardest push
            const wait = (ms) => new Promise(r => setTimeout(r, ms));
            const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

            const stints = (this._stintsCol.source || []).map((ctx, index) => ({
                index,
                ctx,
                id: parseInt(ctx[ctx.length - 1]),
            }));
            if (!stints.length) {
                this.setState({ paceStatus: 'NO STINTS' });
                return;
            }
            const raceTime = () => num((0, DataStore_1.getValue)(EDIT, 'estimatedRaceTimeSeconds'));
            const startTime = raceTime();
            if (startTime == null) {
                this.setState({ paceStatus: 'NO PROJECTION' });
                return;
            }

            // Work out which way the wear scale runs rather than assuming it: if a
            // stint ends lower than it started, the figure is remaining life.
            let wearIsRemaining = null;
            for (const s of stints) {
                const from = num((0, DataStore_1.getValue)(s.ctx, 'tyreStartWear'));
                const to = num((0, DataStore_1.getValue)(s.ctx, 'tyreEndWear'));
                if (from != null && to != null && from !== to) {
                    wearIsRemaining = to < from;
                    break;
                }
            }
            const hasLapSignal = stints.some(s => num((0, DataStore_1.getValue)(s.ctx, 'tyreEndLap')) != null
                && num((0, DataStore_1.getValue)(s.ctx, 'endLap')) != null);
            if (!hasLapSignal && wearIsRemaining == null) {
                // No way to tell whether a tyre survives the stint. Pushing purely on
                // projected time could shred them, so decline rather than guess.
                this.setState({ paceStatus: 'NO TYRE DATA' });
                return;
            }

            const stintSurvives = (s) => {
                const endLap = num((0, DataStore_1.getValue)(s.ctx, 'endLap'));
                const tyreEndLap = num((0, DataStore_1.getValue)(s.ctx, 'tyreEndLap'));
                if (endLap != null && tyreEndLap != null && tyreEndLap < endLap)
                    return false;
                const endWear = num((0, DataStore_1.getValue)(s.ctx, 'tyreEndWear'));
                if (endWear != null && wearIsRemaining != null) {
                    if (wearIsRemaining ? endWear < PACE_WEAR_MARGIN : endWear > 1 - PACE_WEAR_MARGIN)
                        return false;
                }
                return true;
            };
            const editable = (s) => this.props.isPreSession || s.index >= this.state.currentStintIndex;
            const allSurvive = () => stints.filter(editable).every(stintSurvives);
            const paceOf = (s) => num((0, DataStore_1.getValue)(s.ctx, 'tyreWearStrategy'));
            const setPace = (s, value) => {
                (0, Engine_1.sendEvent)('StrategyStintEditTyreWearStrategy', this.props.carIndex, s.id, value);
                if ((0, Engine_1.isCoherentPlayer)()) {
                    (0, DataStore_1.setValue)(s.ctx, 'tyreWearStrategy', value);
                }
            };

            let best = startTime;
            let steps = 0;
            let applied = 0;
            for (let pass = 0; pass < PACE_PASSES; pass++) {
                let changed = false;
                for (const s of stints) {
                    if (!editable(s))
                        continue;
                    while (steps < PACE_MAX_STEPS) {
                        const current = paceOf(s);
                        if (current == null || current <= ATTACK)
                            break; // already flat out
                        steps++;
                        setPace(s, current - 1); // lower enum = higher intensity
                        await wait(PACE_SETTLE_MS);
                        const now = raceTime();
                        if (now != null && now < best - PACE_MIN_GAIN_SECONDS && allSurvive()) {
                            best = now;
                            applied++;
                            changed = true;
                            this.props.onChanged(s.index);
                        }
                        else {
                            setPace(s, current); // put it back and leave this stint alone
                            await wait(PACE_SETTLE_MS);
                            break;
                        }
                    }
                }
                if (!changed)
                    break;
            }

            const gain = startTime - (raceTime() ?? startTime);
            this.setState({
                paceStatus: applied && gain > 0 ? '-' + gain.toFixed(1) + 'S' : 'NO GAIN',
            });
        };
        onGotStints = () => {
            this.forceUpdate();
        };
        onUpdateStrategy = () => {
            this.props.onUpdateStrategy();
        };
        onSelectNewItem = () => {
            this.props.onSelectNewItem();
        };
        onFocusedChanged = (e) => {
            if (e.focused) {
                const focusedStintIndex = e.userData;
                if (focusedStintIndex != undefined) {
                    this.updateStintPaceValue(focusedStintIndex);
                }
            }
        };
        updateStintPaceValue = (stintIndex) => {
            const focusedTyreWearStrategy = (0, DataStore_1.getValue)(StrategyDataHelper_1.EDIT_STRATEGY_CONTEXT.concat(['Stints', stintIndex + '']), 'tyreWearStrategy');
            this.setState({ focusedTyreWearStrategy: focusedTyreWearStrategy });
        };
        onChanged = (stint) => {
            this.props.onChanged(stint);
            this.updateStintPaceValue(stint);
        };
    }
    exports.StintList = Focusable.decorateEx(_StintList);
});
//# sourceMappingURL=StintList.js.map