const base_url = 'https://random-api1.herokuapp.com/dic_2021/api';

const loading = {
  start: function() {
    document.body.insertAdjacentHTML('beforeend', '<div id="loading"></div>');
  },
  stop: function() {
    let div = document.getElementById("loading");
    if(!div) return;
    div.remove(div);
  }
};

addStyle()
//loading.start();

function addStyle() {
  const css = "#loading { margin: -25px 0 0 -25px;position: absolute;top: 50%;left:50%; border: 16px solid #f3f3f3;border-radius: 50%;border-top: 16px solid #3498db;width: 120px; height: 120px; -webkit-animation: spin 2s linear infinite;animation: spin 2s linear infinite; } @-webkit-keyframes spin { 0% { -webkit-transform: rotate(0deg); } 100% { -webkit-transform: rotate(360deg); }";
  const style = document.createElement('style');
  document.head.appendChild(style);
  style.type = "text/css";
  style.appendChild(document.createTextNode(css));
};

async function callApi(method = 'get', path, data) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${base_url}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'Authorization': token
    },
    ...(method != 'get' && ({
      body: JSON.stringify(data)
    }))
  });
  if (response.status > 500) return alert('Internal Server Error');
  if (response.status == 401) {
    window.location.href = 'index.html';
    return;
  };

  const json = await response.json();
  if (response.ok) return json;

  json.status = response.status;
  return Promise.reject(json);

};

const request = {
  get: (...args) => callApi('get', ...args),
  post: (...args) => callApi('post', ...args),
  patch: (...args) => callApi('patch', ...args),
  put: (...args) => callApi('put', ...args)
};

function getQuery(name) {
  const params = (new URL(document.location)).searchParams;
  return params.get(name);
};

async function staffLogin(e) {
  e.preventDefault();
  const username = e.target.elements.username.value;
  const password = e.target.elements.password.value;
  request.post('/users/staff/signin', {
      username,
      password
    })
    .then((data) => {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user_type', 'staff');
      window.location.href = 'Staff_Dashboard.html';
    })
    .catch((err) => {
      if (err.status === 400) {
        alert(err.errors[0].message.en);
      };
    });
}

function adminLogin(e) {
  e.preventDefault();
  const username = e.target.elements.username.value;
  const password = e.target.elements.password.value;
  request.post('/users/admin/signin', {
      username,
      password
    })
    .then((data) => {
      localStorage.setItem('user_type', 'admin');
      localStorage.setItem('token', data.accessToken);
      window.location.href = 'Admin_Dashboard.html';
    })
    .catch((err) => {
      if (err.status === 400) {
        alert(err.errors[0].message.en);
      }
    });
};

const appendTeams = (teams) => {
  const table = document.getElementById('Team_table');
  for (const team of teams) {
    const row = table.insertRow();
    row.insertCell(0).innerHTML = team.team_id;
    row.insertCell(1).innerHTML = team.name;
    row.insertCell(2).innerHTML = team.location;
    row.insertCell(3).innerHTML = team.contact;
    row.insertCell(4).innerHTML = `<input type="month" value="${window.currentMonth}" onchange="window.currentMonth=this.value">`;
    /**modify*/
    row.insertCell(5).innerHTML = `<a onclick="onSelectTeam('${team.id}')">SELECT</a>`;
  }
};

function onSelectTeam(id) {
  window.location.href = `addToWeaving.html?team_id=${id}&month=${window.currentMonth}`;
};

function getTeams() {
  const date = new Date();
  window.currentMonth = `${date.getFullYear()}-${date.getMonth()+1}`;
  request.get('/users/get_teams')
    .then((data) => {
      appendTeams(data.teams);
    });
}


const onClick = (id) => {
  const c44 = document.getElementById("44");
  const c58 = document.getElementById("58");
  if (id == "44") {
    c44.checked = true;
    c58.checked = false;
  } else {
    c58.checked = true;
    c44.checked = false;
  };
  document.documentElement.style.setProperty('--show44', c44.checked ? 'table-row' : 'none');
  document.documentElement.style.setProperty('--show58', c58.checked ? 'table-row' : 'none');

};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

async function loadWorkPage(workName) {
 const dateObj = new Date(getQuery('month'));
 document.getElementById('month').innerHTML = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const header = "<tr><th>ID</th><th>Name</th></tr>";
  const table = document.getElementById("dataTable");
  const category = getQuery('category');
  let membersHtml = header;
  let current = category || "44";
  onClick(current);

  const id = getQuery('team_id');
  request.get(`/users/get_one_team/${id}`)
    .then(({ team: data }) => {
      document.getElementById('title').innerHTML = data.name;
      document.getElementById('team_id').innerHTML = data.team_id;
      document.getElementById('location').innerHTML = data.location;
      document.getElementById('contact').innerHTML = data.contact;
    });
  const [members, works] = await Promise.all([
    request.get(`/users/get_team_members/${id}`).then(q => q.teamMembers),
    request.get(`/users/get_works`).then(q => q.works)
  ]);
  const work = works.find((item) => item.name == workName);
  if (!work) return alert(`Please create work ${workName} on backend before proceeding`);
  window.work = work;
  for (const id of work.workers_44) {
    const member = members.find((item) => item.id == id);
    if (member) {
      membersHtml += `<tr class="category44"><td>${member.id}</td><td>${member.name}</td></tr>`;
    };

  }
  for (const id of work.workers_58) {
    const member = members.find((item) => item.id == id);
    if (member) {
      membersHtml += `<tr class="category58"><td>${member.id}</td><td>${member.name}</td></tr>`;
    };
  };
  table.innerHTML = membersHtml;
  onClick(current);
};

function addTeam(e) {
  e.preventDefault();
  const body = {};
  for (let i = 0; i < e.target.elements.length; i++) {
    body[e.target.elements[i].getAttribute("name")] = e.target.elements[i].value;
  };
  request.post('/users/add_new_team', body)
    .then((data) => {
      appendTeams([data]);
      Hide();
      alert('Team added successfully')
    });
};

function onTeamMemberClick(id, value) {
  if (value == true && !window.ids.includes(id)) {
    window.ids.push(id);
  } else {
    window.ids = window.ids.filter((item) => item != id);
  };
}

function onTeamSubmit() {
  const workId = getQuery('work_id');
  const category = getQuery('category')
  request.put(`/users/update_work/${workId}`, {
    [`workers_${category}`]: window.ids
    })
    .then((data) => {
      alert('Team members updated');
      goToWorkPage(getQuery('page'), category);
    });
};

function loadTeamMembers() {
  let html = "<tr><th></th><th>ID</th><th>Name</th><th>Ac. No.</th><th>Bank Name</th><th>IFSC code</th><th>Branch Name</th><th>Action</th></tr>";
  const mIds = JSON.parse(getQuery('ids'));
  window.ids = mIds;
  request.get(`/users/get_team_members/${getQuery('team_id')}`)
    .then(({ teamMembers: data }) => {
      for (const team of data) {
        const is = window.ids.includes(team.id);
        html += `<tr><td><input id="${team.id}"  onclick="onTeamMemberClick(this.id, this.checked)" type="checkbox" ${is ? 'checked': 'null'}></td><td>${team.id}</td><td>${team.name}</td><td>${team.bank_account_info.bank_account_number}</td><td>${team.bank_account_info.bank_name}</td><td>${team.bank_account_info.bank_ifsc_code}</td><td>${team.bank_account_info.branch_name}</td></tr>`;
      };
      document.getElementById('dataTab').innerHTML = html;
    });
}

function goToWorkPage(page, category) {
  category = category || (document.getElementById('44').checked ? '44' : '58');
  window.location.href = `${page}?team_id=${getQuery('team_id')}&category=${category}&month=${getQuery('month')}`;
};

function goToTeamList() {
  const category = document.getElementById('44').checked ? '44' : '58';
  window.location.href = `teamlist.html?page=${window.location.pathname}&team_id=${getQuery('team_id')}&category=${category}&work_id=${work.id}&ids=${JSON.stringify(work[`workers_${category}`])}`;
}

async function loadMetrePage(id) {
  window.category = getQuery('category');
  window.members = [];
  window.work = {};
  window.updates = {};
  const [works, data] = await Promise.all([
    request.get(`/users/get_works`)
    .then(q => q.works),
  request.get(`/users/get_team_members/${id}`)
    .then(q => q.teamMembers)
  ]);
  window.work = works.find(e => getQuery('work').toLowerCase().includes(e.name));
  if (!work) return alert('Please create work before moving forward');
  const table = document.getElementById('dataTable');
  window.members = data.filter(e => {
    if (category == '44' && work.workers_44.includes(e.id)) return true;
    if (category == '58' && work.workers_58.includes(e.id)) return true;
  });
  
  for (const member of members) {
    const wage = member.wages.find((item) => item.monthYear === getQuery('month'));
    const tr = document.createElement('tr');
    tr.setAttribute('id', 'm' + member.id);
    const get = (key) => (wage && wage[work.name][category][key]) || 0;
    tr.innerHTML = `<td>${member.id}</td><td>${member.name}</td><td><input type="number" value="${get('input')}" onchange="onMetreChange('${member.id}', this.value, '${member.name}', ${!!wage})"></td><td data-id="${work.name}">${work.name}</td><td data-id="pf">${get('pf')}</td><td data-id="esi">${get('esi')}</td><td data-id="gt">${get('gratuity')}</td><td data-id="others">${get('others')}</td><td data-id="sum">${get('sum')}</td><td data-id="margin">${get('margin')}</td><td data-id="mw">${get('mw')}</td><td data-id="mt">${get('mt')}</td><td data-id="dividends">${get('dividends')}</td>`;
    table.appendChild(tr);
  };

}

function setText(id, dataId, value) {
  const el = document.querySelector(`#m${id} > td[data-id="${dataId}"`);
  el.textContent = Math.trunc(value * 100) / 100;
}

function onMetreChange(id, value, name, exists) {
  value = Number(value);
  if (typeof value != 'number') return alert('Invalid number provided');
  const values = calculate(id, value, name);
  values.exists = exists;
  setText(id, work.name, values[work.name]);
  setText(id, 'pf', values.pf);
  setText(id, 'esi', values.esi);
  setText(id, 'gt', values.gratuity);
  setText(id, 'others', values.others);
  setText(id, 'margin', values.margin);
  setText(id, 'sum', values.sum);
  setText(id, 'mw', values.mw);
  setText(id, 'mt', values.mt);
  setText(id, 'dividends', values.dividends);
  window.updates[id] = values;
};

const formulas = {
  44: {
    weaving: 56.98,
    winding: 17.81,
    warping: 2.31,
    joining: 2.03,
    pf: 12,
    esi: 3.25,
    gratuity: 7,
    others: 20.33
  },
  58: {
    weaving: 68.53,
    winding: 20.66,
    warping: 2.03,
    joining: 2.59,
    pf: 12,
    esi: 3.25,
    gratuity: 7,
    others: 20.33
  }
};

function calculate(id, value) {
  const name = window.work.name;
  let [totalMargin, totalSum] = Object.values(updates).filter(e => e.id !== id).reduce((prev, cur) => {
    prev[0] = prev[0] + cur.input;
    prev[1] = prev[1] + cur.sum;
    return prev;
  }, [value, 0]);
  totalMargin = totalMargin * 3.96;

  let values = {
    id,
    name,
    input: value,
    winding: 0,
    weaving: 0,
    warping: 0,
    joining: 0,
    pf: 0,
    esi: 0,
    gratuity: 0,
    others: 0,
    margin: totalMargin,
    sum: 0,
    mw: 0,
    mt: 0,
    dividends: 0
  };


  values[name] += value * formulas[category][name];
  values.pf += formulas[category].pf / 100 * values[name];
  values.esi += formulas[category].esi / 100 * values[name];
  values.gratuity += formulas[category].gratuity / 100 * values[name];
  values.others += formulas[category].others / 100 * values[name];
  values.sum += (values[name] + values.pf + values.esi + values.gratuity + values.others);
  if (name == 'weaving') {
    values.mw += value * 34;
  };

  totalSum += values.sum;
  values.mt = totalSum - values.mw;
  values.dividends = totalMargin + values.mt;
  return values;
};

async function onMetreSubmit() {
  const data = await request.put(`/users/update_team_member_bulk`, {
    work: work.name,
    monthYear: getQuery('month'),
    category,
    data: Object.values(window.updates)
  });
  exportToCsv();
  toggleModal();
  goToNextPage();
};

function goToMetre() {
  window.location.href = `addMetre.html?work="${window.location.pathname}&team_id=${getQuery('team_id')}&category=${document.getElementById('44').checked ? '44' : '58'}&month=${getQuery('month')}`;
};

function goToNextPage() {
  let current;
  let next;
  switch (work.name) {
    case "weaving":
      current = 'addToWeaving.html'
      next = 'addToWinding.html'
      break;
    case "winding":
      current = 'addToWinding.html'
      next = 'addToWarping.html';
      break;
    case "warping":
      current = 'addToWarping.html'
      next = 'addToJoining.html'
    case "joining":
      current = 'addToJoining.html'
  };
  if (category == '44') return goToWorkPage(current, '58');
  if (!next) return;
  goToWorkPage(next, '44');
};

function searchTable(id, text, row = 0) {
  const table = document.getElementById(id);
  if (!table) return;
  const tr = table.getElementsByTagName('tr');

  for (i = 0; i < tr.length; i++) {
    let td = tr[i].getElementsByTagName('td')[row];
    if (td) {
      if ((td.textContent || td.innerText).toLowerCase().indexOf(text.toLowerCase()) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

function sortTable(id, row = 0) {
  let table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById(id);
  switching = true;
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("td")[row];
      y = rows[i + 1].getElementsByTagName("td")[row];
      // Check if the two rows should switch place:
      if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
        // If so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}