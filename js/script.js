/**
 * Created by lazarohcm on 27/03/17.
 */

var element = 'point', mousePos = {x:0, y:0}, color = {r: 0, g: 0, b: 0, a:0}, clicks = 0;
var points = [], lines = [], polygons = [];
var new_line = false, mouseDown = false, pause = false;
var line = new Line();
var lastClick = {x: 0, y: 0}
var canvas = document.getElementById('customizer');
var CTX = canvas.getContext('2d');

function reDraw(){
    CTX.clearRect(0,0,canvas.width, canvas.height);
    for(var line in lines){
        CTX.setLineDash([0, 0]);
        lines[line].draw();
        //lines[line].tick();
    }

    for(var point in points){
        points[point].draw();
        points[point].tick();
    }

    if(mouseDown && new_line && element == 'line') {
        CTX.setLineDash([2, 2]);
        CTX.beginPath();
        CTX.moveTo(lastClick.x, lastClick.y);
        var point = new Point(mousePos.x, mousePos.y);
        CTX.lineTo(point.x, point.y);
        CTX.stroke();
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
            handleClick();
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
    mousePos = getMousePos(canvas, evt);
    switch(element){
        case 'line':
            if(mouseDown && clicks > 0){
                CTX.globalCompositeOperation = 'xor';
                line.two = new Point(mousePos.x, mousePos.y);
                line.draw();
                CTX.globalCompositeOperation = 'source-over';
            }
            break;
    }
}

function handleClick(){
    var point = new Point(mousePos.x, mousePos.y);

    switch (element){
        case 'point':
            points.push(point);
            point.draw();
            break;
        case 'line':
            CTX.fillStyle = 'rgba(0, 200, 0, 1)';
            line = new Line();
            if(clicks == 0){
                new_line = true;
                lastClick.x = point.x; lastClick.y = point.y;
                line.one = point;
            }
            clicks ++;
            break;
        case 'polygon':
            break;
        case 'select':
            pause = true;
        default:
            break;
    }
}

function handleUp(){
    mouseDown = false;
    clicks = 0;
    if(new_line && (typeof line.two.x != 'undefined' && typeof line.two.y != 'undefined')){
        lines.push(line);
        new_line = false;
        clicks = 0;
        lastClick.x = null; lastClick.y = null;
    }

    var point = new Point(0, 0);
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

    //It actually draws a circle with a static radius of 3
    this.draw = function() {
        CTX.beginPath();
        CTX.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
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
}

function randX(){
    return Math.random() < 0.5 ? -1 : 1;
}

function Line(one, two) {
    this.one = new Point(one);
    this.two = new Point(two);
    this.size = 2;
    this.draw = function (){
        CTX.closePath();
        CTX.beginPath();
        CTX.lineWidth = this.size;
        CTX.moveTo(this.one.x, this.one.y);
        CTX.lineTo(this.two.x, this.two.y);
        CTX.stroke();
    }

    this.tick = function(){

    }
}

function Rectangle(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}


//Helpers
function getMousePos(canvas, evt){
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

$(document).ready(function(){
    $('.menu button').on('click', function(e){
        $('.menu button').removeClass('active');
        $(this).toggleClass('active');
        if($(this).hasClass('point')){
            element = 'point';
            pause = false;
        }
        if($(this).hasClass('line')){
            element = 'line';
            pause = false;
        }
        if($(this).hasClass('polygon')){
            element = 'polygon';
            pause = false;
        }

        if($(this).hasClass('select')){
            element = 'select';
            pause = true;
        }
    })
});