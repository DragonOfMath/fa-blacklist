var DragHandler = {
	x: 0,
	y: 0,
	oldx: 0,
	oldy: 0,
	dx: 0,
	dy: 0,
	dragging: null,
	initialize: function () {
		DragHandler.x = 0;
		DragHandler.y = 0;
		DragHandler.oldx = 0;
		DragHandler.oldy = 0;
		DragHandler.dx = 0;
		DragHandler.dy = 0;
		DragHandler.dragging = null;
	},
	goto: function (x,y) {
		DragHandler.oldx = DragHandler.x;
		DragHandler.oldy = DragHandler.y;
		DragHandler.x = x;
		DragHandler.y = y;
		DragHandler.dx = DragHandler.x - DragHandler.oldx;
		DragHandler.dy = DragHandler.y - DragHandler.oldy;
	},
	move: function (e) {
		if (DragHandler.dragging) {
			e.preventDefault();
			DragHandler.dragging.move(DragHandler.dx, DragHandler.dy).keepOnScreen();
		}
	},
	start: function ($e) {
		DragHandler.dragging = $e;
	},
	stop: function () {
		DragHandler.dragging = null;
	},
	listen: function (evt, fn) {
		document.addEventListener(evt, function (e) {
			fn.call(DragHandler, e);
		}, false);
	}
};

DragHandler.listen('mousedown', function (e) {
	if (e.target.hasClassName('drag-handle')) {
		e.preventDefault();
		this.start(e.target.closest('.drag-parent'));
	} else if (e.target.hasClassName('draggable')) {
		e.preventDefault();
		this.start(e.target);
	}
});
DragHandler.listen('mouseup', function (e) {
	//console.log(e);
	if (this.dragging) {
		this.stop();
	}
});
DragHandler.listen('mousemove', function (e) {
	//console.log(e);
	var scroll = {
		x: document.documentElement.scrollLeft || document.body.scrollLeft,
		y: document.documentElement.scrollTop  || document.body.scrollTop
	};
	this.goto(
		e.PageX ? e.PageX : e.clientX + scroll.x,
		e.PageY ? e.PageY : e.clientY + scroll.y
	);
	this.move(e);
});
