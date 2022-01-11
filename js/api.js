const base_url = 'https://random-api1.herokuapp.com/dic_2021/api';

const loading = {
  start: function() {
    document.body.insertAdjacentHTML('beforeend', '<div id="loading"></div>');
  },
  stop: function() {
    let div = document.getElementById("loading");
    if (!div) return;
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
    row.insertCell(2).innerHTML = team.circle || '';
    row.insertCell(3).innerHTML = team.location;
    row.insertCell(4).innerHTML = team.contact;
    row.insertCell(5).innerHTML = team.bank_account_info.bank_name;
    row.insertCell(6).innerHTML = team.bank_account_info.branch_name;
    row.insertCell(7).innerHTML = team.bank_account_info.bank_account_number;
    row.insertCell(8).innerHTML = team.bank_account_info.bank_ifsc_code;
    row.insertCell(9).innerHTML = team.secretary || '';
    row.insertCell(10).innerHTML = `<input type="month" value="${window.currentMonth}" onchange="window.currentMonth=this.value">`;
    /**modify*/
    row.insertCell(11).innerHTML = `<a onclick="onSelectTeam('${team.id}')">SELECT</a>`;
  }
};

function onSelectTeam(id) {
  window.location.href = `addToWeaving.html?team_id=${id}&month=${window.currentMonth}`;
};

function getTeams() {
  const date = new Date();
  window.currentMonth = `${date.getFullYear()}-${("0" + (date.getMonth())+1).slice(-2)}`;
  request.get('/users/get_teams')
    .then((data) => {
      appendTeams(data.teams);
    });
}


const onClick = (id) => {
  const c44 = document.getElementById("44");
  const c58 = document.getElementById("58");
  if (id == "44") {
    window.category = "44";
    if (c44) c44.checked = true;
    if (c58) c58.checked = false;
  } else {
    window.category = "58";
    if (c58) c58.checked = true;
    if (c44) c44.checked = false;
  };

  document.documentElement.style.setProperty('--show44', category == '44' ? 'table-row' : 'none');
  document.documentElement.style.setProperty('--show58', category == '58' ? 'table-row' : 'none');

};

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

async function loadWorkPage(workName) {
  const m = getQuery('month');
  window.category = getQuery('category') || '44';
  onClick(category)
  const dateObj = new Date(m);
  document.getElementById('month').innerHTML = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  const cDom = document.getElementById('c');
  if(cDom) cDom.innerHTML = category;
  const header = "<tr><th>ID</th><th>Name</th></tr>";
  const table = document.getElementById("dataTable");
  let membersHtml = header;


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
  for (const { month, member_id: id } of work.workers_44) {
    const member = members.find((item) => item.id == id);
    if (month == m && member) {
      membersHtml += `<tr class="category44"><td>${member.id}</td><td>${member.name}</td></tr>`;
    };

  }
  for (const { month, member_id: id } of work.workers_58) {
    const member = members.find((item) => item.id == id);
    if (month == m && member) {
      membersHtml += `<tr class="category58"><td>${member.id}</td><td>${member.name}</td></tr>`;
    };
  };
  table.innerHTML = membersHtml;
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
  const month = getQuery('month');
  if (value == true && !window.ids.some(e => e.month == month && e.member_id == id)) {
    window.ids.push({ month, member_id: id });
  } else {
    window.ids = window.ids.filter((item) => item.month == month && item.member_id != id);
  };
}

function onTeamSubmit() {
  const month = getQuery('month');
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
        const is = window.ids.some(e => e.month == getQuery('month') && e.member_id == team.id);
        html += `<tr><td><input id="${team.id}"  onclick="onTeamMemberClick(this.id, this.checked)" type="checkbox" ${is ? 'checked': 'null'}></td><td>${team.id}</td><td>${team.name}</td><td>${team.bank_account_info.bank_account_number}</td><td>${team.bank_account_info.bank_name}</td><td>${team.bank_account_info.bank_ifsc_code}</td><td>${team.bank_account_info.branch_name}</td></tr>`;
      };
      document.getElementById('dataTab').innerHTML = html;
    });
}

function goToWorkPage(page, c) {
  c = c || window.category;
  window.location.href = `${page}?team_id=${getQuery('team_id')}&category=${c}&month=${getQuery('month')}`;
};

function goToTeamList() {
  const c = window.category;
  window.location.href = `teamlist.html?page=${window.location.pathname}&team_id=${getQuery('team_id')}&category=${c}&work_id=${work.id}&ids=${JSON.stringify(work[`workers_${c}`])}&month=${getQuery('month')}`;
}

function setMargin(value) {
  const el = document.querySelector('#dataTable > tr > td[data-id="margin"');
  el.textContent = Math.trunc(value * 100) / 100;
};

function setDivideds(value) {
  const el = document.querySelector('#dataTable > tr > td[data-id="dividends"');
  el.textContent = Math.trunc(value * 100) / 100;
};

async function loadMetrePage(id) {
  const month = getQuery('month');
  window.category = getQuery('category');
  window.members = [];
  window.work = {};
  window.updates = {};
  window.marginValue = 0;
  window.dividendValue = 0;
  window.v = {};

  const [works, data, vv] = await Promise.all([
    request.get(`/users/get_works`)
    .then(q => q.works),
  request.get(`/users/get_team_members/${id}`)
    .then(q => q.teamMembers),
  request.get('/users/values')
  ]);
  window.v = vv;
  window.work = works.find(e => getQuery('work').toLowerCase().includes(e.name));
  if (!work) return alert('Please create work before moving forward');
  const table = document.getElementById('dataTable');
  window.members = data.filter(e => {
    if (category == '44' && work.workers_44.some(a => a.member_id == e.id && a.month == month)) return true;
    if (category == '58' && work.workers_58.includes(a => a.member_id == e.id && a.month == month)) return true;
  });

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const wage = member.wages.find((item) => item.monthYear === month);
    const tr = document.createElement('tr');
    tr.setAttribute('id', 'm' + member.id);
    const get = (key) => (wage && wage[work.name][category][key]) || 0;
    tr.innerHTML = `<td>${member.id}</td><td>${member.name}</td><td><input type="number" value="${get('input')}" onchange="onMetreChange('${member.id}', this.value, '${member.name}', ${!!wage}, '${member.pf}', '${member.esi}')"></td><td data-id="${work.name}">${get(work.name.toLowerCase())}</td><td data-id="pf">${get('pf')}</td><td data-id="esi">${get('esi')}</td><td data-id="gt">${get('gratuity')}</td><td data-id="others">${get('others')}</td><td data-id="sum">${get('sum')}</td>${i == 0 ? `<td rowspan="${members.length}" data-id="margin">${get('margin')}</td>`: ""}<td data-id="mw">${get('mw')}</td><td data-id="mt">${get('mt')}</td>${i == 0 ? `<td rowspan="${members.length}" data-id="dividends">${get('dividends')}</td>` : ""}`;
    table.appendChild(tr);
  };

  const tr = document.createElement('tr');
  tr.setAttribute('id', 'mtotal')
  tr.innerHTML = `<td colspan="2">Total</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td>`;
  table.appendChild(tr)
}

function setText(id, dataId, value) {
  const el = document.querySelector(`#m${id} > td[data-id="${dataId}"`);
  el.textContent = Math.trunc(value * 100) / 100;
}

function round(e) {
  return (Math.trunc(e * 100) / 100);
};

function onMetreChange(id, value, name, exists, pf, esi) {
  value = Number(value);
  if (typeof value != 'number') return alert('Invalid number provided');
  const values = calculate(id, value, pf, esi);
  values.exists = exists;
  setText(id, work.name, values[work.name]);
  setText(id, 'pf', values.pf);
  setText(id, 'esi', values.esi);
  setText(id, 'gt', values.gratuity);
  setText(id, 'others', values.others);
  // setText(id, 'margin', values.margin);
  setText(id, 'sum', values.sum);
  setText(id, 'mw', values.mw);
  setText(id, 'mt', values.mt);
  // setText(id, 'dividends', values.dividends);
  setMargin(values.margin);
  setDivideds(values.dividends);
  window.marginValue = values.margin;
  window.dividendValue = values.dividends;
  window.updates[id] = values;
  setTotals();
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

function setTotals() {
  const e = Object.values(updates).reduce((pre, cur) => {
    pre.size += 1;
    for (const key in cur) {
      if (!pre[key]) pre[key] = 0;
      pre[key] += (Math.trunc((cur[key] || 0) * 100) / 100);
    };
    return pre;
  }, { size: 0 });
  document.getElementById('mtotal').innerHTML = `<td colspan="2">Total</td><td>${e.input}</td><td>${e[work.name.toLowerCase()]}<td>${e.pf}</td><td>${e.esi}</td><td>${e.gratuity}</td><td>${e.others}</td><td>${e.sum}<td>${round(marginValue)}</td><td>${e.mw}</td><td>${e.mt}</td><td>${round(dividendValue)}`;
};

function calculate(id, value, pf, esi) {
  const name = window.work.name;
  let [totalMargin, totalSum, totalTeamSum] = Object.values(updates).filter(e => e.id !== id).reduce((prev, cur) => {
    prev[0] = prev[0] + cur.input;
    prev[1] = prev[1] + cur.sum;
    prev[2] = prev[2] + cur.mt;
    return prev;
  }, [value, 0, 0]);
  const a = v[name.toLowerCase()][category];
  totalMargin = totalMargin * a.margin;

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


  values[name] += value * a.rate;
  values.pf += (pf == 'true' ? (a.pf / 100 * values[name]) : 0);
  values.esi += (esi == 'true' ? (a.esi / 100 * values[name]) : 0);
  values.gratuity += a.gty / 100 * values[name];
  values.others += a.others / 100 * values[name];
  values.sum += (values[name] + values.pf + values.esi + values.gratuity + values.others);
  if (name == 'weaving') {
    values.mw += value * 34;
  };

  totalSum += values.sum;
  values.mt = totalSum - values.mw;
  values.dividends = totalTeamSum + values.mt + totalMargin;
  return values;
};

async function onMetreSubmit() {
  const data = await request.put(`/users/update_team_member_bulk`, {
    work: work.name,
    monthYear: getQuery('month'),
    category,
    data: Object.values(window.updates)
  });
  // exportToCsv();
  toggleModal();
  goToNextPage();
};

function goToMetre() {
  window.location.href = `addMetre.html?work="${window.location.pathname}&team_id=${getQuery('team_id')}&category=${window.category}&month=${getQuery('month')}`;
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

  if (!next) {
    exportToCsv()
    return goToWorkPage('addToWeaving.html', category == '44' ? '58' : '44');
  };
  if (next) return goToWorkPage(next, category);
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


function onPriceChange(type, field, event) {
  const category = document.getElementById('44').checked ? '44' : '48';
  window.updates[type][category][field] = Number(event.target.value) || 0;
};

async function loadPricing(v) {
  window.updates = {};
  const category = document.getElementById('44').checked ? '44' : '58';
  onClick(category);
  const data = await request.get('/users/values');
  window.updates = data;
  const list = ['weaving', 'winding', 'warping', 'joining'];
  const table = document.getElementById('Team_table');
  for (let i = 0; i < 4; i++) {
    const name = list[i];
    for (const key of [44, 58]) {
      const value = data[name][key];
      const tr = document.createElement('tr');
      tr.setAttribute('class', `category${key}`);
      tr.innerHTML = `<td>${i+1}</td>
						<td>${list[i]}</td>
						<td><input type="number" name="" value="${value.rate}" class="table_input" readonly onkeyup="onPriceChange('${name}', 'rate', event)"></td>
						<td><input type="number" name="" value="${value.pf}" class="table_input" readonly onkeyup="onPriceChange('${name}', 'pf', event)"></td>
						<td><input type="number" name="" value="${value.esi}" class="table_input" readonly onkeyup="onPriceChange('${name}', 'esi', event)"></td>
						<td><input type="number" name="" value="${value.gty}" class="table_input" readonly onkeyup="onPriceChange('${name}', 'gty', event)"></td>
						<td><input type="number" name="" value="${value.others}" class="table_input" readonly onkeyup="onPriceChange('${name}', 'others', event)"></td><td><input type="number" value="${value.margin}" class="table_input" readonly onkeyup="onPriceChange('${name}', 'margin', event)"></td>`
      table.appendChild(tr);
    };
  }
};


async function excel(data) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet 1');
  const alignment = {
    horizontal: 'center',
    vertical: 'middle'
  };
  
  sheet.addRow([`PROFOMMA ${category}`]);
  sheet.mergeCells('A1:L1');
  sheet.getCell('A1').alignment = alignment;
  let r = 2;
  for(const work of data) {
    sheet.addRow([work.name.toUpperCase()]);
    sheet.mergeCells(`A${r}:B${r}`);
    const table = sheet.addTable({
      name: work.name,
      ref: `A${r + 1}`,
      headerRow: true,
      totalsRow: work.members.length && true,
      columns: [
       { name: 'ID', totalsRowLabel: 'Total' },
       { name: 'NAME', totalsRowFunction: 'none' },
       { name: 'METRE', totalsRowFunction: 'sum' },
       { name: work.name.toUpperCase(), totalsRowFunction: 'sum' },
       { name: 'PF', totalsRowFunction: 'sum' },
       { name: 'ESI', totalsRowFunction: 'sum' },
       { name: 'OTHERS', totalsRowFunction: 'sum' },
       { name: 'TOTAL SUM', totalsRowFunction: 'sum' },
       { name: 'MARGIN', totalsRowFunction: 'max' },
       { name: 'MONEY FOR WEAVERS', totalsRowFunction: 'sum' },
       { name: 'MONEY FOR TEAM', totalsRowFunction: 'sum' },
       { name: 'DIVIDENDS', totalsRowFunction: 'sum' }
      ],
      rows: work.members.map((e) => ([
        e.id, e.name, e.input || 0, e.rate || 0, e.pf || 0, e.esi || 0, e.others || 0, e.sum || 0, e.margin || 0, e.mw || 0, e.mt || 0, e.dividends || 0
      ]))
    });
    sheet.addRow([]);
    sheet.addRow([]);
    r += (work.members.length + 4);
  };
  
  const a = { horizontal: 'center', vertical: 'middle' };
  
  sheet.getColumn(1).width = 27;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).alignment = a;
  sheet.getColumn(4). alignment = a;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).alignment = a;
  sheet.getColumn(6).alignment = a;
  sheet.getColumn(7).alignment = a;
  sheet.getColumn(7).width = 12;
  sheet.getColumn(8).alignment = a;
  sheet.getColumn(8).width = 15;
  sheet.getColumn(9).alignment = a;
  sheet.getColumn(9).width = 12;
  sheet.getColumn(10).alignment = a;
  sheet.getColumn(10).width = 23;
  sheet.getColumn(11).alignment = a;
  sheet.getColumn(11).width = 20;
  sheet.getColumn(12).alignment = a;
  sheet.getColumn(12).width = 15;
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  saveAs(blob, "reports.xlsx");
};

function exportToCsv() {
  const category = getQuery('category');
  request.get(`/users/teams/${getQuery('team_id')}/csv?category=${category}&month=${getQuery('month')}`)
    .then((data) => {
      excel(data);
    });
  return;

  function goToMetre() {
    window.location.href = `addMetre.html?team_id=${getQuery('team_id')}&category=${document.getElementById('inch').checked ? '44' : '58'}`;
  };
  const data = window.members.map((item) => {
    let mData = window.updates[item.id] || item[work.name][category];
    mData.id = item.id;
    mData.name = item.name;
    mData.money_for_team = mData.mt;
    mData.money_for_weaving = mData.mw;
    return mData;
  });
  const csv = window.Papa.unparse(data, {
    columns: ['id', 'name', work.name, 'pf', 'esi', 'gratuity', 'others', 'sum', 'margin', 'money_for_team', 'money_for_weaving', 'dividends']
  });
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${work.name + category}.csv`);
  document.body.appendChild(link);
  link.click();
};