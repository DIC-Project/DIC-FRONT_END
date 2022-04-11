// Password Seen or not
var state= false;
function toggle(){
    if (state) {
        document.getElementById("admin_pass").setAttribute("type","password");
        document.getElementById("togglePassword").style.color='#707070';
        state= false;
    }
    else{
        document.getElementById("admin_pass").setAttribute("type","text");
        document.getElementById("togglePassword").style.color='#5887ef';
        state= true;
    }
}


// Sign Out
let signout = document.querySelector(".signout");

signout.addEventListener("click",(e)=>{
    e.preventDefault();
    window.location.replace("../index.html")
})


// Table List View to AddtoHtml
let team_Lists = document.getElementById("dataTable");
let addbtn = document.querySelector(".add-view");

// addbtn.addEventListener("click",(e)=>{
//     e.preventDefault();
// })
// console.log(team_Lists);
// console.log(team)s
for (var i = 0; i < 4; i++) {

    var tr = document.createElement('tr');


    var td1 = document.createElement('td');
    var td2 = document.createElement('td');
  
    var text1 = document.createTextNode('Text1');
    var text2 = document.createTextNode('Text2');
  
    td1.appendChild(text1);
    td2.appendChild(text2);
    tr.appendChild(td1);
    tr.appendChild(td2);
  
    // team.appendChild(tr);
}
