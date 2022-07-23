/*
  getTournamentNames : calls NodeJS server, and recieves a list of all smash tournaments in the US
*/


function getTournamentNames()
{
    fetch(window.location.origin+"/gatherData")
    .then(response => response.json())
    .then(data =>
      {tournamentDict = data; 
        console.log(Object.keys(tournamentDict));
        setList();
        if(sessionStorage.getItem("tournamentName") != null)
        {
          document.getElementById("tournamentInputField").value = sessionStorage.getItem("tournamentName");
          checkForTournament();
        }

      });
}

/*
  getTournamentEvents : calls NodeJS server, and recieves a list of all events from a specific smash tourney, with attendees
*/

function getTournamentEvents(tourneyID)
{
  fetch(window.location.origin+"/getTourneyEvents", {
      method: 'POST',
      headers:{
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body : `id=${tournamentDict[tourneyID]}`
  }).then(response => response.json())
  .then(data => {
    if(Object.keys(data).length === 0)
    {
      setHeader("Tournament Not Started");
    }
    else
    {
      document.getElementById("tournDiv").style.display = "block";
      tempObject = new Object();
      tempObject.name = tourneyID;
      tempObject.id =  tournamentDict[tourneyID];
      data["m_dataObject"] = tempObject;
      currentTournamentList.push(data); 
      addTournamentDiv(tempObject.name,tempObject.id); 
      addDropdownandInput(tempObject.id);
    }
    
  });
}

function getPlayerSets(tournamentID,selectedPlayer,selectedOption,isNew,startIndex,overallGameDiv,pName,playerObj)
{
  
  let currTournamentIndex = findTournament(tournamentID);  
  let playerName;
  if(pName == "")
  {
    playerName = selectedPlayer.getElementsByClassName("inputField")[0].value;
    selectedPlayer.getElementsByClassName("inputField")[0].value = "";
  }
  else
  {
    playerName = pName;
  } 
  indexPos = currTournamentIndex[selectedOption].attendeeList.indexOf(playerName);
  if(indexPos != -1)
  {
    let tempObj = new Object();
    tempObj["playerID"] = currTournamentIndex[selectedOption].idList[indexPos];
    tempObj["eventID"] = currTournamentIndex[selectedOption].id;
    tempObj["entrantID"] = currTournamentIndex[selectedOption].standingList[indexPos];
    console.log(tempObj);
      fetch(window.location.origin+"/getSpecificPlayer", {
        method: 'POST',
        headers:{
          'Content-Type': 'application/json'
        },
        body : JSON.stringify(tempObj)
    }).then(response => response.json())
      .then(data => {
        console.log(data);
        if(Object.keys(data).length === 0)
        {
          setHeader("An Error Has Occured");
        }
        else
        {
          if(startIndex == -1)
          {
            startIndex = data.data.event.sets.nodes.length-1;
          }
          addGames(selectedPlayer,data.data.event.sets.nodes,playerName,tempObj["playerID"],currTournamentIndex[selectedOption].attendeeList,currTournamentIndex[selectedOption].idList,selectedOption,data.data.event.standings.nodes,isNew,startIndex,tournamentID,overallGameDiv,playerObj);
        }
        
      });
  }
  else
  {
    console.log("Player not found!")
  }
  
}

/*
  addTournamentDropdown : add new div to tournamentDiv
*/

function addTournamentDiv(tourneyName,id)
{
  let tournamentDiv = document.getElementsByClassName("tournamentDiv")[0];
  let newDiv = document.createElement("div");
  let header = document.createElement("h1");
  let headerDiv = document.createElement("div");
  
  let titleDiv = document.createElement("div");
  titleDiv.className = "tournamentTitleDiv";


  headerDiv.className = "tournamentHeader";

  header.innerText = tourneyName;
  header.className = "tournamentTitleHeader";

  let deleteBtn = document.createElement("button");
  deleteBtn.className = "deleteTourneyButton";
  deleteBtn.innerHTML = "Delete Tournament";
  deleteBtn.setAttribute("onclick", "deleteTournamentRevised(this.parentElement)");

  
  newDiv.id = id;
  newDiv.className = "specificTournament";
  titleDiv.append(header);
  titleDiv.append(deleteBtn);
  headerDiv.append(titleDiv);
  newDiv.appendChild(headerDiv);
  tournamentDiv.appendChild(newDiv);
}

function findTournament(tournamentID)
{
  for(let i = 0; i < currentTournamentList.length; ++i)
  {
    if(currentTournamentList[i].m_dataObject.id == tournamentID)
    {
      return currentTournamentList[i];
    }
  }
  return null;
}
function deleteTournamentRevised(ele)
{
  ele = ele.parentElement.parentElement;
  // if(ele.previousSibling != null && ele.previousSibling.tagName == "BR")
  // {
  //   ele.previousSibling.remove();
  // }
  if(ele.nextSibling != null && ele.nextSibling.tagName == "BR")
  {
    ele.nextSibling.remove();
  }

  ele.remove();
  deleteFromList(ele.id);
}

function addDropdownandInput(tournamentID)
{
  let currTournamentIndex = findTournament(tournamentID);

  let currentTournamentDiv = document.getElementsByClassName("specificTournament")[document.getElementsByClassName("specificTournament").length - 1];

  let headerDiv = currentTournamentDiv.getElementsByClassName("tournamentHeader")[0];

  let tournamentEventSelectDiv = document.createElement("div");
  tournamentEventSelectDiv.className = "eventDiv";

  let tournamentEventSelect = document.createElement("select");
  tournamentEventSelect.className = `eventDropdown`;
  tournamentEventSelect.id = tournamentID;

  let tournamentEventBtn = document.createElement("button");
  tournamentEventBtn.type = "button";
  tournamentEventBtn.className = "innerButton playerButton"
  tournamentEventBtn.innerText = "Add Player";


  // let tournamentDeleteBtn = document.createElement("button");
  // tournamentDeleteBtn.className = "eventPlayerButton";
  // tournamentDeleteBtn.innerText = "Delete Tournament!";
  // tournamentDeleteBtn.setAttribute("onclick", "deleteTournamentRevised(this)");

  let tournamentEntrantInput = document.createElement("input");
  tournamentEntrantInput.className = "inputField playerInput";

  tournamentEntrantInput.setAttribute("type","text");

  let inputComboForm = document.createElement("form");
  inputComboForm.className = "InputButtonCombo playerCombo";
  inputComboForm.appendChild(tournamentEntrantInput);
  inputComboForm.appendChild(tournamentEventBtn);
  
  
  
  //tournamentEventSelect.id = String(`select:${currentTournamentDiv.childElementCount-1}`);
  //tournamentEntrantInput.id = String(`id:${currentTournamentDiv.childElementCount-1}`);
  
  Object.keys(currTournamentIndex).forEach
  (element => {
    if(element != "m_dataObject")
    {
      let optionTemp = document.createElement("option");
      optionTemp.text = element;
      //optionTemp.className = element;
      optionTemp.id = currTournamentIndex[element].id;
      tournamentEventSelect.appendChild(optionTemp);
    }
    
  })
  headerDiv.appendChild(tournamentEventSelectDiv);
  tournamentEventSelectDiv.appendChild(tournamentEventSelect);
  // tournamentEventSelectDiv.appendChild(tournamentEntrantInput);
  // tournamentEventSelectDiv.appendChild(tournamentEventBtn);
  tournamentEventSelectDiv.appendChild(inputComboForm);
  //tournamentEventSelectDiv.appendChild(tournamentDeleteBtn);
  //tournamentEventSelect.setAttribute("onchange",setInputList(parseInt(this.id), this.options[this.selectedIndex].value));
  Object.keys(currTournamentIndex).forEach
  (element => {
    if(element != "m_dataObject")
    {
      let tournamentEventDiv = document.createElement("div");
      tournamentEventDiv.className = element;
      tournamentEventDiv.id = "specificGameEvent" 
  

      let tournamentEventDivHeader = document.createElement("h1");
      tournamentEventDivHeader.innerHTML = element;
      tournamentEventDivHeader.className = "eventHeader";
      tournamentEventDivHeader.style.display = "none";
      tournamentEventDiv.appendChild(tournamentEventDivHeader);
      currentTournamentDiv.appendChild(tournamentEventDiv);

    }
  })
  let tournBreak = document.createElement("br");
  currentTournamentDiv.parentElement.append(tournBreak);
  
  tournamentEventSelect.setAttribute("onchange","setInputList(this.id,this.options[this.selectedIndex].text,this)");
  setInputList(tournamentEventSelect.id,tournamentEventSelect.options[tournamentEventSelect.selectedIndex].text,tournamentEventSelect);
  //tournamentEventBtn.setAttribute("onclick", "getTournamentNames()");
  
  tournamentEventBtn.setAttribute("onclick", "getPlayerSets(this.parentElement.previousSibling.id,this.previousSibling,this.parentElement.previousSibling.options[this.parentElement.previousSibling.selectedIndex].text,true,-1,null,\"\",null)")
  //tournamentEventBtn.setAttribute("onclick", "hello()");
  
}

function hello()
{
  console.log("te");
}
function setInputList(tourneyID,tourneyName,ele)
{
  let currTournamentIndex = findTournament(tourneyID);
  if(ele.nextSibling.firstChild.className == "awesomplete")
  {
    ele.nextSibling.firstChild.remove();
    let temp = document.createElement("input");
    temp.setAttribute("type","text");
    temp.className = "inputField";

    ele.nextSibling.insertBefore(temp,ele.nextSibling.firstChild);
    new Awesomplete(ele.nextSibling.firstChild,{list:currTournamentIndex[tourneyName].attendeeList});


  }
  else
  {
    new Awesomplete(ele.nextSibling.firstChild, {
      list:currTournamentIndex[tourneyName].attendeeList });
  }
  
}

function deletePlayerList(tourneyID, playerName)
{
  for(let i = 0; i < playerUpdateList.length; ++i)
  {
    if(playerUpdateList[i].tourneyID == tourneyID && playerUpdateList[i].pName == playerName)
    {
      playerUpdateList.slice(i,1);
      return;
    }
  }
}
function deleteFromList(tournamentID)
{
  let index = -1;
  for(let i =0 ; i < currentTournamentList.length; ++i)
  {
    if(currentTournamentList[i].m_dataObject.id == tournamentID)
    {
      index = i;
    }
  }
  if(index != -1)
  {
    currentTournamentList.splice(index,1);
  }
}

function setList()
{
  var input = document.getElementById("tournamentInputField");
  new Awesomplete(input, {
	        list:Object.keys(tournamentDict) });
}

function deleteTournament(ele)
{
  ele.parentElement.parentElement.parentElement.remove();

  deleteFromList(ele.parentElement.parentElement.parentElement.id);
}

function deletePlayer(ele)
{
  deletePlayerList(ele.parentElement.parentElement.id,ele.previousSibling.innerHTML);
  let parentEle = ele.parentElement;
  ele.nextSibling.remove();
  ele.nextSibling.remove();
  ele.previousSibling.remove();
  if(ele.nextSibling)
  {
    ele.nextSibling.remove();
  }
  ele.remove();
  if(parentEle.childElementCount == 1)
  {
    parentEle.firstChild.style.display = "none";
  }
  
}


function checkGames()
{

   playerUpdateList.forEach(element =>
     {
      getPlayerSets(element.tournamentID, element.selectedPlayer,element.selectedOption,false,element.currSize,element.htmlElement,element.pName,element);
     })
}
function removeHeader()
{
  document.getElementsByClassName("missingTournamentTxt")[0].style.display = "none";
}
function setHeader(text)
{
  let missingHeader = document.getElementsByClassName("missingTournamentTxt")[0];
  missingHeader.innerHTML = text;
  missingHeader.style.display = "block"
  setTimeout(removeHeader,2000);
}
function addGames(textElement,gameList,pName,id,atnList,idList,event, standingsList, isNew, startPoint,tournamentID,overallGameDiv,playerObj)
{
   
    gameList.sort((a,b)=>{return a.completedAt > b.completedAt ? -1 : 1});
    if(isNew)
    {
      let parentEventDiv = textElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.getElementsByClassName(event)[0];
      parentEventDiv.getElementsByClassName("eventHeader")[0].style.display = "block";
      let playerTitle = document.createElement("h2");
      playerTitle.innerHTML = pName;
      playerTitle.className = "playerTitle";
   
  
      overallGameDiv = document.createElement("div");
      overallGameDiv.className = "overallDiv";
      overallGameDiv.id = gameList.length;
          
      let deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "Remove Player";
      deleteBtn.setAttribute("onclick", "deletePlayer(this)");
      deleteBtn.className = "deleteBtn";
  
      let brInsert = document.createElement("br");
  
      if(parentEventDiv.childElementCount > 1)
      {
        parentEventDiv.appendChild(brInsert);
      }
  
      parentEventDiv.appendChild(playerTitle);
      parentEventDiv.appendChild(deleteBtn);
      parentEventDiv.appendChild(brInsert.cloneNode(true));
      parentEventDiv.appendChild(overallGameDiv);
    }
    overallGameDiv.innerHTML = "";
    let overallStyle = "";
    for(let i = 0; i < gameList.length; ++i)
    {
      if(gameList[i].completedAt != null)
      {
        overallStyle += "1fr ";
      }
    }
    for(let i = gameList.length-1;i > -1; --i )
    { 
      
      if(gameList[i].completedAt == null)
      {
        continue;
      }
      else
      {
        let currentString = gameList[i].displayScore;
        
        let startPos = currentString.indexOf(pName);
        let p1Score = 0;
        let p2Score = 0;
        let a = currentString.length - 1;
        let victoryChar = 'W';
        if(currentString == "DQ")
        {
          if(gameList[i].winnerId == id)
          {
            p1Name = pName;
            p2Name = "DQ";
            p1Score = Math.floor(gameList[i].totalGames/2) + 1;
            p2Score = 0;
          }
          else
          {
            p1Name = pName + " (DQ)";
            let index = idList.indexOf(gameList[i].winnerId);
            if(index != -1)
            {
              p2Name = atnList[index];
            }
            else
            {
              p2Name = "UNKNOWN";
            }
            victoryChar = 'L';
            p1Score = 0;
            p2Score = Math.floor(gameList[i].totalGames/2) + 1;
          }
        }
        else
        {
          for(; a > -1; --a)
          {
            if(currentString[a] == ' ')
            {
              p2Score = parseInt(currentString.slice(a,currentString.length));
              break;
            }
          }
          if(startPos == 0)
          {
            let i = pName.length+1;
            for(; i < currentString.length; ++i)
            {
              if(currentString[i] == ' ')
              {
                p1Score = parseInt(currentString.slice(pName.length, i));
                break;
              }
            }
            p1Name = pName;
            p2Name = currentString.slice(i+2,a);
            if(p1Score < p2Score)
            {
              victoryChar = 'L';
            }
          }
          else
          {
            let start = a-pName.length-4;
            let i = a-pName.length-4;
            for(; i > -1; --i)
            {
              if(currentString[i] == " ")
              {
                p1Score = parseInt(currentString.slice(i,start+1));
                break;
              }
            }
            p2Name = pName;
            p1Name = currentString.slice(0,i);
            if(p2Score < p1Score)
            {
              victoryChar = 'L';
            }
          }
        }
      
      
        var insert = `<div class = "gamerTitle">
                    <p class = "roundTitle">
                    ${gameList[i].fullRoundText} (${gameList[i].phaseGroup.phase.name})
                    </p>
                    <div class = "specificGame">
                      <div class ="playerDiv${victoryChar}">
                          <p class = "bigP">${p1Name}</p>
                          <hr class = "matchMiddle">
                          <p class = "bigP">${p2Name}</p>
                      </div>
                      <div class = "scoreDiv${victoryChar}">
                          <p class = "bigP">${p1Score}</p>
                          <hr class = "matchMiddle">
                          <p class = "bigP">${p2Score}</p>
                      </div>
                  </div>
                  </div>
                  `

        
        overallGameDiv.innerHTML += insert;
      }

    }
    if(standingsList != null && standingsList[0].isFinal == true)
    {
      overallStyle+= "1fr ";
      if(standingsList[0].placement == 1)
      {
        overallGameDiv.innerHTML += `<div class = "tournamentPlacementW"><h1 class = "placementHeader">Won The Event!</h1></div>`
        //overallGameDiv.innerHTML += `<h1 class = "finalPlacement">Won The Event!<h1>`

      }
      else
      {
        overallGameDiv.innerHTML += `<div class = "tournamentPlacementL"><h1 class = "placementHeader">Out At ${standingsList[0].placement}th</h1></div>`;
      }

      if(!isNew)
      {
        for(let i = 0; i < playerUpdateList.length; ++i)
        {
          if(playerUpdateList[i].htmlElement.isEqualNode(overallGameDiv))
          {
            playerUpdateList.splice(i,1);
            break;
          }
        }
      }
    }
    else
    {
      if(playerObj != null)
      {
        playerObj["currSize"] = gameList.length;
      }
      if(isNew)
      {
        let listObj = new Object();
        listObj["htmlElement"] =overallGameDiv;
        listObj["currSize"] = gameList.length ;
        listObj["tournamentID"] = tournamentID;
        listObj["selectedOption"] = event;
        listObj["pName"] = pName;
        listObj["selectedPlayer"] = textElement;
        playerUpdateList.push(listObj);
      }
      
    }
    
    overallGameDiv.style.setProperty("grid-template-columns",overallStyle);
  

}

function checkForTournament()
{
  let textBox = document.getElementById("tournamentInputField");
  if(textBox.value in tournamentDict)
  {
    inList = false;
    currentTournamentList.forEach(element => 
      {
        if(element["m_dataObject"].name == textBox.value) 
        {
          inList = true;
        }
      });
    if(!inList)
    {
      getTournamentEvents(textBox.value)
    }    
    textBox.value = "";
  }
  else
  {
    setHeader("An Error has Occured Retrieving Data");
  }
}
var tournamentDict = new Object();
var currentTournamentList = [];
var autocompleteList = [];
var playerUpdateList = [];
var autocompleteObject = new Object();
const gameRefreshCheck = 1000*60*2; // 1 second * 60 * 2 = 2 Minutes :)
var getUrl = window.location;
var baseUrl = getUrl.protocol + "//" + getUrl.host;

document.getElementsByClassName("missingTournamentTxt")[0].style.display = "none";
document.getElementById("tournDiv").style.display = "none"; 

if(sessionStorage.getItem("tournamentDict") == null)
{
  getTournamentNames();
}
else
{
  tournamentDict = JSON.parse(sessionStorage.getItem("tournamentDict"));
  if(sessionStorage.getItem("tournamentName") != null)
  {
    document.getElementById("tournamentInputField").value = sessionStorage.getItem("tournamentName");
    checkForTournament();
  }
  setList();

}

console.log(baseUrl);
setInterval(checkGames,gameRefreshCheck)



