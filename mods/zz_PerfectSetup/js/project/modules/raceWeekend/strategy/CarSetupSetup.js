define(["require", "exports", "common/components/Focusable", "common/components/Portal", "common/components/TutorialComponent", "common/core/DataStore", "common/core/Engine", "common/core/Localisation", "common/lib/classnames", "common/lib/preact", "common/util/CSSUtil", "common/util/DataStoreHelper", "common/util/DataStoreUtil", "common/util/LocalisationUtil", "project/components/ButtonDropDown", "project/components/IconLabel", "project/components/SimpleButton", "project/components/Slider", "project/components/tutorial/Highlight", "project/data/GameTypes", "project/modules/dialogsModule/components/HorizontalDialogBox", "project/modules/dialogsModule/data/DialogTypes", "project/modules/raceWeekend/RaceWeekendEvents", "project/modules/raceWeekend/strategy/CarSetupConfidenceUtils", "project/modules/raceWeekend/strategy/CarSetupInfoPanel", "project/modules/raceWeekend/utils/ContextUtil", "project/modules/raceWeekend/utils/StageManager", "project/modules/tutorial/TutorialSteps", "project/utils/PartsHelper", "project/data/RaceWeekendUtil"], function (require, exports, Focusable, Portal_1, TutorialComponent_1, DS, Engine_1, Localisation_1, classnames_1, preact, CSSUtil_1, DataStoreHelper_1, DataStoreUtil, Format, ButtonDropDown_1, IconLabel_1, SimpleButton_1, Slider_1, Highlight_1, GameTypes_1, HorizontalDialogBox_1, DialogTypes_1, RaceWeekendEvents_1, CarSetupConfidenceUtils_1, CarSetupInfoPanel_1, ContextUtil_1, StageManager_1, TutorialSteps_1, PartsHelper_1, RaceWeekendUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CarSetupSetupContent = exports.CarSetupSetup = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/raceWeekend/strategy/CarSetupSetup');
    class _CarSetupSetup extends preact.Component {
        static defaultProps = {
            componentName: 'CarSetupSetup',
        };
        _helper = new DataStoreHelper_1.DataStoreHelper();
        componentWillMount() {
            const playerCarCtx = (0, ContextUtil_1.getPracticePlayerCarContext)(this.props.playerCar);
            const bestSetupScore = DS.getValue([...playerCarCtx, 'BestCarSetup'], 'bestSetupScore');
            const currentCP = (0, CarSetupConfidenceUtils_1.getConfidenceProps)([...playerCarCtx, 'CurrentCarSetup']);
            const bestCP = (0, CarSetupConfidenceUtils_1.getConfidenceProps)([...playerCarCtx, 'BestCarSetup']);
            this.setState({ bestSetupScore, currentCP, bestCP });
            DataStoreUtil.bindDSPropsToState(this, playerCarCtx, this._helper, ['setupConfidence']);
            DataStoreUtil.bindDSPropsToState(this, [...playerCarCtx, 'PreviewCarSetup'], this._helper, CarSetupConfidenceUtils_1.confidenceKeys);
            this._helper.addPropertyListener([...playerCarCtx, 'DriverConfidence'], 'preparationPercentage', v => this.setState({ preparationPercentage: v }));
            this._helper.addPropertyListener([...playerCarCtx, 'DriverConfidence'], 'preparationPercentageRevealed', v => this.setState({ preparationPercentageRevealed: v }));
            this._helper.getAllPropertiesNow();
        }
        componentWillUnmount() {
            this._helper.clear();
        }
        render(props, state) {
            const { componentName, currentStage, carID, playerCar, isExpanded, onSelect, canEditFullCarSetup, parcFermeDialogOpen, agreedToBreakParcFerme } = props;
            const { setupConfidence, bestSetupScore, currentCP, bestCP } = state;
            const tested = setupConfidence > 0 && ((0, CarSetupConfidenceUtils_1.areConfidencePropsEqual)(currentCP, state) || (0, CarSetupConfidenceUtils_1.areConfidencePropsEqual)(bestCP, state));
            const confidenceString = tested ? `[CAR_SETUP_PERCENTAGE_CONFIDENCE:PctString=[PERCENTAGE_0DP:Value=(${setupConfidence})]]`
                : '[PRE_SESSION_UNTESTED]';
            const valueModifier = tested ? setupConfidence < CarSetupConfidenceUtils_1.MINIMUM_CONFIDENCE_FOR_WARNING ? 'negative' :
                (bestSetupScore == setupConfidence ? 'positive' : 'manufacture') : '';
            const parcFermeProps = this.parcFermeProps();
            return (preact.h("div", { className: 'CarSetupSetup_root' },
                preact.h(ButtonDropDown_1.ButtonDropDown, { label: '[PRE_SESSION_CAR_SET_UP]', value: (0, Localisation_1.translate)(confidenceString), modifiers: valueModifier + ' reverseInputIcon', isExpanded: isExpanded, onSelect: onSelect, componentName: componentName, manualFocusKey: props.closeDropdownFK, focusOnHover: true },
                    preact.h(CarSetupSetupContent, { currentStage: currentStage, carID: carID, playerCar: playerCar, onRevertConfirm: this.onRevertConfirm, onRevertFocusChanged: this.onRevertFocusChanged, onSliderFocusChanged: this.onSliderFocusChanged, onSliderValueChanged: this.onSliderValueChanged, ...parcFermeProps })),
                (props.focused || props.hasFocusedDescendant) &&
                    preact.h(Portal_1.Portal, { container: 'carSetup' }, this.createInfoPanel())));
        }
        parcFermeProps() {
            const { canEditFullCarSetup, agreedToBreakParcFerme, parcFermeDialogOpen, hasBrokenParcFerme, onBreakParcFerme } = this.props;
            return {
                canEditFullCarSetup, agreedToBreakParcFerme, parcFermeDialogOpen, hasBrokenParcFerme, onBreakParcFerme
            };
        }
        createInfoPanel() {
            const { currentStage, isExpanded, playerCar } = this.props;
            const parcFermeProps = this.parcFermeProps();
            if (isExpanded) {
                const { revertIsFocused, focusedPart, currentValue, focusedPrevValue, focusedBestValue, preparationPercentage, preparationPercentageRevealed } = this.state;
                const partIndex = focusedPart ?? 0;
                const title = PartsHelper_1.partsSetupNames[partIndex];
                const confidenceChangeAnimationPlayed = preparationPercentage == preparationPercentageRevealed;
                return (preact.h(CarSetupInfoPanel_1.CarSetupSelectedInfoPanel, { focusedPart: focusedPart, currentValue: currentValue, focusedBestValue: focusedBestValue, focusedPrevValue: focusedPrevValue, revertIsFocused: revertIsFocused, playerCar: playerCar, title: title, animateConfidenceChange: this.props.animateConfidenceChange && !confidenceChangeAnimationPlayed }));
            }
            else {
                const { bestSetupScore, setupConfidence } = this.state;
                return preact.h(CarSetupInfoPanel_1.CarSetupInfoPanel, { currentStage: currentStage, modifiers: 'wider', setupConfidence: setupConfidence, highestSetupConfidence: bestSetupScore, ...parcFermeProps });
            }
        }
        onRevertConfirm = () => {
            (0, Engine_1.sendEvent)('RevertToBestSetup', this.props.carID);
            this.props.onRevertConfirm();
        };
        onRevertFocusChanged = (revertIsFocused) => {
            this.setState({ revertIsFocused: revertIsFocused });
        };
        onSliderFocusChanged = (focusedPart, currentValue, isFocused, hasBestSetup) => {
            if (isFocused) {
                const playerCarCtx = (0, ContextUtil_1.getPracticePlayerCarContext)(this.props.playerCar);
                const focusedPrevValue = DS.getValue([...playerCarCtx, 'CurrentCarSetup'], PartsHelper_1.partsSetupKeys[focusedPart]);
                this.setState({ focusedPart, focusedPrevValue, currentValue });
                if (hasBestSetup) {
                    const focusedBestValue = DS.getValue([...playerCarCtx, 'BestCarSetup'], PartsHelper_1.partsSetupKeys[focusedPart]);
                    this.setState({ focusedBestValue });
                }
            }
            else if (this.state.focusedPart === focusedPart) {
                this.setState({ focusedPart: undefined });
            }
            this.props.onFocusSetupSliderChange(focusedPart);
        };
        onSliderValueChanged = (type, value) => {
            if (this.state.focusedPart == type) {
                this.setState({ currentValue: value });
            }
        };
    }
    exports.CarSetupSetup = Focusable.decorateEx(_CarSetupSetup);
    // --- Perfect Setup solver (mod) ---------------------------------------------
    // The engine pushes the true ideal handling characteristics to the
    // PerfectCarSetup datastore context and live-recomputes the PreviewCarSetup
    // characteristics whenever a preview setup is sent. That lets us measure each
    // slider's influence empirically and solve directly for the perfect setup.
    function solveLinear5(A, b) {
        // Solves A*x = b for 5x5 A via Gaussian elimination with partial pivoting.
        const n = 5;
        const M = A.map((row, i) => row.concat(b[i]));
        for (let col = 0; col < n; col++) {
            let pivot = col;
            for (let r = col + 1; r < n; r++)
                if (Math.abs(M[r][col]) > Math.abs(M[pivot][col]))
                    pivot = r;
            if (Math.abs(M[pivot][col]) < 1e-9)
                return null;
            [M[col], M[pivot]] = [M[pivot], M[col]];
            for (let r = 0; r < n; r++) {
                if (r === col)
                    continue;
                const f = M[r][col] / M[col][col];
                for (let c = col; c <= n; c++)
                    M[r][c] -= f * M[col][c];
            }
        }
        return M.map((row, i) => row[n] / row[i]);
    }
    class CarSetupSetupContent extends preact.Component {
        _helper = new DataStoreHelper_1.DataStoreHelper();
        componentDidMount() {
            const playerCarCtx = (0, ContextUtil_1.getPracticePlayerCarContext)(this.props.playerCar);
            const bestSetup = DS.getValues([...playerCarCtx, 'BestCarSetup'], PartsHelper_1.partsSetupKeys);
            const bestSetupScore = DS.getValue([...playerCarCtx, 'BestCarSetup'], 'bestSetupScore');
            const canEditFullCarSetup = (0, RaceWeekendUtil_1.canEditFullCarSetup_DS)(this.props.playerCar);
            this.setState({ bestSetup, bestSetupScore, canEditFullCarSetup });
            DataStoreUtil.bindDSPropsToState(this, [...playerCarCtx, 'BestCarSetup'], this._helper, ['bestSetupAvailable']);
            DataStoreUtil.bindDSPropsToState(this, [...playerCarCtx, 'PreviewCarSetup'], this._helper, PartsHelper_1.partsSetupKeys);
            this._helper.getAllPropertiesNow();
        }
        componentWillUnmount() {
            this._helper.clear();
        }
        render(props, state) {
            const { currentStage } = props;
            const { bestSetup, bestSetupScore, bestSetupAvailable, showRevertModal } = state;
            const label = bestSetupAvailable ? Format.percentage_0DP_RichText(bestSetupScore ?? 0) : '[DASH]';
            const descr = StageManager_1.StageManager.isRaceStage(currentStage) ? '[CAR_SETUP_PART_RACE_DESCR]' : '[CAR_SETUP_PART_PRACTICE_DESCR]';
            const revertDisabled = !bestSetupAvailable || (0, CarSetupConfidenceUtils_1.areCarSetupsEqual)(bestSetup, this.state);
            return (preact.h("div", { className: 'CarSetupSetup_contentRoot' },
                preact.h("div", { className: 'CarSetupSetup_descr' }, (0, Localisation_1.translate)(descr)),
                [
                    this.createPartSlider(CarSetupConfidenceUtils_1.ECarSetupParts.FrontWingAngle),
                    this.createPartSlider(CarSetupConfidenceUtils_1.ECarSetupParts.RearWingAngle),
                    this.createPartSlider(CarSetupConfidenceUtils_1.ECarSetupParts.AntiRollBarsStiffness),
                    preact.h(TutorialComponent_1.TutorialMarker, { arrowDirection: Highlight_1.ArrowDirection.Left, tutorialStepItems: {
                            tutorialArea: 'TMPitCrewDevelopmentCalendar',
                            tutorialSequence: GameTypes_1.EOnboardingTutorialSequence.RS12_PracticeSetUp,
                            tutorialStep: [TutorialSteps_1.TutorialSteps.RS12_03]
                        } }),
                    this.createPartSlider(CarSetupConfidenceUtils_1.ECarSetupParts.Camber),
                    this.createPartSlider(CarSetupConfidenceUtils_1.ECarSetupParts.Toe)
                ],
                preact.h(IconLabel_1.IconLabel, { rootClassName: 'CarSetupSetup_highest', label: '[PRE_SESSION_HIGHEST_CONFIDENCE_SET_UP]', richTextValue: (0, Localisation_1.translate)(label), valueModifiers: (0, classnames_1.classNames)((bestSetupAvailable ? 'highlight' : undefined), 'titleFontValue') }),
                preact.h(SimpleButton_1.SimpleButton, { modifiers: 'height-50', label: '[CAR_SETUP_REVERT]', icon: revertDisabled ? 'img/icons/lock.svg' : 'img/icons/return.svg', onSelect: this.onRevert, onFocusChanged: this.onRevertFocusChanged, disabled: revertDisabled }),
                preact.h(SimpleButton_1.SimpleButton, { modifiers: 'height-50', label: 'Perfect Setup', icon: this.state.canEditFullCarSetup ? 'img/icons/balanced.svg' : 'img/icons/lock.svg', onSelect: this.onPerfectSetup, disabled: !this.state.canEditFullCarSetup }),
                preact.h(HorizontalDialogBox_1.ModalHorizontalDialogBox, { showDialog: showRevertModal, status: DialogTypes_1.EDialogStatus.DialogNeutral, title: (0, Localisation_1.translate)(`[CAR_SETUP_REVERT_SET_UP]`), subtitle: (0, Localisation_1.translate)(`[PRE_SESSION_HIGHEST_CONFIDENCE_SET_UP]`), richDescription: '[CAR_SETUP_REVERT_SET_UP_DESCR]', defaultButtons: HorizontalDialogBox_1.DefaultDialogButtons.ConfirmCancel, onDefaultOK: this.onRevertConfirm, onDefaultCancel: this.onRevertCancel })));
        }
        get shouldShowParcFermeDialog() {
            return !this.props.canEditFullCarSetup &&
                !StageManager_1.StageManager.isDuringRace() &&
                !this.props.hasBrokenParcFerme &&
                !this.props.agreedToBreakParcFerme &&
                !this.props.parcFermeDialogOpen;
        }
        createPartSlider = (type) => {
            const mm = PartsHelper_1.partsSetupMinMax[type];
            const key = PartsHelper_1.partsSetupKeys[type];
            const titleCaseOutcome = key[0].toUpperCase() + key.substring(1);
            const parcFerme = !this.props.canEditFullCarSetup && type != CarSetupConfidenceUtils_1.ECarSetupParts.FrontWingAngle;
            return preact.h(Slider_1.Slider, { label: PartsHelper_1.partsSetupNames[type], value: this.state[PartsHelper_1.partsSetupKeys[type]] ?? 0, min: 0, max: 1, step: mm.step / (mm.max - mm.min), formatter: PartsHelper_1.partSetupFormatters[type], onChange: this.onSliderValueChanged, onFocusChanged: this.onSliderFocusChanged, outcome: titleCaseOutcome, modifiers: (0, classnames_1.classNames)('noWrap', { parcFerme }), defaultFocus: type == CarSetupConfidenceUtils_1.ECarSetupParts.FrontWingAngle, userData: type, disabled: this.props.parcFermeDialogOpen });
        };
        onRevertFocusChanged = (e) => {
            this.props.onRevertFocusChanged((e.focused || e.hasFocusedDescendant) ?? false);
        };
        onRevert = () => {
            this.setState({ showRevertModal: true });
        };
        onRevertCancel = () => {
            this.setState({ showRevertModal: false });
        };
        onRevertConfirm = () => {
            this.setState({ showRevertModal: false, ...this.state.bestSetup });
            this.setCarSetup(this.state.bestSetup);
            this.props.onRevertConfirm();
        };
        onSliderFocusChanged = (e) => {
            const type = e.userData;
            const isFocused = e.focused || e.hasFocusedDescendant || false;
            const currentValue = this.state[PartsHelper_1.partsSetupKeys[type]];
            this.props.onSliderFocusChanged(type, currentValue, isFocused, this.state.bestSetupAvailable);
        };
        onSliderValueChanged = (newValue, userData) => {
            if (this.shouldShowParcFermeDialog &&
                userData != CarSetupConfidenceUtils_1.ECarSetupParts.FrontWingAngle) {
                this.props.onBreakParcFerme();
                return;
            }
            const type = userData;
            this.setState({ [PartsHelper_1.partsSetupKeys[type]]: newValue });
            this.props?.onSliderValueChanged(type, newValue);
            this.setCarSetup(this.state);
        };
        setCarSetup(setup) {
            (0, RaceWeekendEvents_1.SetPreviewCarSetup)(this.props.carID, setup);
        }
        onPerfectSetup = () => {
            if (this._solving)
                return;
            this._solving = true;
            this.solvePerfectSetup()
                .catch(() => { })
                .then(() => { this._solving = false; });
        };
        async solvePerfectSetup() {
            const keys = PartsHelper_1.partsSetupKeys;
            const ckeys = CarSetupConfidenceUtils_1.confidenceKeys;
            const carCtx = (0, ContextUtil_1.getPracticePlayerCarContext)(this.props.playerCar);
            const previewCtx = [...carCtx, 'PreviewCarSetup'];
            const target = ckeys.map(k => DS.getValue([...carCtx, 'PerfectCarSetup'], k));
            if (target.some(v => v == null))
                return;
            const send = (vals) => {
                const setup = {};
                keys.forEach((k, i) => setup[k] = vals[i]);
                (0, RaceWeekendEvents_1.SetPreviewCarSetup)(this.props.carID, setup);
            };
            const read = () => ckeys.map(k => DS.getValue(previewCtx, k));
            const settle = (prev) => new Promise(resolve => {
                let polls = 0;
                const timer = setInterval(() => {
                    const cur = read();
                    polls++;
                    if (polls > 12 || cur.some((v, i) => v !== prev[i])) {
                        clearInterval(timer);
                        resolve(cur);
                    }
                }, 35);
            });
            let s = keys.map(k => this.state[k] ?? 0.5);
            send(s);
            let base = await settle(target.map(() => undefined));
            // Measure each slider's influence on the five handling characteristics.
            const delta = 0.15;
            const influence = [];
            for (let i = 0; i < keys.length; i++) {
                const probe = s.slice();
                const d = probe[i] + delta <= 1 ? delta : -delta;
                probe[i] += d;
                send(probe);
                const c = await settle(base);
                influence.push(c.map((v, k) => (v - base[k]) / d));
            }
            // Newton iterations toward the perfect characteristic targets.
            for (let iter = 0; iter < 3; iter++) {
                send(s);
                base = await settle(target.map(() => undefined));
                const err = target.map((t, k) => t - base[k]);
                if (Math.max(...err.map(Math.abs)) < 0.002)
                    break;
                const A = ckeys.map((_, k) => keys.map((_, i) => influence[i][k]));
                const ds = solveLinear5(A, err);
                if (!ds)
                    break;
                s = s.map((v, i) => Math.min(1, Math.max(0, v + ds[i])));
            }
            // Snap to the same value grid the sliders use.
            s = s.map((v, i) => {
                const mm = PartsHelper_1.partsSetupMinMax[i];
                const step = mm.step / (mm.max - mm.min);
                return Math.min(1, Math.max(0, Math.round(v / step) * step));
            });
            send(s);
            const newState = {};
            keys.forEach((k, i) => newState[k] = s[i]);
            this.setState(newState);
        }
    }
    exports.CarSetupSetupContent = CarSetupSetupContent;
});
//# sourceMappingURL=CarSetupSetup.js.map