'use strict';

const version="1.2.4";

moment.locale('sv');
let safe = DOMPurify.sanitize

// Init storage key and store to use for data storage
let initCurrentStorageListKey = (prefix) => {
    setCurrentStorageListKey(createNewStorageKey(prefix));
    return getCurrentStorageListKey();
}

// Return new key id
// YYMMDD + seconds since midnight for current day
let createNewStorageKey = (prefix) => {
    let d = new Date(), e = new Date(d);
    return prefix+moment().format("YYMMDD") + (e - d.setHours(0,0,0,0));
}

// Get key of currently used storage list
let getCurrentStorageListKey = () => {
    return localStorage.getItem(current_storage_keyname);
}
let setCurrentStorageListKey = (key) => {
    localStorage.setItem(current_storage_keyname, key);
}

// Keys used
// Caution: Changing these might break functionality
let _storage_prefix="ol-deltagare-";
let _data_prefix=_storage_prefix+"list-";
let help_key=_storage_prefix+"help";
let state_key=_storage_prefix+"state";
let current_storage_keyname=_storage_prefix+"current-list";
let storage_key=getCurrentStorageListKey() || initCurrentStorageListKey(_data_prefix);

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
    localStorage.setItem(getCurrentStorageListKey(), encoded);
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
    console.log("Key to export", getCurrentStorageListKey());
    let shareLink = url.protocol + "//" + url.host + url.pathname + "?v="+ version+"&k="+ safeEncode(getCurrentStorageListKey().replace(_data_prefix,""))+"&classes=" + safeEncode(_.toString(classList)) 
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

        //console.log("Raw key: ", params.get("k"));
        //console.log("Decoded key: ", safeDecode(params.get("k")));
        storage_key = _data_prefix+safeDecode(params.get("k"));
        setCurrentStorageListKey(storage_key);
        //console.log("Imported key: ", storage_key);

        let classes = safeDecode(params.get("classes")).split(",");
        let data = safeDecode(params.get("data")).split(",");

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

        // Mark import done
        document.location.hash="imported";
        console.log("Import completed!");
    } else {
        console.info("No data to import");
    }
}

let createReport = () => {
    let persons = appdata.persons;
    
    let count = _.filter(persons, function(o) { return o.status=="here"; }).length;
    let here = count + " personer närvarande<br><br>";
    if(count == 1) {
        here = "1 person närvarande<br><br>";
    }
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
    updatePersonStats();
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

let showOverview = () => {
    $('#overviewNav').toggleClass('active',true);
    $('#settingsNav').toggleClass('active',false);
    $('#helpNav').toggleClass('active',false);

    localStorage.setItem(state_key, VIEWS.OVERVIEW);
    renderPersonsChecklist();
    updatePersonStats();
    updatePageInfo();

    $("#overviewContainer").show();
    $("#settingsContainer").hide();
    $("#helpContainer").hide();
}

let showSettings = () => {
    $('#overviewNav').toggleClass('active',false);
    $('#settingsNav').toggleClass('active',true);
    $('#helpNav').toggleClass('active',false);

    localStorage.setItem(state_key, VIEWS.SETTINGS);
    renderPersonList();
    renderStoredLists();
    updatePageInfo();
    document.getElementById("currentList").innerHTML = storageKeyToName(storage_key);

    $("#overviewContainer").hide();
    $("#settingsContainer").show();
    $("#helpContainer").hide();
}

let showHelp = () => {
    $('#overviewNav').toggleClass('active',false);
    $('#settingsNav').toggleClass('active',false);
    $('#helpNav').toggleClass('active',true);

    console.log("Show help...");
    localStorage.setItem(state_key, VIEWS.HELP);
    renderHelpInfo();
    updatePageInfo();

    $("#overviewContainer").hide();
    $("#settingsContainer").hide();
    $("#helpContainer").show();
}

let renderHelpInfo = () => {
    console.log("TODO: Render help");
}

// Updates page with curretn version and current list loaded
let updatePageInfo = () => {
    document.querySelectorAll("small.app-version").forEach(el => {
        el.innerHTML = "Version: <strong>" + version + "</strong><br>Aktuell lista: <strong>" + storageKeyToName(storage_key) +"</strong>";
    });
}


// Load and render all stored lists on current device
let renderStoredLists = () => {
    let list = [];
    for (var i = 0; i < localStorage.length; i++){
        if(localStorage.key(i).startsWith(_data_prefix)) {
            list.push({'key':localStorage.key(i),'name':storageKeyToName(localStorage.key(i))});
        }
    }
    // Sort list
    // appdata.persons = _.sortBy(appdata.persons, [function(o) { return o.name; }]);
    list = _.sortBy(list, [function(o) { return o.key; }]);

    // Template
    let storedList = _.template($('#storedListTemplate').html());

    // Render list
    $('#storedList').html(storedList({'current':storage_key,'lists':list}));
}

// Convert storage key to something that is readable for user
let storageKeyToName = (key) => {
    let id_part = key.replace(_data_prefix,"");
    //return "Närvaro " + id_part.slice(0,6) + " (" + (id_part.slice(6)||1) + ")";

    let d = new Date();
    d.setHours(0,0,0,0);
    d.setMilliseconds(id_part.slice(6));

    return "Närvaro " + id_part.slice(0,6) + " (" + d.toLocaleTimeString() + ")";
} 

// Load stored list
let loadStoredList = (key) => {
    storage_key = key;
    setCurrentStorageListKey(storage_key);
    let personsLoaded = getDataFromLocalStorage();
    appdata.persons = personsLoaded || [];
    showSettings();
}

// Update/clone current list
let changeCurrentList = (key) => {
    changeListModal.show();

    // Create new key
    let newKey = createNewStorageKey(_data_prefix);

    // Clone current list
    localStorage.setItem(newKey, localStorage.getItem(getCurrentStorageListKey()));

    // Reload settings and show new list
    showSettings();
    changeListModal.hide();
}

// Delete stored list
let deleteStoredList = (key) => {
    if(getCurrentStorageListKey() == key) {
        alert("Du kan inte ta bort aktuell lista");
    }
    $("#confirmationYes").attr("data-item-key", key);
    document.getElementById("confirmationYes").addEventListener("click", doDeleteStoredList);
    $("#confirmQuestion").html("Vill du ta bort lista '" + storageKeyToName(key) + "'?");
    confirmModal.show();
}

// Actually remove list (after assumed confirmation)
let doDeleteStoredList = () => {
    let key = $("#confirmationYes").attr("data-item-key");
    $("#confirmationYes").attr("data-item-key",""); // Reset
    console.log("key", key);
    document.getElementById("confirmationYes").removeEventListener("click", doDeleteStoredList);
    confirmModal.hide();
    localStorage.removeItem(key);
    showSettings();
}

let showFirstHelp = () => {
    if (!localStorage.getItem(help_key)) {
        localStorage.setItem(help_key,"shown");
        showHelp();
    }
}

let getTimeStamp = () => {
    var d = new Date()
    return d.getFullYear() + d.getMonth().toString().padStart("2", "0") + d.getDate().toString().padStart("2", "0") + "_" + d.getHours().toString().padStart("2", "0") + d.getMinutes().toString().padStart("2", "0")
}

let safeEncode = (decoded) => {return LZString.compressToEncodedURIComponent(safe(decoded))}
let safeDecode = (encoded) => {return safe(LZString.decompressFromEncodedURIComponent(encoded))}

const VIEWS = {
    OVERVIEW: "overview",   // View and check persons
    SETTINGS: "settings",   // Settings, export/import
    HELP: "help"            // Help, instructions
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
    var data = JSON.parse(localStorage.getItem(getCurrentStorageListKey()));
    return data;
}

let saveData = () => {
    let encoded = getCurrentDataForStorage()
    localStorage.setItem(getCurrentStorageListKey(), encoded)
}

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

let confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'), {
    keyboard: true,
    focus: true
});

let changeListModal = new bootstrap.Modal(document.getElementById('changeListModal'), {
    keyboard: true,
    focus: true
});