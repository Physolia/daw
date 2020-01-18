"use strict";

function UIcompositionChanged( obj, prevObj ) {
	console.log( "change", obj );
	UIcompositionChanged.fn.forEach( ( fn, attr ) => {
		if ( typeof attr === "string" ) {
			if ( attr in obj ) {
				fn.call( this, obj, prevObj );
			}
		} else if ( attr.some( attr => attr in obj ) ) {
			fn.call( this, obj, prevObj );
		}
	} );
}

UIcompositionChanged.fn = new Map( [
	[ "channels", function( { channels } ) {
		const synOpenedDest = DAW.get.synth( DAW.get.synthOpened() ).dest,
			synOpenedChan = channels[ synOpenedDest ];

		UImixer.change( channels );
		Object.entries( channels ).forEach( ( [ id, obj ] ) => {
			if ( "name" in obj ) {
				UIsynthsUpdateChanName( id, obj.name );
			}
		} );
		if ( synOpenedChan && "name" in synOpenedChan ) {
			DOM.synthChannelBtnText.textContent = synOpenedChan.name;
		}
	} ],
	[ "effects", function( obj ) {
		UIeffects.change( obj.effects );
	} ],
	[ "synths", function( { synths }, prevObj ) {
		const synOpened = DAW.get.synthOpened();

		Object.entries( synths ).forEach( ( [ id, obj ] ) => {
			if ( !obj ) {
				UIsynthsRemoveSynth( id );
			} else if ( !prevObj.synths[ id ] ) {
				UIsynthsAddSynth( id, obj );
			} else {
				UIsynthsUpdateSynth( id, obj );
			}
		} );
		if ( synOpened in synths ) {
			UIsynthChange( synths[ synOpened ] );
		}
	} ],
	[ "patterns", function( { patterns }, prevObj ) {
		Object.entries( patterns ).forEach( ( [ id, obj ] ) => {
			if ( !obj ) {
				UIpatterns.get( id ).remove();
				UIpatterns.delete( id );
			} else if ( !prevObj.patterns[ id ] ) {
				UIaddPattern( id, obj );
			} else {
				UIupdatePattern( id, obj );
			}
		} );
		gsuiReorder.listReorder( DOM.buffPatterns, patterns );
		UIsynths.forEach( syn => {
			const list = syn.root.querySelector( ".synth-patterns" );

			gsuiReorder.listReorder( list, patterns );
		} );
	} ],
	[ [ "tracks", "blocks" ], function( obj ) {
		GSData.deepAssign( UIpatternroll.data.tracks, obj.tracks );
		GSData.deepAssign( UIpatternroll.data.blocks, obj.blocks );
	} ],
	[ [ "loopA", "loopB" ], function() {
		UIpatternroll.loop(
			DAW.get.loopA(),
			DAW.get.loopB() );
	} ],
	[ [ "beatsPerMeasure", "stepsPerBeat" ], function() {
		const bPM = DAW.get.beatsPerMeasure(),
			sPB = DAW.get.stepsPerBeat();

		UIclock.setStepsPerBeat( sPB );
		UIsynth.timeSignature( bPM, sPB );
		UIdrums.timeSignature( bPM, sPB );
		UIpatternroll.timeSignature( bPM, sPB );
		UIpianoroll.timeSignature( bPM, sPB );
		DOM.beatsPerMeasure.textContent = bPM;
		DOM.stepsPerBeat.textContent = sPB;
		Object.keys( DAW.get.patterns() ).forEach( UIupdatePatternContent );
	} ],
	[ "bpm", function( { bpm } ) {
		UIclock.setBPM( bpm );
		DOM.bpm.textContent =
		UIcompositions.get( DAW.get.composition() ).bpm.textContent = bpm;
		UIupdatePatternsBPM( bpm );
	} ],
	[ "name", function( { name } ) {
		UItitle();
		DOM.headCmpName.textContent =
		UIcompositions.get( DAW.get.composition() ).name.textContent = name;
	} ],
	[ "duration", function( { duration } ) {
		const dur = DAWCore.time.beatToMinSec( duration, DAW.get.bpm() );

		if ( DAW.compositionFocused ) {
			DOM.sliderTime.options( { max: duration } );
		}
		DOM.headCmpDur.textContent =
		UIcompositions.get( DAW.get.composition() ).duration.textContent = dur;
	} ],
	[ "keys", function( { keys } ) {
		const pats = Object.entries( DAW.get.patterns() ),
			patOpened = DAW.get.patternKeysOpened();

		Object.entries( keys ).forEach( ( [ keysId, keysObj ] ) => {
			pats.some( ( [ patId, patObj ] ) => {
				if ( patObj.keys === keysId ) {
					UIupdatePatternContent( patId );
					if ( patId === patOpened ) {
						GSData.deepAssign( UIpianoroll.data, keysObj );
					}
					return true;
				}
			} );
		} );
	} ],
	[ "synthOpened", function( { synthOpened }, prevObj ) {
		const el = UIsynths.get( synthOpened ),
			elPrev = UIsynths.get( prevObj.synthOpened );

		el && el.root.classList.add( "synth-selected" );
		elPrev && elPrev.root.classList.remove( "synth-selected" );
		UIsynthOpen( synthOpened );
	} ],
	[ "patternKeysOpened", function( { patternKeysOpened }, prevObj ) {
		const pat = DAW.get.pattern( patternKeysOpened ),
			el = pat && UIpatterns.get( patternKeysOpened ),
			elPrev = UIpatterns.get( prevObj.patternKeysOpened );

		UIpianoroll.empty();
		DOM.pianorollName.textContent = pat ? pat.name : "";
		DOM.pianorollForbidden.classList.toggle( "hidden", pat );
		if ( pat ) {
			el.classList.add( "selected" );
			GSData.deepAssign( UIpianoroll.data, DAW.get.keys( pat.keys ) );
			UIpianoroll.resetKey();
			UIpianoroll.scrollToKeys();
			if ( !DAW.compositionFocused ) {
				DOM.sliderTime.options( { max: pat.duration } );
			}
			UIwindows.window( "piano" ).open();
		} else {
			UIpianoroll.setPxPerBeat( 90 );
		}
		if ( elPrev ) {
			elPrev.classList.remove( "selected" );
		}
	} ],
] );
