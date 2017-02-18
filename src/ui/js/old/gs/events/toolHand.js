"use strict";

ui.tool.hand = {
	start: function() {
		ui.cursor( "grid", "grab" );
	},
	end: function() {
		ui.cursor( "grid", null );
	},
	mousedown: function() {
		ui.cursor( "app", "grabbing" );
	},
	mouseup: function() {
		ui.cursor( "app", null );
	},
	mousemove: function( e ) {
		ui.setTrackLinesLeft( ui.trackLinesLeft + ui.px_xRel );
		ui.gridScrollTop( ui._gridScrollTop - ui.px_yRel );
		ui.timelineUpdate();
		ui.tracksBgUpdate();
	}
};
