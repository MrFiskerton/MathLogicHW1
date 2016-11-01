/**
 * Created by Fiskov Roman on 10.10.16.
 */

//"use strict";

function Node(operation, left, right) {
    this.left = left;
    this.right = right;
    this.operation = operation;
}

Node.prototype.equals = function (other) {
    return typeof(this) === typeof(other) && this.operation === other.operation && this.left.equals(other.left) && this.right.equals(other.right);
};

Node.prototype.toString = function () {
    if (this.operation === "!") {
        if (typeof(this.left) === "string" || this.left.operation === "!") {
            return "!" + this.left.toString();
        }
        return "!(" + this.left.toString() + ")";
    }
    return "(" + this.left.toString() + this.operation + this.right.toString() + ")";
};

function Parser() {
    this.filesystem = require('fs');
    this.resultStr = "";
    this.axiomSchemas = ["a->b->a", "(a->b)->(a->b->c)->(a->c)", "a->b->a&b", "a&b->a", "a&b->b", "a->a|b", "b->a|b",
        "(a->c)->(b->c)->(a|b->x)", "(a->b)->(a->!b)->!a", "!!a->a"].map(function (x) {
        Parser.prototype.parseExpressionLine(x)
    });//TODO:Проверить аксиомы
    this.rootsOfExpression = [];
    this.hypothesis = {};
    this.rightP = {};
    this.fullP = {};
}

Parser.prototype.parseExpressionLine = function (line) {
    console.log("Input: " + line);
    var tokens = [];
    var operationPriority = {"!": 3, "&": 2, "|": 1, "->": 0};
    var isTypingVar = false;
    var i = 0;
    for (i = 0; i < line.length; i++) {
        //console.log("==========" + line[i] + " ]" + (line[i] in operationPriority));
        if (line[i] in operationPriority || line[i] === "(" || line[i] === ")") {
            tokens.push(line[i]);
            isTypingVar = false;
        } else if (line[i] === "-") {
            tokens.push("->");
            i++;
            isTypingVar = false;
        } else if (/*!(line[i] === " " || line[i] === "\n") && */ /^[а-яА-ЯёЁa-zA-Z0-9]+$/.test(line[i])) {
            if (isTypingVar) {
                tokens[tokens.length - 1].concat(line[i]);
            } else {
                tokens.push(line[i]);
                isTypingVar = true;
            }
        }
    }
    //console.info("Tokens: "  + tokens/* + "ZZZ"*/);
for(var v = 0; v < tokens.length; v++){console.log("{"+tokens[v] + "}");}
    var n = tokens.length;
    i = 0;
    function rec() {
        var stackVar = [];
        var stackOper = [];
        while (i < n) {
            var c = tokens[i];
            if (c === "!") {
                var j = 0;
                while (tokens[i] === "!") {
                    j++;
                    i++;
                }
                var p = tokens[i];
                if (p === "(") {
                    i++;
                    p = rec();
                }
                for (var k = 0; k < j; k++) {
                    p =  new Node("!", p);
                }
                stackVar.push(p);
            } else if (c === ")") {
                break;
            } else if (c === "(") {
                i++;
                stackVar.push(rec());
            } else if (c in operationPriority) {
                var last = stackVar.pop();
                while (stackOper.length != 0 && operationPriority[stackOper[stackOper.length - 1]] >= operationPriority[c]) {
                    last = new Node(stackOper.pop(), stackVar.pop(), last);
                }
                stackVar.push(last);
                stackOper.push(c);
            } else {
                stackVar.push(c);
            }
            i++;
        }
        var root = stackVar.pop();
        while (stackOper.length != 0) {
            root = new Node(stackOper.pop(), stackVar.pop(), root);
        }
        console.log(stackVar.length, stackOper.length);
        return root;
    }
    return rec();
};

//Parser.axiomSchemas = ["a->b->a", "(a->b)->(a->b->c)->(a->c)", "a->b->a&b", "a&b->a", "a&b->b", "a->a|b", "b->a|b",
//    "(a->c)->(b->c)->(a|b->x)", "(a->b)->(a->!b)->!a", "!!a->a"].map(function (x) {
//    Parser.prototype.parseExpressionLine(x)
//});

Parser.prototype.isAxiom = function (s) {
    console.error("LOL2");
    var d = {};
    console.log(s.toString());
    console.log("LOL1");
    function axiomChecker(expression, schema) {
        console.error("LOL2");
        if (typeof(expression) === "string" || schema.operation != expression.operation) {
            return false;
        }
        //Left
        console.error("LOL2");
        console.log((typeof(expression) === "string" || schema.operation != expression.operation));
        if (typeof(schema.left) == "string") {
            if (!(schema.left in d)) {
                d[schema.left] = expression.left;// TODO: Сделать нормальную адресацию. И можно ли так ?!
            } else if (!d[schema.left].equals(expression.left)) {
                return false;
            }
        } else if (!(axiomChecker(expression.left, schema.left))) {
            return false;
        }
        //Right
        if (schema.operation != "!") {
            if (typeof(schema.right) === "string") {
                if (!(schema.right in d)) {
                    s[schema.right] = expression.right;
                } else {
                    return (d[schema.right].equals(expression.right));
                }
            } else {
                return axiomChecker(expression.right, schema.right);
            }
        }
        return true;
    }

    for (var number = 0; number < this.axiomSchemas; number++) {
        d = {};
        console.error("LOL3");
        if (axiomChecker(s, this.axiomSchemas[number])) {
            return (number + 1);
        }
    }
    return 0;
};

Parser.prototype.parseInputFile = function (inputFileName) {
    var text = this.filesystem.readFileSync(inputFileName, 'utf8');
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
        //console.log("Recovery: [", (this.parseExpressionLine(lines[i])).toString(), "]");
        //console.log((this.parseExpressionLine(lines[i])).toString());
        this.rootsOfExpression.push(this.parseExpressionLine(lines[i]));
    }
    return this.rootsOfExpression;
};

Parser.prototype.printResult = function (outputFileName) {
    this.filesystem.writeFileSync(outputFileName, this.resultStr);
};

var main = function () {
    var parser = new Parser();
    parser.parseInputFile("input.txt");
    //console.log(Parser.axiomSchemas[0].toString());
    var j = -1;
    for (var w = 0; w < parser.rootsOfExpression.length; w++) {
        var deduct = parser.rootsOfExpression[w];
        j++;
        parser.resultStr += (j + 1);
        parser.resultStr += " " + deduct.toString();

        console.log("=======f=======");
        var f = parser.isAxiom(deduct);
        console.log(f);
        if (f != 0) {
            parser.resultStr += " (Сх.Аксиом " + f + " )\n";
        } else {
            if (deduct in parser.hypothesis) {
                f = (1 + parser.hypothesis);
            }
            if (f != 0) {
                parser.resultStr += "(Гипотеза " + f + " )\n";
            } else if (deduct in parser.rightP) {
                for (var h in parser.rightP) {
                    if (parser.rootsOfExpression[h].left in parser.fullP && h < j) {
                        parser.resultStr += " (M.P " + (parser.fullP[parser.rootsOfExpression[h].left] + 1) + " " + (h + 1) + " )\n";
                        f = true;//TODO: WTF!!!
                        break;
                    }
                }
            }
        }
        if (f != 0) {
            parser.fullP[deduct] = j;
            if (typeof(deduct) == "Object" && deduct.operation != "!") {//TODO:WTF!!! Исправить проверку на тип
                if (!(deduct.right in parser.rightp)) {
                    parser.rightp[deduct.right] = [];
                }
                parser.rightp[deduct.right].push(j);
            }
        } else {
            parser.resultStr += " Не доказано\n";
        }
    }
    parser.printResult("output.txt");
    console.log("=================================");
    //console.log(parser.axiomSchemas[0].toString());
    //console.log("TEST: " + (parser.parseExpressionLine("(A->B)->(A->B->C)->(A->C)")).toString());
};
main();