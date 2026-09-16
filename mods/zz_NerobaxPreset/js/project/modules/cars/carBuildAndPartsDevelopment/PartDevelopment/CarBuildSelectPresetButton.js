define(["require", "exports", "common/components/FDiv", "common/components/Focusable", "common/components/ListStepper", "common/core/DataStore", "common/core/Engine", "common/core/Focus", "common/core/Input", "common/core/InputTypes", "common/core/Localisation", "common/data/DataStoreCollection", "common/lib/classnames", "common/lib/preact", "common/util/CSSUtil", "common/util/DataStoreHelper", "project/components/Button", "project/components/SimpleButton", "project/data/GameTypes", "project/modules/cars/carBuildAndPartsDevelopment/PartDevelopment/CarBuildTip", "project/modules/cars/CarBuildConfig", "project/utils/VoltaModuleFocusPriority"], function (require, exports, FDiv_1, Focusable, ListStepper_1, DS, Engine_1, Focus, Input, InputTypes_1, Localisation_1, DataStoreCollection_1, classnames_1, preact, CSSUtil_1, DataStoreHelper_1, Button_1, SimpleButton_1, GameTypes_1, CarBuildTip_1, CarBuildConfig_1, VoltaModuleFocusPriority_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CarBuildPresetInfoPanel = exports.CarBuildSelectPresetStepper = exports.CarBuildSelectPresetButton = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/cars/carBuildAndPartsDevelopment/CarBuildSelectPresetButton');
    // The design screen opens with Balanced pre-selected but never applies it, and the
    // game only applies preset sliders on a change between REAL presets (SetPreset with
    // Custom is ignored for its internal current-preset tracking). Bounce through another
    // real preset and straight back so the DB-defined Balanced values actually apply.
    function autoReapplyBalanced(component, value) {
        if (value == GameTypes_1.EEmphasisPreset.Balanced && !component._nerobaxAutoApplied) {
            component._nerobaxAutoApplied = true;
            (0, Engine_1.sendEvent)('NewDesignSetPreset', GameTypes_1.EEmphasisPreset.HighSpeedPerformance);
            (0, Engine_1.sendEvent)('NewDesignSetPreset', GameTypes_1.EEmphasisPreset.Balanced);
        }
    }
    class _CarBuildSelectPresetButton extends preact.Component {
        _presetsCollection = new DataStoreCollection_1.DataStoreCollection();
        _dataHelper = new DataStoreHelper_1.DataStoreHelper();
        defaultTooltip = preact.h(CarBuildTip_1.CarBuildTip, null,
            preact.h("div", { className: 'CarBuildSelectPresetButton_title' }, (0, Localisation_1.translate)('[CAR_BUILD_DEV_PRESET_TOOLTIP_TITLE]')),
            preact.h("div", { className: 'CarBuildSelectPresetButton_descr' }, (0, Localisation_1.translate)('[CAR_BUILD_DEV_PRESET_TOOLTIP_DESC]')));
        state = {
            selectedPresetName: undefined,
            presetButtons: [],
            selectedEmphasisPreset: GameTypes_1.EEmphasisPreset.Custom,
        };
        componentWillMount() {
            this._dataHelper.addPropertyListener(['Parts'], 'selectedEmphasisPreset', this.selectedEmphasisChanged);
            this._dataHelper.getAllPropertiesNow();
            this._presetsCollection.bindToContext(['Parts', 'Types', this.props.type.toString(), 'Presets']);
        }
        componentWillUnmount() {
            this._dataHelper.clear();
            this._presetsCollection.dispose();
        }
        render(props, state, context) {
            let { rootClassName, modifiers } = props;
            let { selectedEmphasisPreset } = state;
            return (preact.h(SimpleButton_1.SimpleButton, { rootClassName: (0, classnames_1.classNames)(rootClassName, 'CarBuildSelectPresetButton_root', modifiers), icon: this.getPresetIcon(selectedEmphasisPreset), modifiers: modifiers, alwaysShowInputIcon: false, onSelect: this.onSelect, onFocusChanged: this.onFocus, label: (selectedEmphasisPreset == GameTypes_1.EEmphasisPreset.Balanced ? 'Nerobax' : `[CAR_BUILD_PRESET_${GameTypes_1.EEmphasisPreset[selectedEmphasisPreset].toUpperCase()}]`) }));
        }
        getPresets = () => {
            for (let i = 0; i < this._presetsCollection.source.length; i++) {
                const id = DS.getValue(this._presetsCollection.source[i], 'id');
                if (id == GameTypes_1.EEmphasisPreset.Custom)
                    continue;
                this.state.presetButtons.push(preact.h(SimpleButton_1.SimpleButton, { rootClassName: 'CarBuildSelectPresetButton_button', icon: this.getPresetIcon(id), label: (id == GameTypes_1.EEmphasisPreset.Balanced ? 'Nerobax' : `[CAR_BUILD_PRESET_${GameTypes_1.EEmphasisPreset[id].toUpperCase()}]`), focusable: true, onSelect: () => this.onSelectPresetButton(id) }));
            }
        };
        onSelect = () => {
            let isGamepad = Input.currentInputMethodIs(InputTypes_1.InputMethod.Gamepad);
            if (this.props.showingPresetSelector) {
                this.props.onUpdateTipContext(this.defaultTooltip, false);
            }
            else {
                let tooltipNode = preact.h(exports.CarBuildPresetInfoPanel, { presetButtons: this.state.presetButtons, onBack: this.onBack });
                this.props.onUpdateTipContext(tooltipNode, true);
            }
        };
        onFocus = (e) => {
            if (e.focused && !this.props.showingPresetSelector) {
                this.props.onUpdateTipContext(this.defaultTooltip);
            }
        };
        onSelectPresetButton = (selectedEmphasisPreset) => {
            this.setState({ selectedEmphasisPreset });
            (0, Engine_1.sendEvent)('NewDesignSetPreset', selectedEmphasisPreset);
            if ((0, Engine_1.isCoherentPlayer)())
                DS.setValue(['Parts'], 'selectedEmphasisPreset', selectedEmphasisPreset);
            this.props.onUpdateTipContext(this.defaultTooltip, false);
        };
        getPresetIcon = (preset) => {
            switch (preset) {
                case GameTypes_1.EEmphasisPreset.Custom: return 'img/icons/filters.svg';
                case GameTypes_1.EEmphasisPreset.Balanced: return 'img/icons/filters.svg';
                case GameTypes_1.EEmphasisPreset.HighSpeedPerformance: return 'img/icons/topSpeed.svg';
                case GameTypes_1.EEmphasisPreset.LowSpeedPerformance: return 'img/icons/speed.svg';
                case GameTypes_1.EEmphasisPreset.OptimisedAerodynamics: return 'img/icons/wind.svg';
                case GameTypes_1.EEmphasisPreset.OptimisedCooling: return 'img/icons/temperature.svg';
                case GameTypes_1.EEmphasisPreset.DragRecovery: return 'img/icons/dragReduction.svg';
                case GameTypes_1.EEmphasisPreset.RacePerformance: return 'img/icons/track.svg';
                default: return 'img/icons/placeholder.svg';
            }
        };
        selectedEmphasisChanged = (value) => {
            if (value != undefined) {
                this.setState({ selectedEmphasisPreset: value });
                autoReapplyBalanced(this, value);
            }
        };
        onBack = () => {
            this.props.onUpdateTipContext(this.defaultTooltip, false);
        };
    }
    exports.CarBuildSelectPresetButton = Focusable.decorate(_CarBuildSelectPresetButton);
    const CAR_BUILD_DESIGN_PRESETS = [
        GameTypes_1.EEmphasisPreset.Custom,
        GameTypes_1.EEmphasisPreset.Balanced,
        GameTypes_1.EEmphasisPreset.HighSpeedPerformance,
        GameTypes_1.EEmphasisPreset.LowSpeedPerformance,
        GameTypes_1.EEmphasisPreset.OptimisedCooling,
        GameTypes_1.EEmphasisPreset.OptimisedAerodynamics,
        GameTypes_1.EEmphasisPreset.DragRecovery,
        GameTypes_1.EEmphasisPreset.RacePerformance,
    ];
    class _CarBuildSelectPresetStepper extends preact.Component {
        _presetsCollection = new DataStoreCollection_1.DataStoreCollection();
        _dataHelper = new DataStoreHelper_1.DataStoreHelper();
        state = {
            selectedEmphasisPreset: GameTypes_1.EEmphasisPreset.Balanced,
            presetList: [],
            presetListIndex: 1,
        };
        componentWillMount() {
            this._dataHelper.addPropertyListener(['Parts'], 'selectedEmphasisPreset', this.selectedEmphasisChanged);
            this._dataHelper.getAllPropertiesNow();
            this._presetsCollection.bindToContext(['Parts', 'Types', this.props.type.toString(), 'Presets']);
            this._presetsCollection.onChange.add(this.getPresets);
            this.getPresets();
        }
        componentWillUnmount() {
            this._dataHelper.clear();
            this._presetsCollection.dispose();
        }
        defaultTooltip = preact.h(CarBuildTip_1.CarBuildTip, null,
            preact.h("div", { className: 'CarBuildSelectPresetButton_title' }, (0, Localisation_1.translate)('[CAR_BUILD_DEV_PRESET_TOOLTIP_TITLE]')),
            preact.h("div", { className: 'CarBuildSelectPresetButton_descr' }, (0, Localisation_1.translate)('[CAR_BUILD_DEV_PRESET_TOOLTIP_DESC]')));
        render(props, state, context) {
            let { rootClassName, modifiers } = props;
            let { presetListIndex, presetList } = state;
            return (preact.h(ListStepper_1.ListStepper, { rootClassName: rootClassName, modifiers: (0, classnames_1.classNames)(modifiers, 'autoTextWidth'), label: `[CAR_BUILD_DEV_PRESET]`, onChange: this.onChangePreset, listIndex: presetListIndex, formatter: this.formatterStepperPreset, items: presetList, modal: false, onFocusChanged: this.onFocus }));
        }
        onChangePreset = (presetListIndex) => {
            this.setState({ selectedEmphasisPreset: this.state.presetList[presetListIndex], presetListIndex: presetListIndex });
            this.onSelectPresetButton(this.state.presetList[presetListIndex]);
        };
        getPresets = () => {
            let presetList = [];
            for (let i = 0; i < this._presetsCollection.source.length; i++) {
                const id = DS.getValue(this._presetsCollection.source[i], 'id');
                if (id == GameTypes_1.EEmphasisPreset.Custom)
                    continue;
                presetList.push(id);
            }
            presetList.push(GameTypes_1.EEmphasisPreset.Custom);
            presetList.reverse();
            const balancedIdx = presetList.indexOf(GameTypes_1.EEmphasisPreset.Balanced);
            if (balancedIdx > 0) {
                presetList.splice(balancedIdx, 1);
                presetList.unshift(GameTypes_1.EEmphasisPreset.Balanced);
            }
            this.setState({ presetList: presetList });
        };
        formatterStepperPreset(selectedEmphasisPreset) {
            return (0, Localisation_1.translate)((0, CarBuildConfig_1.CarPartDesignLabelPreset)(selectedEmphasisPreset));
        }
        onFocus = (e) => {
            if (e.focused && !this.props.showingPresetSelector) {
                this.props.onUpdateTipContext(this.defaultTooltip);
            }
        };
        onSelectPresetButton = (selectedEmphasisPreset) => {
            (0, Engine_1.sendEvent)('NewDesignSetPreset', selectedEmphasisPreset);
            if ((0, Engine_1.isCoherentPlayer)())
                DS.setValue(['Parts'], 'selectedEmphasisPreset', selectedEmphasisPreset);
            this.props.onUpdateTipContext(this.defaultTooltip, false);
        };
        selectedEmphasisChanged = (selectedEmphasisPreset) => {
            if (selectedEmphasisPreset == undefined)
                return;
            const listIndex = Math.max(0, this.state.presetList.indexOf(selectedEmphasisPreset));
            this.setState({ selectedEmphasisPreset: selectedEmphasisPreset, presetListIndex: listIndex });
            autoReapplyBalanced(this, selectedEmphasisPreset);
        };
    }
    exports.CarBuildSelectPresetStepper = Focusable.decorate(_CarBuildSelectPresetStepper);
    class _CarBuildPresetInfoPanel extends preact.Component {
        _backButtonKeyFK = Symbol('CarBuildPresetInfoPanel_backButtonFK');
        render(props, state) {
            const isGamepad = Input.currentInputMethodIs(InputTypes_1.InputMethod.Gamepad);
            return (preact.h(FDiv_1.FDiv, { focusModulePriority: VoltaModuleFocusPriority_1.VoltaModuleFocusPriority.CarBuildSelectPresetButton, focusBarrier: Focus.Barrier.Hover_Spatial },
                preact.h("div", { className: 'CarBuildSelectPresetButton_title' }, (0, Localisation_1.translate)('[CAR_BUILD_DEV_PRESET_TOOLTIP_TITLE]')),
                preact.h("div", { className: 'CarBuildSelectPresetButton_descr' }, (0, Localisation_1.translate)(`[CAR_BUILD_DEV_PRESET_TOOLTIP_DESC]`)),
                preact.h("div", { className: 'CarBuildSelectPresetButton_presets' }, this.props.presetButtons),
                preact.h(Button_1.Button, { rootClassName: 'CarBuildSelectPresetButton_button', label: `[BACK]`, modifiers: 'altStyle lightBottomBar', alwaysShowInputIcon: true, focusable: !isGamepad, inputName: InputTypes_1.InputName.Cancel, onSelect: this.props.onBack, manualFocusKey: this._backButtonKeyFK })));
        }
        handleInput(e) {
            if (e.button && e.button.isPressed()) {
                if (Focus.getFocusable(this._backButtonKeyFK)?.handleInput(e)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.CarBuildPresetInfoPanel = Focusable.decorate(_CarBuildPresetInfoPanel);
});
//# sourceMappingURL=CarBuildSelectPresetButton.js.map