define(["require", "exports", "common/core/DataStore", "common/lib/classnames", "common/lib/preact", "common/util/CSSUtil", "common/util/DataStoreHelper", "project/components/Texture", "project/data/GameTypes"], function (require, exports, DS, classnames_1, preact, CSSUtil_1, DataStoreHelper_1, Texture_1, GameTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CharacterImage = void 0;
    (0, CSSUtil_1.loadCSS)('project/components/CharacterImage');
    const FACE_OVERRIDES = {
        9: 'StaffPhotos/Faces/Named/Drivers/F1/S_Vettel_TN'
    };
    // Last-resort body for overridden staff: unbranded overalls. Only used if the
    // team lookup below fails.
    const BODY_OVERRIDES = {
        9: 'StaffPhotos/Bodies/RacingOveralls/Male/FrontThin/Free_Driver_Thin_premultiplied'
    };
    const isUsableBody = (value) => !!value && !('' + value).includes('MissingBody');
    // The game has no Photo.Body for un-retired drivers, so they fell back to the
    // unbranded overalls above and never picked up team kit. Resolve the team's
    // overalls the same way the engine does for its own overwriteBodyImageTeam
    // path: StaffConstants/Overalls/F<formula>[/<teamID> for F1]/<0 driver|1 staff>
    // /<gender>, read with the staff member's BodyType as the property name.
    const resolveTeamOveralls = (staffId, teamID) => {
        const stringID = staffId.toString();
        if (teamID == null)
            return null;
        let location = ['StaffConstants', 'Overalls'];
        if (teamID === -1) {
            location.push('Unemployed');
        }
        else {
            const formula = DS.getValue(['Teams', 'TeamsList', teamID + ''], 'formula');
            if (formula == null)
                return null;
            location.push('F' + formula);
            if (formula == 1) {
                location.push(teamID + '');
            }
        }
        const staffType = DS.getValue(['Staff', stringID], 'staffType');
        const gender = DS.getValue(['Staff', stringID], 'gender');
        const bodyType = DS.getValue(['Staff', stringID, 'Photo'], 'BodyType');
        if (staffType == null || gender == null || bodyType == null)
            return null;
        location = location.concat([(staffType == GameTypes_1.EStaffType.Driver) ? '0' : '1', gender + '']);
        const overalls = DS.getValue(location, bodyType + '');
        return isUsableBody(overalls) ? overalls : null;
    };
    // BodyType comes from the same StaffPhotoData entry the un-retired driver is
    // missing, so the lookup above can come up empty too. A teammate's Photo.Body
    // is already that team's kit, so borrow it.
    const TEAMMATE_SLOTS = ['driver1ID', 'driver2ID', 'reserveDriverID'];
    const borrowTeammateBody = (staffId, teamID) => {
        if (teamID == null || teamID === -1)
            return null;
        for (const slot of TEAMMATE_SLOTS) {
            const mateID = DS.getValue(['Teams', 'TeamsList', teamID + ''], slot);
            if (mateID == null || mateID < 0 || mateID == staffId || BODY_OVERRIDES[mateID] != undefined)
                continue;
            const body = DS.getValue(['Staff', mateID + '', 'Photo'], 'Body');
            if (isUsableBody(body))
                return body;
        }
        return null;
    };
    const resolveOverrideBody = (staffId, teamID) => resolveTeamOveralls(staffId, teamID) ?? borrowTeammateBody(staffId, teamID) ?? BODY_OVERRIDES[staffId];
    class CharacterImage extends preact.Component {
        static defaultProps = {
            showAnimation: true
        };
        _dataStoreHelper = new DataStoreHelper_1.DataStoreHelper();
        _curCharacter = '';
        _showAnimClass = '';
        componentWillMount() {
            this.refreshData();
        }
        componentDidUpdate(oldProps) {
            if (this.props.staffId != oldProps.staffId) {
                this.refreshData();
            }
        }
        componentWillUnmount() {
            this._dataStoreHelper.clear();
            this._curCharacter = '';
            this._showAnimClass = '';
        }
        render(props, state, context) {
            const modifiers = (0, classnames_1.classNames)(props.modifiers, context.theme);
            if (props.showAnimation) {
                const newCharacter = (state.bodyImage || '') + (state.faceImage || '');
                if (this._curCharacter != newCharacter) {
                    this._curCharacter = newCharacter;
                    this._showAnimClass = this._showAnimClass == 'show' ? 'showAlt' : 'show';
                }
            }
            return (preact.h("div", { className: (0, classnames_1.classNames)('CharacterImage_root center', props.rootClassName, modifiers, this._showAnimClass) },
                (state.customSuit && !state.isReady) &&
                    [
                        preact.h(Texture_1.Texture, { playerFileType: 'tga', rootClassName: (0, classnames_1.classNames)('CharacterImage_head', modifiers), src: 'StaffPhotos/Faces/MissingFace' }),
                        preact.h(Texture_1.Texture, { playerFileType: 'tga', rootClassName: (0, classnames_1.classNames)('CharacterImage_body', modifiers), src: 'StaffPhotos/Bodies/MissingBody' }),
                        preact.h("div", { className: (0, classnames_1.classNames)('CharacterImage_loadingIcon', modifiers) })
                    ],
                (!state.customSuit || state.isReady) &&
                    state.bodyImage != '' && props.staffId != -1 &&
                    [
                        preact.h(Texture_1.Texture, { playerFileType: 'tga', rootClassName: (0, classnames_1.classNames)('CharacterImage_head', modifiers), src: state.faceImage }),
                        preact.h(Texture_1.Texture, { playerFileType: 'tga', rootClassName: (0, classnames_1.classNames)('CharacterImage_body', modifiers), src: state.bodyImage })
                    ],
                props.staffId == -1 &&
                    preact.h("div", { className: (0, classnames_1.classNames)('CharacterImage_vacant', modifiers) }),
                preact.h("div", { className: (0, classnames_1.classNames)('CharacterImage_content', modifiers) }, props.children)));
        }
        refreshData = () => {
            this._dataStoreHelper.clear();
            if (this.props.staffId != undefined && this.props.staffId != null) {
                const stringID = this.props.staffId.toString();
                if (this.props.overwriteBodyImageTeam != undefined && BODY_OVERRIDES[this.props.staffId] != undefined) {
                    this.onGotBody(resolveOverrideBody(this.props.staffId, this.props.overwriteBodyImageTeam));
                }
                else if (this.props.overwriteBodyImageTeam != undefined) {
                    let overallsDatastoreLocation = ['StaffConstants', 'Overalls'];
                    if (this.props.overwriteBodyImageTeam == -1) {
                        overallsDatastoreLocation.push('Unemployed');
                    }
                    else {
                        const formula = DS.getValue(['Teams', 'TeamsList', this.props.overwriteBodyImageTeam + ''], 'formula');
                        overallsDatastoreLocation.push('F' + formula);
                        if (formula == 1) {
                            overallsDatastoreLocation.push(this.props.overwriteBodyImageTeam + '');
                        }
                    }
                    const staffType = DS.getValue(['Staff', stringID], 'staffType');
                    const gender = DS.getValue(['Staff', stringID], 'gender');
                    const bodyType = DS.getValue(['Staff', stringID, 'Photo'], 'BodyType');
                    overallsDatastoreLocation = overallsDatastoreLocation.concat([(staffType == GameTypes_1.EStaffType.Driver) ? '0' : '1', gender + '']);
                    this._dataStoreHelper.addPropertyListener(overallsDatastoreLocation, bodyType + '', this.onGotBody);
                }
                else {
                    this._dataStoreHelper.addPropertyListener(['Staff', stringID, 'Photo'], 'Body', this.onGotBody);
                    if (BODY_OVERRIDES[this.props.staffId] != undefined) {
                        this._dataStoreHelper.addPropertyListener(['Staff', stringID], 'teamID', this.onGotTeamForOverride);
                    }
                    this.state.customSuit = DS.getValue(['Staff', stringID, 'Photo'], 'IsCustomSuit');
                    if (this.state.customSuit) {
                        this._dataStoreHelper.addPropertyListener(['Teams', 'CustomTeamCustomisation', 'CustomSuitTextures'], 'CustomSuitTexturesReady', this.onCustomSuitTexturesReadyChanged);
                    }
                }
                this._dataStoreHelper.addPropertyListener(['Staff', stringID, 'Photo'], 'Face', this.onGotFace);
                this._dataStoreHelper.getAllPropertiesNow();
            }
            else {
                const bodyImage = 'StaffPhotos/Bodies/MissingBody';
                const faceImage = 'StaffPhotos/Faces/MissingFace';
                this.setState({ bodyImage, faceImage });
            }
        };
        onGotTeamForOverride = () => {
            const stringID = this.props.staffId.toString();
            this.onGotBody(DS.getValue(['Staff', stringID, 'Photo'], 'Body'));
        };
        onGotBody = (value) => {
            const bodyOverride = BODY_OVERRIDES[this.props.staffId];
            if (bodyOverride && !isUsableBody(value)) {
                value = resolveOverrideBody(this.props.staffId, DS.getValue(['Staff', this.props.staffId.toString()], 'teamID'));
            }
            this.setState({ bodyImage: (value ?? 'StaffPhotos/Bodies/MissingBody') });
        };
        onGotFace = (value) => {
            const faceOverride = FACE_OVERRIDES[this.props.staffId];
            if (faceOverride && (value == null || value == '' || value.includes('MissingFace'))) {
                value = faceOverride;
            }
            this.setState({ faceImage: (value ?? 'StaffPhotos/Faces/MissingFace') });
        };
        onCustomSuitTexturesReadyChanged = (value) => {
            this.setState({ isReady: (value ?? false) });
        };
    }
    exports.CharacterImage = CharacterImage;
});
//# sourceMappingURL=CharacterImage.js.map