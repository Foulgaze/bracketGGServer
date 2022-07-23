
function getTournamentNames()
{
    
    fetch(`${window.location.origin}/gatherData`)
    .then(response => response.json())
    .then(data =>
        {
        let tempObj = new Object; 
        tempObj = data;
        console.log(tempObj);
        sessionStorage.setItem("tournamentDict", JSON.stringify(tempObj));

        Object.keys(tempObj).forEach(element => 
            {
                let temp = new Object();
                temp.label = element;
                tournList.push(temp);
            }
        )});
}


function changePage(tournamentName)
{
    sessionStorage.setItem("tournamentName", tournamentName);
    sessionStorage.setItem("tournList", tournList);
    document.location.href = '/mainPage.html';
}

var tournList = [];
getTournamentNames();
var input = document.getElementById("tournamentInput");

autocomplete({
    input: input,
    fetch: function(text, update) {
        text = text.toLowerCase();
        // you can also use AJAX requests instead of preloaded data
        var suggestions = tournList.filter(n => n.label.toLowerCase().startsWith(text))
        update(suggestions);
    },
    onSelect: function(item) {
        input.value = item.label;
        changePage(item.label);
    }
});