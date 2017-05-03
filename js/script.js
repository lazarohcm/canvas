/**
 * Created by lazarohcm on 27/03/17.
 */

//Global Variables
var
    element = 'point',
    mousePos = {x:0, y:0},
    mouseLastPos = {x: 0, y:0},
    color = {r: 0, g: 0, b: 0, a:0},
    clicks = 0,
    shapes = [],
    new_line = false,
    mouseDown = false,
    pause = false,
    hulling = false,
    line = new Line(),
    lastClick = {x: null, y: null},
    polygon_started = false,
    polygon = new Polygon(),
    canvas = document.getElementById('customizer'),
    selected_shape = null;


//CONSTANTS
var CTX = canvas.getContext('2d'),
    TOL = 5,
    //radius of click around the first point to close the draw
    END_CLICK_RADIUS = 15,
    //the max number of points of your polygon
    MAX_POINTS = 10;

CTX.save();


function reDraw(){
    CTX.clearRect(0,0,canvas.width, canvas.height);

    for(var element_id in shapes){
        CTX.setLineDash([0]);
        shapes[element_id].draw();
        shapes[element_id].tick();
    }

    if(polygon_started){
        polygon.draw();
        CTX.moveTo(polygon.points[polygon.points.length - 1].x, polygon.points[polygon.points.length - 1].y);
        CTX.lineTo(mousePos.x, mousePos.y);
        CTX.stroke();
        CTX.setLineDash([]);
    }

    if(mouseDown && element == 'line' || (clicks == 1 && element == 'line')) {

        if(lastClick.x != null && lastClick.y != null){
            CTX.setLineDash([2, 2]);
            CTX.beginPath();
            CTX.moveTo(lastClick.x, lastClick.y);
            var point = new Point(mousePos.x, mousePos.y);
            CTX.lineTo(point.x, point.y);
            CTX.stroke();
        }

    }

    if(hulling){
        convexHull();
    }
}

function init(){
    canvas.addEventListener("click", eventHandler, false);
    canvas.addEventListener("mousemove", eventHandler, false);
    canvas.addEventListener("mouseup", eventHandler, false);
    canvas.addEventListener("mousedown", eventHandler, false);

}

init();
setInterval(reDraw, 60);

function eventHandler(event){
    var current_event = event.type;
    switch (current_event){
        case 'click':
            handleClick(event);
            break;
        case 'mousemove':
            handleMove(event);
            break;
        case 'mouseup':
            handleUp();
            break;
        case 'mousedown':
            handleDown();
            break;
        default:
            break;
    }
};

//Events Handlers
function handleMove(evt){
    mouseLastPos = mousePos;
    mousePos = getMousePos(canvas, evt);
    switch(element){
        case 'line':
            if(clicks == 1){
                // CTX.globalCompositeOperation = 'xor';
                // CTX.setLineDash([2, 2]);
                // line.two = new Point(mousePos.x, mousePos.y);
                // line.draw();
                // CTX.globalCompositeOperation = 'source-over';
            }
            break;
        case 'polygon':
            break;
        case 'move':
            if(mouseDown){
                if(selected_shape != null) {
                    var x = 0;
                    var y = 0;

                    if(mousePos.x < mouseLastPos.x){
                        x = -2;
                    }else if(mousePos.x > mouseLastPos.x){
                        x = 2;

                    }

                    if(mousePos.y < mouseLastPos.y){
                        y = -2;
                    }else if(mousePos.y > mouseLastPos.y){
                        y = 2;
                    }
                    selected_shape.move(x, y);
                }
            }
            break;
        case 'scale':
            if(mouseDown){

            }
            break;
    }
}

//Right click function
canvas.oncontextmenu = function (e) {
    e.preventDefault();

    if(element == 'scale'){
        if(selected_shape != null) {
            //Scalling around the polygon "bounding box center"
            var scale_factor = 0.9;
            var center = {x: selected_shape.center().x, y:  selected_shape.center().y};
            selected_shape.move(-center.x, -center.y);
            selected_shape.scale(scale_factor);
            selected_shape.move(center.x, center.y);
        }
    }

    if(element == 'rotate'){
        if(selected_shape != null){
            var angle = -10 * (Math.PI/180);
            var center = {x: selected_shape.center().x, y:  selected_shape.center().y};
            selected_shape.move(-center.x, -center.y);
            selected_shape.rotate(angle, center.x, center.y);
            selected_shape.move(center.x, center.y);
        }
    }

    if(element == 'reflect'){
        if(selected_shape != null){
            var center = {x: selected_shape.center().x, y:  selected_shape.center().y};
            selected_shape.move(-center.x, -center.y);
            selected_shape.reflect('y');
            selected_shape.move(center.x, center.y);
        }
    }
};

function handleClick(event){
    var point = new Point(mousePos.x, mousePos.y);
    switch (element){
        case 'point':
            // points.push(point);
            shapes.push(point);
            // point.draw();
            break;
        case 'line':
            clicks ++;
            if(clicks == 1){
                line = new Line();
                new_line = true;
                lastClick.x = point.x; lastClick.y = point.y;
                line.one = new Point(mousePos.x, mousePos.y);
            }
            if(clicks == 2){
                clicks = 0;
                line.two = new Point(mousePos.x, mousePos.y);
                shapes.push(line);
            }
            break;
        case 'polygon':
            var x_click = mousePos.x;
            var y_click = mousePos.y;
            if(polygon_started){
                //drawing the next line and closing the polygon if needed
                if((Math.abs(x_click - polygon.points[0].x) < END_CLICK_RADIUS &&
                    Math.abs(y_click - polygon.points[0].y) < END_CLICK_RADIUS) && polygon.points.length && polygon.points.length > 2){
                    polygon_started = false;
                    polygon.saved = true;
                    shapes.push(polygon);
                    polygon = new Polygon();
                } else {
                    polygon.points.push(new Point(x_click, y_click));
                    //Locating the maximum and minimum x and y to have an easy central point
                    if(polygon.points.length >= MAX_POINTS){
                        polygon.saved = true;
                        shapes.push(polygon);
                        polygon = new Polygon();
                        polygon_started = false;
                    }
                }
            }else{
                //starting the polygon
                polygon.points.push(new Point(x_click, y_click));
                polygon.min = new Point(x_click, y_click);
                polygon.max = new Point(x_click, y_click);
                polygon_started = true;
            }

            break;
        case 'select':
            pause = true;
            for(var element_id in shapes){
                if(shapes[element_id].pick()) selected_shape = shapes[element_id];
            }
            break;
        case 'move':
            break;

        case 'scale':
            if(selected_shape != null) {
                //Scalling around the polygon "bounding box center"
                var scale_factor = 1.1;
                var center = {x: selected_shape.center().x, y:  selected_shape.center().y};
                selected_shape.move(-center.x, -center.y);
                selected_shape.scale(scale_factor);
                selected_shape.move(center.x, center.y);
            }
            break;
        case 'rotate':
            if(selected_shape != null){
                var angle = 10 * (Math.PI/180);
                var center = {x: selected_shape.center().x, y:  selected_shape.center().y};
                selected_shape.move(-center.x, -center.y);
                selected_shape.rotate(angle, center.x, center.y);
                selected_shape.move(center.x, center.y);
            }
            break;
        case 'reflect':
            if(selected_shape != null){
                console.log(selected_shape);
                var center = {x: selected_shape.center().x, y:  selected_shape.center().y};
                selected_shape.move(-center.x, -center.y);
                selected_shape.reflect('x');
                selected_shape.move(center.x, center.y);
            }
            break;
        case 'remove':
            if(selected_shape != null){
                var index = shapes.indexOf(selected_shape);
                shapes.splice(index, 1);
            }
            selected_shape = null;
            break;
        default:
            break;
    }
}
function pickCode(vertex, min_point, max_point){

    var code = [];
    //Left
    code[0] = vertex.x < min_point.x;
    //right
    code[1] = vertex.x > max_point.x;
    //bottom
    code[2] = vertex.y < min_point.y;
    //top
    code[3] = vertex.y > max_point.y;
    return code;
}

function handleUp(){
    mouseDown = false;
    lastClick.x = null; lastClick.y = null;
}

function handleDown(){
    mouseDown = true
}

//Classes
function Point(x, y){
    this.size = 3;
    this.x = x;
    this.y = y;
    this.x_speed = randX();
    this.y_speed = randX();
    this.color = randRGBA();
    this.type = 'point';

    this.matrix = identity_matrix();
    this.vector = [0,0,1];

    //It actually draws a circle with a static radius of 3
    this.draw = function() {
        CTX.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        CTX.fillStyle = this.color;
        CTX.beginPath();
        CTX.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
        CTX.stroke();
        CTX.fill();
    }

    this.tick = function(){
        if(!pause){
            this.x += this.x_speed;
            this.y += this.y_speed;
            if((this.x + this.size) >= canvas.width){
                this.x_speed = -(this.x_speed);
            }
            if((this.x - this.size) <= 0){
                this.x_speed = -(this.x_speed);
            }

            if((this.y + this.size) >= canvas.height){
                this.y_speed = -(this.y_speed);
            }
            if((this.y - this.size) <= 0){
                this.y_speed = -(this.y_speed);
            }
        }
    }

    this.pick = function(){
        if((mousePos.x >= (this.x - TOL)) && (mousePos.x <= (this.x + TOL))){
            if((mousePos.y >= (this.y - TOL)) && (mousePos.y <= (this.y + TOL))){
                return true;
            }
        }
        return false;
    }

    //Transformations
    this.move = function(x, y){
        this.matrix[0][0] = 1; this.matrix[1][1] = 1; this.matrix[2][2] = 1;
        this.matrix[0][2] = x; this.matrix[1][2] = y;
        this.vector[0] = this.x; this.vector[1] = this.y;
        var translation_vector = matrix_vector_multiply(this.matrix, this.vector);
        this.x = translation_vector[0];
        this.y = translation_vector[1];
        this.matrix = identity_matrix();
    }

    this.scale = function(scale_factor){

        this.matrix[0][0] = scale_factor; this.matrix[1][1] = scale_factor; this.matrix[2][2] = 1;
        this.vector[0] = this.x; this.vector[1] = this.y;
        var scale_vector = matrix_vector_multiply(this.matrix, this.vector);
        this.x = scale_vector[0];
        this.y = scale_vector[1];
        this.matrix = identity_matrix();
    }

    this.rotate = function(angle, center_x, center_y){
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        //Using directly the equation, instead of multiplying the matrix and the vector, didn't work
        this.matrix[0][0] = cos; this.matrix[0][1] = -1*sin; this.matrix[1][0] = sin; this.matrix[1][1] = cos;
        this.vector[0] = this.x; this.vector[1] = this.y;
        var rotate_vector = matrix_vector_multiply(this.matrix, this.vector);
        this.x = rotate_vector[0]; //center_x + (cos * (this.x - center_x)) + (-sin * (this.y - center_y));
        this.y = rotate_vector[1]; //center_y + (sin * (this.x - center_x)) + cos * (this.y - center_y);
        this.matrix = identity_matrix();
    }

    this.reflect = function(axis){
        if(axis == 'x'){
            this.matrix[1][1] = -1;
        }else{
            this.matrix[0][0] = -1;
        }
        this.vector[0] = this.x; this.vector[1] = this.y;
        var reflection_vector = matrix_vector_multiply(this.matrix, this.vector);
        this.x = reflection_vector[0];
        this.y = reflection_vector[1];
        this.matrix = identity_matrix();
    }
}

function randX(){
    return Math.random() < 0.5 ? -1 : 1;
}

function Line(one, two) {
    this.one = new Point(one);
    this.two = new Point(two);
    this.size = 2;
    this.color = randRGBA();
    this.type = 'line';
    this.draw = function (){
        CTX.strokeStyle = 'rgba(0, 0, 0, 1)';
        CTX.strokeStyle = this.color;
        CTX.lineWidth = this.size;
        CTX.beginPath();
        CTX.moveTo(this.one.x, this.one.y);
        CTX.lineTo(this.two.x, this.two.y);
        // CTX.lineTo(this.center().x, this.center().y);
        CTX.stroke();
    }

    this.center = function(){
        return new Point(
            (this.one.x + this.two.x)/2,
            (this.one.y + this.two.y)/2
        )
    }

    this.tick = function(){

    }

    this.move = function(x, y){
        this.one.move(x, y);
        this.two.move(x, y);
    }

    this.pick = function(){
        var min = new Point(mousePos.x - TOL, mousePos.y - TOL);
        var max = new Point(mousePos.x + TOL, mousePos.y + TOL);
        /**
         * Source: https://github.com/donkike/Computer-Graphics/blob/master/LineClipping/LineClippingPanel.java
         */
        var temp_one = new Point(this.one.x, this.one.y);
        var temp_two = new Point(this.two.x, this.two.y);
        var code_two = pickCode(this.two, min, max);

        do{
            var code_one = pickCode(temp_one, min, max);
            //Trivial
            var i;
            for(i = 0; i < 4; i++){
                if(code_one[i] && code_two[i]){
                    break;
                }
            }
            if(i != 4){
                break;
            }

            if(code_one[0]){
                temp_one.y += (min.x - temp_one.x) * (temp_two.y - temp_one.y) / (temp_two.x - temp_one.x);
                temp_one.x = min.x;
            } else if(code_one[1]){
                temp_one.y += (max.x - temp_one.x) * (temp_two.y - temp_one.y) / (temp_two.x - temp_one.x);
                temp_one.x = max.x;
            } else if(code_one[2]){
                temp_one.x += (min.y - temp_one.y) * (temp_two.x - temp_one.x) / (temp_two.y - temp_one.y);
                temp_one.y = min.y;
            }else if(code_one[3]){
                temp_one.x += (max.y - temp_one.y) * (temp_two.x - temp_one.x) / (temp_two.y - temp_one.y);
                temp_one.y = min.y;
            }else{
                return true;
            }
        }while(true);
        return false;
    }

    //Transformations
    this.scale = function(scale_factor){
        this.one.scale(scale_factor);
        this.two.scale(scale_factor);
    };

    this.rotate = function(angle, center_x, center_y){
        this.one.rotate(angle, center_x, center_y);
        this.two.rotate(angle, center_x, center_y);
    }

    this.reflect = function(axis){
        this.one.reflect(axis);
        this.two.reflect(axis);
    }
}

function Polygon(){
    this.points = [];
    this.color = randRGBA();
    this.saved = false;
    this.size = 2;
    this.max = new Point(0,0);
    this.min = new Point(0,0);
    this.type = 'polygon';
    this.center = function(){
        this.min.x = this.points[0].x; this.min.y = this.points[0].y;
        this.max.x = this.points[0].x; this.max.y = this.points[0].y;
        for(var point_id in this.points){
            if(this.min.x > this.points[point_id].x) this.min.x = this.points[point_id].x;
            if(this.min.y > this.points[point_id].y) this.min.y = this.points[point_id].y;
            if(this.max.y < this.points[point_id].y) this.max.y = this.points[point_id].y;
            if(this.max.x < this.points[point_id].x) this.max.x = this.points[point_id].x;
        }
        return new Point((this.min.x + this.max.x)/2, (this.min.y + this.max.y)/2);
    }
    this.draw = function(){
        CTX.restore();
        CTX.beginPath();
        CTX.strokeStyle = this.color;
        CTX.setLineDash([]);
        CTX.lineWidth = this.size;
        for (var p in this.points){
            if(p == 0){
                CTX.moveTo(this.points[p].x, this.points[p].y);
            }else{
                CTX.lineTo(this.points[p].x, this.points[p].y);
            }
        }
        CTX.stroke();
        if(polygon_started && !this.saved){
            CTX.setLineDash([2, 2]);
            CTX.lineTo(this.points[0].x, this.points[0].y);
            CTX.stroke();
        }else if(this.saved){
            CTX.fillStyle = this.color;
            CTX.setLineDash([]);
            CTX.lineTo(this.points[0].x, this.points[0].y);
            CTX.stroke();
            CTX.fill();
        }
    }

    this.pick = function(){
        if(this.points.length < 2){
            return false;
        }
        var newPoints = this.points.slice(0);
        newPoints.push(this.points[0]);
        var wn = 0;
        var pointToPick = new Point(mousePos.x, mousePos.y);
        for(var i = 0; i < this.points.length; i++){
            if(newPoints[i].y <= pointToPick.y){
                if(newPoints[i+1].y > pointToPick.y){
                    if(isLeft(newPoints[i], newPoints[i+1], pointToPick) > 0){
                        wn++;
                    }
                }
            }else{
                if(newPoints[i+1].y <= pointToPick.y){
                    if(isLeft(newPoints[i], newPoints[i+1], pointToPick) < 0){
                        wn --;
                    }
                }
            }
        }
        return wn !== 0;
    }

    this.tick = function(){

    }

    //Transformations
    this.move = function(x, y){
        for (var point_id in this.points){
            this.points[point_id].move(x, y);
        }
    }

    this.scale = function(scale_factor){
        for (var point_id in this.points){
            this.points[point_id].scale(scale_factor);
        }
    }

    this.rotate = function(angle, center_x, center_y){
        for (var point_id in this.points){
            this.points[point_id].rotate(angle, center_x, center_y);
        }
    }

    this.reflect = function(axis){
        for (var point_id in this.points){
            this.points[point_id].reflect(axis);
        }
    }
}


function convexHull(){
    var new_points = [];
    for(var i = 0; i < shapes.length; i++){
        if(shapes[i].type === 'point'){
            new_points.push(shapes[i]);
        }
    }
    if(new_points.length < 3){
        console.log('baaahhh');
        return;
    }

    var hull = new Array(new_points.length);
    hull.fill(-1);
    var display_hull = [];
    //finding the leftmost point
    var left_most = 0;
    for(var point_id in new_points){
        if(new_points[point_id].x < new_points[left_most].x) left_most = point_id;
    }

    var p = left_most, q;
    do{
        // Search for a point 'q' such that orientation(p, i, q) is
        // counterclockwise for all points 'i'
        q = (p+1) % new_points.length;
        for(var i in new_points){
            var turn = isRight(new_points[p], new_points[i], new_points[q]);
            if(turn < 0){
                q = i;
            }
        }

        hull[p] = q;
        display_hull.push(new_points[p]);
        p = q;
    }while(p != left_most)

    CTX.beginPath();
    CTX.moveTo(display_hull[0].x, display_hull[0].y);
    for(var i = 1; i <display_hull.length; i++){
        CTX.lineTo(display_hull[i].x, display_hull[i].y);
    }
    CTX.lineTo(display_hull[0].x, display_hull[0].y);

    CTX.stroke();
    pause = true;
}


//Helpers
function getMousePos(canvas, evt){
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

function randRGBA(){
    var red, green, blue;
    red = Math.floor((Math.random() * 255) + 1);
    green = Math.floor((Math.random() * 255) + 1);
    blue = Math.floor((Math.random() * 255) + 1);
    return 'rgba(' +red+ ', ' +green+ ', ' +blue+ ', 0.7)';
}


function matrix_vector_multiply(matrix, vector){
    var new_vector = [0,0,0];
    for (var line = 0; line < 3; line++){
        for (var column = 0; column < 3; column++){
            new_vector[line] += matrix[line][column] * vector[column];
        }
    }
    return new_vector;
}

function identity_matrix(){
    var matrix = [
        [1,0,0],
        [0,1,0],
        [0,0,1]
    ];
    return matrix;
}

function isLeft(p0, p1, p2) {
    return ( (p1.x - p0.x) * (p2.y - p0.y) ) -
        ((p2.x - p0.x) * (p1.y - p0.y) );
}

function isRight(p0,p1,p2){
    return ((p1.y-p0.y)*(p2.x-p1.x)) - ((p1.x-p0.x)*(p2.y-p1.y));
}

$(document).ready(function(){
    $('.menu button').on('click', function(e){
        $('.menu button').removeClass('active');
        $(this).toggleClass('active');
        if($(this).hasClass('point')){
            element = 'point';
            pause = false;
            selected_shape = null;
            hulling = false;
        }
        if($(this).hasClass('line')){
            element = 'line';
            pause = false;
            selected_shape = null;
            hulling = false;
        }
        if($(this).hasClass('polygon')){
            element = 'polygon';
            pause = false;
            selected_shape = null;
            hulling = false;
        }

        if($(this).hasClass('select')){
            element = 'select';
            pause = true;
            hulling = false;
        }

        if($(this).hasClass('move')){
            element = 'move';
            pause = true;
            hulling = false;
        }

        if($(this).hasClass('scale')){
            element = 'scale';
            pause = true;
            hulling = false;
        }

        if($(this).hasClass('rotate')){
            element = 'rotate';
            pause = true;
            hulling = false;
        }

        if($(this).hasClass('reflect')){
            element = 'reflect';
            pause = true;
            hulling = false;
        }

        if($(this).hasClass('remove')){
            element = 'remove';
            pause = true;
            hulling = false;
        }

        if($(this).hasClass('hull')){
            convexHull();
            hulling = true;
            // element = 'remove';
            // pause = true;
        }



    })

    $(document).mouseup(function(){
        mouseDown = false;
    })
});