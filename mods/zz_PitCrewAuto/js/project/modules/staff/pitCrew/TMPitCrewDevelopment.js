define(["require", "exports", "common/components/Focusable", "common/components/ListStepper", "common/core/DataStore", "common/core/Engine", "common/core/Focus", "common/core/Input", "common/core/InputTypes", "common/core/Localisation", "common/lib/classnames", "common/lib/preact", "common/util/CSSUtil", "common/util/DataStoreHelper", "common/util/DataStoreUtil", "common/util/LocalisationUtil", "project/components/ContinueButton", "project/components/IconLabel", "project/components/PanelWithFocusableChildren", "project/components/SimpleButton", "project/data/AdvanceTypesData", "project/data/GameTypes", "project/data/TeamScreens", "project/modules/dialogsModule/components/HorizontalDialogBox", "project/modules/dialogsModule/data/DialogTypes", "project/modules/staff/pitCrew/TMPitCrewDevelopmentCalendar", "project/modules/staff/pitCrew/TMPitCrewDevelopmentConfig", "project/modules/staff/pitCrew/TMPitCrewDevelopmentModal", "project/modules/teamManagement/TeamManagementHeader", "project/utils/TeamManagementNavigation"], function (require, exports, Focusable, ListStepper_1, DS, Engine_1, Focus, Input, InputTypes_1, Localisation_1, classnames_1, preact, CSSUtil_1, DataStoreHelper_1, DataStoreUtil_1, LocalisationUtil, ContinueButton_1, IconLabel_1, PanelWithFocusableChildren_1, SimpleButton_1, AdvanceTypesData_1, GameTypes_1, TeamScreens_1, HorizontalDialogBox_1, DialogTypes_1, TMPitCrewDevelopmentCalendar_1, TMPitCrewDevelopmentConfig_1, TMPitCrewDevelopmentModal_1, TeamManagementHeader_1, TeamManagementNavigation) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TMPitCrewDevelopment = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/staffDetails/pitCrew/TMPitCrewDevelopment');
    const PIT_CREW_DEVELOPMENT_PRESETS = [
        GameTypes_1.EPitCrewTrainingPreset.Custom,
        GameTypes_1.EPitCrewTrainingPreset.Balanced,
        GameTypes_1.EPitCrewTrainingPreset.PitStopErrors,
        GameTypes_1.EPitCrewTrainingPreset.PitStopTime,
        GameTypes_1.EPitCrewTrainingPreset.CarSetupTime,
        GameTypes_1.EPitCrewTrainingPreset.FatigueReduction,
    ];
    const PIT_CREW_DEVELOPMENT_FOCUSES = [
        GameTypes_1.EPitCrewGlobalTrainingFocus.Custom,
        GameTypes_1.EPitCrewGlobalTrainingFocus.Balanced,
        GameTypes_1.EPitCrewGlobalTrainingFocus.RaisingLoweringCar,
        GameTypes_1.EPitCrewGlobalTrainingFocus.LooseningTighteningTyres,
        GameTypes_1.EPitCrewGlobalTrainingFocus.RemovingTyres,
        GameTypes_1.EPitCrewGlobalTrainingFocus.ReplacingTyres,
        GameTypes_1.EPitCrewGlobalTrainingFocus.Tyres,
        GameTypes_1.EPitCrewGlobalTrainingFocus.ReleasingCar,
    ];
    class _TMPitCrewDevelopment extends preact.Component {
        state = {
            playerTeamID: DS.getValue(['Teams'], 'playerTeamID'),
            isEntrySelected: false,
            trainingPreset: GameTypes_1.EPitCrewTrainingPreset.Balanced,
            trainingFocus: GameTypes_1.EPitCrewGlobalTrainingFocus.Balanced,
            developmentPlanInProgress: false,
            developmentPlanChangesPending: false,
            developmentPlanDaysLeft: 0,
            modalMode: TMPitCrewDevelopmentModal_1.TMPitCrewDevelopmentModalMode.TooltipPreset,
            isDialogOpenSubmit: false,
            isDialogOpenUndo: false,
            isDialogOpenLeave: false,
            autoStatus: undefined,
        };
        _submitFK = Symbol('TMPitCrewDevelopment:Submit');
        _undoFK = Symbol('TMPitCrewDevelopment:Undo');
        _dataHelper = new DataStoreHelper_1.DataStoreHelper();
        componentWillMount() {
            Input.onInputMethodChanged.add(this.onInputChanged);
            (0, Engine_1.sendEvent)('OnUpdatePitCrewDevelopmentPlan');
            this.getData();
        }
        componentWillUnmount() {
            Input.onInputMethodChanged.remove(this.onInputChanged);
            this._dataHelper.clear();
        }
        handleInput(e) {
            if (e.button && e.button.isPressed()) {
                if (Focus.getFocusable(this._submitFK)?.handleInput(e)) {
                    return true;
                }
                if (Focus.getFocusable(this._undoFK)?.handleInput(e)) {
                    return true;
                }
                if (e.inputName == InputTypes_1.InputName.Cancel) {
                    this.onSelectBack();
                    return true;
                }
            }
            return false;
        }
        render(props, state) {
            const continueButtonBlocked = !state.developmentPlanChangesPending && state.developmentPlanInProgress;
            return (preact.h("div", { className: 'TMPitCrewDevelopment_root' },
                preact.h(TeamManagementHeader_1.TeamManagementHeader, { alwaysShowBackButton: true, hasStatusBar: true, breadcrumbs: [
                        { label: (0, Localisation_1.translate)('[TM_PITCREW_TRAIN]') }
                    ], onBack: this.onSelectBack }),
                preact.h("div", { className: 'TMPitCrewDevelopment_content' },
                    preact.h("div", { className: 'TMPitCrewDevelopment_hContent' },
                        preact.h(PanelWithFocusableChildren_1.TitledPanelWithFocusableChildren, { focusable: true, title: '[TM_PITCREW_TRAIN_SCHEDULE]', rootClassName: 'TMPitCrewDevelopment_gridPanel' },
                            preact.h(ListStepper_1.ListStepper, { label: '[TM_PITCREW_PRESET_SELECTED]', modifiers: 'ellipsisValue', listIndex: PIT_CREW_DEVELOPMENT_PRESETS.indexOf(state.trainingPreset ?? 0), items: PIT_CREW_DEVELOPMENT_PRESETS, formatter: this.formatterStepperPreset, onChange: this.onChangePreset, modal: false, leftInput: InputTypes_1.InputName.Left, rightInput: InputTypes_1.InputName.Right, onFocusChanged: this.onPresetStepperFocused }),
                            preact.h(ListStepper_1.ListStepper, { label: '[TM_PITCREW_DRILL_FOCUS]', modifiers: 'ellipsisValue', listIndex: PIT_CREW_DEVELOPMENT_FOCUSES.indexOf(state.trainingFocus ?? 0), items: PIT_CREW_DEVELOPMENT_FOCUSES, formatter: this.formatterStepperFocus, onChange: this.onChangeFocus, modal: false, leftInput: InputTypes_1.InputName.Left, rightInput: InputTypes_1.InputName.Right, onFocusChanged: this.onFocusStepperFocused }),
                            preact.h(TMPitCrewDevelopmentCalendar_1.TMPitCrewDevelopmentCalendar, { playerTeamID: state.playerTeamID, onFocusEntry: this.onCalendarEntryFocused, onSelectEntry: this.onCalendarEntrySelected, selectedEntry: state.isEntrySelected ? state.focusedEntryContext : undefined }),
                            preact.h(SimpleButton_1.SimpleButton, { focusable: true, label: state.autoStatus || 'Auto-Optimize', rootClassName: 'TMPitCrewDevelopment_undoButton', icon: 'img/icons/filters.svg', onSelect: this.autoSchedule }),
                            state.developmentPlanChangesPending &&
                                [
                                    preact.h("div", { className: 'TMPitCrewDevelopment_dividerCalendar' }),
                                    preact.h(SimpleButton_1.SimpleButton, { focusable: true, manualFocusKey: this._undoFK, label: '[TM_PITCREW_CHANGES_UNDO]', rootClassName: 'TMPitCrewDevelopment_undoButton', icon: 'img/icons/reboot.svg', inputName: InputTypes_1.InputName.Facebutton_Top, alwaysShowInputIcon: true, onSelect: this.onSelectUndo })
                                ]),
                        preact.h(TMPitCrewDevelopmentModal_1.TMPitCrewDevelopmentModal, { focusable: Input.getInputMethod() != InputTypes_1.InputMethod.Gamepad, modalMode: state.modalMode, trainingFocus: state.trainingFocus, trainingPreset: state.trainingPreset, isEntrySelected: state.isEntrySelected, playerTeamID: state.playerTeamID, focusedEntryContext: state.focusedEntryContext, onCloseModal: this.onCloseModal })),
                    preact.h("div", { className: 'TMPitCrewDevelopment_footer' },
                        preact.h("div", { className: 'TMPitCrewDevelopment_footerContent' },
                            preact.h("div", { className: 'TMPitCrewDevelopment_dividerSubmit' }),
                            preact.h(ContinueButton_1.ContinueButton, { rootClassName: 'TMPitCrewDevelopment_submitButton', advanceType: !continueButtonBlocked ? AdvanceTypesData_1.AdvanceType.ConfirmTraining : AdvanceTypesData_1.AdvanceType.Blocked, label: !continueButtonBlocked ? '[TM_PITCREW_CHANGES_SUBMIT]' : '[TM_PITCREW_CHANGES_NONE]', modifiers: (0, classnames_1.classNames)(!continueButtonBlocked ? 'toPitCrew' : 'blocked', 'isRelative', 'floatingBtn'), focusable: false, manualFocusKey: this._submitFK, inputName: InputTypes_1.InputName.Facebutton_Left, alwaysShowInputIcon: true, onSelect: this.onSelectSubmit, icon: !continueButtonBlocked ? 'img/icons/continueCheckmark.svg' : 'img/icons/continueBlockedSimple.svg', disabled: continueButtonBlocked })))),
                this.getDialogConfirm(),
                this.getDialogCancel(),
                this.getDialogLeave()));
        }
        onInputChanged = () => {
            this.forceUpdate();
        };
        onPresetStepperFocused = (e) => {
            if (e.focused) {
                this.setState({ modalMode: TMPitCrewDevelopmentModal_1.TMPitCrewDevelopmentModalMode.TooltipPreset });
            }
        };
        onFocusStepperFocused = (e) => {
            if (e.focused) {
                this.setState({ modalMode: TMPitCrewDevelopmentModal_1.TMPitCrewDevelopmentModalMode.TooltipFocus });
            }
        };
        onCalendarEntryFocused = (entryContext) => {
            if (entryContext != undefined) {
                this.setState({ focusedEntryContext: entryContext, modalMode: TMPitCrewDevelopmentModal_1.TMPitCrewDevelopmentModalMode.Entry });
            }
        };
        onCalendarEntrySelected = () => {
            this.setState({ isEntrySelected: true });
        };
        onCloseModal = () => {
            this.setState({ isEntrySelected: false });
        };
        getData = () => {
            (0, DataStoreUtil_1.bindDSPropsToState)(this, ['PitCrew', this.state.playerTeamID + ''], this._dataHelper, ['trainingFocus', 'trainingPreset', 'developmentPlanChangesPending', 'developmentPlanInProgress', 'developmentPlanDaysLeft']);
            if (this.state.focusedEntryContext == undefined) {
                this.setState({ focusedEntryContext: ['PitCrew', this.state.playerTeamID + '', 'DevelopmentPlanDaily', '1'] });
            }
            this._dataHelper.getAllPropertiesNow();
        };
        onChangePreset = (newValue) => {
            if ((0, Engine_1.isCoherentPlayer)()) {
                DS.setValue(['PitCrew'], 'trainingPreset', PIT_CREW_DEVELOPMENT_PRESETS[newValue]);
            }
            else {
                (0, Engine_1.sendEvent)('OnSetPitCrewTrainingPreset', PIT_CREW_DEVELOPMENT_PRESETS[newValue], true);
            }
        };
        onChangeFocus = (newValue) => {
            if ((0, Engine_1.isCoherentPlayer)()) {
                DS.setValue(['PitCrew', this.state.playerTeamID + ''], 'trainingFocus', PIT_CREW_DEVELOPMENT_FOCUSES[newValue]);
            }
            else {
                (0, Engine_1.sendEvent)('OnSetPitCrewTrainingFocus', PIT_CREW_DEVELOPMENT_FOCUSES[newValue]);
            }
        };
        onSelectSubmit = () => {
            this.setState({ isDialogOpenSubmit: !this.state.isDialogOpenSubmit });
        };
        onSelectUndo = () => {
            this.setState({ isDialogOpenUndo: !this.state.isDialogOpenUndo });
        };
        onSelectBack = () => {
            if (this.state.developmentPlanChangesPending) {
                this.setState({ isDialogOpenLeave: !this.state.isDialogOpenLeave });
            }
            else {
                this.onConfirmLeave();
            }
        };
        // --- Auto-Optimize (mod) --------------------------------------------------
        // Fills every editable session with training, then walks backwards from each
        // race day converting the nearest sessions to Rest & Recovery until that race
        // day's projected fatigue drops into the lower part of its own achievable
        // range. The fatigue figure the engine exposes is in unknown units (raw
        // race-weekend fatigue in the save DB runs ~168-400, and stat scales differ
        // between contexts), so the target is calibrated per race day by measuring
        // the projection with everything rested and with everything trained, rather
        // than assuming a 0..1 percentage.
        autoSchedule = () => {
            if (this._autoScheduling)
                return;
            this._autoScheduling = true;
            this.setState({ autoStatus: 'Optimizing...' });
            this.runAutoSchedule()
                .catch(() => { this.setState({ autoStatus: 'Auto-Optimize (failed)' }); })
                .then(() => { this._autoScheduling = false; });
        };
        runAutoSchedule = async () => {
            const DRILLS = GameTypes_1.EPitCrewTrainingType.PitStopDrills;
            const GYM = GameTypes_1.EPitCrewTrainingType.GymTraining;
            const REST = GameTypes_1.EPitCrewTrainingType.RestAndRecovery;
            const BALANCED_FOCUS = 0;
            const ERROR_TARGET = 0.05; // drill until under 5% chance of mistake
            const FATIGUE_HEADROOM = 0.3; // allow 30% of each race day's own fatigue range
            const MAX_REST_PER_RACE = 6; // never burn more than 3 days on one race
            const FATIGUE_STAT = '38';
            const STAT_IDS = ['32', '33', '34', '35', '36', '37', '39', '40', '41', '42']; // pit crew stats minus transient Fatigue
            const base = ['PitCrew', this.state.playerTeamID + '', 'DevelopmentPlanDaily'];
            const currentDay = DS.getValue(['Calendar'], 'currentDay');
            const wait = (ms) => new Promise(r => setTimeout(r, ms));
            const pct = (v) => (v == null ? 0 : (v > 1.5 ? v / 100 : v)); // normalize 0..100 scales to 0..1
            const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
            const days = [];
            for (let i = 1; i <= 40; i++) {
                const ctx = base.concat(i + '');
                const dayId = DS.getValue(ctx, 'day');
                if (dayId == null)
                    break;
                days.push({ index: i, ctx, dayId, raceDay: !!DS.getValue(ctx, 'raceDay') });
            }
            if (!days.length)
                return;
            const editable = (d) => !d.raceDay && d.dayId >= currentDay;
            const getType = (d, s) => DS.getValue(d.ctx.concat(s + ''), 'trainingType');
            const setType = (d, s, type, focus) => (0, Engine_1.sendEvent)('OnSetPitCrewTrainingPlan', d.index, s, type, focus ?? (DS.getValue(d.ctx.concat(s + ''), 'trainingFocus') ?? 0));
            const errAt = (d) => pct(DS.getValue(d.ctx.concat('PitStopStages'), 'chanceOfErrorTotal'));
            const fatigueAt = (d) => num(DS.getValue(d.ctx.concat(['PerformanceStats', FATIGUE_STAT]), 'value'));
            const dayStatGain = (d) => STAT_IDS.reduce((sum, id) => sum + Math.abs(DS.getValue(d.ctx.concat(['PerformanceStats', id]), 'delta') ?? 0), 0);
            const fillDays = (list, type, focus) => {
                let n = 0;
                for (const d of list)
                    if (editable(d))
                        for (let s = 0; s < 2; s++)
                            if (getType(d, s) !== type) {
                                setType(d, s, type, focus);
                                n++;
                            }
                return n;
            };
            const raceDays = days.filter(d => d.raceDay && d.dayId >= currentDay);
            // Phase 0: calibrate. Read each race day's projected fatigue with the
            // whole month rested, then with the whole month drilled. Those two
            // readings bracket what is actually achievable, whatever the units are.
            fillDays(days, REST);
            await wait(900);
            const restedFatigue = new Map(raceDays.map(rd => [rd.index, fatigueAt(rd)]));
            // Phase 1: balanced pit stop drills everywhere so the projections show
            // where the cumulative error chance crosses the target.
            fillDays(days, DRILLS, BALANCED_FOCUS);
            await wait(900);
            const loadedFatigue = new Map(raceDays.map(rd => [rd.index, fatigueAt(rd)]));
            // A race day only gets a target if resting demonstrably moves its number;
            // otherwise the projection is not responding and resting is pointless.
            const targetFor = (rd) => {
                const lo = restedFatigue.get(rd.index), hi = loadedFatigue.get(rd.index);
                if (lo == null || hi == null || !(hi - lo > 1e-6))
                    return null;
                return lo + FATIGUE_HEADROOM * (hi - lo);
            };
            // Phase 2: from the day the projected error chance reaches the target,
            // switch the rest of the month to gym training.
            let crossIdx = -1;
            for (let k = 0; k < days.length; k++)
                if (errAt(days[k]) <= ERROR_TARGET) {
                    crossIdx = k;
                    break;
                }
            if (crossIdx >= 0) {
                const gymDays = days.slice(crossIdx + 1).filter(editable);
                if (fillDays(gymDays, GYM))
                    await wait(900);
                // Phase 3: if gym projects zero stat gain (already maxed), use those
                // days for pit stop drills instead.
                const probe = gymDays.find(d => getType(d, 0) === GYM || getType(d, 1) === GYM);
                if (probe && dayStatGain(probe) < 1e-6) {
                    if (fillDays(gymDays, DRILLS, BALANCED_FOCUS))
                        await wait(900);
                }
            }
            // Phase 4: rest just enough before each race day to bring its projected
            // fatigue down to the calibrated target, converting closest-to-race
            // sessions first. Capped, and abandoned if the number stops responding,
            // so a race that can never hit its target cannot blank the calendar.
            let restedSessions = 0, skipped = 0;
            for (const rd of raceDays) {
                const target = targetFor(rd);
                if (target == null) {
                    skipped++;
                    continue;
                }
                let converted = 0, stalled = 0, last = fatigueAt(rd);
                while (converted < MAX_REST_PER_RACE) {
                    if (last == null || last <= target)
                        break;
                    let didConvert = false;
                    for (let k = days.indexOf(rd) - 1; k >= 0 && !didConvert; k--) {
                        const d = days[k];
                        if (!editable(d))
                            continue;
                        for (let s = 1; s >= 0 && !didConvert; s--)
                            if (getType(d, s) !== REST) {
                                setType(d, s, REST);
                                didConvert = true;
                            }
                    }
                    if (!didConvert)
                        break;
                    converted++;
                    await wait(450);
                    const now = fatigueAt(rd);
                    stalled = (now != null && last != null && last - now > 1e-6) ? 0 : stalled + 1;
                    if (stalled >= 2)
                        break; // two rests with no movement: give up on this race
                    last = now;
                }
                restedSessions += converted;
            }
            this.setState({ autoStatus: 'Auto-Optimize (' + restedSessions + ' rest' + (skipped ? ', ' + skipped + ' race n/a' : '') + ')' });
        };
        onConfirmSubmit = () => {
            (0, Engine_1.sendEvent)('OnSubmitPitCrewDevelopmentPlan');
            this.setState({ isDialogOpenSubmit: false });
            TeamManagementNavigation.set(TeamScreens_1.ScreenID.PitCrew);
        };
        onConfirmUndo = () => {
            (0, Engine_1.sendEvent)('OnRevertPitCrewDevelopmentPlanChanges');
            this.setState({ isDialogOpenUndo: false });
        };
        onConfirmLeave = () => {
            (0, Engine_1.sendEvent)('OnRevertPitCrewDevelopmentPlanChanges');
            this.setState({ isDialogOpenLeave: false });
            TeamManagementNavigation.set(TeamScreens_1.ScreenID.PitCrew);
        };
        formatterStepperPreset(value) {
            return (0, Localisation_1.translate)((0, TMPitCrewDevelopmentConfig_1.pitCrewDevelopmentLabelPreset)(value));
        }
        formatterStepperFocus(value) {
            return (0, Localisation_1.translate)((0, TMPitCrewDevelopmentConfig_1.pitCrewDevelopmentLabelGlobalFocus)(value));
        }
        getDialogConfirm = () => {
            return (preact.h(HorizontalDialogBox_1.ModalHorizontalDialogBox, { status: DialogTypes_1.EDialogStatus.DialogNeutral, icon: '/img/icons/tickCircle.svg', title: (0, Localisation_1.translate)('[TM_PITCREW_SUBMIT]'), subtitle: (0, Localisation_1.translate)('[TM_PITCREW_TRAIN]'), showDialog: this.state.isDialogOpenSubmit && !this.state.isDialogOpenUndo && !this.state.isDialogOpenLeave, defaultButtons: HorizontalDialogBox_1.DefaultDialogButtons.ConfirmCancel, onDefaultOK: this.onConfirmSubmit, onDefaultCancel: this.onSelectSubmit },
                preact.h(IconLabel_1.IconLabel, { rootClassName: 'TMPitCrewDevelopment_dialogIconLabel', modifiers: 'whiteColor', label: '[TM_PITCREW_TRAIN_END]', value: LocalisationUtil.days(this.state.developmentPlanDaysLeft), valueModifiers: 'uppercaseValue' }),
                preact.h("div", { className: 'TMPitCrewDevelopment_dialogText' }, (0, Localisation_1.translate)('[TM_PITCREW_CONFIRM_DESCR]'))));
        };
        getDialogCancel = () => {
            return (preact.h(HorizontalDialogBox_1.ModalHorizontalDialogBox, { status: DialogTypes_1.EDialogStatus.DialogNegative, icon: '/img/icons/warningDiamondSimple.svg', title: (0, Localisation_1.translate)('[TM_PITCREW_CHANGES_CANCEL]'), subtitle: (0, Localisation_1.translate)('[TM_PITCREW_TRAIN]'), showDialog: this.state.isDialogOpenUndo && !this.state.isDialogOpenSubmit && !this.state.isDialogOpenLeave, defaultButtons: HorizontalDialogBox_1.DefaultDialogButtons.ConfirmCancel, onDefaultOK: this.onConfirmUndo, onDefaultCancel: this.onSelectUndo },
                preact.h("div", { className: 'TMPitCrewDevelopment_dialogText' }, (0, Localisation_1.translate)('[TM_PITCREW_CANCEL_DESCR]'))));
        };
        getDialogLeave = () => {
            return (preact.h(HorizontalDialogBox_1.ModalHorizontalDialogBox, { status: DialogTypes_1.EDialogStatus.DialogNegative, icon: '/img/icons/warningDiamondSimple.svg', title: (0, Localisation_1.translate)('[TM_PITCREW_CHANGES_CANCEL]'), subtitle: (0, Localisation_1.translate)('[TM_PITCREW_TRAIN]'), showDialog: this.state.isDialogOpenLeave && !this.state.isDialogOpenUndo && !this.state.isDialogOpenSubmit, defaultButtons: HorizontalDialogBox_1.DefaultDialogButtons.ConfirmCancel, onDefaultOK: this.onConfirmLeave, onDefaultCancel: this.onSelectBack },
                preact.h("div", { className: 'TMPitCrewDevelopment_dialogText' }, (0, Localisation_1.translate)('[TM_PITCREW_CANCEL_DESCR]'))));
        };
    }
    exports.TMPitCrewDevelopment = Focusable.decorate(_TMPitCrewDevelopment);
});
//# sourceMappingURL=TMPitCrewDevelopment.js.map