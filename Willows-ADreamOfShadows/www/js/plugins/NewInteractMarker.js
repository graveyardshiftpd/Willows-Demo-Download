    //=============================================================================
// NewInteractMarker.js
// ----------------------------------------------------------------------------
// (C) 2025
// Internal plugin for use by Graveyard Shift
// ----------------------------------------------------------------------------
// Version
// 1.2.1 2025/08/12 Added exclusion tag and refined icon exit event
// 1.2.0 2025/07/12 Added facing only event support and fixed lingering icon
// 1.1.7 2025/03/12 Small fix, added cutscene event recognition using switch 09
// 1.1.6 2025/30/11 Hotfix, fixed exception case involving facing/non-facing overlap
// 1.1.5 2025/30/11 Fixed bug involving events with bubbles breaking
// 1.1.0 2025/28/11 Finished first functioning version
// 1.0.0 2025/22/11 Created plugin
//=============================================================================

/*:
 * @param DefaultBalloon
 * @text Interact Icon
 * @desc ID of the interact icon
 * @default 15
 * @type number
 *
 * @help
 * Plugin Commands for specifying facing exclusive events. Put one of these in an Event
 * notes section to make the icon only show if player is facing a given direction
 * <FACE UP>
 * <FACE RIGHT>
 * <FACE LEFT>
 * <FACE DOWN>
 */

(function(){
    'use strict';
    var metaTagPrefix = 'NIM';

    var getNumber = function(nString) { return Number((nString || '')) || 0; };
    var pluginName = 'NewInteractMarker';
    var getParamString = function(paramNames){
        if (!Array.isArray(paramNames)) paramNames = [paramNames];
        for (var i = 0; i < paramNames.length; i++){
            var name = PluginManager.parameters(pluginName)[paramNames[i]];
            if (name) return name;
        }
        return null;
    };

    var getParamNumber = function(paramName) {
        var value = getParamString(paramName);
        return Number((value || '')) || 0;
    };

    //=============================================================================
    // Parameter Variables
    //=============================================================================
    const emptyBalloon = 14;
    // Note: Set to menuControl switch, logic based on this
    const cutsceneSwitch = 10;
    var interactDisplay = false;
    var balloonIsActive = false;
    var inEvent = false;
    var interactEventID = 0;
    var lastInteractedID = 0;
    var faceCondition = null;

    //=============================================================================
    // Game Player
    //=============================================================================
    
    // runs every frame, catalogues possible events
    var _Game_PlayerUpdate = Game_Player.prototype.update;
    Game_Player.prototype.update = function() {
        _Game_PlayerUpdate.apply(this, arguments);
        //only runs these functions if player is movable
        if ($gameSwitches.value(cutsceneSwitch)) {

            // grabs position Variables for currently facing event
            let targetX = this.x;
            let targetY = this.y;

            //updates targetX & targetY based on facing
            switch (this.direction()) {
                case 2: targetY++; break;
                case 4: targetX--; break;
                case 6: targetX++; break;
                case 8: targetY--; break;
            }

            //assign event ID
            var currentEventID = $gameMap.eventsXy(this.x, this.y);
            var facingEventID = $gameMap.eventsXy(targetX, targetY);

            //update interactEventID, check if balloon should run
            this.updateEventID(currentEventID, facingEventID);

            //checks to see if interact event is running
            if (!inEvent) {
                //checks if balloon needs to be displayed or deleted
                if (interactEventID !== 0) {
                    this.openInteract();
                } else {
                    this.deleteInteract();
                }
            } else if (interactEventID !== 0 && inEvent) {
                this.resetIcon();
            }
        } else if (!$gameSwitches.value(cutsceneSwitch) && inEvent && interactDisplay) {
            this.resetIcon();
            interactDisplay = false;
        }
    };

    // checks for valid events, assigns interactEventID accordingly
    Game_Player.prototype.updateEventID = function(currentEventID, facingEventID) {
        let wasUpdated = false;
        // check if event currently standing on can be triggered by player action
        currentEventID.forEach(function (event) {
            if (event._trigger === 0 && !event.isException()) {
                interactEventID = event._eventId;
                wasUpdated = true;
                interactDisplay = true;
                return;
            }
        });

        // check if event player is facing is on same level and can be triggered by player action
        facingEventID.forEach(function (event) {
            if (event._trigger === 0 && event.isNormalPriority() && !event.isException()) {
                if (($gamePlayer.direction() === event.readNotetagFacingCon()) || (event.readNotetagFacingCon() == null)) {
                    if (!wasUpdated) {
                        interactEventID = event._eventId;
                    }
                    wasUpdated = true;
                    interactDisplay = true;
                    return;
                }               
            }
        });

        // if neither case is valid, reset interactEventID to 0
        if (!wasUpdated) {
            interactEventID = 0;
            interactDisplay = false;
        }

    };

    // ends interact icon if player is in an event
    Game_Player.prototype.resetIcon = function () {
        if ((this._balloonID = getParamNumber('DefaultBalloon')) || (this._balloonID = emptyBalloon)) {
            this.requestBalloon(emptyBalloon);
            this.endBalloon();
            balloonIsActive = false;
        }
    };

    // when called, display the balloon
    Game_Player.prototype.openInteract = function() {
        // can add fade later if need be
        let balloonID = getParamNumber('DefaultBalloon');
        this.setBalloonLoop(balloonID);
        if (interactDisplay && this._balloonId !== balloonID && !balloonIsActive) {          
            balloonIsActive = true;
            this.requestBalloon(balloonID);
        }
    };

    // when called, deletes the balloon
    Game_Player.prototype.deleteInteract = function () {
        if (!interactDisplay && balloonIsActive) {
            balloonIsActive = false;
            this.requestBalloon(emptyBalloon);
            this.endBalloon();
        }
    };

    // modify defined end balloon to allow looping
    var _Game_Player_endBalloon = Game_Player.prototype.endBalloon;
    Game_Player.prototype.endBalloon = function() {
        _Game_Player_endBalloon.call(this);
        var loop = this.balloonLoop();
        if (loop && balloonIsActive) {        
            this.requestBalloon(loop);
        }
    };

    // setup balloon loop ID

    Game_Player.prototype.setBalloonLoop = function(loopID) {
        this._balloonLoop = loopID;
    };

    Game_Player.prototype.balloonLoop = function() {
        return this._balloonLoop;
    };

    //=============================================================================
    // Game Event
    //=============================================================================
    
    // checks if event is starting, activates interact icon appropriately
    var _Game_EventUpdate = Game_Event.prototype.update;
    Game_Event.prototype.update = function () {
        _Game_EventUpdate.apply(this, arguments);
        if (this._eventId === interactEventID) {
            if (this._locked) {
                inEvent = true;
                lastInteractedID = interactEventID._eventId;
            } else if (interactEventID !== lastInteractedID) {
                inEvent = false;
            }
        }

        if (!$gameSwitches.value(cutsceneSwitch) && balloonIsActive) {
            this.endHintInteraction();
        }
    };

    //if detected that player is in event, end the looping balloon animation
    Game_Event.prototype.endHintInteraction = function () {
        if (($gamePlayer._balloonID = getParamNumber('DefaultBalloon')) || ($gamePlayer._balloonID = emptyBalloon) && balloonIsActive) {
            $gamePlayer.deleteInteract();
            balloonIsActive = false;
        }
    };

    //detects facing if notpad conditional is Set
    Game_Event.prototype.readNotetagFacingCon = function () {
        if (this.event().note === '') return;
        var conUp = /<FACE UP>/i;
        var conRi = /<FACE RIGHT>/i;
        var conDw = /<FACE DOWN>/i;
        var conLf = /<FACE LEFT>/i;
        if (this.event().note.match(conUp)) {
            return 8;
        }
        else if (this.event().note.match(conRi)) {
            return 6;
        }
        else if (this.event().note.match(conDw)) {
            return 2;
        }
        else if (this.event().note.match(conLf)) {
            return 4;
        }
        else {
            return null;
        }
    };

    Game_Event.prototype.isException = function () {
        var exceptionTag = /<ICON EXCLUDE>/i;
        if (this.event().note.match(exceptionTag)) {
            return true
        } else {
            return false;
        }
    }

    //=============================================================================
    // Sprite Character
    //=============================================================================

    var _Sprite_Character_endBalloon = Sprite_Character.prototype.endBalloon;
    Sprite_Character.prototype.endBalloon = function () {
        var balloonLoop = $gamePlayer.balloonLoop();
        if (balloonLoop && balloonIsActive) {
            this._balloonSprite.setup(balloonLoop);
        } else {
            _Sprite_Character_endBalloon.call(this);
        }
    };
})();
