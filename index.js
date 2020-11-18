
let keywrods = "abstract,dynamic,implements,show,as,else,import,static,assert,enum,in,super,async,export,interface,switch,await,extends,is,sync,break,external,library,this,case,factory,mixin,throw,catch,false,new,true,class,final,null,try,const,finally,on,typedef,continue,for,operator,var,covariant,Function,part,void,default,get,rethrow,while,deferred,hide,return,with,do,if,set,yield,List";
let keywrodList = keywrods.split(",");

let onJsonChange = function() {
    let text = document.getElementById("json").value;
    if (text.length <= 0) return ;

    let obj = JSON.parse(text);
    
    if (typeof obj === 'object') {
        document.getElementById("json").value = JSON.stringify(obj, null, 2);
    }
}

// 生成属性名
let generatePropertyName = function(name) {
    let nameParts = name.split("_");

    let output = nameParts[0];
    for (let index = 1; index < nameParts.length; index++) {
        output += nameParts[index].substring(0, 1).toUpperCase() + nameParts[index].substring(1)
    }

    if (keywrodList.indexOf(output) != -1) {
        output = "m" + output.toUpperCase();
    }
    return output;
}

// 生成类名
let generateClassName = function(name) {
    let nameParts = name.split("_");
    let output = "";
    for (let index = 0; index < nameParts.length; index++) {
        output += nameParts[index].substring(0, 1).toUpperCase() + nameParts[index].substring(1)
    }

    return output;
}

let convertObjectToClass = function(className, obj) {

    let propers = [];
    let subClass = [];
    for (let key in obj) {

        let propertyType = "";
        let isArray = false;
        let isSubclass = false;

        switch (typeof obj[key]) {
            case "number":
                propertyType = "double";
                break;
            case "string":
                propertyType = "String";
                break;
            case "boolean":
                propertyType = "bool";
                break;
            case "object":
                if (Array.isArray(obj[key])) {
                    isArray = true;
                    if (obj[key].length > 0) {
                        let subObj = obj[key][0];
                        switch(typeof subObj) {
                            case "number":
                                propertyType = "double";
                            break;
                        case "string":
                            propertyType = "String";
                            break;
                        case "boolean":
                            propertyType = "bool";
                            break;
                        case "object":
                            if (Array.isArray(subObj)) {
                                propertyType = "dynamic";
                            } else {
                                isSubclass = true;
                                propertyType = className + generateClassName(key);;
                                subClass.push(convertObjectToClass(propertyType, subObj));
                            }
                            break;
                        }

                    } else {
                        propertyType = "dynamic";
                    }
                } else {
                    isSubclass = true;
                    propertyType = className + generateClassName(key);;
                    subClass.push(convertObjectToClass(propertyType, obj[key]));
                }
                break;
            default:
                break;
        }

        if (propertyType !== "")  {
            propers.push({
                "key": key,
                "propertyName": generatePropertyName(key),
                "propertyType": propertyType,
                "isSubclass": isSubclass,
                "isArray": isArray,
            });
        }
        
    }



    let output = `class ${className} {\n\n`;
    
    // -- 生成属性
    for (let idx in propers) {
        let prop = propers[idx];
        if (prop.isArray) {
            output += `  List<${prop.propertyType}> ${prop.propertyName};\n\n`;
        } else {
            output += `  ${prop.propertyType} ${prop.propertyName};\n\n`;
        }
    }

    // -- 生成FromJson方法
    output += `  ${className}.fromJson(Map<String, dynamic> json) {\n\n`;
    for (let idx in propers) {
        let prop = propers[idx];
        output += `    if (json["${prop.key}"] != null) {\n`

        if (prop.isArray) {
            if (prop.isSubclass) {
                output += `        final objs = List<${prop.propertyType}>();\n`;
                output += `        for (var item in json["${prop.key}"]) {\n`;
                output += `          objs.add(${prop.propertyType}.fromJson(item));\n`;
                output += `        }\n`;
                output += `        this.${prop.propertyName} = objs;\n`
            } else {
                output += `        final objs = List<${prop.propertyType}>();\n`;
                output += `        for (var item in json["${prop.key}"]) {\n`;
                output += `          objs.add(item);\n`;
                output += `        }\n`;
                output += `        this.${prop.propertyName} = objs;\n`
            }
        } else if (prop.isSubclass) {
            output += `        this.${prop.propertyName} = ${prop.propertyType}.fromJson(json["${prop.key}"]);\n`;
        } else if (prop.propertyType == "double") {
            output += `        this.${prop.propertyName} = json["${prop.key}"].toDouble();\n`
        } else {
            output += `        this.${prop.propertyName} = json["${prop.key}"];\n`
        }
        output += `    }\n`
    }
    output += `  }\n\n`

    // -- 生成ToJson方法
    output += `  Map<String, dynamic> toJson() {\n`;
    output += `    final map = Map<String, dynamic>();\n`
    for (let idx in propers) {
        let prop = propers[idx];
        output += `    if (this.${prop.propertyName} != null) {\n`

        if (prop.isArray && prop.isSubclass) {
            output += `        map["${prop.key}"] = this.${prop.propertyName}.map((e) => e.toJson()).toList();\n`; 
        } else if (prop.isSubclass) {
            output += `        map["${prop.key}"] = this.${prop.propertyName}.toJson();\n`
        } else {
            output += `        map["${prop.key}"] = this.${prop.propertyName};\n`
        }

        output += `    }\n`
    }
    output += `    return map;\n`
    output += "  }\n\n";

    output += "}\n\n"

    for(let idx in subClass) {
        output += subClass[idx];
    }

    return output;
}


let convertBtnClick = function() {
    let text = document.getElementById("json").value;
    if (text.length <= 0) return ;
    let obj = JSON.parse(text);
    let name = document.getElementById("class-name").value;
    name = name.length <= 0 ? "AutoGenerate" : name;

    if (typeof obj === 'object') {
        document.getElementById("dart").value = convertObjectToClass(name, obj);
    } else {
        alert("不是合法的json");
    }
}