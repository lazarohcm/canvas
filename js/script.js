/**
 * Created by lazarohcm on 27/03/17.
 */

var element = 'point', mousePos = {x:0, y:0}, color = {r: 0, g: 0, b: 0, a:0}, clicks = 0;
var points = [], lines = [], polygons = [];
var new_line = false, mouseDown = false, pause = false;
var line = new Line();
var lastClick = {x: null, y: null}
var canvas = document.getElementById('customizer');
var CTX = canvas.getContext('2d');
var TOL = 5;

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
            if(clicks == 1){
                CTX.globalCompositeOperation = 'xor';
                CTX.setLineDash([2, 2]);
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
                lines.push(line);
            }
            break;
        case 'polygon':

            break;
        case 'select':
            pause = true;
            for(var point in points){
                if(points[point].pick()){
                    console.log(points[point]);
                }
                points[point].draw();
                points[point].tick();
            }

            var min = new Point(mousePos.x - TOL, mousePos.y - TOL);
            var max = new Point(mousePos.x + TOL, mousePos.y + TOL);
            for(var id in lines){
                // console.log(lines[id].pick(min, max));
                if(lines[id].pick(min,max)) console.log(id);
            }
            break;
        default:
            break;
    }
}
const INSIDE = 0, LEFT = 1, RIGHT = 2, TOP = 3, BOTTOM = 4;
function pickCode(vertex, min_point, max_point){
    // var code = INSIDE;
    //
    // //true means that the line is on that direction
    // if(vertex.x < min_point.x){
    //     code = LEFT;
    // }else if(vertex.x > max_point.x){
    //     code = RIGHT;
    // }
    // if(vertex.y < min_point.y){
    //     code = BOTTOM;
    // }else if(vertex.y > max_point.y){
    //     code = TOP;
    // }

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
}

function randX(){
    return Math.random() < 0.5 ? -1 : 1;
}

function Line(one, two) {
    this.one = new Point(one);
    this.two = new Point(two);
    this.size = 2;
    this.color = randRGBA();
    this.draw = function (){
        CTX.strokeStyle = 'rgba(0, 0, 0, 1)';
        CTX.strokeStyle = this.color;
        CTX.beginPath();
        CTX.lineWidth = this.size;
        CTX.moveTo(this.one.x, this.one.y);
        CTX.lineTo(this.two.x, this.two.y);
        CTX.stroke();
    }

    this.tick = function(){

    }

    this.pick = function(min, max){
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

function randRGBA(){
    var red, green, blue;
    red = Math.floor((Math.random() * 255) + 1);
    green = Math.floor((Math.random() * 255) + 1);
    blue = Math.floor((Math.random() * 255) + 1);
    return 'rgba(' +red+ ', ' +green+ ', ' +blue+ ', 0.7)';
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