import fetch from "node-fetch";
import fs from "fs";
import express from "express";
import process from "process";
import bodyParser from "body-parser";
import path from 'path';
import {fileURLToPath} from 'url';


function readFile(filePath)
{
    const data = fs.readFileSync(filePath, {encoding : "utf8", flag : "r"}).split("\n")
    return data;
}
/*
    readJson : Reads json data from filepath
*/

function readJson(filePath)
{
    let data = fs.readFileSync(filePath, {encoding : "utf8", flag : "r"})
    data = JSON.parse(data);
    return data;
}

/*
    getStartggData : Queries start.gg for all tournaments, and places results into tournamentDict global var
*/

function getStartggData(counter)
{
    const query = `query TournamentsByCountry( $perPage: Int!,$page:Int!, $afterDate : Timestamp, $beforeDate : Timestamp) {
        tournaments(query: {
          perPage: $perPage
          page : $page
          filter: {
            afterDate: $afterDate
            beforeDate: $beforeDate
          }
        }) {
          nodes {
            id
            name
          }
        }
      }
    `
    
    fetch("https://api.start.gg/gql/alpha",{
        method: 'POST',
        headers: {"Content-Type" : "application/json",
                    "Authorization" : `Bearer ${envVariables}`},
        body : JSON.stringify({
            query: query
            ,
            variables :{
                perPage : 500,
                page : counter,
                afterDate : Math.floor(new Date(Date.now() - 604800000)/1000),
                beforeDate: Math.floor(new Date(Date.now() + 604800000)/1000),
            }
        })
    }).then(res => res.json())
    .then(data => {
        if(data.data["tournaments"] != null &&data.data["tournaments"]["nodes"].length != 0)
        {
            data.data["tournaments"]["nodes"].forEach(element => tournamentDict[element.name] = element.id);
            getStartggData(counter + 1);

        }
        else
        {
            currentlyUpdating = false;
            if(!serverStarted)
            {
              startListening();
              serverStarted = true;
            }
            writeToJSON();
            return;
        }
    
    });
}
/*
    getStartGGEvents: Queries the start.gg api for all events of a specific tournament 
*/
function getStartggEvents(tournID, passedResponse)
{
  const query = `query eventQuery($tourneyID : ID)
  {
    tournament(id: $tourneyID)
    {
      events 
      {
        name
        id
      }
    }
  }`
  fetch("https://api.start.gg/gql/alpha", {
    method: 'POST',
        headers: {"Content-Type" : "application/json",
                    "Authorization" : `Bearer ${envVariables}`},
        body : JSON.stringify({
            query: query
            ,
            variables :{
                tourneyID : tournID
            }
        })
    }).then(res => res.json())
  .then(data => 
    {
      var returnObject = new Object();
      data.data["tournament"]["events"].forEach( element => 
        {
          let tempObject = new Object(); 
          tempObject.id = element.id;
          tempObject.attendeeList = [];
          tempObject.idList = [];
          tempObject.standingList = [];
          returnObject[element.name] = tempObject;
        });
        let objList = Object.values(returnObject);
        let keyList= Object.keys(returnObject);
        let countObj = new Object();
        countObj.count = 0;
        countObj.length = objList.length;
        for(let i = 0; i < objList.length; ++i)
        {
          getEventParticipants(objList[i].id, passedResponse,1,returnObject,keyList[i],tournID,countObj);
        }
       
    })

}

function returnFunction(response, countObj, data, tournID)
{
  if(countObj.length == countObj.count)
  {
    let ret = JSON.stringify(data);
    response.send(ret);
    fs.writeFile(`${dataFolder}${tournID}.json`, ret, err =>{if(err){console.log(err)}});

  }
}

/*
  getEventParticipants: Async function that gathers all the events and participants from a tournament.
  Requires event ID, the response, the page number (is recursive), the return object, the event name, tournament ID, and async count obj
*/

async function getEventParticipants(eventID, passedResponse, currPage, returnObject, eventName,tournID, countObj)
{
  const query = `query eventParticipants($eventID :ID, $perPage:Int, $page :Int)
  {
    event(id : $eventID)
    {
      entrants(query : {page : $page, perPage: $perPage})
      {
        nodes
        {
          name
          id
          standing
          {
            id
          }
        }
        
      }
    }
  }`
  fetch("https://api.start.gg/gql/alpha", {
    method: 'POST',
        headers: {"Content-Type" : "application/json",
                    "Authorization" : `Bearer ${envVariables}`},
        body : JSON.stringify({
            query: query
            ,
            variables :{
                eventID : eventID,
                perPage :  500,
                page : currPage

            }
        })
    }).then(res => res.json())
  .then(data => {
    if(data.data["event"]["entrants"]["nodes"].length != 0)
    {
      for(let i = 0; i < data.data["event"]["entrants"]["nodes"].length; ++i)
      {
        if(data.data["event"]["entrants"]["nodes"][i].standing == null)
        {
          returnObject[eventName].standingList.push(-1);
        }
        else
        {
          returnObject[eventName].standingList.push(data.data["event"]["entrants"]["nodes"][i].standing.id)
        }
        returnObject[eventName].attendeeList.push(data.data["event"]["entrants"]["nodes"][i].name);
        returnObject[eventName].idList.push(data.data["event"]["entrants"]["nodes"][i].id);
        
      }
      getEventParticipants(eventID, passedResponse, currPage+1, returnObject, eventName,tournID, countObj);
    }
    else
    {
        countObj.count += 1;
        returnFunction(passedResponse,countObj,returnObject,tournID);
    }

  } )
}

/*
  getPlayedGames : Gathers the set data for one player. Requires their ID, entrant ID, event ID, and passed response
*/

function getPlayedGames(playerID, eventID,entrantID,response)
{
  const query = `query eventParticipants($eventID :ID, $playerID:ID, $entrantID : ID)
  {
    event(id : $eventID)
    {
      sets(page : 1, perPage : 500, sortType : RECENT,filters:{entrantIds : [$playerID]} )
      {
        nodes
        {
          phaseGroup
          {
            phase
            {
              name
						}
					}
          round
          startedAt
          totalGames
          startAt
          displayScore
          identifier
          fullRoundText
          winnerId
          completedAt
				}
			}
      standings(query:{perPage:5,page:1,filter:{id: $entrantID}})
      {
        nodes
        {
          isFinal
          placement
        }
      }
    }
  }`
  fetch("https://api.start.gg/gql/alpha", {
    method: 'POST',
        headers: {"Content-Type" : "application/json",
                    "Authorization" : `Bearer ${envVariables}`},
        body : JSON.stringify({
            query: query
            ,
            variables :{
                eventID : eventID,
                playerID : playerID,
                entrantID : entrantID
            }
        })
    }).then(res => res.json())
      .then(data => {response.send(data)})
}

/*
    writeToJSON : Write to tournamentFile in JSON format
*/

function writeToJSON()
{
    fs.writeFileSync(tournamentFile,JSON.stringify(tournamentDict))
}

/*
  startListening : Start listening on port
*/

function startListening()
{
  let port = process.env.port || 8000;
  var server = app.listen(port, function () {

    var host = server.address().address
    var port = server.address().port
    console.log('Express app listening at http://%s%s', host, port)

  });
}

/*
MODULE IMPORTS:
fs: file IO module
express: http wrapper for server management
process: exiting program async
*/

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tournamentFile = __dirname+"/../data/tournamentNames.json" // Global name for tournament data storage file in JSON
const dataFolder = __dirname+"/../data/";
const fileRefreshTime = 7200;
var tournamentDict = new Object(); // Global dictionary for storing tournament name and IDS
var currentlyUpdating = false; // Global variable for checking if the dictionary is currently being updated
const envVariables = process.env.BRACKET_KEY;

var serverStarted = false;
tournamentDict = readJson(tournamentFile);


var minutes = 60, nameUpdateInterval = minutes * 60 * 1000;

// Will call updateTournamentData every hour
setInterval(() => {currentlyUpdating = true; getStartggData(0)}, nameUpdateInterval);

var app = express()


app.use(express.static(__dirname+'/../website'))
app.use(express.static(__dirname+'/../website/mainPage'))

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());


app.get('/', (req, res) =>
{
    res.send("{}");
})
app.get('/test',(req, res) =>
{
    res.send("TEST!");
})

app.get('/gatherData', (req, res) =>
{
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(tournamentDict));
})

app.post('/getTourneyEvents', (req,res) =>
{
   let reqString = JSON.parse(JSON.stringify(req.body));
   if("id" in reqString && !isNaN(parseInt(reqString["id"])))
   {  
    let id = reqString["id"];
    let sent = false;
    fs.readdir(dataFolder, (err, files) =>
    {
      files.forEach(file =>
        {
          if(file.indexOf(id) == 0)
          {
              sent = true;
              fs.stat(dataFolder +file, function(err,stats)
              {
                  if( ((new Date().getTime() - stats.mtime) / 1000) < fileRefreshTime)
                  {
                  
                    fs.readFile(dataFolder+file, function(err, data)
                    {
                      if(err)
                      {
                        console.log(err);
                      }
                      else
                      {
                        res.send(JSON.parse(data));
                      }
                    })
                  }
                  else
                  {
                    getStartggEvents(parseInt(reqString["id"]),res);
                  }
                  
              });
          }
        })
        if(!sent)
        {
          getStartggEvents(parseInt(reqString["id"]),res);
        }
    })
   }
   else
   {
    res.sendStatus(404);
   }

})

app.post('/getSpecificPlayer', (req,res) =>
{
   let reqString = req.body;
   if("eventID" in reqString && !isNaN(parseInt(reqString["eventID"])) && "playerID" in reqString && !isNaN(parseInt(reqString["playerID"])) && "entrantID" in reqString && !isNaN(parseInt(reqString["entrantID"])))
   {
    getPlayedGames(parseInt(reqString["playerID"]),reqString["eventID"],reqString["entrantID"],res);
   }
   else
   {

    res.send("{}");
   }

})


startListening();
serverStarted = true;
process.on("exit", () => writeToJSON());
