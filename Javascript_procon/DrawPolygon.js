
var WIDTH = 100;
var HEIGHT = 64;
var SCALE = 10;
var data_file = "input.txt";
var goiy_level1 = "goiy_level1.txt";
var goiy_level2 = "goiy_level2.txt";
var goiy_level3 = "goiy_level3.txt";
var goiy_level4 = "goiy_level4.txt";

var game = new Phaser.Game(WIDTH*SCALE, HEIGHT*SCALE, Phaser.CANVAS, 'phaser-example', {preload: preload, create: create, update: update });

var polygons = [];
var polygonsTruth = []; // nhung hinh nao dung vi tri se co gia tri la -1
var frame;
var graphics;
var texts = [];
var rotatePoly; // D
var selectPoly; // C
var flipPoly; // S
var angle = [] // chua 3 diem de dinh nghia 1 goc

function preload(){
	// var poly = new Phaser.Polygon([ new Phaser.Point(200, 100), new Phaser.Point(350, 100), new Phaser.Point(375, 200), new Phaser.Point(150, 200) ]);
	// var poly1 = new Phaser.Polygon([ new Phaser.Point(200, 500), new Phaser.Point(350, 500), new Phaser.Point(375, 600), new Phaser.Point(150, 600) ]);

	// polygons.push(poly);
	// polygons.push(poly1);

	game.load.text('polygonsData', data_file);
	game.load.text('goiy1', goiy_level1);
	game.load.text('goiy2', goiy_level2);
	game.load.text('goiy3', goiy_level3);
	game.load.text('goiy4', goiy_level4);
}

function create() {
	
    graphics = game.add.graphics(0, 0);
	drawGrid();
	// game.add.text(0, 0, 'Press one, two or three !', { font: "20px Arial", fill: "#00ff00", align: "center" } );
	rotatePoly = game.input.keyboard.addKey(Phaser.Keyboard.D);
	rotatePoly.onDown.add(rotatePolygon, this);

	selectPoly = game.input.keyboard.addKey(Phaser.Keyboard.C);
	selectPoly.onDown.add(selectPolygon, this);

	flipPoly = game.input.keyboard.addKey(Phaser.Keyboard.S);
	flipPoly.onDown.add(flipPolygon, this);

	game.input.onDown.add(getAngle, this);

	// doc toan bo hinh tu file du lieu tong
	var data = game.cache.getText('polygonsData').split(':');
	for(var i = 1; i <= parseInt(data[0]); i++){
		polygons.push(createPoly(data[i]));
		polygonsTruth.push(0);
	}
	
	frame = createPoly(data[data.length-1]);
	// polygonsTruth[4] = 1;
	// load cac file goi y
	var goi_y = [];

	for(var i = 1; i <= 4; i++){
		var goiy_data = game.cache.getText('goiy'+i).split(':');
		for(var j = 1; j <= parseInt(goiy_data[0]); j++){
			goi_y.push(createPoly(goiy_data[j]));
		}
	}
	checkTheTruthPolygons(goi_y);
}

// update mang polygonsTruth
function checkTheTruthPolygons(goi_y){
	for(var i = 0; i < goi_y.length; i++){
		for(var j = 0; j < polygons.length; j++){
			if(isPolygonsEqual(goi_y[i], polygons[j])){
				updateTruthPolygon(j, goi_y[i]);
			}
		}
	}
}

function isPolygonsEqual(poly1, poly2){
	if(poly1.points.length != poly2.points.length) return false;
	var distances_poly1 = [];
	var distances_poly2 = [];
	for(var i = 0; i < poly1.points.length; i++){
		if(i == poly1.points.length-1){
			distances_poly1.push(computeDistance(poly1.points[i], poly1.points[0]));
			distances_poly2.push(computeDistance(poly2.points[i], poly2.points[0]));
		} else {
			distances_poly1.push(computeDistance(poly1.points[i], poly1.points[i+1]));
			distances_poly2.push(computeDistance(poly2.points[i], poly2.points[i+1]));
		}
	}
	distances_poly1 = distances_poly1.sort();
	distances_poly2 = distances_poly2.sort();
	for(var i = 0; i < distances_poly1.length; i++){
		if(distances_poly1[i] != distances_poly2[i]) return false;
	}

	var angle_poly1 = [];
	var angle_poly2 = [];
	for(var i = 0; i < poly1.points.length; i++){
		if(i == poly1.points.length-1){
			angle_poly1.push(computeAngle(poly1.points[i-1], poly1.points[i], poly1.points[0]));
			angle_poly2.push(computeAngle(poly2.points[i-1], poly2.points[i], poly2.points[0]));
		} 
		else if(i == 0){
			angle_poly1.push(computeAngle(poly1.points[poly1.points.length-1], poly1.points[i], poly1.points[i+1]));
			angle_poly2.push(computeAngle(poly2.points[poly1.points.length-1], poly2.points[i], poly2.points[i+1]));
		}
		else {
			angle_poly1.push(computeAngle(poly1.points[i-1], poly1.points[i], poly1.points[i+1]));
			angle_poly2.push(computeAngle(poly2.points[i-1], poly2.points[i], poly2.points[i+1]));
		}
	}
	angle_poly1 = angle_poly1.sort();
	angle_poly2 = angle_poly2.sort();
	for(var i = 0; i < angle_poly1.length; i++){
		if(angle_poly1[i] != angle_poly2[i]) return false;
	}
	return true;

}

function updateTruthPolygon(polyFalsePostion, polyTruth){
	// polygons[polyFalsePostion] = polygonsTruth;
	for(var i = 0; i < polyTruth.points.length; i++){
		polygons[polyFalsePostion].points[i].x = polyTruth.points[i].x;
		polygons[polyFalsePostion].points[i].y = polyTruth.points[i].y;		
	}
	polygonsTruth[polyFalsePostion] = 1;
}

var selected = -1;
function update(){
	
 	if(selected != -1){
   		dragPolyByMouse(polygons[selected], game.input);
 	}
 	
	graphics.clear();
	drawGrid();
	drawPolygons();
	drawAngle();
}

function getAngle(){
	if(game.input.activePointer.leftButton.isDown){
		if(angle.length == 3){
			angle = [];
		} else {
			var point = new Phaser.Point(round(game.input.x), round(game.input.y));
			angle.push(point);
		}
		
	}
}

function drawAngle(){
	if(angle.length){
		drawPoint(angle[0].x, angle[0].y);
		graphics.lineStyle(2, 0x00cc00, 1);
		graphics.moveTo(angle[0].x, angle[0].y);
		for(var i = 1; i < angle.length; i++){
			graphics.lineTo(angle[i].x, angle[i].y);
		}
	}
}

function drawPolygons(){
	// draw frame
	graphics.lineStyle(1, 0xffd900, 1);
	graphics.drawPolygon(frame);

	for(var i = 0; i < polygons.length; i++){
		graphics.beginFill(0xff0000); // red
		if(i == selected){
			graphics.beginFill(0xff3399); // pink
			if(isOverlap()){
				graphics.beginFill(0x6600ff);
			}
		}
	    graphics.drawPolygon(polygons[i]);
	    if(texts[i]) texts[i].destroy();
	    texts[i] = game.add.text(centroidOfPolygon(polygons[i]).x, centroidOfPolygon(polygons[i]).y-20, i, { font: "20px Arial", fill: "#00ff00", align: "center" } );
	    graphics.endFill();
	}

}

function selectPolygon(){
	if(selected != -1) selected = -1;
	else{
		for(var i = 0; i < polygons.length; i++){
			if(polygonsTruth[i] == 0 && polygons[i].contains(game.input.x, game.input.y)){
				selected = i;
				break;
			} else selected = -1;
		}
	}
}

function drawPoint(x, y){
	graphics.beginFill(0x00cc00, 1);
	graphics.drawCircle(round(x), round(y), 1);
	// console.log(round(x), round(y));
}

function dragPolyByMouse(poly, mouse){
	translate(round(mouse.x), round(mouse.y), poly);
}

function drawGrid(){

	graphics.lineStyle(1, 0x0000FF, 1);
	// draw col
	for(var i = 0; i <= WIDTH; i++){
		graphics.moveTo(i*SCALE, 0);
		graphics.lineTo(i*SCALE, HEIGHT*SCALE);
	}
	// draw row
	for(var i = 0; i <= HEIGHT; i++){
		graphics.moveTo(0, i*SCALE);
		graphics.lineTo(WIDTH*SCALE, i*SCALE);
	}
}

function round(pos){
	pos = Math.round(pos);
	var mod = pos%10;
	if(mod < 5) pos = pos - mod;
	else pos = pos + (10 - mod);
	return pos;
}

function translate(desX, desY, poly){
	var points = poly.points;
	var offset = 0;
	var dx = centroidOfPolygon(poly).x - desX + offset;
	var dy = centroidOfPolygon(poly).y - desY + offset;
	
	for(var i = 0; i < points.length; i++){
		poly.points[i].x -= dx;
		poly.points[i].y -= dy;
	}

}

function rotatePolygon(){
	var i;
	for(i = 0; i < polygons.length; i++){
		if(polygonsTruth[i] == 0 && polygons[i].contains(game.input.x, game.input.y)){
			break;
		}
	}
	if(i < polygons.length){
		// console.log("rotate: ", i, Math.PI);
		var originPos = centroidOfPolygon(polygons[i]);
		var angle = Math.PI/2;
		translate(0, 0, polygons[i]);
		for(var j = 0; j < polygons[i].points.length; j++){
			var x = polygons[i].points[j].x;
	    	var y = polygons[i].points[j].y;
	    	polygons[i].points[j].x = x * Math.cos(angle) - y * Math.sin(angle);
	    	polygons[i].points[j].y = x * Math.sin(angle) + y * Math.cos(angle);
		}
		translate(originPos.x, originPos.y, polygons[i]);
	}
	
}

function flipPolygon(){
	var i;
	for(i = 0; i < polygons.length; i++){
		if(polygonsTruth[i] == 0 && polygons[i].contains(game.input.x, game.input.y)){
			break;
		}
	}
	if(i < polygons.length){
		// Lat theo Ox roi tinh tien ve originPoint
		var originPos = polygons[i].points[0];
		for(var j = 0; j < polygons[i].points.length; j++){
			polygons[i].points[j].y = -polygons[i].points[j].y;
		}
		translate(originPos.x, originPos.y, polygons[i]);
	}
}

function centroidOfPolygon(poly){
	var length = poly.points.length;
	var xG = 0, yG = 0;
	for(var i = 0; i < length; i++){
		xG += poly.points[i].x;
		yG += poly.points[i].y;
	}
	return new Phaser.Point(round(xG/length), round(yG/length));
}

function createPoly(textPoint){
	var arr = textPoint.split(" ");
	var points = [];
	var numPoint = parseInt(arr[0]);
	for(var i = 1; i < arr.length-1; i += 2){
		points.push(new Phaser.Point(arr[i]*SCALE, arr[i+1]*SCALE))
	}
	return new Phaser.Polygon(points);
}

function isOverlap(){
	if(selected != -1){
		for(var i = 0; i < polygons.length; i++){
			if( i!= selected && isPolysIntersect(polygons[selected], polygons[i])) return true;
		}
		return false;
	}
}

function isLinesIntersect(point1L1, point2L1, point1L2, point2L2){
	var f1 = (point1L1.y - point2L1.y)*(point1L2.x - point1L1.x) + (point2L1.x - point1L1.x )*(point1L2.y - point1L1.y);
	var f2 = (point1L1.y - point2L1.y)*(point2L2.x - point1L1.x) + (point2L1.x - point1L1.x )*(point2L2.y - point1L1.y);
	var t = f1*f2;
	f1 = (point1L2.y - point2L2.y)*(point1L1.x - point1L2.x) + (point2L2.x - point1L2.x )*(point1L1.y - point1L2.y);
	f2 = (point1L2.y - point2L2.y)*(point2L1.x - point1L2.x) + (point2L2.x - point1L2.x )*(point2L1.y - point1L2.y);
	if(t < 0 && f1*f2 < 0) return true;
	return false;

}
 
 function isPolysIntersect(poly1, poly2){
 	var l1 = poly1.points.length;
 	var l2 = poly2.points.length;
 	var iPoint1;
 	var iPoint2;
 	var jPoint1, jPoint2;
 	for(var i = 0; i < l1; i++){
 		iPoint1 = i;
 		iPoint2 = i + 1;
 		if(i == l1 - 1) iPoint2 = 0;
 		for(var j = 0; j < l2; j++){
 			jPoint1 = j;
 			jPoint2 = j + 1;
 			if(j == l2 - 1) jPoint2 = 0;
 			if(isLinesIntersect(poly1.points[iPoint1], poly1.points[iPoint2], poly2.points[jPoint1], poly2.points[jPoint2])){
 				return true;
 			}
 		}
 	}
 	return false;
 }

 function computeAngle(point1, point2, point3){
 	var x1 = point1.x - point2.x;
    var x2 = point3.x - point2.x;
    var y1 = point1.y - point2.y;
    var y2 = point3.y - point2.y;
   
    return Math.acos((x1*x2 + y1*y2)/(Math.sqrt(x1*x1+y1*y1)*Math.sqrt(x2*x2+y2*y2)));
 }

 function computeDistance(point1, point2){
 	return Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2);
 }