//=============================================================================
// Soundtrack Manager
// Jay_SoundtrackManager.js
// Based on Jay_VariableMix.js
// Version 3.2.2
// FOR USE WITH RPG MAKER MV
//=============================================================================

var Imported = Imported || {};
Imported.Jay_SoundtrackManager = true;

var Jay = Jay || {};
Jay.SoundtrackManager = Jay.SoundtrackManager || {};

//=============================================================================
 /*:
 * @plugindesc Contains a number of special controls for BGM tracks.
 *
 * @author Jason R. Godding
 * @target MV
 *
 * @param BGM Override Switch
 * @type Switch
 * @desc If the chosen switch is turned on, normal BGM and ME commands will be ignored.
 *
 * @help This plugin allows you to load and play music tracks with a number
 * of features not included in RPG Maker MV normally.
 *
 * There are three main commands:
 *
 * ===LOADING A TRACK===
 *
 * Plugin command:
 * LoadBGM nameOfTrack [parameter=value] [parameter=value] ...
 *
 * This command loads a BGM track into memory. If not loaded, PlayBGM will
 * not work. Loading takes a second or two, so make sure to load it before
 * you need it.
 * 
 * "nameOfTrack" is the file name of the track in your audio\bgm folder.
 * Do not include the extension. Names cannot contain spaces, so you
 * should_use_underscores OrCamelCase when naming tracks.
 *
 * Loaded tracks are saved to the game's save file, and will be automatically
 * re-loaded when the save file is loaded.
 * 
 * All parameters are optional. They are separated by spaces, but cannot
 * contain any spaces within them (including before and after = signs).
 * Valid parameters are:
 *
 * alias=thisTracksAlias
 *
 * If you give a track an alias, you can refer to it by that alias in the
 * future when playing back or clearing it. This also allows you to create
 * multiple instances of a single track with different parameters.
 * The default alias is the same as the name of the track.
 * No two loaded tracks can have the same alias. If you try to load another
 * track with the same alias, the first will be unloaded and replaced
 * by the second.
 *
 * volume=50
 *
 * Sets the volume of the track. Works the same as the default editor, but
 * allows for more values.
 * Default is 100.
 *
 * pan=10
 * 
 * Sets the left/right pan of the track. Works the same as the default editor,
 * but allows for more values.
 * Default is 0.
 *
 * pitch=125
 *
 * Sets the pitch of the track. Works the same as the default editor, but
 * allows for more values.
 * Default is 100.
 * Please note that the built-in AudioManager sometimes behaves oddly
 * with pitch values other than 100, and it might prevent variable mix
 * from working, or user-defined starting points from being used.
 *
 * tempoRatio=120/160
 *
 * Used for variable mix tracks. One track must be considered the "default"
 * tempo, and all others must be defined as ratios of the default tempo over
 * the other tracks'. For example, if the "default" is 180 beats per minute,
 * and you want to load a track with a tempo of 144 beats per minute, then
 * the tempoRatio of the second track should be 180/144 (or 5/4).
 * Ignored when not played as a variable mix.
 * Accepts fractions and decimals. Default is 1.0.
 *
 * loopstart=12345
 *
 * Overrides the track's LOOPSTART metadata. If not included, the standard
 * LOOPSTART will be used. Use sample number as you would in LOOPSTART.
 *
 * looplength=23456
 *
 * Overrides the track's LOOPLENGTH metadata. If not included, the standard
 * LOOPLENGTH will be used. Use sample number as you would in LOOPLENGTH.
 *
 * playFrom=5432
 *
 * Starts playback at the sample number included. Ignored for variable mix
 * playback, or when playing another instance of the same track (forceFromStart
 * in the PlayBGM command can force it to start from this point anyway.)
 * Default is 0.
 *
 * sampleRate=56789
 *
 * If you're using certain file types, like OPUS, that don't have a built-in
 * sample rate, define one here. If the file has a built-in sample rate, this
 * will go unused. Default is 44100, which is standard, so you usually will
 * not need to set this even if you're using an alternate file type.
 *
 * ===PLAYING A TRACK===
 *
 * Plugin command:
 * PlayBGM trackAlias [parameter=value] [parameter=value] ...
 *
 * Plays a loaded BGM from its alias. If the given BGM was not loaded, this
 * command will do nothing.
 *
 * Some parameters from loading can be overridden by the play command.
 * Notably, pitch is not one of them (it has inconsistent behavior), so if
 * you want to play the track at a different pitch, set it with the load
 * command.
 *
 * "trackAlias" is the name or alias of the track that was loaded. If an
 * alias was provided, it must be used here; using the name of the track won't
 * work.
 *
 * Since loading tracks takes time, if given enough load time before calling
 * PlayBGM, the tracks will start significantly sooner than they would otherwise.
 * 
 * All parameters are optional. They are separated by spaces, but cannot
 * contain any spaces within them (including before and after = signs).
 * Valid parameters are:
 *
 * volume=70
 *
 * Overrides the volume setting.
 *
 * pan=-5
 * 
 * Overrides the pan setting.
 * 
 * loopstart=5432
 *
 * Overrides both the LOOPSTART setting in the track's metadata and the
 * loopstart setting in the LoadBGM command.
 *
 * looplength=6543
 *
 * Overrides both the LOOPLENGTH setting in the track's metadata and the
 * looplength setting in the LoadBGM command.
 * 
 * playfrom=787878
 *
 * Starts playback at the sample number included. Ignored for variable mix
 * playback, or when playing another instance of the same track when
 * forceFromStart is not set. Overrides any value given in the LoadBGM command.
 *
 * variable (or variablemix or continue)
 *
 * When set, the track starts from a point relative to the current playback
 * position of the current track. Used for allowing the music to flow cleanly
 * between related tracks. When the tracks have defined tempoRatio values, it
 * calculates the starting point based on the ratio of their tempos; otherwise,
 * it starts from the same sample number.
 * Automatically sets crossFade, but the "instant" parameter can cancel that.
 *
 * crossFade
 *
 * When set, the currently-playing track will fade out and the new track will
 * fade in simultaneously. If there is no track currently playing, there will
 * not be any fade-in unless the fadeIn parameter is set. You cannot use
 * cross-fading between two tracks with the same alias (but you can use it
 * between two instances of the same track with different aliases); if you
 * try, it will be ignored.
 *
 * fadeIn
 *
 * When set, and when cross-fading is not set or does not apply, the track
 * will fade in as it starts playing.
 * There is no fadeOut command, because the standard RPG Maker command
 * works fine.
 *
 * instant
 *
 * Cancels the automatic application of crossFade from variable mix tracks.
 *
 * fadeTime=1.5
 *
 * Sets how long, in seconds, cross-fading and fadeIn commands take. Allows
 * decimals.
 * Default is 1.0.
 *
 * forceFromStart
 *
 * Normally, when a new "Play BGM" command is played using the same track
 * as what is presently playing, it continues playback from the same point.
 * "forceFromStart" changes this behavior, so it will always start from the
 * beginning of the track (or the "playFrom" point).
 * Ignored for variable tracks, and meaningless when the currently-playing
 * track is not the same as the track being played.
 *
 * ===CLEARING A TRACK===
 *
 * Plugin command:
 * ClearBGM [trackAlias]
 *
 * Too many tracks loaded into memory at once will slow the game and may
 * even crash it. Though I've found that a decent-quality PC can keep
 * literally hundreds of BGM tracks loaded simultaneously, best not to
 * push it - especially if you're aiming to create a mobile game!
 *
 * If you provide an alias to the command, it will clear that track
 * from memory (if it hasn't been loaded, nothing will happen.) If you
 * don't, all tracks will be cleared from memory at once. This will
 * not affect any tracks currently playing; they won't be able to be
 * called with PlayBGM any more, but they'll continue playing.
 *
 * ===OTHER THINGS TO NOTE===
 *
 * If you play the same track that is currently playing with different
 * loop settings, without forceFromStart, it will work fine and continue
 * playing with the new loop settings, which can be used for helping
 * sync scenes with the action in the game... just so long as the new
 * end of the loop is after the sample that is currently playing. If it
 * is before, the track will jump back to a point inside the new loop,
 * which may sound jarring and should probably be avoided (it won't
 * hurt anything, though.)
 *
 * Any loaded track whose alias is the same as its track name will be
 * played as though run through PlayBGM if played through any normal
 * playback methods, allowing you to use some of the features for
 * automatic playback situations (like battles or riding vehicles.)
 *
 * ====================================
 *
 * Version 3.2.2 - Another compatibility improvement for
 * Soundtrack Layering.
 *
 * Version 3.2.1 - Fixed oversight that interferes with the new
 * Soundtrack Layering plugin.
 *
 * Version 3.2 - Added support for file types beyond standard OGG.
 *
 * Version 3.1.3 - Fixes an issue where tracks would remain loaded
 * between multiple save files played in the same session.
 *
 * Version 3.1.2 - Actually makes the BGM Override Switch work (oops!)
 *
 * Version 3.1.1 - Fixed another bug in ClearBGM
 *
 * Version 3.1 - Added BGM Override Switch option.
 *
 * Version 3.0.1 - Fixed a bug in ClearBGM
 *
 * Version 3.0 - Premium version:
 *  - Became "Soundtrack Manager" instead of "Variable Mix Manager"
 *  - Now does things other than variable mix tracks:
 *  -- Change the loop points of a track on the fly
 *  -- Start a track partway through
 *  -- Cross-fade between unrelated tracks
 *  -- See above for full details
 *  - Parameters are now defined by name instead of position in command.
 *
 * Version 2.0 - Not released to public - Allows multiple tracks to be loaded.
 *
 * Version 1.0.2 - Small robustness fix most people won't even notice.
 *
 * Version 1.0.1 - Fixed a game-crashing bug if you saved after loading a
 * variable track, but before playing it.
 *
 * Version 1.0 - First version.
 *
 * This version of the plugin is not free to use; please purchase before using.
 * Do not distribute or claim ownership.
 * When used, please credit Jason R. Godding in your project.
 * © Jason R. Godding, 2019
 *
 */
 
Jay.Parameters = Jay.Parameters || {};
Jay.Parameters.SoundtrackManager = PluginManager.parameters('Jay_SoundtrackManager');

Jay.Param = Jay.Param || {};
Jay.Param.BGMOverrideSwitch = eval(Jay.Parameters.SoundtrackManager['BGM Override Switch']);

// Attaches the "LoadBGM", "PlayBGM", and "ClearBGM" commands to the interpreter.
Jay.SoundtrackManager.pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	if (command === 'LoadBGM') {
		this.loadBGM(args);
	}
	if (command === 'PlayBGM') {
		AudioManager.playLoadedBgm(args);
	}
	if (command === 'ClearBGM') {
		AudioManager.clearBgm(args);
	}
	Jay.SoundtrackManager.pluginCommand.call(this, command, args);
}

// Loads a BGM's details from the plugin command line.
Game_Interpreter.prototype.loadBGM = function(args) {
    if (!args[0]) {
        throw ("No parameters provided for LoadBGM command.");
    }
    
    // Default values
    var trackName = args[0];
    var trackAlias = trackName;
    var trackVolume = 100;
    var trackPan = 0;
    var trackPitch = 100;
    var trackTempoRatio = 1.0;
    var trackLoopStartOverride = -1;
    var trackLoopLengthOverride = -1;
    var trackStartingPos = 0;
	var trackSampleRate = 44100;
    
    // Load in the values from the plugin command
    args.forEach(function(arg) {
        if (arg.match(/alias=(.*)/gi)) {
            trackAlias = RegExp.$1;
        }
        else if (arg.match(/volume=(\d*)/gi)) {
            trackVolume = parseInt(RegExp.$1);
        }
        else if (arg.match(/pan=(\d*)/gi)) {
            trackPan = parseInt(RegExp.$1);
        }
        else if (arg.match(/pitch=(\d*)/gi)) {
            trackPitch = parseInt(RegExp.$1);
        }
        else if (arg.match(/temporatio=(.*)/gi)) {
            trackTempoRatio = RegExp.$1;
        }
        else if (arg.match(/loopstart=(\d*)/gi)) {
            trackLoopStartOverride = parseInt(RegExp.$1);
        }
        else if (arg.match(/looplength=(\d*)/gi)) {
            trackLoopLengthOverride = parseInt(RegExp.$1);
        }
        else if (arg.match(/playfrom=(\d*)/gi)) {
            trackStartingPos = parseInt(RegExp.$1);
        }
        else if (arg.match(/sampleRate=(\d*)/gi)) {
            trackSampleRate = parseInt(RegExp.$1);
        }
    });
    
    // Create the BGM object
	var bgm = {
		name: trackName,
		volume: trackVolume,
		pitch: trackPitch,
		pan: trackPan,
		tempoRatio: trackTempoRatio,
        alias: trackAlias,
        loopstart: trackLoopStartOverride,
        looplength: trackLoopLengthOverride,
        startingPos: trackStartingPos,
		sampleRate: trackSampleRate
	}
    
    // Load the buffer
	AudioManager.loadBgm(bgm);
}

// Loads a BGM into memory and adds it to _bgmBuffers
AudioManager.loadBgm = function(bgm) {
    if (!bgm) {
        return;
    }
    
    if (!this._bgmBuffers) {
        this._bgmBuffers = {}
        this._bgmBuffers._count = 0;
    }
    
	var bgmBuffer = this.createBuffer('bgm', bgm.name);
    
    if (!this._bgmBuffers[bgm.alias]) {
        this._bgmBuffers._count++;
    }
    else {
        this._bgmBuffers[bgm.alias].track = null;
        this._bgmBuffers[bgm.alias].buffer = null;
        this._bgmBuffers[bgm.alias] = null;
    }
    
    this._bgmBuffers[bgm.alias] = {
        track: bgm,
        buffer: bgmBuffer
    }
    
    if (!$gameParty._saveBgm) {
        $gameParty._saveBgm = {};
    }
    
    $gameParty._saveBgm[bgm.alias] = bgm;
}

// Plays a BGM loaded into _bgmBuffers.
AudioManager.playLoadedBgm = function(args) {
    if (!args[0]) {
        throw ("No parameters provided for PlayBGM command.");
    }
    
	if(!this._bgmBuffers || !this._bgmBuffers[args[0]]) {
        // It hasn't been loaded, so we can't play it.
        return;
	}
    
    // Default values
    var bgm = Object.assign({}, this._bgmBuffers[args[0]].track);
    var buffer = this._bgmBuffers[args[0]].buffer;
    var currentBgmPos = AudioManager.saveBgm();
    var isVariable = false;
    var crossFade = false;
    var crossFadeSet = false;
    var fadeIn = false;
    var fadeInSet = false;
    var forceFromStart = false;
    var oldTempoRatio = 1.0;
    var fadeTime = 1;
    
    // Load from the plugin command
    args.forEach(function(arg) {
        if (arg.match(/playfrom=(\d*)/gi)) {
            bgm.startingPos = parseInt(RegExp.$1);
        }
        else if (arg.match(/loopstart=(\d*)/gi)) {
            bgm.loopstart = RegExp.$1;
        }
        else if (arg.match(/looplength=(\d*)/gi)) {
            bgm.looplength = RegExp.$1;
        }
        else if (arg.toLowerCase() === "variable" || 
            arg.toLowerCase === "variablemix" || 
            arg.toLowerCase === "continue") {
                isVariable = true;
                if (!crossFadeSet) {
                    crossFade = true;
                }
        }
        else if (arg.toLowerCase() === "crossfade") {
            crossFade = true;
            crossFadeSet = true;
        }
        else if (arg.toLowerCase() === "instant") {
            crossFade = false;
            fadeIn = false;
            crossFadeSet = true;
            fadeInSet = true;
        }
        else if (arg.toLowerCase() === "fadein") {
            fadeIn = true;
            fadeInSet = true;
        }
        else if (arg.toLowerCase() === "forcefromstart") {
            forceFromStart = true;
        }
        else if (arg.match(/fadetime=(.*)/gi)) {
            fadeTime = Number(RegExp.$1);
        }
        else if (arg.match(/volume=(\d*)/gi)) {
            bgm.volume = parseInt(RegExp.$1);
        }
        else if (arg.match(/pan=(\d*)/gi)) {
            bgm.pan = parseInt(RegExp.$1);
        }
    });
    
    // Get info on the currently-playing track to stop it or fade it out (as necessary).
    if (this._currentBgm) {
        oldTempoRatio = this._currentTempoRatio || 1.0;
        if (this._currentBgm.name == bgm.name && !isVariable && !forceFromStart) { isVariable = true; }
        
        if (this._bgmBuffer === buffer) {
            crossFade = false;
        }
        
        if (this._bgmBuffer) {
            if (crossFade) {
                this.fadeOutBgm(fadeTime);
            }
            else if (this._bgmBuffer !== buffer) {
                this.stopBgm();
            }
        }
        else {
            crossFade = false;
        }
        
        if(this._spareBuffer && this._spareBuffer !== this._bgmBuffer) {
            this._spareBuffer.stop();
        }
    }
    else {
        var oldTempoRatio = 1.0;
        currentBgmPos.pos = 0;
        crossFade = false;
    }
    
    if (crossFade) { fadeIn = true; }
    var currentPos = 0;
    this._spareBuffer = this._bgmBuffer;
    this._bgmBuffer = null;
	var sampleRate = buffer._sampleRate > 0 ? buffer._sampleRate : bgm.sampleRate;
    
    // Set the loop
    if (bgm.loopstart > -1) {
        buffer._naturalLoopStart = buffer._naturalLoopStart || buffer._loopStart;
        buffer._loopStart = bgm.loopstart / sampleRate;
    }
    else if (buffer._naturalLoopStart) {
        buffer._loopStart = buffer._naturalLoopStart;
    }
    
    if(bgm.looplength > -1) {
        buffer._naturalLoopLength = buffer._naturalLoopLength || buffer._loopLength;
        buffer._loopLength = bgm.looplength / sampleRate;
    }
    else if (buffer._naturalLoopLength) {
        buffer._loopLength = buffer._naturalLoopLength;
    }
    
    if (isVariable) {
        // Variable mix setup
        currentPos = currentBgmPos.pos * eval(bgm.tempoRatio) / eval(oldTempoRatio);
        var loops = Math.floor((currentPos - buffer._loopStart) / buffer._loopLength);
        if(buffer._loopStart + buffer._loopLength < currentPos) {
            currentPos -= buffer._loopLength * loops;
        }
    }
    else if (bgm.startingPos > 0) {
        currentPos = bgm.startingPos / sampleRate;
    }
    
	if (!this._meBuffer) {
		buffer.play(true, currentPos);
	}
	this._bgmBuffer = buffer;
	this.updateBgmParameters(bgm);
    
    if (fadeIn) {
        this._bgmBuffer.fadeIn(fadeTime);
    }
    
	this.updateCurrentBgm(bgm, currentPos);
    this._currentTempoRatio = bgm.tempoRatio;
    $gameParty._currentTempoRatio = bgm.tempoRatio;
};

// Overrides the playBgm command. If a track is loaded with its
// name as its alias, it plays that track through playLoadedBgm
// instead of the normal methods.
Jay.SoundtrackManager.playBgm = AudioManager.playBgm;
AudioManager.playBgm = function(bgm, pos) {
    if(this.bgmIsOverridden()) {
        return;
    }

    if(!this._bgmBuffers || !this._bgmBuffers[bgm.name] || this._bgmBuffers[bgm.name].buffer.pitch * 100 != bgm.pitch) {
        // It hasn't been loaded, so we have to use the native playBgm function.
        Jay.SoundtrackManager.playBgm.call(this, bgm, pos);
    }
    else {
        args = [];
        args[0] = bgm.name;
        args[1] = 'pan=' + bgm.pan;
        args[2] = 'volume=' + bgm.volume;
            
        if (pos) {
            args[3] = 'playFrom=' + pos * this._bgmBuffers[bgm.name].buffer._sampleRate;
        }
            
        AudioManager.playLoadedBgm(args);
    }
};

// Overrides the stopBgm command.
Jay.SoundtrackManager.stopBgm = AudioManager.stopBgm;
AudioManager.stopBgm = function() {
    if(!this.bgmIsOverridden()) {
        Jay.SoundtrackManager.stopBgm.call(this);
    }
};

// Overrides the playMe command.
Jay.SoundtrackManager.playMe = AudioManager.playMe;
AudioManager.playMe = function(me) {
    if(!this.bgmIsOverridden()) {
        Jay.SoundtrackManager.playMe.call(this, me);
    }
};

AudioManager.bgmIsOverridden = function() {
    if (Jay.Param.BGMOverrideSwitch !== null && Jay.Param.BGMOverrideSwitch > 0) {
        return $gameSwitches.value(Jay.Param.BGMOverrideSwitch);
    }
    
    return false;
};

// Overrides the playTitleMusic command.
Scene_Title.prototype.playTitleMusic = function() {
    Jay.SoundtrackManager.playBgm.call(AudioManager, $dataSystem.titleBgm);
    AudioManager.stopBgs();
    AudioManager.stopMe();
};

/**
 * Performs the audio fade-out.
 * Fixes a minor bug in the original version of the function.
 *
 * @method fadeOut
 * @param {Number} duration Fade-out time in seconds
 */
WebAudio.prototype.fadeOut = function(duration) {
    if (this._gainNode) {
        var gain = this._gainNode.gain;
        var currentTime = WebAudio._context.currentTime;
        gain.cancelScheduledValues(currentTime);
        gain.setValueAtTime(this._volume, currentTime);
        gain.linearRampToValueAtTime(0, currentTime + duration);
    }
    this._autoPlay = false;
};

// Clears a BGM from memory, or all BGMs if no args are provided.
// Also clears from the gameParty object so it won't persist in
// save files.
AudioManager.clearBgm = function(args) {
    AudioManager.clearBgmBase(args);
    AudioManager.clearBgmFromSaves(args);
}

// Clears a BGM from memory, or all BGMs if no args are provided.
AudioManager.clearBgmBase = function(args) {
    if (args && args.length > 0) {
        if (this._bgmBuffers && this._bgmBuffers[args[0]]) {
            var track = args[0];
            this._bgmBuffers[track].track = null;
            this._bgmBuffers[track].buffer = null;
            this._bgmBuffers[track] = null;
            this._bgmBuffers._count--;
        }
    }
    else {
        for (var key in this._bgmBuffers) {
			if (this._bgmBuffers[key]) {
				this._bgmBuffers[key].track = null;
				this._bgmBuffers[key].buffer = null;
				this._bgmBuffers[key] = null;
			}
        }
        this._bgmBuffers = null;
    }
}

// Clears a BGM from gameParty so it won't persist in save files.
AudioManager.clearBgmFromSaves = function(args) {
    if (!$gameParty._saveBgm) {
        return;
    }
    
    if (args && args.length > 0) {
        $gameParty._saveBgm[args[0]] = null;
    }
    else {
        for (var key in $gameParty._saveBgm) {
            $gameParty._saveBgm[key] = null;
        }
        $gameParty._saveBgm = null;
    }
}

// Automatically loads tracks that were loaded previously
// upon loading a saved game.
Jay.SoundtrackManager.load = DataManager.loadGame;
DataManager.loadGame = function(savefileId) {
	var returnValue = Jay.SoundtrackManager.load.call(this, savefileId);
    AudioManager.clearBgmBase();
	if($gameParty._saveBgm) {
        for (var key in $gameParty._saveBgm) {
            AudioManager.loadBgm($gameParty._saveBgm[key]);
        }
        AudioManager._currentTempoRatio = $gameParty._currentTempoRatio || 1.0;
	}
	return returnValue;
}

// Clears local BGMs after a game ends.
Jay.SoundtrackManager.commandToTitle = Scene_GameEnd.prototype.commandToTitle;
Scene_GameEnd.prototype.commandToTitle = function() {
    Jay.SoundtrackManager.commandToTitle.call(this);
	AudioManager.clearBgmBase();
};