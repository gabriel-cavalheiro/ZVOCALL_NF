/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"brcominbetta/zvocall_nf/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
