//=============================================================================
// Soundtrack Manager
// Jay_SoundtrackLayering.js
// Version 1.0.1
// FOR USE WITH RPG MAKER MV
//=============================================================================

var Imported = Imported || {};
Imported.Jay_SoundtrackLayering = true;

var Jay = Jay || {};
Jay.SoundtrackLayering = Jay.SoundtrackLayering || {};

//=============================================================================
 /*:
 * @plugindesc Allows layering of BGM tracks.
 *
 * @author Jason R. Godding
 * @target MV
 *
 * @help This plugin will not work properly unless Jay_SoundtrackManager.js is also
 * installed.
 *
 * This plugin allows multiple tracks to be layered at once. All layers must
 * be called with Soundtrack Manager's LoadBGM command in order to be used.
 * 
 * When tracks are layered, a "base track" - played either through RPG
 * Maker's normal Play BGM command or the PlayBGM command of Soundtrack
 * Manager - must be playing and will not be considered a "layer". If 
 * no base track is playing, layers also will not play! Each layer is played
 * independently from each other. They should all be long enough to cover the
 * loop length of the base track.
 *
 * If the base track stops, all layers will stop as well.
 *
 * ===PLAYING A LAYER===
 *
 * Plugin command:
 * PlayBGMLayer trackAlias [parameter=value] [parameter=value] ...
 *
 * Adds a layer with the given track alias (see Soundtrack Manager) to the
 * current BGM. The BGM must be loaded with LoadBGM before this is called.
 * 
 * The loop settings of the base track will override any loop settings of
 * the layer. Pitch will be ignored (it has inconsistent behavior.)
 *
 * All parameters are optional. They are separated by spaces, but cannot
 * contain any spaces within them (including before and after = signs).
 * Valid parameters are:
 *
 * fadeIn
 *
 * Causes the track to gradually fade in instead of starting instantly.
 *
 * fadeTime=5
 *
 * In seconds, how long the fading will take if fadeIn is set. Default is 1.
 *
 * volume=53
 *
 * Overrides the volume setting.
 *
 * pan=15
 *
 * Overrides the pan setting.
 *
 * ===PLAYING A TRACK WITH LAYERS===
 *
 * Plugin command:
 * PlayBGMWithLayers baseTrackAlias [layerAlias] [layerAlias] ...
 * 
 * Plays multiple layered tracks at once. No special parameters can be given.
 * Just list all the tracks (with spaces between, but no spaces in the track
 * names) that you want to play.
 *
 * ===STOPPING A LAYER===
 *
 * Plugin command:
 * StopBGMLayer trackAlias
 *
 * Causes a single layer to stop playing. Does not affect the base track or
 * other layers.
 *
 * ===FADING A LAYER OUT===
 *
 * Plugin command:
 * FadeOutBGMLayer trackAlias [fadeTime]
 * 
 * Causes a single layer to fade out with the given fade time (default is 
 * 1 second.) Does not affect the base track or other layers.
 * 
 * ====================================
 *
 * Version 1.0.1 - Fixed oversight with volume and pan settings.
 *
 * Version 1.0 - First version.
 *
 * This version of the plugin is not free to use; please purchase before using.
 * Do not distribute or claim ownership.
 * When used, please credit Jason R. Godding in your project.
 * © Jason R. Godding, 2025
 *
 */

Jay.Parameters = Jay.Parameters || {};
Jay.Parameters.SoundtrackLayering = PluginManager.parameters('Jay_SoundtrackLayering');

Jay.Param = Jay.Param || {};

// Attaches layering commands to the interpreter.
Jay.SoundtrackLayering.pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	if(command === 'PlayBGMLayer') {
		AudioManager.playBgmLayerCmd(args);
	}
	if(command === 'PlayBGMWithLayers') {
		AudioManager.playBgmWithLayers(args);
	}
	if(command === 'StopBGMLayer') {
		AudioManager.stopBgmLayerCmd(args);
	}
	if(command === 'FadeOutBGMLayer') {
		AudioManager.fadeOutBgmLayerCmd(args);
	}
	Jay.SoundtrackLayering.pluginCommand.call(this, command, args);
}

// Plays a track as a layer to another track.
AudioManager.playBgmLayerCmd = function(args) {	
	if (!args[0]) {
        throw ("No parameters provided for PlayBGMLayer command.");
    }
	
	if(!this._bgmBuffers || !this._bgmBuffers[args[0]]) {
        // It hasn't been loaded, so we can't really do anything.
		return;
    }
	
	if(!this._currentBgm) {
		// You can't add a layer to no track.
		return;
	}
	
	if(!this._bgmLayers) {
		this._bgmLayers = {};
	}
	
	var bgmAlias = args[0];
	var bgm = Object.assign({}, this._bgmBuffers[bgmAlias].track);
	
	if(this._currentBgm.name === bgm.name) {
		// Can't add a track as its own layer
		return;
	}
	
	if(this._bgmLayers[bgmAlias] && this._bgmLayers[bgmAlias]._autoPlay) {
		// Layer is already playing.
		return;
	}
	
    var fadeIn = false;
    var fadeTime = 1;
    
    // Load from the plugin command
    args.forEach(function(arg) {
        if (arg.toLowerCase() === "fadein") {
            fadeIn = true;
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
	
	this.playBgmLayer(bgm, fadeIn, fadeTime);
}

AudioManager.playBgmLayer = function(bgm) {
	this.playBgmLayer(bgm, false, 1);
}
	
AudioManager.playBgmLayer = function(bgm, fadeIn, fadeTime) {
    var buffer = this._bgmBuffers[bgm.alias].buffer;
    var currentBgmPos = AudioManager.saveBgm();
	buffer._loopStart = this._bgmBuffer._loopStart;
	buffer._loopLength = this._bgmBuffer._loopLength;
	
	if (!this._meBuffer) {
		buffer.play(true, currentBgmPos.pos);
	}
	else
	{
		buffer.wasPlaying = true;
	}
	
	this.updateBufferParameters(buffer, this._bgmVolume, bgm);
	
	if (fadeIn) {
        buffer.fadeIn(fadeTime);
    }
	
	if(!this._bgmLayers) {
		this._bgmLayers = {};
	}
	
	this._bgmLayers[bgm.alias] = buffer;
	
	if (!$gameParty._saveLayers) {
		$gameParty._saveLayers = {};
	}
	
	$gameParty._saveLayers[bgm.alias] = bgm;
}

AudioManager.playBgmWithLayers = function(args) {
	if (!args[0]) {
        throw ("No parameters provided for PlayBGMWithLayers command.");
    }
	
	this.playLoadedBgm([args[0]]);
	
	args.forEach(function(track) {
		if(track != args[0]) {
			AudioManager.playBgmLayerCmd([track]);
		}
	});
}

AudioManager.stopBgmLayerCmd = function(args) {
	this.stopBgmLayer(args[0]);
	$gameParty[args[0]] = null;
}

AudioManager.fadeOutBgmLayerCmd = function(args) {
	var duration = args[1] ? parseInt(args[1]) : 1;
	this.fadeOutBgmLayer(args[0], duration);
	$gameParty[args[0]] = null;
}

AudioManager.stopBgmLayer = function(layer) {
	if (this._bgmLayers[layer]) {
		this._bgmLayers[layer].wasPlaying = false;
		this._bgmLayers[layer].stop();
		$gameParty._saveLayers[layer] = null;
	}
}

AudioManager.fadeOutBgmLayer = function(layer, duration) {
	if (this._bgmLayers[layer]) {
		this._bgmLayers[layer].wasPlaying = false;
		this._bgmLayers[layer].fadeOut(duration);
		$gameParty._saveLayers[layer] = null;
	}
}

// Overrides the stopBgm command.
AudioManager.stopBgm = function() {
    if(!this.bgmIsOverridden()) {
        Jay.SoundtrackManager.stopBgm.call(this);
		
		for (var key in this._bgmLayers) {
			this.stopBgmLayer(key);
			this._bgmLayers[key] = null;
        }
    }
};

// Overrides the fadeOutBgm command.
Jay.SoundtrackLayering.fadeOutBgm = AudioManager.fadeOutBgm;
AudioManager.fadeOutBgm = function(duration) {
    Jay.SoundtrackLayering.fadeOutBgm.call(this, duration);
	
	for (var key in this._bgmLayers) {
		this.fadeOutBgmLayer(key, duration);
		this._bgmLayers[key] = null;
    }
};

// Overrides the playMe command.
AudioManager.playMe = function(me) {
    this.stopMe();
    if (me.name) {
        if (this._bgmBuffer && this._currentBgm) {
            this._currentBgm.pos = this._bgmBuffer.seek();
			if (this._bgmLayers) {
				for (var key in this._bgmLayers) {
					if (this._bgmLayers[key]) {
						this._bgmLayers[key].wasPlaying = this._bgmLayers[key].isPlaying();
						this._bgmLayers[key].stop();
					}
				}
			}
            this._bgmBuffer.stop();
        }
        this._meBuffer = this.createBuffer('me', me.name);
        this.updateMeParameters(me);
        this._meBuffer.play(false);
        this._meBuffer.addStopListener(this.stopMe.bind(this));
    }
};

// Overrides the stopMe command.
AudioManager.stopMe = function() {
    if (this._meBuffer) {
        this._meBuffer.stop();
        this._meBuffer = null;
        if (this._bgmBuffer && this._currentBgm && !this._bgmBuffer.isPlaying()) {
            this._bgmBuffer.play(true, this._currentBgm.pos);
            this._bgmBuffer.fadeIn(this._replayFadeTime);
			if (this._bgmLayers) {
				for (var key in this._bgmLayers) {
					if (this._bgmLayers[key] && this._bgmLayers[key].wasPlaying) {
						this._bgmLayers[key].play(true, this._currentBgm.pos);
						this._bgmLayers[key].fadeIn(this._replayFadeTime);
					}
				}
			}
        }
    }
};

// Overrides the onAfterLoad command.
Jay.SoundtrackLayering.onAfterLoad = Game_System.prototype.onAfterLoad;
Game_System.prototype.onAfterLoad = function() {
	Jay.SoundtrackLayering.onAfterLoad.call(this);
	if($gameParty._saveLayers) {
		for (var key in $gameParty._saveLayers) {
			if ($gameParty._saveLayers[key]) {
				AudioManager.playBgmLayer($gameParty._saveLayers[key]);
			}
		}
	}
};