'use strict';

const version="1.1.8";

moment.locale('sv');
let safe = DOMPurify.sanitize

// Here is all data
let appdata = {
    persons: [/*
        {'name': 'Leif Orienterare', 'class': 'Svart Kort', 'age':25, 'status': ..., 'run': ...},
        ...
    */]
}

// Eventor selector
// document.querySelectorAll("#main h3 ~ table tbody tr:nth-child(1n+1) td:nth-child(-n+2)")

let eventorPersons = () => {
    let result = "";
    let list = document.querySelectorAll("#main h3 ~ table tbody tr:nth-child(1n+1) td:nth-child(-n+2)")
    for (let i = 0; i < list.length; i+=2) {
        result += list[i] + ";" + list[i+1] + "\n";
    }
}

let parseLine = (line) => {
    if(line != "") {
        line = line.trim()
        if (line.includes(";")) {
            return line.split(';')
        } else {
            return [line, ""]
        }
    }
}

let getPersonStatusIcon = (status) => {
    if(status == "here") {
        return personHereIcon;
    } else if(status == "nothere") {
        return personNotHereIcon;
    } else {
        return personUnknownIcon;
    }
}
let getRunStatusIcon = (status) => {
    if(status == "out") {
        return personRunningIcon;
    } else if(status == "home") {
        return returnIcon;
    } else {
        return personUnknownIcon;
    }
}

// Triggered from person clicked
let changePersonStatus = (els) => {
    var el = els[0];
    let status = el.getAttribute("data-here-status");
    if(status == "unknown") {
        el.setAttribute("data-here-status", "here");
        $(el).children("td.status")[0].innerHTML = getPersonStatusIcon("here");
        $(el).children("td.run").toggleClass("disabled", false);
    } else if(status == "here") {
        el.setAttribute("data-here-status", "nothere");
        $(el).children("td.status")[0].innerHTML = getPersonStatusIcon("nothere");
        el.setAttribute("data-run-status", "unknown");
        $(el).children("td.run")[0].innerHTML = getRunStatusIcon("unknown");
        $(el).children("td.run").toggleClass("disabled", true);
    } else {
        el.setAttribute("data-here-status", "unknown");
        $(el).children("td.status")[0].innerHTML = getPersonStatusIcon("unknown");
        el.setAttribute("data-run-status", "unknown");
        $(el).children("td.run").toggleClass("disabled", false);
        $(el).children("td.run")[0].innerHTML = getRunStatusIcon("unknown");
    }
    saveCheckData();
    updatePersonStats();
}

// Triggered from person clicked
let changeRunStatus = (els) => {
    var el = els[0];
    let status = el.getAttribute("data-run-status");
    let runEl = $(el).children("td.run")[0];
    // Only update if not disabled
    if(!$(runEl).hasClass("disabled")) {
        if(status == "unknown") {
            el.setAttribute("data-run-status", "out");
            runEl.innerHTML = getRunStatusIcon("out");
            el.setAttribute("data-here-status", "here");
            $(el).children("td.status")[0].innerHTML = getPersonStatusIcon("here");
        } else if(status == "out") {
            el.setAttribute("data-run-status", "home");
            runEl.innerHTML = getRunStatusIcon("home");
            // TODO: Add start time as nice feature
            // el.setAttribute("data-run-time", 1233);
            el.setAttribute("data-here-status", "here");
            $(el).children("td.status")[0].innerHTML = getPersonStatusIcon("here");
        } else {
            el.setAttribute("data-run-status", "unknown");
            runEl.innerHTML = getRunStatusIcon("unknown");
        }
        saveCheckData();
        updatePersonStats();
    }
}

let hideCompleted = () => {
    // Disabled for now
    /*console.log("hideCompleted", document.getElementById("hideCompleted").checked);
    localStorage.setItem("ol-hide", document.getElementById("hideCompleted").checked);
    showOverview();*/
}

// Save current checklist status (overwrite previous data)
let saveCheckData = () => {
    var els = document.querySelectorAll("#personsChecklist tr");
    var persons = [];
    els.forEach(el => {
        var name = el.querySelector("td.name span").innerHTML;
        var age = 1;  // TODO
        //var klass = "";
        //if (document.getElementById("settingsDetails").checked) {
           var klass = el.querySelector("td.name small").innerHTML;
        //}
        var status = $(el).attr("data-here-status");
        var run = $(el).attr("data-run-status");
        var hidden = $(el).attr("data-hidden"); // If hidden by user or not
        persons.push({'name':name,'class':klass,'age':age,'status':status,'run':run});
    });
    appdata.persons = persons;
    let encoded = getCurrentDataForStorage();
    localStorage.setItem("ol-stateData", encoded);
}

let getClassByIndex = (idx, classes) => {
    return classes[idx];
}
let getClassIndexByClass = (klass, classes) => {
    return _.indexOf(classes, klass);
}
let getStatusByIndex = (idx) => {
    return ['unknown','here','nothere'][idx];
}
let getStatusIndexByClass = (status) => {
    return _.indexOf(['unknown','here','nothere'], status);
}
let getRunByIndex = (idx) => {
    return ['unknown','out','home'][idx];
}
let getRunIndexByClass = (status) => {
    return _.indexOf(['unknown','out','home'], status);
}

let shareData = () => {

    var data = appdata.persons;
    var result = [];

    // Add config object to save data needed
    // ['Svart','Gul','']
    var classList = _.uniqBy(data, function (o) {return o.class;});
    classList = _.map(classList, _.property('class')); // Now, only classes

    data.forEach(p => {
        // Create small "objects"
        // Format: '<person>|<class>|<here or not>|<out running or not>'
        let pdata = "";
        pdata += p.name + ";";
        pdata += getClassIndexByClass(p.class, classList) + ";";
        pdata += getStatusIndexByClass(p.status) + ";";
        pdata += getRunIndexByClass(p.run) + ";";
        result.push(pdata);
    })

    var url = new URL(document.location);
    let shareLink = url.protocol + "//" + url.host + url.pathname + "?v="+ version+"&classes=" + safeEncode(_.toString(classList)) 
        + "&data=" + safeEncode(_.toString(result));

    shareModal.show();
    copyToClipboard(shareLink);

    /*let a = document.createElement('a');
    a.setAttribute('href', shareLink);
    a.innerHTML = "Länk att dela (kopiera mig)";
    document.getElementById("shareLink").innerHTML = "";
    document.getElementById("shareLink").appendChild(a);*/
}

let copyToClipboard = (text) => {
    /* Get the text field */
    var copyText = document.getElementById("shareDataHolder");
    copyText.value = text;
  
    /* Select the text field */
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
  
    /* Copy the text inside the text field */
    document.execCommand("copy");
  
    /* Alert the copied text */
    console.log("Copied the text: " + copyText.value);
  } 


// Import data from external part via URL
let importData = () => {
    let url = new URL(document.location);
    let params = new URLSearchParams(url.search);

    if (params.has("data") && params.has("classes")) {

        let classes = safeDecode(params.get("classes")).split(",");
        //console.log(classes);
        //console.log(safeDecode(classes));

        // Why \" for first and last?
        //console.log("classes - before", classes);
        //classes.forEach((bug,idx) => {
            //console.log(bug, typeof(bug));
          //  classes[idx] = bug.replaceAll("\"","");
        //})
        //console.log("classes - after", classes);
        //console.log("Imported classes - safe: ", safeDecode(params.get("classes").replaceAll("''","")));
        //console.log("Imported classes: ", classes);
    
        //let dataStr = safeDecode(params.get("data")).split(",");
        let data = safeDecode(params.get("data")).split(",");
        //console.log(dataStr);
        //let data = JSON.parse(dataStr);
        //console.log("Imported data: ", data);

        // Convert to workable object
        let currentPersons = [];
        data.forEach((str) => {
            // Expected format: '<person>;<class-idx>;<status-idx>;<run-idx>'
            let p = str.split(";");
            let person = {}
            person.name = p[0];
            person.class = getClassByIndex(p[1], classes);
            person.status = getStatusByIndex(p[2]);
            person.run = getRunByIndex(p[3]);
            currentPersons.push(person);
        }); 
        appdata.persons = currentPersons;

        //$("#overviewTable").toggleClass("table-sm", document.getElementById("settingsLargeTable").checked)
        //_renderPersons(currentPersons, data.persons);

        // Mark import done
        document.location.hash="imported";
        console.log("Import completed!");
    } else {
        console.info("No data to import");
    }
}

let createReport = () => {

    let persons = appdata.persons;
    
    let here = _.filter(persons, function(o) { return o.status=="here"; }).length + " st personer var närvarande<br><br>"
    let idx = 1;
    persons.forEach(p => {
        if(p.status == "here") {
            if (p.class && p.class != "") {
                here += idx +": " +p.name + ", " + p.class + "<br>";
            } else {
                here += idx +": " +p.name + "<br>";
            }
            idx++;
        }
    });

    console.log($("#reportedHere"))
    $("#reportedHere")[0].innerHTML = here;
    reportModal.show();
}

/*let clearSelection = () => {
    if (document.selection) {
        document.selection.empty();
    }
    else if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
}*/

let updatePersonStats = () => {
    var persons = appdata.persons;

    // Template
    let personStats = _.template($('#personStatsTemplate').html());

    // Render list
    $('#personStats').html(personStats(
        {'out':_.filter(persons, function(o) { return o.run=="out"; }).length,
        'notstarted':_.filter(persons, function(o) { return o.status=="unknown" || o.status=="here" && o.run=="unknown"; }).length,
        'here':_.filter(persons, function(o) { return o.status=="here"; }).length,
        'unknown':_.filter(persons, function(o) { return o.status=="unknown"; }).length,
        'nothere':_.filter(persons, function(o) { return o.status=="nothere"; }).length}));
}

// Add list of persons
// Don't add persons with same name
let addList = () => {
    var listValue = document.getElementById("personData").value;
    if(listValue && listValue.length > 0) {
        let dataPersonLines = listValue.split("\n").sort();
        dataPersonLines.forEach((line, idx) => {
            let data = parseLine(line);
            //console.log(data); // -> Array [ "Sara Lydmark", "Orange" ]
            if(!_.isEmpty(data)) {
                let name = data[0].trim();
                let klass = data[1] ? data[1].replaceAll(',','.').trim():"";
                // Don't add duplicates
                if(!_.find(appdata.persons, ['name', name])) {
                    appdata.persons.push({'name':name,'class':klass,'age':0}); 
                }
            }
        });
    }
    // Sort here
    appdata.persons = _.sortBy(appdata.persons, [function(o) { return o.name; }]);
    document.getElementById("personData").value = "";
    saveData();
    renderPersonList();
    addListModal.hide();
}

// Render list of persons on settings view
let renderPersonList = () => {
    if(_.isEmpty(appdata.persons)) {
        $('#personsList').html('Inga personer inlagda');
    } else {
        // Template
        let personList = _.template($('#personListTemplate').html());

        // Render list
        $('#personsList').html(personList({'persons':appdata.persons}));
    }
}

// Render list of persons to check on overview
let renderPersonsChecklist = () => {
    if(_.isEmpty(appdata.persons)) {
        $('#personsChecklist').html('<tr><td colspan=3>&nbsp;Inga personer inlagda - se <a href="#" style="color:#99ccff;" onclick="showSettings();return false;">Inställningar &raquo;</a></td></tr>');
    } else {
        let showClasses = true; //document.getElementById("settingsDetails").checked;

        // Template
        let personChecklist = _.template($('#personsChecklistTemplate').html());

        // Render list
        var data = {}
        data.showClasses = showClasses;
        data.persons = appdata.persons;
        $('#personsChecklist').html(personChecklist({'data':data}));
    }
}

// Remove person from list (based on 'name')
let deletePerson = (name) => {
    appdata.persons = _.filter(appdata.persons, function(o) { return o.name != name; });
    saveData();
    renderPersonList();
}

let _renderPersons = (currentPersons, personLines) => {
    
    let html = ""
    let showClasses = document.getElementById("settingsDetails").checked;

    console.log("_renderPersons - _renderPersons: ", personLines);
    if(personLines != "") { // personLines.length > 0
        $("#startInfo").toggleClass("d-none", true)
        $("#personStats").toggleClass("d-none", false)
        personLines.forEach((line, idx) => {
            let data = parseLine(line)

            //console.log("_renderPersons - data: ", data);

            let name = data[0]
            let className = data[1] ? data[1] : "";
            let status = data[2] ? data[2] : "unknown";
            let run = data[3] ? data[3] : "unknown";

            const found = currentPersons.find(element => element.name == name);
            if(found) {
                status = found.status;
                run = found.run;
            }

            if(data) {
                html += '<tr class="runner">\
                    <td class="name"><span>' + name + '</span>' + (showClasses ? '<small class="text-muted d-block-lg ml-1">' + className +	'</small>': '') + '</td>\
                    <td class="status text-center" style="cursor: pointer;" data-here-status="' + status + '" onclick="changePersonStatus(this);">' + getPersonStatusIcon(status) + '</td>\
                    <td class="run text-center" style="cursor: pointer;" data-run-status="' + run + '" onclick="changeRunStatus(this);">' + getRunStatusIcon(run) + '</td>\
                </tr>'
            }
        })	
    } else {
        $("#startInfo").toggleClass("d-none", false)
        $("#personStats").toggleClass("d-none", true)
    }

    // Redraw
    document.getElementById("personList").innerHTML = html;
    console.log("Redraw", data);

    updatePersonStats();
}

let showOverview = () => {
    $('#overviewNav').toggleClass('active',true);
    $('#settingsNav').toggleClass('active',false);

    localStorage.setItem("ol-state", VIEWS.OVERVIEW);
    renderPersonsChecklist();

    $("#overviewContainer").show();
    $("#settingsContainer").hide();
}

let showSettings = () => {
    $('#overviewNav').toggleClass('active',false);
    $('#settingsNav').toggleClass('active',true);

    localStorage.setItem("ol-state", VIEWS.SETTINGS);
    renderPersonList();

    $("#settingsContainer").show();
    $("#overviewContainer").hide();
}

/*let toggleView = (view) => {
    state.toggleView(view)
}*/

let getTimeStamp = () => {
    var d = new Date()
    return d.getFullYear() + d.getMonth().toString().padStart("2", "0") + d.getDate().toString().padStart("2", "0") + "_" + d.getHours().toString().padStart("2", "0") + d.getMinutes().toString().padStart("2", "0")
}

//let safeEncode = (decoded) => {return window.btoa(safe(decoded))}
//let safeDecode = (encoded) => {return safe(window.atob(encoded))}

let safeEncode = (decoded) => {return LZString.compressToEncodedURIComponent(safe(decoded))}
let safeDecode = (encoded) => {return safe(LZString.decompressFromEncodedURIComponent(encoded))}

const VIEWS = {
    OVERVIEW: "overview", // View and check persons
    SETTINGS: "settings"  // Settings, export/import
}

/*let setPersonDataAttr = (attribute, value) => {
    let personData = document.getElementById("personData")
    personData.setAttribute(attribute, safeEncode(value))
}
let getPersonDataAttr = (attribute) => {
    return safeDecode(document.getElementById("personData").getAttribute(attribute))
}
// Get cached data from DOM
let getPersonDataCache = () => {
    return getPersonDataAttr("data-person-list")
}*/
// Get current data from textarea
/*let getPersonData = () => {
    return document.getElementById("personData").value
}*/

// Get data from page/app
let getCurrentDataForStorage = () => {
    let data = appdata.persons;
    return JSON.stringify(data);
}

let getDataFromLocalStorage = () => {
    var data = JSON.parse(localStorage.getItem("ol-stateData"));
    return data;
}

let saveData = () => {
    let encoded = getCurrentDataForStorage()
    localStorage.setItem("ol-stateData", encoded)
}

// State controller
let state = {
    _view: VIEWS.OVERVIEW,
    _data: "",
    toggleView: (view) => {
        if(view == "settings") {

            //var c = getPersonDataCache();
            //console.log("Got persons from cache: ", c);

            // Save copy of persondata
            //setPersonDataAttr("data-person-list", personData.value)

            //state.viewSettings();
        } else {
            // Overview
            /*
            // Load persondata from settings
            let personDataCached = getPersonDataCache();
            let personData = document.getElementById("personData").value
            if(personDataCached != personData) {
                // Unsaved changes
                //console.log("Unsaved changes")
                //alert("new updates")
            }
            //_updateOverview(personData)
            state.viewOverview();*/
        }
    },
    viewOverview: (data) => {
        /*state._updateState(VIEWS.OVERVIEW, getCurrentDataForStorage());
        $('#overviewNav').toggleClass('active',true);
        $('#settingsNav').toggleClass('active',false);
        $("#overviewContainer").show();
        $("#settingsContainer").hide();
        _displayOverview(data)*/
    },
    viewSettings: () => {
        /*state._updateState(VIEWS.SETTINGS, getCurrentDataForStorage());
        $('#overviewNav').toggleClass('active',false);
        $('#settingsNav').toggleClass('active',true);
        $("#settingsContainer").show();
        $("#overviewContainer").hide();
        _displaySettings()*/
    },
    _updateState: (view, data) => {
        state._view = view
        state._data = data
        localStorage.setItem("ol-state", state._view)
        localStorage.setItem("ol-stateData", state._data)
    },
    // Load save state and show according to this
    isStateSaved: () => {
        return localStorage.getItem("ol-state") != null
    },
    /*saveData: () => {
        let encoded = getCurrentDataForStorage()
        localStorage.setItem("ol-stateData", encoded)
    },*/
    //_loadData: () => {
    //	let decoded = safeDecode(localStorage.getItem("ol-stateData"))
    //},
    loadAndShowState: () => {
        // [{"name":"Eric","class":"","status":"unknown","run":"unknown"},{"name":"Olle","class":"","status":"unknown","run":"unknown"}]
        if(state.isStateSaved()) {
            state._view = safe(localStorage.getItem("ol-state"))
            state._data = JSON.parse( localStorage.getItem("ol-stateData") )
            if(state._view == VIEWS.OVERVIEW) {
                state.viewOverview(state._data)
            } else if (state._view == VIEWS.SETTINGS) {
                state.viewSettings()
            } else {
                console.log("Unsupported view")
            }
        } else {
            state._view = VIEWS.OVERVIEW
            //state._data = ""
            state.viewOverview()
        }
    }
}

/*function autoGrow (oField) {
    if (oField.scrollHeight > oField.clientHeight) {
        oField.style.height = oField.scrollHeight + "px";
    }
}*/

let shareModal = new bootstrap.Modal(document.getElementById('shareModal'), {
    keyboard: true,
    focus: true
});

let addListModal = new bootstrap.Modal(document.getElementById('addListModal'), {
    keyboard: true,
    focus: true
});

let reportModal = new bootstrap.Modal(document.getElementById('reportModal'), {
    keyboard: true,
    focus: true
});